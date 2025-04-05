# Notification API System

## Changes Made

The email notification system has been removed from this application. It previously used:

- Nodemailer for sending email notifications
- Vercel Cron for scheduling updates
- Email templates for different alert types
- SMTP configuration for email delivery

## Future API Integration

The notification system will be replaced with an external API integration that will handle all notifications. This will allow for more flexibility and scalability, supporting multiple notification channels beyond email.

### What Was Removed

- `src/lib/email.ts`: Email service utility file
- Email-related test scripts
- Nodemailer dependency
- Email-related environment variables
- Vercel Cron scheduling (emptied the cron jobs array)
- Email notification documentation

### What Was Kept

- The notification database schema
- Flight data update logic
- Notification messages generation
- Database notification creation

### Integration Points

When implementing the new notification API, you'll need to:

1. Configure the new API settings in the environment variables:
   ```
   NOTIFICATION_API_URL="https://api.example.com/notifications"
   NOTIFICATION_API_KEY="your-notification-api-key"
   ```

2. Update the placeholder `sendNotification` function in `src/lib/notifications/index.ts` to make real API calls.

3. Replace the TODO comments in `src/app/api/cron/update-flights/route.ts` with actual calls to the notification API.

### API Requirements

The notification API should support:

- User registration/configuration
- Multiple notification channels (email, SMS, push notifications, etc.)
- Webhook/API integration
- Authentication mechanisms
- Delivery status tracking

## Re-enabling Scheduling

To re-enable scheduled updates with the new notification system, you'll need to:

1. Update the `vercel.json` file to add the cron job back:
   ```json
   {
     "crons": [
       {
         "path": "/api/cron/update-flights",
         "schedule": "*/15 * * * *"
       }
     ],
     ...
   }
   ```

2. Update the cron trigger scripts if needed.

## Next Steps

1. Implement the external notification API
2. Update the placeholder notification function
3. Re-enable scheduling when appropriate
4. Test the new notification system 