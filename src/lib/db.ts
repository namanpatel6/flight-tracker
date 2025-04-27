import { PrismaClient } from "@prisma/client";
import { prisma as globalPrisma } from "./prisma";

/**
 * Export the singleton Prisma client from prisma.ts
 * This ensures we're using the same connection across the application
 */
export const db = globalPrisma;

/**
 * Enhanced utility function to retry Prisma operations with exponential backoff
 * in case of prepared statement errors or connection issues
 */
export async function withRetry<T>(
  operation: () => Promise<T>, 
  maxRetries: number = 3
): Promise<T> {
  let lastError: any;
  let retryCount = 0;
  
  while (retryCount < maxRetries) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      // Check for specific database errors that can be retried
      const isRetryableError = 
        (error.message && error.message.includes('prepared statement') && error.message.includes('already exists')) ||
        error.message?.includes('Connection pool timeout') ||
        error.code === 'P1001' || // Connection error
        error.code === 'P1002'; // Database server unreachable
      
      if (!isRetryableError) {
        // Non-retryable error, throw immediately
        throw error;
      }
      
      // Log the retry
      console.warn(`Retrying database operation (${retryCount + 1}/${maxRetries})`, 
        { error: error.message, code: error.code });
      
      // Exponential backoff: 500ms, 1000ms, 2000ms, etc.
      const backoffTime = 500 * Math.pow(2, retryCount);
      await new Promise(resolve => setTimeout(resolve, backoffTime));
      
      retryCount++;
    }
  }
  
  // If we've exhausted all retries, throw the last error
  console.error(`Database operation failed after ${maxRetries} retries`, lastError);
  throw lastError;
} 