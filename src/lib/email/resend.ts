import { Resend } from 'resend';
import { EmailData, SendEmailResponse } from './types';

// Initialize Resend with API key from environment variables
const resend = new Resend(process.env.RESEND_API_KEY);

// Default sender email address from environment variables
const DEFAULT_FROM = process.env.EMAIL_FROM || 'onboarding@resend.dev';

/**
 * Send an email using Resend
 */
export async function sendEmail(data: EmailData): Promise<SendEmailResponse> {
  try {
    // Prepare email data for Resend
    const emailData = {
      from: data.from || DEFAULT_FROM,
      to: Array.isArray(data.to) ? data.to : [data.to],
      subject: data.subject,
      text: data.text || data.html?.replace(/<[^>]*>/g, '') || 'No content provided', // Ensure text is always provided
      html: data.html,
      cc: data.cc,
      bcc: data.bcc,
      reply_to: data.replyTo,
      attachments: data.attachments?.map(attachment => ({
        filename: attachment.filename,
        content: attachment.content,
        content_type: attachment.contentType,
      })),
    };

    // Send email via Resend
    const { data: responseData, error } = await resend.emails.send(emailData);

    if (error) {
      console.error('Resend API error:', error);
      return {
        success: false,
        error: error.message || 'Failed to send email',
      };
    }

    return {
      success: true,
      messageId: responseData?.id,
    };
  } catch (error) {
    console.error('Resend send error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error sending email',
    };
  }
} 