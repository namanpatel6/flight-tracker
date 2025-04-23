# QStash Integration for Flight Tracker

This document explains how to set up and use QStash with the Flight Tracker application to overcome Vercel's free tier cron job limitations.

## Overview

Vercel's free tier only allows cron jobs with a minimum frequency of once per day, which is insufficient for real-time flight tracking. QStash is used to create more frequent schedules (15 minutes, 30 minutes, 2 hours, 12 hours) to properly process flight rules and send notifications.

## Setup Instructions

### 1. Create a QStash Account

1. Go to [Upstash](https://upstash.com/) and sign up for an account
2. Navigate to the QStash service and create a new QStash instance
3. Obtain your QStash tokens and signing keys

### 2. Configure Environment Variables

Add the following variables to your Vercel environment variables:

```
QSTASH_TOKEN=your_qstash_token
QSTASH_CURRENT_SIGNING_KEY=your_qstash_current_signing_key
QSTASH_NEXT_SIGNING_KEY=your_qstash_next_signing_key
ADMIN_API_KEY=your_admin_api_key_for_secure_endpoints
NEXT_PUBLIC_APP_URL=https://your-vercel-app-url.vercel.app
```

### 3. Deploy Your Application

Deploy your application to Vercel to ensure the QStash webhook endpoints are accessible.

### 4. Set Up QStash Schedules

Once deployed, set up the QStash schedules by making a POST request to your admin endpoint:

```bash
curl -X POST https://your-vercel-app-url.vercel.app/api/admin/qstash-setup \
  -H "Authorization: Bearer your_admin_api_key"
```

This will create four schedules:
- Every 15 minutes for active flights
- Every 30 minutes for upcoming flights
- Every 2 hours for flights >12 hours away
- Every 12 hours for flights >24 hours away

### 5. Verify Schedules

Check that your schedules are properly configured:

```bash
curl -X GET https://your-vercel-app-url.vercel.app/api/admin/qstash-setup \
  -H "Authorization: Bearer your_admin_api_key"
```

## How It Works

1. QStash sends webhook requests to your API endpoint at the specified intervals
2. The endpoint `/api/qstash/process-rules` verifies the request is from QStash
3. If verified, it processes the rules using your existing `processRules()` function
4. The rule processor updates flight data and sends notifications as needed

## Testing Locally

For local testing:
1. Start your development server
2. Make a GET request to `/api/qstash/process-rules`

This will bypass the QStash signature verification in development mode.

## Maintenance

If you need to update your schedules:
1. Make changes to the intervals in `src/lib/qstash-config.ts`
2. Use the admin endpoint to remove old schedules and create new ones

## Troubleshooting

### QStash Not Triggering

1. Check the QStash dashboard to see if your schedules are active
2. Verify your webhook URL is correct
3. Look for any error responses in the QStash dashboard

### Signature Verification Failing

1. Verify your signing keys are correctly configured
2. Check that the request headers from QStash are being correctly processed

### Cost Considerations

The free tier of QStash includes 100 messages per day. With our current configuration:
- 15-minute schedule: 96 messages/day
- 30-minute schedule: 48 messages/day
- 2-hour schedule: 12 messages/day
- 12-hour schedule: 2 messages/day
- Total: 158 messages/day

You may need to adjust schedule frequencies or upgrade to a paid tier if you exceed the free limit. 