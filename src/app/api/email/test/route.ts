import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';
import { createNotificationEmail } from '@/lib/email/templates/notification';

// This is a simple test endpoint to verify the email service is working
// In a production environment, you should secure this endpoint or remove it
export async function GET() {
  try {
    // Create a test notification email
    const emailData = createNotificationEmail({
      recipientEmail: 'patel.naman6@gmail.com', // Replace with a real email for testing
      recipientName: 'Test User',
      message: 'This is a test email from your Flight Tracker application.',
      actionUrl: 'https://example.com',
      actionText: 'Visit Website',
    });

    // Send the email
    const result = await sendEmail(emailData);

    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        message: 'Test email sent successfully', 
        messageId: result.messageId 
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to send email' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in test email endpoint:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 