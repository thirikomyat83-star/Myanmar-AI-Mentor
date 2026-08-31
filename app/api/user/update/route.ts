import { auth } from "@/auth";
import { NextResponse } from "next/server"; 
import { db } from "@/lib/db";
import { users, profiles } from "@/lib/schema";
import { eq } from "drizzle-orm";

// ==========================================
// 1. POST: Profile နှင့် Onboarding မှ ဒေတာများ သိမ်းရန်
// ==========================================
export async function POST(req: Request) {
  try {
    const session = await auth();
    
    // 🚨 ID အစား (၁၀၀%) သေချာသော Email ကို အသုံးပြု၍ စစ်ဆေးပါမည်
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    // Email ဖြင့် Database ထဲမှ User ကို အတိအကျ ပြန်ဆွဲထုတ်ပါမည်
    const foundUsers = await db.select().from(users).where(eq(users.email, session.user.email));
    const currentUser = foundUsers[0];

    if (!currentUser) {
      return NextResponse.json({ error: "User not found in database" }, { status: 401 });
    }

    // Database မှ အတိအကျ ရလာသော ID ကိုသာ အသုံးပြုပါမည်
    const userId = currentUser.id;
    const data = await req.json();

    const { 
      fullName, username, bio, avatar, hasProfile, 
      grade, stream, weakSubjects, goal, isOnboarded 
    } = data;

    // 💾 ၁။ Profile ရှိမရှိ အရင်စစ်ဆေးပါမည်
    const existingProfile = await db.select().from(profiles).where(eq(profiles.userId, userId));

    if (existingProfile.length > 0) {
      await db.update(profiles).set({
        ...(fullName && { fullName }),
        ...(username && { username }),
        ...(bio && { bio }),
        ...(avatar && { avatar }),
        ...(grade && { grade }),
        ...(stream && { major: stream }), 
        ...(goal && { goal }),
        ...(weakSubjects && { weakSubjects }),
      }).where(eq(profiles.userId, userId));
    } else {
      await db.insert(profiles).values({
        userId: userId,
        fullName: fullName || "Student",
        username: username || "",
        bio: bio || "",
        avatar: avatar || "",
        grade: grade || "",
        major: stream || "",
        goal: goal || "",
        weakSubjects: weakSubjects || [],
      });
    }

    // 💾 ၂။ User Table ကို အပ်ဒိတ်လုပ်ခြင်း
    await db.update(users).set({
      ...(hasProfile !== undefined && { hasProfile }),
      ...(isOnboarded !== undefined && { isOnboarded }),
    }).where(eq(users.id, userId));

    const updatedUsers = await db.select().from(users).where(eq(users.id, userId));

    return NextResponse.json({ success: true, user: updatedUsers[0] });
  } catch (error: any) {
    console.error("Database Update Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ==========================================
// 2. GET: Dashboard တွင် ပြသရန် ဒေတာများကို ပြန်ဆွဲထုတ်ရန်
// ==========================================
export async function GET(req: Request) {
  try {
    const session = await auth();
    
    // 🚨 ဤနေရာတွင်လည်း Email ဖြင့်သာ စစ်ဆေးပါမည်
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const foundUsers = await db.select().from(users).where(eq(users.email, session.user.email));
    const currentUser = foundUsers[0];

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    const foundProfiles = await db.select().from(profiles).where(eq(profiles.userId, currentUser.id));

    return NextResponse.json({ success: true, profile: foundProfiles[0] || null });
  } catch (error: any) {
    console.error("Fetch Profile Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}