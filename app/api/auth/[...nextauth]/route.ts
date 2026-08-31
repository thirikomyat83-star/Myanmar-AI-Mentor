import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

// 🚨 Version အသစ် (v5) ပုံစံဖြင့် Export လုပ်ခြင်း
export const { handlers: { GET, POST } } = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "dummy_id",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "dummy_secret",
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET || "my_super_secret_for_nextauth_123",
});