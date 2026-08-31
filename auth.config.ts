import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/',
  },
  providers: [], // Providers များကို auth.ts တွင်သာ ထည့်ပါမည်
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      
      // သွားခွင့်ပြုမည့် လမ်းကြောင်းများ
      const isAuthRoute = nextUrl.pathname === '/';
      const isProtectedRoute = 
        nextUrl.pathname.startsWith('/dashboard') ||  
        nextUrl.pathname === '/profile-setup' ||  
        nextUrl.pathname === '/onboarding';

      if (isAuthRoute) {
        if (isLoggedIn) {
          return Response.redirect(new URL('/dashboard', nextUrl));
        }
        return true;
      }

      if (isProtectedRoute && !isLoggedIn) {
        return Response.redirect(new URL('/', nextUrl));
      }

      return true;
    },
  },
} satisfies NextAuthConfig;