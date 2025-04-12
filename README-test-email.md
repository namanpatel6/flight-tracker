# Email Notification Testing

This document provides instructions for testing the email notification system in the Flight Tracker application.

## Prerequisites

- Node.js installed
- Development server running (`npm run dev`)
- `CRON_API_KEY` environment variable set (same as in your `.env` file)

## Running the Test Script

1. First, ensure your development server is running:
   ```
   npm run dev
   ```

2. Set the CRON_API_KEY environment variable:
   
   On Windows (Command Prompt):
   ```
   set CRON_API_KEY=your_cron_api_key_here
   ```
   
   On Windows (PowerShell):
   ```
   $env:CRON_API_KEY="your_cron_api_key_here"
   ```
   
   On macOS/Linux:
   ```
   export CRON_API_KEY=your_cron_api_key_here
   ```

3. Run the test script:
   ```
   node test-email-endpoint.js
   ```

## What the Test Does

The test script performs two actions:

1. **Simple Email Test**: Sends a basic notification email with a gate change alert.
2. **AA777 Flight Test**: Sets up a complete workflow for the AA777 flight:
   - Creates or updates a tracked flight
   - Creates a rule for sending notifications
   - Sends a confirmation email
   - Updates the flight status to trigger a notification
   - Processes the rules to send the notification

## Expected Output

If the tests work correctly, you should:

1. See successful JSON responses in the console
2. Receive two test emails at the specified address (default: test@example.com)

## Troubleshooting

- If you see an error about `CRON_API_KEY not set`, make sure you've set the environment variable correctly.
- If the server can't be reached, ensure your development server is running.
- Check the server logs for any errors related to email sending.
- Verify your email configuration in the `.env` file is correct. 