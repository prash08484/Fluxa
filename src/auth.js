import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

/**
 * Single source of truth for Auth.js v5.
 * Used by:
 *   - app/api/auth/[...nextauth]/route.js  → mounts handlers
 *   - (app)/layout.js                      → server-side session check
 *   - app/login/page.js                    → signIn() server action
 *
 * Session strategy: JWT (no DB required for v1). Move to a Mongo adapter when
 * we want server-side session invalidation / multi-device sign-out.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
});
