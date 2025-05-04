#!/usr/bin/env node

/**
 * Prisma Setup Script
 * Loads environment variables from .env.local and generates the Prisma client
 */

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

// Verify DATABASE_URL is loaded
if (!process.env.DATABASE_URL) {
  console.error('❌ Error: DATABASE_URL not found in .env.local file');
  console.error('Please ensure your .env.local file contains:');
  console.error('DATABASE_URL="postgresql://user:password@localhost:5432/database?schema=public"');
  console.error('DIRECT_URL="postgresql://user:password@localhost:5432/database?schema=public"');
  process.exit(1);
}

const { execSync } = require('child_process');

console.log('🔄 Setting up Prisma with environment variables from .env.local');
console.log(`DATABASE_URL is configured as: ${process.env.DATABASE_URL.split('@')[0].replace(/:[^:]*@/, ':****@')}...`);

try {
  // Clean up existing client
  console.log('\n🧹 Cleaning up existing Prisma client...');
  execSync('npx rimraf node_modules/.prisma', { stdio: 'inherit' });
  
  // Generate fresh client
  console.log('\n🔨 Generating Prisma client...');
  
  // Pass environment variables to prisma generate command
  execSync('npx prisma generate', { 
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_URL: process.env.DATABASE_URL,
      DIRECT_URL: process.env.DIRECT_URL || process.env.DATABASE_URL
    }
  });
  
  console.log('\n✅ Prisma client generated successfully!');
  console.log('\nNext steps:');
  console.log('  • Run node test-db.js to test your database connection');
  
} catch (error) {
  console.error('\n❌ Error during Prisma setup:', error.message);
  process.exit(1);
} 