import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    // 1. Route Protection (Runs on Edge)
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAuthPage =
        nextUrl.pathname.startsWith("/login") ||
        nextUrl.pathname.startsWith("/signup");
      const isAdminPage = nextUrl.pathname.startsWith("/admin");
      const role = auth?.user?.role;

      // Redirect logged-in users away from auth pages
      if (isAuthPage && isLoggedIn) {
        return Response.redirect(new URL("/admin", nextUrl));
      }

      // Protect Admin Routes
      if (isAdminPage) {
        if (!isLoggedIn) return false;
        if (role !== "admin") {
          return Response.redirect(new URL("/", nextUrl));
        }
      }

      return true;
    },
    // 2. Add Role to Token
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    // 3. Add Role to Session
    session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string;
        session.user.id = token.sub as string;
      }
      return session;
    },
  },
  providers: [], // Providers added in auth.ts
} satisfies NextAuthConfig;
