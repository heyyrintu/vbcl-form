import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "./db";
import bcrypt from "bcryptjs";

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  basePath: "/api/auth",
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { username: credentials.username as string },
        });

        if (!user) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        // Update lastLoginAt timestamp
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          name: user.username,
          role: user.role,
          pageAccess: (user as unknown as { pageAccess?: string[] }).pageAccess || ["dashboard", "employees", "all-entries", "employee-attendance"],
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized: async ({ auth }) => {
      return !!auth;
    },
    jwt: async ({ token, user }) => {
      if (user) {
        token.role = user.role;
        token.id = user.id || "";
        token.pageAccess = (user as unknown as { pageAccess?: string[] }).pageAccess;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
        session.user.pageAccess = token.pageAccess as string[] || ["dashboard", "employees", "all-entries", "employee-attendance"];
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
});


