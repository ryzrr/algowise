import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GitHub({
      // Trust GitHub's verified email and merge into any existing account
      // that already uses this email (e.g. one created via Google).
      allowDangerousEmailAccountLinking: true,
      profile(profile) {
        return {
          id: String(profile.id),
          name: profile.name ?? profile.login,
          username: profile.login,
          email: profile.email,
          image: profile.avatar_url,
        };
      },
    }),
    Google({
      // Trust Google's verified email and merge into any existing account
      // that already uses this email (e.g. one created via GitHub).
      allowDangerousEmailAccountLinking: true,
      profile(profile) {
        return {
          id: String(profile.sub),
          name: profile.name,
          username: profile.email?.split("@")[0] ?? null,
          email: profile.email,
          image: profile.picture,
        };
      },
    }),
  ],
  session: { strategy: "database" },
  pages: {
    signIn: "/sign-in",
  },
  callbacks: {
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.username = (user as { username?: string | null }).username ?? null;
      }
      return session;
    },
  },
});
