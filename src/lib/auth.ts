import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { Adapter } from "next-auth/adapters";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      userType: string;
      uniqueKey: string;
      image?: string | null;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    userType: string;
    uniqueKey: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    userType: string;
    uniqueKey: string;
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        // Find user by email or username
        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: credentials.email.toLowerCase() },
              { username: credentials.email },
            ],
            isActive: true,
          },
        });

        if (!user || !user.password) {
          throw new Error("User not found");
        }

        // Verify password
        const isValid = await bcrypt.compare(credentials.password, user.password);

        if (!isValid) {
          throw new Error("Invalid password");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.username,
          userType: user.userType,
          uniqueKey: user.uniqueKey,
        };
      },
    }),
    // Google OAuth (optional - requires env vars)
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            profile(profile) {
              return {
                id: profile.sub,
                email: profile.email,
                name: profile.name ?? profile.email?.split("@")[0],
                image: profile.picture,
                userType: "CLIENT",
                uniqueKey: profile.sub,
              };
            },
          }),
        ]
      : []),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.userType = user.userType;
        token.uniqueKey = user.uniqueKey;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.userType = token.userType;
        session.user.uniqueKey = token.uniqueKey;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    newUser: "/register",
    error: "/login",
  },
  events: {
    async signIn({ user }) {
      console.log(`User signed in: ${user.email}`);
    },
  },
  debug: process.env.NODE_ENV === "development",
};

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

/**
 * Verify a password against its hash
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}
