import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "./db";
import { compare } from "bcrypt";
import { CustomPrismaAdapter } from "./auth-adapter";

// NextAuth configuration
export const authOptions: NextAuthOptions = {
  adapter: CustomPrismaAdapter(db),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
    signOut: "/auth/signout",
    error: "/auth/error",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
        };
      },
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await db.user.findUnique({
          where: {
            email: credentials.email,
          },
        });

        if (!user || !user.password) {
          return null;
        }

        const isPasswordValid = await compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.image = token.picture;
      }
      return session;
    },
    async jwt({ token, user, account }) {
      // Initial sign in
      if (account && user) {
        return {
          ...token,
          id: user.id,
          name: user.name,
          email: user.email,
          picture: user.image,
        };
      }

      // Return previous token if the user already exists
      const existingUser = await db.user.findFirst({
        where: {
          email: token.email,
        },
      });

      if (existingUser) {
        return {
          ...token,
          id: existingUser.id,
          name: existingUser.name,
          email: existingUser.email,
          picture: existingUser.image,
        };
      }

      return token;
    },
  },
  debug: process.env.NODE_ENV === "development",
  secret: process.env.NEXTAUTH_SECRET,
};

const prisma = new PrismaClient();

// Schema for registration validation
export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type RegisterInput = z.infer<typeof registerSchema>;

// Schema for login validation
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;

// Get the current session
export async function getSession() {
  return await getServerSession(authOptions);
}

// Get the current user
export async function getCurrentUser() {
  const session = await getSession();
  
  if (!session?.user?.email) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  return user;
}

// Register a new user
export async function registerUser(data: RegisterInput) {
  const { name, email, password } = data;
  
  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error("User with this email already exists");
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
    },
  });

  return { id: user.id, name: user.name, email: user.email };
}

// Send verification email
export async function sendVerificationEmail(email: string) {
  // In a real application, you would:
  // 1. Generate a verification token
  // 2. Save it to the database
  // 3. Send an email with a verification link
  
  // For now, we'll just create a verification token
  const token = crypto.randomUUID();
  const expires = new Date(Date.now() + 3600 * 1000); // 1 hour from now
  
  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires,
    },
  });
  
  // In a real app, you would send an email here
  console.log(`Verification token for ${email}: ${token}`);
  
  return token;
}

// Verify email with token
export async function verifyEmail(token: string) {
  const verificationToken = await prisma.verificationToken.findUnique({
    where: { token },
  });
  
  if (!verificationToken) {
    throw new Error("Invalid token");
  }
  
  if (verificationToken.expires < new Date()) {
    throw new Error("Token expired");
  }
  
  // Update user
  await prisma.user.update({
    where: { email: verificationToken.identifier },
    data: { emailVerified: new Date() },
  });
  
  // Delete token
  await prisma.verificationToken.delete({
    where: { token },
  });
  
  return true;
} 