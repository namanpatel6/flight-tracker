// Email service utility for sending notifications
import nodemailer from 'nodemailer';

// Email templates for different alert types
const emailTemplates = {
  STATUS_CHANGE: (flight: any) => ({
    subject: `Flight Status Update: ${flight.flightNumber}`,
    body: `
      <h1>Flight Status Update</h1>
      <p>Your flight ${flight.flightNumber} from ${flight.departureAirport} to ${flight.arrivalAirport} has a status update.</p>
      <p>Current status: <strong>${flight.status}</strong></p>
      <p>Departure: ${new Date(flight.departureTime).toLocaleString()}</p>
      <p>Arrival: ${new Date(flight.arrivalTime).toLocaleString()}</p>
    `
  }),
  DELAY: (flight: any) => ({
    subject: `Flight Delay Alert: ${flight.flightNumber}`,
    body: `
      <h1>Flight Delay Alert</h1>
      <p>Your flight ${flight.flightNumber} from ${flight.departureAirport} to ${flight.arrivalAirport} has been delayed.</p>
      <p>New departure time: <strong>${new Date(flight.departureTime).toLocaleString()}</strong></p>
      <p>New arrival time: <strong>${new Date(flight.arrivalTime).toLocaleString()}</strong></p>
    `
  }),
  GATE_CHANGE: (flight: any) => ({
    subject: `Gate Change Alert: ${flight.flightNumber}`,
    body: `
      <h1>Gate Change Alert</h1>
      <p>Your flight ${flight.flightNumber} from ${flight.departureAirport} to ${flight.arrivalAirport} has a gate change.</p>
      <p>New gate: <strong>${flight.gate || 'Not available'}</strong></p>
      <p>Departure: ${new Date(flight.departureTime).toLocaleString()}</p>
    `
  }),
  DEPARTURE: (flight: any) => ({
    subject: `Departure Update: ${flight.flightNumber}`,
    body: `
      <h1>Departure Update</h1>
      <p>Your flight ${flight.flightNumber} from ${flight.departureAirport} to ${flight.arrivalAirport} has a departure update.</p>
      <p>Departure time: <strong>${new Date(flight.departureTime).toLocaleString()}</strong></p>
      <p>Gate: ${flight.gate || 'Not available'}</p>
      <p>Terminal: ${flight.terminal || 'Not available'}</p>
    `
  }),
  ARRIVAL: (flight: any) => ({
    subject: `Arrival Update: ${flight.flightNumber}`,
    body: `
      <h1>Arrival Update</h1>
      <p>Your flight ${flight.flightNumber} from ${flight.departureAirport} to ${flight.arrivalAirport} has an arrival update.</p>
      <p>Arrival time: <strong>${new Date(flight.arrivalTime).toLocaleString()}</strong></p>
      <p>Gate: ${flight.gate || 'Not available'}</p>
      <p>Terminal: ${flight.terminal || 'Not available'}</p>
    `
  })
};

// Create a transporter for sending emails
// In production, you would use a real email service like SendGrid, Mailgun, etc.
// For development, we'll use a test account from Ethereal
let transporter: any = null;

async function createTransporter() {
  if (transporter) return transporter;
  
  // For development/testing - create a test account
  if (process.env.NODE_ENV !== 'production') {
    // Create a test account at ethereal.email
    const testAccount = await nodemailer.createTestAccount();
    
    // Create a SMTP transporter
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
    
    return transporter;
  }
  
  // For production - use environment variables
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
  
  return transporter;
}

/**
 * Send an email notification for a flight alert
 */
export async function sendAlertEmail(
  userEmail: string, 
  alertType: string, 
  flight: any
) {
  try {
    const transport = await createTransporter();
    
    // Get the template for this alert type
    const template = emailTemplates[alertType as keyof typeof emailTemplates];
    
    if (!template) {
      throw new Error(`No email template found for alert type: ${alertType}`);
    }
    
    const { subject, body } = template(flight);
    
    // Send the email
    const info = await transport.sendMail({
      from: process.env.EMAIL_FROM || '"Flight Tracker" <notifications@flight-tracker.com>',
      to: userEmail,
      subject,
      html: body
    });
    
    if (process.env.NODE_ENV !== 'production') {
      // Log the test URL for development
      console.log('Email sent: %s', info.messageId);
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
} 