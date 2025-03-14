require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');

/**
 * This script manually triggers the cron job to update flights and send notifications
 * in production mode, which will use real email services instead of Ethereal.
 */

async function triggerProductionCronJob() {
  // Ensure we're in production mode
  process.env.NODE_ENV = 'production';
  
  console.log('Manually triggering the flight update cron job in PRODUCTION mode...');
  console.log('This will send real emails to users!');
  
  try {
    // Get the API key from environment variables
    const apiKey = process.env.CRON_API_KEY;
    
    if (!apiKey) {
      console.error('❌ Error: CRON_API_KEY is not defined in your .env.local file');
      console.log('Please add CRON_API_KEY=your_secret_key to your .env.local file');
      return;
    }
    
    // Determine the base URL (localhost for development, actual domain for production)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const url = `${baseUrl}/api/cron/update-flights`;
    
    console.log(`Making request to: ${url}`);
    
    // Make the request to the cron endpoint
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'X-Environment': 'production'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to trigger cron job: ${response.status} ${response.statusText}\n${errorText}`);
    }
    
    const data = await response.json();
    console.log('✅ Production cron job triggered successfully!');
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Error triggering production cron job:', error.message);
  }
}

// Run the function
triggerProductionCronJob().catch(console.error); 