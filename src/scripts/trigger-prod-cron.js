require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');

/**
 * DEPRECATED: This script was used to manually trigger the cron job in production mode.
 * The email notification system has been removed and will be replaced with an external API.
 */

console.log('⚠️ DEPRECATED: The cron job functionality has been removed.');
console.log('This script is kept for reference purposes only.');
console.log('Flight notifications will be handled by an external API in the future.');

function triggerProductionCronJob() {
  console.log('ℹ️ This functionality is no longer available.');
  console.log('Please refer to the new notification API documentation when available.');
}

// This function call is intentionally commented out
// triggerProductionCronJob(); 