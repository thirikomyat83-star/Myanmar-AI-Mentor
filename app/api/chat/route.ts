import { auth } from "@/auth"; 
import { NextResponse } from "next/server";
import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

import { db } from "@/lib/db";
import { users, profiles } from "@/lib/schema";
import { eq } from "drizzle-orm";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    // 🔐 AUTH CHECK
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const foundUsers = await db.select().from(users).where(eq(users.email, session.user.email));
    const currentUser = foundUsers[0];

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    const userId = currentUser.id;

    const body = await req.json();
    const {
      messages = [],
      studyMode = "General Study",
      tutorPersona = "Friendly Mentor",
    } = body;

    // 🔑 API KEY CHECK
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing API key" }, { status: 500 });
    }

    // 👤 PROFILE FETCH
    const foundProfiles = await db.select({
      fullName: profiles.fullName,
      grade: profiles.grade,
      major: profiles.major,
      weakSubjects: profiles.weakSubjects,
      goal: profiles.goal,
    }).from(profiles).where(eq(profiles.userId, userId));
    
    const dbProfile = foundProfiles[0] || null;

    // 🚨 FEATURES (AI မှတ်ထားရန် အချက်အလက်များကို ပိုမိုတိကျအောင် ပြင်ဆင်ထားသည်)
    const weakSubjectsArray = Array.isArray(dbProfile?.weakSubjects) ? dbProfile.weakSubjects : [];
    const weakSubjStr = weakSubjectsArray.length > 0 ? weakSubjectsArray.join(", ") : "None";
    const currentGrade = dbProfile?.grade || "High School";
    const currentMajor = dbProfile?.major || "General";
    
    // 🧠 SYSTEM PROMPT (🚨 Mode နှင့် Persona အတိအကျ ပြောင်းလဲရန် ပြင်ဆင်ထားသော အပိုင်း)
    const systemPrompt = `
You are "Myanmar AI Mentor", an expert tutor. You MUST strictly follow the rules below.

1. 👤 STUDENT PROFILE (သင် သင်ကြားပေးရမည့် ကျောင်းသား၏ အချက်အလက်များ):
- Name: ${dbProfile?.fullName || "Student"}
- Grade/Class: ${currentGrade}
- Major/Stream: ${currentMajor}
- Weak Subjects: ${weakSubjStr}
- Goal: ${dbProfile?.goal || "None"}
*INSTRUCTION:* သင်၏ ရှင်းပြမှုအဆင့်အတန်းကို ဤ ${currentGrade} အဆင့်နှင့် ${currentMajor} ဘာသာတွဲနှင့် ကိုက်ညီအောင် ပြုလုပ်ပါ။ ${weakSubjStr} နှင့် ပတ်သက်သော အကြောင်းအရာဖြစ်ပါက အလွန်စိတ်ရှည်စွာဖြင့် အခြေခံမှစ၍ ရှင်းပြပါ။

2. 🗣️ CURRENT PERSONA (သင်၏ စကားပြောဟန် / အသံ):
- Persona: ${tutorPersona}
*INSTRUCTION:* သင်သည် စက်ရုပ် (AI) လို မပြောရပါ။ ဤ "${tutorPersona}" ၏ စရိုက်လက္ခဏာ၊ အသုံးအနှုန်း၊ စကားပြောဟန်အတိုင်း အတိအကျ ပြောင်းလဲပြောဆိုပါ။

3. 🎯 CURRENT MODE (ယခုလုပ်ဆောင်ရမည့် တာဝန်):
- Mode: ${studyMode}
*INSTRUCTION BASED ON MODE:*
${
  studyMode.toLowerCase().includes("exam") 
  ? "CRITICAL: ယခုသည် EXAM MODE (စာမေးပွဲစစ်ဆေးခြင်း) ဖြစ်သည်။ စာ လုံးဝ (လုံးဝ) မရှင်းပြပါနှင့်။ Examiner တစ်ယောက်ကဲ့သို့ ပြုမူပါ။ ကျောင်းသား၏ Grade နှင့် Major အလိုက် ခက်ခဲသော စာမေးပွဲမေးခွန်း (၁) ခုကိုသာ မေးပါ။ ကျောင်းသား ဖြေဆိုပြီးမှသာ အဖြေမှန်/မှား စစ်ဆေးပြီး အမှတ်ပေးပါ။ ထို့နောက် နောက်ထပ် မေးခွန်းတစ်ခု ထပ်မေးပါ။"
  : studyMode.toLowerCase().includes("quiz")
  ? "CRITICAL: ယခုသည် QUIZ MODE (ဉာဏ်စမ်းမေးခွန်း) ဖြစ်သည်။ စာမရှင်းပြပါနှင့်။ သင်ခန်းစာနှင့် ပတ်သက်သော Multiple Choice (သို့) Short Answer မေးခွန်းတို (၁) ခုကို မေးပါ။ ကျောင်းသား ဖြေဆိုသည့်တိုင်အောင် စောင့်ပါ။ ဖြေဆိုပြီးမှ အဖြေမှန်ကို ပြောပြပြီး နောက်မေးခွန်း ဆက်မေးပါ။"
  : "ယခုသည် EXPLAIN MODE (စာရှင်းပြသည့်မုဒ်) ဖြစ်သည်။ ကျောင်းသားမေးသော မေးခွန်းများကို ${tutorPersona} ကဲ့သို့ မေတ္တာထား၍ အဆင့်ဆင့် ရှင်းလင်းစွာ မြန်မာလို သင်ကြားပြသပေးပါ။"
}

4. 🌐 GENERAL RULES:
- Always reply in natural Burmese (Myanmar language).
- Do not hallucinate. Be accurate.
`;

    // 🌐 OPENROUTER CLIENT
    const openrouter = createOpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey,
      headers: {
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Myanmar AI Mentor",
      },
    });

    // 🧹 SAFE MESSAGE NORMALIZATION
    const safeMessages = messages.map((m: any) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content:
        typeof m.content === "string"
          ? m.content
          : Array.isArray(m.content)
          ? m.content.map((c: any) => c.text || "").join(" ")
          : String(m.content || ""),
    }));

    // 🚀 STREAM
    const result = await streamText({
      model: openrouter.chat("openai/gpt-4o-mini"),
      system: systemPrompt,
      messages: safeMessages,
      temperature: 0.2,
    });

    // ✅ DIRECT STREAM RESPONSE
    return result.toTextStreamResponse(); 

  } catch (error: any) {
    console.error("🔥 AI API ERROR:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}