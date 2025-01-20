// src/pages/api/auth/[...nextauth].ts

import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import prisma from "@/lib/prisma"; // Ensure this path is correct

// Extend the default User interface
interface CustomUser {
  id: string;
  username: string;
  role: string;
  firstName: string;
  lastName: string;
  department?: string;
  position?: string;
  isFirstTime: boolean;
}

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

        const user = await prisma.user.findUnique({
          where: { username: credentials.username },
        });

        if (!user) {
          // User does not exist
          return null;
        }

        // Verify the password using bcrypt
        const isValidPassword = await bcrypt.compare(credentials.password, user.password);
        if (!isValidPassword) {
          return null;
        }

        // Coalesce user.isFirstTime (boolean | null) into a strict boolean
        const isFirstTime = user.isFirstTime ?? false;

        // Return user object including isFirstTime as a boolean
        const customUser: CustomUser = {
          id: user.id,
          username: user.username,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          department: user.department || undefined,
          position: user.position || undefined,
          isFirstTime, // Ensures it's always a boolean
        };

        return customUser;
      },
    }),
  ],
  pages: {
    signIn: "/auth/signin",
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
        // Also coalesce here if needed, but user is already boolean in customUser
        token.isFirstTime = user.isFirstTime;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        // Cast token fields to the correct types
        session.user = {
          ...session.user,
          id: token.sub || "", // Use sub (subject) as id
          username: token.username as string,
          role: token.role as string,
          firstName: token.firstName as string,
          lastName: token.lastName as string,
          department: token.department as string | undefined,
          position: token.position as string | undefined,
          isFirstTime: token.isFirstTime as boolean,
        };
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Always redirect to the homepage after sign in
      return `${baseUrl}`;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
};

// Type augmentation for session and token
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

export default NextAuth(authOptions);
