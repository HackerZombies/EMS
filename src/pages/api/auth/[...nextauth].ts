// src/pages/api/auth/[...nextauth].ts

import type { NextApiRequest, NextApiResponse } from "next";
import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import prisma from "@/lib/prisma"; // Ensure correct path

//
// 1. Extend default User/Session/JWT interfaces
//
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
      role: string;
      firstName: string;
      lastName: string;
      department?: string;
      position?: string;
      isFirstTime: boolean;
    };
  }

  interface User {
    id: string;
    username: string;
    role: string;
    firstName: string;
    lastName: string;
    department?: string;
    position?: string;
    isFirstTime: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    username: string;
    role: string;
    firstName: string;
    lastName: string;
    department?: string;
    position?: string;
    isFirstTime: boolean;
  }
}

//
// 2. Define the NextAuth options
//
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text", placeholder: "jsmith" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials) return null;

        // Fetch user by username
        const user = await prisma.user.findUnique({
          where: { username: credentials.username },
        });
        if (!user) {
          // User does not exist
          return null;
        }

        // Verify password using bcrypt
        const isValidPassword = await bcrypt.compare(
          credentials.password,
          user.password
        );
        if (!isValidPassword) {
          return null;
        }

        // Coalesce user.isFirstTime into a strict boolean
        const isFirstTime = user.isFirstTime ?? false;

        // Return a custom user object
        return {
          id: user.id,
          username: user.username,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          department: user.department || undefined,
          position: user.position || undefined,
          isFirstTime, // always a boolean
        };
      },
    }),
  ],
  pages: {
    signIn: "/auth/signin", // Your Next.js sign-in page
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.username = user.username;
        token.role = user.role;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.department = user.department;
        token.position = user.position;
        token.isFirstTime = user.isFirstTime;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user = {
          ...session.user,
          // sub is the JWT 'subject', typically user.id
          id: token.sub || "",
          username: token.username,
          role: token.role,
          firstName: token.firstName,
          lastName: token.lastName,
          department: token.department,
          position: token.position,
          isFirstTime: token.isFirstTime,
        };
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // For Next.js web usage, always redirect to the homepage
      return baseUrl;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
};

//
// 3. Custom API route wrapper
//
// - Detects if it's a Credentials POST request with redirect=false
// - If so, returns JSON instead of redirecting
// - Otherwise, uses the normal NextAuth behavior (which can redirect)
//
export default async function auth(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const isCredentialsRoute =
    req.query.nextauth?.includes("callback") &&
    req.query.nextauth?.includes("credentials");

  if (
    req.method === "POST" &&
    isCredentialsRoute &&
    req.query.redirect === "false"
  ) {
    // Override the redirect callback
    // Instead of returning null (which causes a TS error),
    // return a valid string. NextAuth will respond with JSON
    // but must see a string to satisfy types.
    return await NextAuth(req, res, {
      ...authOptions,
      callbacks: {
        ...authOptions.callbacks,
        redirect: async () => {
          // Return an empty path or "/" to satisfy the string requirement.
          // NextAuth won't actually perform a 302 redirect in `redirect=false` mode.
          return "";
        },
      },
    });
  }

  // Otherwise, default NextAuth behavior
  return await NextAuth(req, res, authOptions);
}

//
// 4. Ensure we're using Node.js runtime, not the Edge runtime
//    so TS expects NextApiRequest / NextApiResponse
//
export const config = {
  runtime: "nodejs",
};
