import { db } from "./db";

/**
 * Utility function to clean up expired sessions
 * This can be called from a cron job to remove old sessions
 * that might be causing connection pool issues
 */
export async function cleanupExpiredSessions(): Promise<{ deleted: number }> {
  try {
    // Find and delete all expired sessions
    const result = await db.session.deleteMany({
      where: {
        expires: {
          lt: new Date(),
        },
      },
    });
    
    console.log(`Cleaned up ${result.count} expired sessions`);
    return { deleted: result.count };
  } catch (error) {
    console.error("Error cleaning up expired sessions:", error);
    throw error;
  }
}

/**
 * Utility to check for database connection health
 * Can be used in health check endpoints
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    // Simple query to verify database connection
    await db.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error("Database connection check failed:", error);
    return false;
  }
}

/**
 * Utility to remove orphaned database connections
 * This is helpful when connection issues occur
 */
export async function resetConnectionPool(): Promise<void> {
  try {
    // Close all connections in the pool
    await db.$disconnect();
    
    // Force a new connection to be established
    await db.$connect();
    
    console.log("Database connection pool has been reset");
  } catch (error) {
    console.error("Error resetting database connection pool:", error);
    throw error;
  }
} 