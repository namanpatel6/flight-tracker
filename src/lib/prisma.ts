import { PrismaClient } from '@prisma/client';

/**
 * PrismaClient is attached to the `global` object in development to prevent
 * exhausting your database connection limit.
 * Learn more: https://pris.ly/d/help/next-js-best-practices
 */
const globalForPrisma = global as unknown as { prisma: PrismaClient };

/**
 * PrismaClient singleton with basic configuration
 */
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
};

// Use existing Prisma instance if available
export const prisma = globalForPrisma.prisma || prismaClientSingleton();

// In development, attach to global to prevent multiple instances
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Cleanup utility function for connection management
 */
export async function disconnectPrisma(): Promise<void> {
  if (globalForPrisma.prisma) {
    await globalForPrisma.prisma.$disconnect();
  }
}

/**
 * Connection testing utility
 * Can be called on app startup to verify database connectivity
 */
export async function testConnection(): Promise<boolean> {
  try {
    // Simple query to test connection
    await prisma.$queryRaw`SELECT 1 as connection_test`;
    console.log('Database connection successful');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
} 