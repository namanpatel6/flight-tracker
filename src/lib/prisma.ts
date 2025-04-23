import { PrismaClient } from '@prisma/client';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Create Prisma client with connection pool settings
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  }).$extends({
    query: {
      async $allOperations({ operation, model, args, query }) {
        try {
          return await query(args);
        } catch (error: any) {
          if (error.message && error.message.includes('prepared statement') && error.message.includes('already exists')) {
            console.warn(`Handling prepared statement error for ${model}.${operation}`);
            
            // Wait a brief moment and retry once
            await new Promise(resolve => setTimeout(resolve, 500));
            return await query(args);
          }
          throw error;
        }
      }
    }
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma; 