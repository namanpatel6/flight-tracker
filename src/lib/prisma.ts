import { PrismaClient } from '@prisma/client';

/**
 * PrismaClient is attached to the `global` object in development to prevent
 * exhausting your database connection limit and to enable connection reuse.
 * This is crucial to avoid "prepared statement already exists" errors.
 */
const globalForPrisma = global as unknown as { prisma: PrismaClient };

/**
 * Connection pooling configuration
 * Handles disconnecting idle connections and reconnections automatically
 */
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    // Connection pooling settings
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  }).$extends({
    query: {
      async $allOperations({ operation, model, args, query }) {
        try {
          return await query(args);
        } catch (error: any) {
          // Handle prepared statement errors with improved retry logic
          if (error.message && error.message.includes('prepared statement') && error.message.includes('already exists')) {
            console.warn(`Handling prepared statement error for ${model}.${operation}`);
            
            // Wait with exponential backoff and retry
            await new Promise(resolve => setTimeout(resolve, 500));
            
            try {
              return await query(args);
            } catch (retryError: any) {
              console.error(`Failed retry for ${model}.${operation}:`, retryError);
              throw retryError;
            }
          }
          
          // Log other database errors clearly
          console.error(`Database error in ${model}.${operation}:`, error);
          throw error;
        }
      }
    }
  });
};

// Use existing Prisma instance if available to prevent connection issues
export const prisma = globalForPrisma.prisma || prismaClientSingleton();

// In development, add to global to prevent multiple connections
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Cleanup utility function - can be called during app shutdown
 * or in cleanup hooks to properly close connections
 */
export async function disconnectPrisma(): Promise<void> {
  if (globalForPrisma.prisma) {
    await globalForPrisma.prisma.$disconnect();
  }
} 