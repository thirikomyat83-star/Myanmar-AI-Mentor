// lib/db.ts
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

// .env ထဲက DATABASE_URL ကို အလိုအလျောက် ယူသုံးပါမည်
const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql);