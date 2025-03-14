/**
 * This script manually triggers the cron job to update flights and send notifications.
 * It's useful for testing the cron job functionality without waiting for the scheduled run.
 */

async function triggerCronJob() {
  console.log('Manually triggering the flight update cron job...');
  
  const apiKey = process.env.CRON_API_KEY;
  
  if (!apiKey) {
    console.error('❌ CRON_API_KEY environment variable is not set.');
    process.exit(1);
  }
  
  try {
    // Determine the base URL based on environment
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const url = `${baseUrl}/api/cron/update-flights`;
    
    console.log(`Making request to: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-api-key': apiKey
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to trigger cron job: ${response.status} ${response.statusText}\n${errorText}`);
    }
    
    const result = await response.json();
    console.log('✅ Cron job triggered successfully:', result);
  } catch (error) {
    console.error('❌ Error triggering cron job:', error);
  }
}

// Run the function
triggerCronJob().catch(console.error); 