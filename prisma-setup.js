/**
 * Prisma Client Setup Script
 * 
 * This script provides a convenient way to:
 * 1. Generate the Prisma client
 * 2. Test the database connection
 * 3. Apply database migrations
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

console.log(`${colors.cyan}🔄 Prisma Setup Script ${colors.reset}\n`);

// Check for .env file
if (!fs.existsSync(path.join(__dirname, '.env'))) {
  console.log(`${colors.yellow}⚠️  No .env file found. Creating example file...${colors.reset}`);
  const envExample = `DATABASE_URL="postgresql://prisma_user:password@localhost:5432/flight_tracker?schema=public"
DIRECT_URL="postgresql://prisma_user:password@localhost:5432/flight_tracker?schema=public"`;
  
  fs.writeFileSync(path.join(__dirname, '.env.example'), envExample);
  console.log(`${colors.yellow}Created .env.example - please copy to .env and update with your credentials${colors.reset}\n`);
  process.exit(1);
}

try {
  // Step 1: Clear the Prisma cache
  console.log(`${colors.blue}🧹 Clearing Prisma cache...${colors.reset}`);
  execSync('npx prisma generate --no-engine', { stdio: 'inherit' });
  
  // Step 2: Generate the Prisma client
  console.log(`\n${colors.blue}🔨 Generating Prisma client...${colors.reset}`);
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  console.log(`\n${colors.green}✅ Prisma client generated successfully!${colors.reset}`);
  
  // Provide options for next steps
  console.log(`\n${colors.cyan}Next steps:${colors.reset}`);
  console.log(`  • Run ${colors.yellow}npx prisma db push${colors.reset} to sync schema with database`);
  console.log(`  • Run ${colors.yellow}node src/lib/db-test.ts${colors.reset} to test database connection`);
  console.log(`  • Run ${colors.yellow}npx prisma studio${colors.reset} to open Prisma Studio\n`);
  
} catch (error) {
  console.error(`\n${colors.red}❌ Error during Prisma setup:${colors.reset}`, error.message);
  process.exit(1);
} 