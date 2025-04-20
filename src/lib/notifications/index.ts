/**
 * This file is a placeholder for the future notification API integration.
 * The email notification system has been removed and will be replaced by an external API.
 */

/**
 * Notification service to send email notifications
 * Using Resend as the email delivery provider
 */

import { sendEmail } from '@/lib/email';
import { EmailData } from '@/lib/email/types';

/**
 * Sends a notification email to a user
 * @param to Recipient email address
 * @param subject Email subject
 * @param html HTML content of the email
 * @param text Plain text content (fallback for non-HTML clients)
 */
export async function sendNotificationEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<{ success: boolean; message: string }> {
  try {
    // Create email data object
    const emailData: EmailData = {
      to,
      subject,
      html,
      text,
    };

    // Send the email using the Resend service
    const result = await sendEmail(emailData);

    if (!result.success) {
      return { success: false, message: result.error || 'Failed to send email' };
    }

    return { success: true, message: 'Email sent successfully' };
  } catch (error) {
    console.error('Error sending email:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error sending email' 
    };
  }
}

/**
 * Creates a flight alert notification email
 * @param data Alert data
 */
export function createFlightAlertEmail({
  userName,
  flightNumber,
  alertType,
  message,
}: {
  userName: string;
  flightNumber: string;
  alertType: string;
  message: string;
}): { subject: string; html: string; text: string } {
  const subject = `Flight Alert: ${flightNumber} - ${alertType}`;
  
  // Simple HTML template
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #3b82f6;">Flight Alert: ${flightNumber}</h2>
      <p>Hello ${userName || 'there'},</p>
      <p>${message}</p>
      <div style="margin: 20px 0; padding: 15px; background-color: #f3f4f6; border-radius: 5px;">
        <p style="margin: 0;"><strong>Flight:</strong> ${flightNumber}</p>
        <p style="margin: 5px 0;"><strong>Alert Type:</strong> ${alertType}</p>
      </div>
      <p>You can view more details by logging into your Flight Tracker account.</p>
      <p>Safe travels!</p>
      <p>- The Flight Tracker Team</p>
    </div>
  `;
  
  // Plain text version
  const text = `
    Flight Alert: ${flightNumber}
    
    Hello ${userName || 'there'},
    
    ${message}
    
    Flight: ${flightNumber}
    Alert Type: ${alertType}
    
    You can view more details by logging into your Flight Tracker account.
    
    Safe travels!
    - The Flight Tracker Team
  `;
  
  return { subject, html, text };
} 