// src/pages/api/auth/[...nextauth].ts

import NextAuth, { NextAuthOptions, Session, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt"; 
import prisma from "@/lib/prisma";

// Extend the default User interface
interface CustomUser extends User {
  id: string;
  username: string;
  role: string;
  firstName: string;
  lastName: string;
  department?: string;
  position?: string;
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
        if (credentials == null) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { username: credentials.username },
        });

        if (user == null) {
          // User does not exist
          return null;
        }

        // Use bcrypt to verify the hashed password
        const isValidPassword = await bcrypt.compare(credentials.password, user.password);
        if (isValidPassword) {
          return {
            id: user.id,
            username: user.username,
            role: user.role,
            firstName: user.firstName,
            lastName: user.lastName,
            department: user.department || undefined,
            position: user.position || undefined,
          } as CustomUser;
        } else {
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        // On first login, add user details to token
        token.username = user.username;
        token.role = user.role;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.department = user.department;
        token.position = user.position;
      }

      // Handle profile updates
      if (trigger === "update") {
        // Update token with new session data
        if (session?.firstName) token.firstName = session.firstName;
        if (session?.lastName) token.lastName = session.lastName;
        if (session?.department) token.department = session.department;
        if (session?.position) token.position = session.position;
      }

      return token;
    },
    async session({ session, token }) {
      // Attach additional user details to session
      if (token) {
        session.user = {
          ...session.user,
          id: token.sub || '', // Use sub (subject) as id
          username: token.username as string,
          role: token.role as string,
          firstName: token.firstName as string,
          lastName: token.lastName as string,
          department: token.department as string | undefined,
          position: token.position as string | undefined,
        };
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Always redirect to the homepage after sign in
      return `${baseUrl}`;
    },
  },
  // Configure session settings
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
};

// Type augmentation for session and token
declare module "next-auth" {
  interface Session {
    user: CustomUser;
  }

  interface User {
    id: string;
    username: string;
    role: string;
    firstName: string;
    lastName: string;
    department?: string;
    position?: string;
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
  }
}

export default NextAuth(authOptions);
