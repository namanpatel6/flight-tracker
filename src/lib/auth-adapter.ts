import { PrismaClient } from "@prisma/client";
import { Adapter, AdapterAccount, AdapterUser, AdapterSession } from "next-auth/adapters";
import { withRetry } from "./db";

/**
 * Custom NextAuth Adapter for Prisma to avoid prepared statement issues
 * Implements retry logic for error-prone operations
 */
export function CustomPrismaAdapter(prisma: PrismaClient): Adapter {
  return {
    createUser: async (data: Omit<AdapterUser, "id">): Promise<AdapterUser> => {
      const user = await withRetry(() => prisma.user.create({
        data: {
          name: data.name,
          email: data.email!,
          emailVerified: data.emailVerified,
          image: data.image,
        },
      }));
      return {
        id: user.id,
        name: user.name || undefined,
        email: user.email || "",
        emailVerified: user.emailVerified,
        image: user.image || undefined,
      };
    },
    getUser: async (id: string): Promise<AdapterUser | null> => {
      const user = await withRetry(() => prisma.user.findUnique({
        where: { id },
      }));
      if (!user) return null;
      return {
        id: user.id,
        name: user.name || undefined,
        email: user.email || "",
        emailVerified: user.emailVerified,
        image: user.image || undefined,
      };
    },
    getUserByEmail: async (email: string): Promise<AdapterUser | null> => {
      const user = await withRetry(() => prisma.user.findUnique({
        where: { email },
      }));
      if (!user) return null;
      return {
        id: user.id,
        name: user.name || undefined,
        email: user.email || "",
        emailVerified: user.emailVerified,
        image: user.image || undefined,
      };
    },
    getUserByAccount: async ({ provider, providerAccountId }: Pick<AdapterAccount, "provider" | "providerAccountId">): Promise<AdapterUser | null> => {
      const account = await withRetry(() => prisma.account.findUnique({
        where: {
          provider_providerAccountId: {
            provider,
            providerAccountId,
          },
        },
        select: { user: true },
      }));
      if (!account?.user) return null;

      const user = account.user;
      return {
        id: user.id,
        name: user.name || undefined,
        email: user.email || "",
        emailVerified: user.emailVerified,
        image: user.image || undefined,
      };
    },
    updateUser: async (data: Partial<AdapterUser> & Pick<AdapterUser, "id">): Promise<AdapterUser> => {
      const user = await withRetry(() => prisma.user.update({
        where: { id: data.id },
        data: {
          name: data.name,
          email: data.email,
          emailVerified: data.emailVerified,
          image: data.image,
        },
      }));
      return {
        id: user.id,
        name: user.name || undefined,
        email: user.email || "",
        emailVerified: user.emailVerified,
        image: user.image || undefined,
      };
    },
    linkAccount: async (data: AdapterAccount): Promise<void> => {
      await withRetry(() => prisma.account.create({
        data: {
          userId: data.userId,
          type: data.type,
          provider: data.provider,
          providerAccountId: data.providerAccountId,
          refresh_token: data.refresh_token,
          access_token: data.access_token,
          expires_at: data.expires_at,
          token_type: data.token_type,
          scope: data.scope,
          id_token: data.id_token,
          session_state: data.session_state,
        },
      }));
    },
    createSession: async (data: { sessionToken: string; userId: string; expires: Date }): Promise<AdapterSession> => {
      const session = await withRetry(() => prisma.session.create({
        data,
      }));
      return session;
    },
    getSessionAndUser: async (sessionToken: string): Promise<{ session: AdapterSession; user: AdapterUser } | null> => {
      const dbSession = await withRetry(() => prisma.session.findUnique({
        where: { sessionToken },
        include: { user: true },
      }));
      if (!dbSession) return null;
      
      const { user, ...session } = dbSession;
      return {
        session,
        user: {
          id: user.id,
          name: user.name || undefined,
          email: user.email || "",
          emailVerified: user.emailVerified,
          image: user.image || undefined,
        },
      };
    },
    updateSession: async (data: Partial<AdapterSession> & Pick<AdapterSession, "sessionToken">): Promise<AdapterSession | null> => {
      const session = await withRetry(() => prisma.session.update({
        where: { sessionToken: data.sessionToken },
        data,
      }));
      return session;
    },
    deleteSession: async (sessionToken: string): Promise<void> => {
      await withRetry(() => prisma.session.delete({
        where: { sessionToken },
      }));
    },
    deleteUser: async (userId: string): Promise<void> => {
      await withRetry(() => prisma.user.delete({
        where: { id: userId },
      }));
    },
    unlinkAccount: async ({ provider, providerAccountId }: Pick<AdapterAccount, "provider" | "providerAccountId">): Promise<void> => {
      await withRetry(() => prisma.account.delete({
        where: {
          provider_providerAccountId: {
            provider,
            providerAccountId,
          },
        },
      }));
    },
  };
} 