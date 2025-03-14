# Email Notification System

This document provides an overview of the email notification system implemented in the Flight Tracker application.

## Overview

The Flight Tracker application includes an email notification system that sends alerts to users about changes to their tracked flights. The system supports various types of notifications, including status changes, delays, gate changes, departures, and arrivals.

## Components

The email notification system consists of the following components:

1. **Email Service (`src/lib/email.ts`)**: Handles the creation and sending of emails using Nodemailer.
2. **Cron Job (`src/app/api/cron/update-flights/route.ts`)**: Periodically checks for flight updates and triggers notifications.
3. **Notification Model**: Stores notification data in the database.
4. **Test Scripts**: Utilities for testing the email functionality.

## Email Templates

The system includes the following email templates:

- **STATUS_CHANGE**: Notifies users when a flight's status changes (e.g., from "scheduled" to "delayed").
- **DELAY**: Notifies users when a flight is delayed.
- **GATE_CHANGE**: Notifies users when a flight's gate changes.
- **DEPARTURE**: Notifies users when a flight is departing.
- **ARRIVAL**: Notifies users when a flight has arrived.

## Configuration

### Environment Variables

The email notification system requires the following environment variables to be set in your `.env.local` file:

```
# Email Configuration
EMAIL_HOST="smtp.example.com"
EMAIL_PORT="587"
EMAIL_SECURE="false"
EMAIL_USER="user@example.com"
EMAIL_PASSWORD="your-email-password"
EMAIL_FROM="Flight Tracker <notifications@flight-tracker.com>"

# Cron Job API Key
CRON_API_KEY="your-cron-api-key"
```

In development mode, the system uses [Ethereal](https://ethereal.email/) to create test email accounts, so these environment variables are not required.

## Testing

### Test Email Functionality

To test the email functionality, run:

```bash
npm run test:email
```

This script sends test emails for each alert type using a test email account from Ethereal. You can view the emails in the Ethereal web interface using the preview URLs printed in the console.

### Trigger Cron Job Manually

To manually trigger the cron job that checks for flight updates and sends notifications, run:

```bash
npm run trigger:cron
```

This script makes a request to the cron endpoint with the appropriate API key.

## Implementation Details

### Email Service

The email service uses Nodemailer to send emails. In development mode, it creates a test account using Ethereal. In production, it uses the SMTP configuration provided in the environment variables.

```typescript
// Create a transporter for sending emails
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
      secure: false,
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
```

### Cron Job

The cron job endpoint (`/api/cron/update-flights`) is designed to be called by a cron job service like Vercel Cron. It:

1. Retrieves all tracked flights with active alerts
2. Fetches the latest information for each flight
3. Compares the new information with the stored information
4. Sends notifications for any changes
5. Updates the flight information in the database

The endpoint is secured with an API key that must be provided in the request headers.

## Troubleshooting

### Emails Not Sending

If emails are not being sent, check the following:

1. In development mode, make sure you have an internet connection (required for Ethereal).
2. In production mode, make sure the email configuration in your environment variables is correct.
3. Check the server logs for any errors related to email sending.

### Cron Job Not Running

If the cron job is not running, check the following:

1. Make sure the `CRON_API_KEY` environment variable is set correctly.
2. Check that the cron job service is configured to call the endpoint at the desired interval.
3. Check the server logs for any errors related to the cron job.

## CommonJS Scripts

For testing purposes, we've created CommonJS versions of the email and cron trigger scripts:

- `src/scripts/email-utils.js`: CommonJS version of the email service
- `src/scripts/test-email.js`: Script to test email sending
- `src/scripts/trigger-cron.js`: Script to manually trigger the cron job

These scripts can be run directly with Node.js without requiring TypeScript compilation. 