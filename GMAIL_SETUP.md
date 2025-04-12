# Setting Up Gmail for Production Email Notifications

This guide will help you configure your Flight Tracker application to send real email notifications using your Gmail account.

## Prerequisites

- A Gmail account
- 2-Step Verification enabled on your Google Account
- Flight Tracker application set up locally

## Step 1: Generate an App Password

Since Gmail doesn't allow direct password authentication for third-party apps, you'll need to generate an App Password:

1. Go to your [Google Account Security settings](https://myaccount.google.com/security)
2. Under "Signing in to Google," select "App passwords" (you'll need to verify your identity)
3. At the bottom, select "Select app" and choose "Mail"
4. Select "Other" for the device and enter "Flight Tracker"
5. Click "Generate"
6. Google will display a 16-character password - **copy this password**

## Step 2: Update Your .env.local File

Update your `.env.local` file with the following settings:

```
# Email Configuration
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT="587"
EMAIL_SECURE="false"
EMAIL_USER="your-gmail@gmail.com"
EMAIL_PASSWORD="your-16-character-app-password"
EMAIL_FROM="Flight Tracker <your-gmail@gmail.com>"

# Environment
NODE_ENV="production"

# Enable rules polling for notifications
ENABLE_RULES_POLLING="true"
RULES_POLLING_INTERVAL_MINUTES="5"
```

Replace:
- `your-gmail@gmail.com` with your actual Gmail address
- `your-16-character-app-password` with the App Password you generated in Step 1

## Step 3: Testing Email Notifications

Once you have configured your credentials, you can test the email notification system using one of the following methods:

### Method 1: Test API Endpoint

Use the test API endpoint to send a test notification email:

```
curl -X GET "http://localhost:3000/api/test-email" -H "x-api-key: test"
```

Or in PowerShell:

```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/test-email" -Headers @{"x-api-key"="test"} | Select-Object -ExpandProperty Content
```

### Method 2: Simulate Rule Processing with Test Mode

Use the process-rules endpoint with test mode to simulate notifications:

```
curl -X GET "http://localhost:3000/api/cron/process-rules?test=true" -H "x-api-key: test"
```

Or in PowerShell:

```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/cron/process-rules?test=true" -Headers @{"x-api-key"="test"} | Select-Object -ExpandProperty Content
```

## Step 4: Production Deployment

For production deployment with Vercel:

1. Make sure you've set up all the environment variables in your Vercel project
2. The cron job is configured in vercel.json to run every 30 minutes:

```json
{
  "crons": [
    {
      "path": "/api/cron/process-rules",
      "schedule": "*/30 * * * *"
    }
  ]
}
```

For a production application with many users, consider using a dedicated email service like SendGrid, Mailgun, or Amazon SES. 