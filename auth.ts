import NextAuth from "next-auth"
import { DrizzleAdapter } from "@auth/drizzle-adapter" // 🚨 Prisma နေရာတွင် Drizzle Adapter ပြောင်းသုံးထားပါသည်
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { authConfig } from "./auth.config"

// 🚨 Prisma အစား Drizzle ကို ခေါ်ယူခြင်း
import { db } from "./lib/db"
import { users } from "./lib/schema"
import { eq } from "drizzle-orm"

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: DrizzleAdapter(db), // 🚨 ဤနေရာတွင်လည်း ပြောင်းလဲထားပါသည်
  session: { strategy: "jwt" },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // 🚨 Prisma ၏ findUnique အစား Drizzle ၏ select() ကို အသုံးပြုထားပါသည်
        const foundUsers = await db.select().from(users).where(eq(users.email, credentials.email as string));
        const user = foundUsers[0];

        if (!user || !user.password) return null;

        const passwordsMatch = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (passwordsMatch) return user;
        return null;
      }
    })
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.hasProfile = (user as any).hasProfile;
        token.isOnboarded = (user as any).isOnboarded;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role;
        (session.user as any).hasProfile = token.hasProfile;
        (session.user as any).isOnboarded = token.isOnboarded;
      }
      return session;
    }
  }
});

// Route Handlers အတွက် သီးသန့် ခွဲထုတ်၍ Export လုပ်ခြင်း
export const { GET, POST } = handlers;