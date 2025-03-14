require('dotenv').config({ path: '.env.local' });
const { sendAlertEmail } = require('./email-utils');

async function testEmailSending() {
  console.log('Starting email testing...');
  
  // Sample flight for testing
  const flight = {
    flightNumber: 'AA1234',
    departureAirport: 'JFK',
    arrivalAirport: 'LAX',
    departureTime: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
    arrivalTime: new Date(Date.now() + 21600000).toISOString(),  // 6 hours from now
    status: 'ON_TIME',
    gate: 'B12',
    terminal: 'T2'
  };
  
  // Test all alert types
  const alertTypes = ['STATUS_CHANGE', 'DELAY', 'GATE_CHANGE', 'DEPARTURE', 'ARRIVAL'];
  
  // Replace with your Gmail address
  const yourEmail = process.argv[2] || 'test@example.com';
  
  console.log(`Sending test emails to: ${yourEmail}`);
  
  for (const alertType of alertTypes) {
    try {
      console.log(`Sending ${alertType} alert email...`);
      const result = await sendAlertEmail(yourEmail, alertType, flight);
      
      if (result.success) {
        console.log(`✅ Successfully sent ${alertType} email! Message ID: ${result.messageId}`);
        
        // For development, log the Ethereal preview URL
        if (process.env.NODE_ENV !== 'production') {
          console.log('Check the console output above for the preview URL');
        }
      } else {
        console.error(`❌ Failed to send ${alertType} email:`, result.error);
      }
      
      // Wait a bit between emails
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Error testing ${alertType} email:`, error);
    }
  }
  
  console.log('Email testing complete!');
}

// Run the test
testEmailSending().catch(console.error); 