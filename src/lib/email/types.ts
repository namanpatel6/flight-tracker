/**
 * Common email data interface to be used across different email providers
 */
export interface EmailData {
  /**
   * Email recipient(s)
   */
  to: string | string[];
  
  /**
   * Email subject line
   */
  subject: string;
  
  /**
   * Email HTML content
   */
  html?: string;
  
  /**
   * Plain text fallback content
   */
  text?: string;
  
  /**
   * CC recipient(s)
   */
  cc?: string | string[];
  
  /**
   * BCC recipient(s)
   */
  bcc?: string | string[];
  
  /**
   * Reply-to email address
   */
  replyTo?: string;
  
  /**
   * Optional sender name and email (if different from default)
   */
  from?: string;
  
  /**
   * Optional attachments
   */
  attachments?: EmailAttachment[];
}

/**
 * Email attachment interface
 */
export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

/**
 * Response from email sending operation
 */
export interface SendEmailResponse {
  /**
   * Whether the email was sent successfully
   */
  success: boolean;
  
  /**
   * Message ID (if available)
   */
  messageId?: string;
  
  /**
   * Error message (if any)
   */
  error?: string;
} 