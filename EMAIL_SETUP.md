# Email Notification Service Setup

This document provides instructions on how to set up and test the email notification service for the Flight Tracker application.

## Environment Variables

The email service requires the following environment variables to be set in your `.env.local` file:

```
# Email Service Configuration
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@example.com
EMAIL_PASSWORD=your-email-password
EMAIL_FROM="Flight Tracker <notifications@flight-tracker.com>"

# Cron Job API Key
CRON_API_KEY=your-secure-cron-api-key
```

### Development Mode

In development mode, the application uses [Ethereal Email](https://ethereal.email/) to create a test SMTP account. This allows you to test email sending without actually delivering emails to real recipients. The test emails can be viewed in the Ethereal Email inbox.

### Production Mode

For production, you should use a real email service like SendGrid, Mailgun, or your own SMTP server. Update the environment variables with your actual email service credentials.

## Checking Environment Variables

To check if your environment variables are set up correctly:

```bash
npm run check:env
```

This will display which variables are set and which are missing.

## Testing Email Functionality

To test the email sending functionality:

1. Make sure your environment variables are set up correctly.
2. Run the test script:

```bash
npm run test:email
```

This will send test emails for each alert type (STATUS_CHANGE, DELAY, GATE_CHANGE, DEPARTURE, ARRIVAL) to the email address specified in the script. In development mode, you'll see preview URLs in the console output that you can use to view the test emails.

## Setting Up the Cron Job

The application includes a cron job endpoint that checks for flight updates and sends notifications. To set this up:

### For Local Development

You can manually trigger the cron job using the provided script:

```bash
npm run trigger:cron
```

### For Production

For production, you should set up a scheduled task to call the cron endpoint regularly. There are several options:

1. **Vercel Cron Jobs**: If you're deploying on Vercel, the included `vercel.json` file already configures a cron job to run every 15 minutes. Make sure to set the `CRON_API_KEY` environment variable in your Vercel project settings.

2. **External Cron Service**: Use a service like [Cron-job.org](https://cron-job.org/), [EasyCron](https://www.easycron.com/), or [SetCronJob](https://www.setcronjob.com/) to call your endpoint.

3. **Custom Server**: If you're running your own server, you can set up a traditional cron job using the server's cron daemon.

Example cron schedule (check every 15 minutes):

```
*/15 * * * * curl -X GET -H "x-api-key: your-secure-cron-api-key" https://your-domain.com/api/cron/update-flights
```

## Available Scripts

The following scripts are available to help with email notification setup and testing:

- `npm run check:env`: Check if all required environment variables are set
- `npm run test:email`: Test sending emails for all alert types
- `npm run trigger:cron`: Manually trigger the cron job to update flights and send notifications

## Troubleshooting

If you encounter issues with the email service:

1. **Check Environment Variables**: Make sure all required environment variables are set correctly.

2. **Check SMTP Settings**: Verify that your SMTP server settings are correct and that the server is accessible.

3. **Check Logs**: Look for error messages in the console or server logs.

4. **Test with Ethereal**: In development, use Ethereal Email to test without sending real emails.

5. **Check Firewall/Network**: Ensure that your application can connect to the SMTP server (port 587 or 465 is typically used).

## Email Templates

The email templates are defined in `src/lib/email.ts`. You can customize these templates to change the appearance and content of the notification emails. 