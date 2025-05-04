// Load environment variables from .env.local if running directly
if (!process.env.DATABASE_URL) {
  require('dotenv').config({ path: '.env.local' });
}

const { PrismaClient } = require('@prisma/client');

/**
 * PrismaClient is attached to the `global` object in development to prevent
 * exhausting your database connection limit.
 * Learn more: https://pris.ly/d/help/next-js-best-practices
 */
const globalForPrisma = global.prisma || {};

/**
 * Helper function to check and encode a database URL if needed
 */
function checkAndEncodeDbUrl(url) {
  try {
    const parsedUrl = new URL(url);
    const password = parsedUrl.password;
    
    // Skip if no password or already properly encoded
    if (!password || password === encodeURIComponent(password)) {
      return url;
    }
    
    // Encode the password
    const username = parsedUrl.username;
    const encodedPassword = encodeURIComponent(password);
    
    // Rebuild the URL
    const auth = username ? `${username}:${encodedPassword}` : encodedPassword;
    parsedUrl.username = '';
    parsedUrl.password = '';
    
    return parsedUrl.toString().replace('//', `//${auth}@`);
  } catch (error) {
    console.warn('Warning: Could not parse DATABASE_URL', error.message);
    return url;
  }
}

/**
 * PrismaClient singleton with basic configuration
 */
const prismaClientSingleton = () => {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set. Please check your .env.local file.');
  }
  
  // Ensure the URL is properly encoded
  const encodedUrl = checkAndEncodeDbUrl(process.env.DATABASE_URL);
  
  // Create the client with the encoded URL
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: encodedUrl
      }
    }
  });
};

// Use existing Prisma instance if available
const prisma = globalForPrisma.prisma || prismaClientSingleton();

// In development, attach to global to prevent multiple instances
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Cleanup utility function for connection management
 */
async function disconnectPrisma() {
  if (globalForPrisma.prisma) {
    await globalForPrisma.prisma.$disconnect();
  }
}

/**
 * Connection testing utility
 * Can be called on app startup to verify database connectivity
 */
async function testConnection() {
  try {
    // Simple query to test connection
    await prisma.$queryRaw`SELECT 1 as connection_test`;
    console.log('Database connection successful');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    
    // Provide more helpful error messages
    if (error.message?.includes('Unsupported or invalid secret format')) {
      console.error('\nThis error usually happens when the password in your DATABASE_URL contains special characters that need to be URL-encoded.');
      console.error('Please run: node encode-db-url.js to get a properly encoded URL.');
    }
    
    return false;
  }
}

module.exports = { 
  prisma, 
  disconnectPrisma, 
  testConnection 
}; 