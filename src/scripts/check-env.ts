/**
 * This script checks if the required environment variables for email functionality are set.
 */

function checkEnvironmentVariables() {
  console.log('Checking environment variables for email functionality...');
  
  const requiredVars = [
    'EMAIL_HOST',
    'EMAIL_PORT',
    'EMAIL_SECURE',
    'EMAIL_USER',
    'EMAIL_PASSWORD',
    'EMAIL_FROM',
    'CRON_API_KEY'
  ];
  
  const missingVars: string[] = [];
  
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  }
  
  if (missingVars.length === 0) {
    console.log('✅ All required environment variables are set.');
    
    // Print the values (mask sensitive information)
    console.log('\nCurrent configuration:');
    console.log(`EMAIL_HOST: ${process.env.EMAIL_HOST}`);
    console.log(`EMAIL_PORT: ${process.env.EMAIL_PORT}`);
    console.log(`EMAIL_SECURE: ${process.env.EMAIL_SECURE}`);
    console.log(`EMAIL_USER: ${process.env.EMAIL_USER}`);
    console.log(`EMAIL_PASSWORD: ${'*'.repeat(8)}`);
    console.log(`EMAIL_FROM: ${process.env.EMAIL_FROM}`);
    console.log(`CRON_API_KEY: ${'*'.repeat(8)}`);
    
    return true;
  } else {
    console.error('❌ The following environment variables are missing:');
    for (const varName of missingVars) {
      console.error(`  - ${varName}`);
    }
    console.error('\nPlease set these variables in your .env.local file.');
    return false;
  }
}

// Run the check
checkEnvironmentVariables(); 