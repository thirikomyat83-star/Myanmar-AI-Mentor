// app/actions/auth.ts
'use server'

import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function registerUser(data: { email: string; password: string }) {
  const { email, password } = data;

  if (!email || !password) return { error: "Email နှင့် Password လိုအပ်ပါသည်။" };

  try {
    // ၁။ Email ရှိမရှိ စစ်ဆေးခြင်း
    const existingUser = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
    
    if (existingUser.length > 0) {
      return { error: "ဤ Email ဖြင့် အကောင့်ဖွင့်ပြီးသား ဖြစ်နေပါသည်။ Login ဝင်ပါ။" };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // ၂။ Database သို့ အကောင့်သစ် ထည့်သွင်းခြင်း
    await db.insert(users).values({
      email: email.toLowerCase(),
      password: hashedPassword,
    });

    return { success: true };
  } catch (error) {
    console.error("Database Error:", error);
    return { error: "အကောင့်ဖွင့်ရာတွင် အမှားအယွင်းဖြစ်ပွားခဲ့ပါသည်။" };
  }
}