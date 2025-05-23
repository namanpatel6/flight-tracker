# Flight Tracker

A modern flight tracking application that allows users to track flights between any collection of sources and destinations.

## Features

- Search flights from multiple carriers and websites
- Create and manage complex tracking rules with logical operators (AND/OR)
- Set up custom alerts based on flight status, times, gates, and more
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

For more details about the email notification system, including configuration, implementation details, and troubleshooting, see [EMAIL_NOTIFICATIONS.md](./EMAIL_NOTIFICATIONS.md).

## Development

- `npm run dev` - Start development server
- `npm run build` - Build production bundle
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run test:email` - Test email notification functionality
- `npm run trigger:cron` - Manually trigger the flight update cron job
- `npm run test:rules` - Test the rules system functionality

## License

[MIT License](LICENSE)

## Flight Rules System

The Flight Tracker application includes a powerful rules engine that allows you to create complex conditions for tracking flights and receiving notifications. For detailed information, see [RULES_AND_ALERTS.md](./RULES_AND_ALERTS.md).

### Key Features

- **Complex Rule Creation**: Create rules with multiple conditions using logical operators (AND/OR).
- **Flexible Conditions**: Set conditions based on flight status, departure/arrival times, gates, terminals, and more.
- **Custom Alerts**: Configure alerts for specific flight events and notification preferences.
- **Rule Management**: Enable/disable, edit, or delete rules as needed.

### Creating and Managing Rules

1. Navigate to the **Flight Rules** page in the dashboard
2. Click the **Create Rule** button to create a new rule
3. Define conditions, select operators, and set up alerts
4. Save and monitor your rules from the dashboard

### Examples

The system supports various rule configurations, such as:

- Business trip rules that track specific flights with status and time conditions
- Family vacation rules that monitor multiple flights with different alert types
- Airport change notifications that alert you when gates or terminals are updated

For more details about the rules system, including examples and troubleshooting, see [RULES_AND_ALERTS.md](./RULES_AND_ALERTS.md).
