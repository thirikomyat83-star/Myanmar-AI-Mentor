// lib/db.ts
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

// Build-time တွင် URL မရှိသေးပါက neon() format error မတက်စေရန် fallback ထည့်သွင်းခြင်း
const fallbackUrl = "postgresql://dummy:dummy@ep-dummy-12345.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";
const connectionString = (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith("postgres"))
  ? process.env.DATABASE_URL
  : fallbackUrl;

const sql = neon(connectionString);
export const db = drizzle(sql);