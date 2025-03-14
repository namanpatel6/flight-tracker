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
```

Replace:
- `your-gmail@gmail.com` with your actual Gmail address
- `your-16-character-app-password` with the App Password you generated in Step 1

## Step 3: Test Your Configuration

Run the production email test script:

```bash
npm run test:prod-email
```

This will send a test email to your Gmail address using the production configuration.

## Step 4: Test the Full Notification Flow

1. Make sure you have a tracked flight with an alert:

```bash
npm run create:gmail-flight -- "your-gmail@gmail.com"
```

2. Simulate a flight status change:

```bash
npm run simulate:change -- "your-gmail@gmail.com"
```

3. Trigger the production cron job:

```bash
npm run trigger:prod-cron
```

4. Check your Gmail inbox for the notification email

## Troubleshooting

### Email Not Sending

If emails are not being sent, check the following:

1. Verify that your App Password is correct
2. Make sure 2-Step Verification is enabled on your Google Account
3. Check that your `.env.local` file has the correct settings
4. Look for any error messages in the console output

### Gmail Security

Gmail may block sign-in attempts from apps it deems less secure. If you're having issues:

1. Check your Gmail inbox for any security alerts
2. Go to your [Google Account Security settings](https://myaccount.google.com/security) and look for any security alerts
3. You might need to confirm that the sign-in attempt was from you

## Gmail Sending Limits

Be aware that Gmail has sending limits:

- Free Gmail accounts: 500 emails per day
- Google Workspace accounts: 2,000 emails per day

For a production application with many users, consider using a dedicated email service like SendGrid, Mailgun, or Amazon SES. 