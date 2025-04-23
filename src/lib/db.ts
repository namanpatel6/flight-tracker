import { PrismaClient } from "@prisma/client";

declare global {
  var cachedPrisma: PrismaClient | undefined;
}

// Create a new client instance
export const db = globalThis.cachedPrisma || new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
});

if (process.env.NODE_ENV !== "production") {
  globalThis.cachedPrisma = db;
}

// Utility function to retry Prisma operations in case of prepared statement errors
export async function withRetry<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error: any) {
    if (error.message && error.message.includes('prepared statement') && error.message.includes('already exists')) {
      // Wait a brief moment and retry once
      await new Promise(resolve => setTimeout(resolve, 500));
      return await operation();
    }
    throw error;
  }
} 