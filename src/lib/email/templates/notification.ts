import { EmailData } from '../types';

interface NotificationEmailProps {
  recipientEmail: string;
  recipientName: string;
  message: string;
  actionUrl?: string;
  actionText?: string;
}

/**
 * Generate a notification email
 */
export function createNotificationEmail(props: NotificationEmailProps): EmailData {
  const {
    recipientEmail,
    recipientName,
    message,
    actionUrl,
    actionText = 'View Details',
  } = props;

  // HTML version of the email
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Flight Tracker Notification</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #2563EB;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 5px 5px 0 0;
          }
          .content {
            padding: 20px;
            background-color: #f9fafb;
            border: 1px solid #e5e7eb;
            border-top: none;
            border-radius: 0 0 5px 5px;
          }
          .button {
            display: inline-block;
            background-color: #2563EB;
            color: white;
            text-decoration: none;
            padding: 10px 20px;
            border-radius: 5px;
            margin-top: 20px;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            font-size: 12px;
            color: #6b7280;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Flight Tracker</h1>
        </div>
        <div class="content">
          <p>Hello ${recipientName},</p>
          <p>${message}</p>
          ${actionUrl ? `<p><a href="${actionUrl}" class="button">${actionText}</a></p>` : ''}
          <p>Thank you for using Flight Tracker!</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Flight Tracker. All rights reserved.</p>
          <p>This email was sent to ${recipientEmail}</p>
        </div>
      </body>
    </html>
  `;

  // Plain text version of the email
  const text = `
Hello ${recipientName},

${message}

${actionUrl ? `${actionText}: ${actionUrl}` : ''}

Thank you for using Flight Tracker!

© ${new Date().getFullYear()} Flight Tracker. All rights reserved.
This email was sent to ${recipientEmail}
  `.trim();

  return {
    to: recipientEmail,
    subject: 'Flight Tracker Notification',
    html,
    text,
  };
} 