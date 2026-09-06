// lib/db.ts
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

const fallbackUrl = "postgresql://dummyuser:dummypassword@ep-dummy-12345.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

// ၁။ Environment ထဲက URL ကို ယူပါမည်။
let rawUrl = process.env.DATABASE_URL?.trim().replace(/^["']|["']$/g, '') || fallbackUrl;

// ၂။ 🚨 Python အတွက် ထည့်ထားသော +asyncpg ပါနေပါက Next.js အတွက် အလိုအလျောက် ဖြုတ်ပေးပါမည်။ 🚨
if (rawUrl.startsWith("postgresql+asyncpg://")) {
  rawUrl = rawUrl.replace("postgresql+asyncpg://", "postgresql://");
}

// ၃။ Connection ကို လုံခြုံစွာ ခေါ်ယူပါမည်။
let sql: any;
try {
  sql = neon(rawUrl);
} catch {
  sql = neon(fallbackUrl);
}

export const db = drizzle(sql);