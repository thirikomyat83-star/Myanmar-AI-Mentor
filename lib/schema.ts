// lib/schema.ts
import { pgTable, text, timestamp, boolean, json } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").notNull().unique(),
  password: text("password"),
  image: text("image"),
  role: text("role").default("student"),
  hasProfile: boolean("hasProfile").default(false),
  isOnboarded: boolean("isOnboarded").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 🚨 Profile Table ကို Drizzle အတွက် အသစ်တိုးထားပါသည်
export const profiles = pgTable("profiles", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id).unique(), // User နဲ့ ချိတ်ဆက်ထားသည်
  fullName: text("full_name").default("Student"),
  username: text("username").default(""),
  bio: text("bio").default(""),
  avatar: text("avatar").default(""),
  grade: text("grade").default(""),
  major: text("major").default(""), // Stream ကို major အနေဖြင့် သိမ်းပါမည်
  goal: text("goal").default(""),
  weakSubjects: json("weak_subjects").default([]), // Array များကို JSON အနေဖြင့် သိမ်းပါမည်
});