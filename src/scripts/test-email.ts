import { sendAlertEmail } from '../lib/email';

async function testEmailSending() {
  console.log('Testing email sending functionality...');
  
  // Sample flight data for testing
  const testFlight = {
    flightNumber: 'AA123',
    departureAirport: 'JFK',
    arrivalAirport: 'LAX',
    departureTime: new Date(Date.now() + 3600000), // 1 hour from now
    arrivalTime: new Date(Date.now() + 21600000),  // 6 hours from now
    status: 'scheduled',
    gate: 'B12',
    terminal: 'T2'
  };
  
  // Test each type of alert email
  const alertTypes = [
    'STATUS_CHANGE',
    'DELAY',
    'GATE_CHANGE',
    'DEPARTURE',
    'ARRIVAL'
  ];
  
  // Replace with your test email
  const testEmail = 'your-test-email@example.com';
  
  for (const alertType of alertTypes) {
    console.log(`Sending test email for alert type: ${alertType}`);
    
    try {
      const result = await sendAlertEmail(testEmail, alertType, testFlight);
      
      if (result.success) {
        console.log(`✅ Successfully sent ${alertType} email. Message ID: ${result.messageId}`);
        if (process.env.NODE_ENV !== 'production') {
          console.log('Check the console output above for the Ethereal preview URL');
        }
      } else {
        console.error(`❌ Failed to send ${alertType} email:`, result.error);
      }
    } catch (error) {
      console.error(`❌ Error sending ${alertType} email:`, error);
    }
    
    // Wait a bit between emails
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('Email testing completed.');
}

// Run the test
testEmailSending().catch(console.error); 