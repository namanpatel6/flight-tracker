require('dotenv').config({ path: '.env.local' });
const { sendAlertEmail } = require('./email-utils');

async function testProductionEmail() {
  // Ensure we're in production mode
  process.env.NODE_ENV = 'production';
  
  console.log('Testing production email configuration...');
  console.log('Email settings:');
  console.log(`- HOST: ${process.env.EMAIL_HOST}`);
  console.log(`- PORT: ${process.env.EMAIL_PORT}`);
  console.log(`- SECURE: ${process.env.EMAIL_SECURE}`);
  console.log(`- USER: ${process.env.EMAIL_USER}`);
  console.log(`- FROM: ${process.env.EMAIL_FROM}`);
  
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
  
  // Get the recipient email from command line or use the EMAIL_USER
  const recipientEmail = process.argv[2] || process.env.EMAIL_USER;
  
  console.log(`Sending test email to: ${recipientEmail}`);
  
  try {
    // Send a test email
    const result = await sendAlertEmail(recipientEmail, 'STATUS_CHANGE', flight);
    
    if (result.success) {
      console.log('✅ Email sent successfully!');
      console.log(`Message ID: ${result.messageId}`);
    } else {
      console.error('❌ Failed to send email:', result.error);
    }
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

testProductionEmail().catch(console.error); 