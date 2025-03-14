# Flight Tracker

A modern flight tracking application that allows users to track flights between any collection of sources and destinations.

## Features

- Search flights from multiple carriers and websites
- Create and manage complex tracking rules
- Receive notifications via email and SMS
- Monitor rule status and execution
- View detailed flight information with direct links

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **UI Components**: Shadcn UI, Tailwind CSS
- **Backend**: Node.js
- **Authentication**: NextAuth.js with Google and GitHub OAuth
- **API**: AviationStack for real-time flight data
- **Email Notifications**: Nodemailer with Ethereal for development

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- npm or yarn
- AviationStack API key (get one at [aviationstack.com](https://aviationstack.com/))
- PostgreSQL database

### Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd flight-tracker
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root directory and add necessary environment variables:
```env
# AviationStack API Key
NEXT_PUBLIC_AVIATIONSTACK_API_KEY=your_api_key_here

# NextAuth.js Secret
# Generate with: node -e "console.log(crypto.randomBytes(32).toString('hex'))"
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000

# OAuth Providers
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GITHUB_ID=your_github_id_here
GITHUB_SECRET=your_github_secret_here

# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/flight_tracker"

# Email Configuration (for production)
EMAIL_HOST="smtp.example.com"
EMAIL_PORT="587"
EMAIL_SECURE="false"
EMAIL_USER="user@example.com"
EMAIL_PASSWORD="your-email-password"
EMAIL_FROM="Flight Tracker <notifications@flight-tracker.com>"

# Cron Job API Key
CRON_API_KEY="your-cron-api-key"
```

4. Generate a secure NEXTAUTH_SECRET:
```bash
node -e "console.log(crypto.randomBytes(32).toString('hex'))"
```
Copy the output and paste it as your NEXTAUTH_SECRET in the `.env.local` file.

5. Set up the database:
```bash
npx prisma migrate dev
```

6. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

The project follows a modern Next.js application structure:

```
/
├── src/
│   ├── app/                # Next.js App Router directory
│   ├── components/         # Reusable UI components
│   ├── lib/                # Utility functions and API clients
│   ├── types/              # TypeScript type definitions
│   └── styles/             # Global styles
├── public/                 # Static assets
└── prisma/                 # Database schema and migrations
```

## API Integration

This project uses the AviationStack API to fetch real-time flight data. To use the API:

1. Sign up for a free account at [aviationstack.com](https://aviationstack.com/)
2. Get your API key from the dashboard
3. Add your API key to the `.env.local` file

Note: The free tier of AviationStack has limitations on the number of requests and does not include HTTPS access. For production use, consider upgrading to a paid plan.

## Authentication

The application uses NextAuth.js for authentication with the following providers:

- Google OAuth
- GitHub OAuth
- Email/Password (credentials)

To set up OAuth providers, you'll need to create OAuth applications in the respective developer consoles and add the client IDs and secrets to your `.env.local` file.

### About NEXTAUTH_SECRET

The NEXTAUTH_SECRET is a cryptographic key used by NextAuth.js for:
- Encrypting JWT tokens used for sessions
- Signing cookies to prevent tampering
- Securing the overall authentication flow

Always use a strong, randomly generated secret and never commit it to your repository.

## Email Notification System

The Flight Tracker application includes an email notification system that sends alerts to users about changes to their tracked flights. For detailed information, see [EMAIL_NOTIFICATIONS.md](./EMAIL_NOTIFICATIONS.md).

### Key Features

- **Real-time Alerts**: Receive email notifications for flight status changes, delays, gate changes, departures, and arrivals.
- **Automated Updates**: A cron job periodically checks for flight updates and sends notifications when changes are detected.
- **Development Mode**: Uses Ethereal Email for testing without sending real emails.
- **Production Ready**: Can be configured to use any SMTP service for production.

### Testing Email Functionality

To test the email functionality:

```bash
npm run test:email
```

This will send test emails for each alert type using Ethereal Email. You can view the emails in the Ethereal web interface using the preview URLs printed in the console.

### Manually Triggering the Cron Job

To manually trigger the cron job that checks for flight updates and sends notifications:

```bash
npm run trigger:cron
```

For more details about the email notification system, including configuration, implementation details, and troubleshooting, see [EMAIL_NOTIFICATIONS.md](./EMAIL_NOTIFICATIONS.md).

## Development

- `npm run dev` - Start development server
- `npm run build` - Build production bundle
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run test:email` - Test email notification functionality
- `npm run trigger:cron` - Manually trigger the flight update cron job

## License

[MIT License](LICENSE)

## Email Notifications

The Flight Tracker application includes an email notification service that sends alerts to users when there are changes to their tracked flights. For detailed setup instructions, see [EMAIL_SETUP.md](./EMAIL_SETUP.md).

### Key Features

- **Automated Notifications**: Receive email alerts for flight status changes, delays, gate changes, departures, and arrivals.
- **Customizable Templates**: Email templates can be customized to match your branding.
- **Development Mode**: Uses Ethereal Email for testing without sending real emails.
- **Production Ready**: Can be configured to use any SMTP service for production.

### Getting Started with Email Notifications

1. Set up the required environment variables in `.env.local`
2. Check your configuration with `npm run check:env`
3. Test the email functionality with `npm run test:email`
4. Set up the cron job for automatic updates

For more details, see the [Email Setup Guide](./EMAIL_SETUP.md).
