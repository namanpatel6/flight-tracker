import { EmailData, SendEmailResponse } from './types';
import { sendEmail as sendWithResend } from './resend';

/**
 * Send an email using the configured email provider
 */
export async function sendEmail(data: EmailData): Promise<SendEmailResponse> {
  // Currently using Resend as the email provider
  return sendWithResend(data);
}

// Re-export types
export * from './types'; 