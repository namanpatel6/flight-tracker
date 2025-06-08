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
- **Database**: PostgreSQL, Prisma ORM
- **Authentication**: NextAuth.js with Google OAuth
- **API**: FlightAware AeroAPI for real-time flight data
- **Email Notifications**: Nodemailer for email delivery
- **Background Processing**: QStash for scheduled tasks

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- npm or yarn
- FlightAware AeroAPI key (get one at [flightaware.com/aeroapi](https://flightaware.com/aeroapi/))
- PostgreSQL database
- Upstash QStash account (for scheduled tasks)

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
# FlightAware AeroAPI Key
FLIGHTAWARE_AERO_API_KEY=your_flightaware_aero_api_key_here

# NextAuth.js Secret
# Generate with: node -e "console.log(crypto.randomBytes(32).toString('hex'))"
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000

# OAuth Providers
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/flight_tracker"

# QStash Configuration
QSTASH_TOKEN=your_qstash_token
QSTASH_CURRENT_SIGNING_KEY=your_qstash_current_signing_key
QSTASH_NEXT_SIGNING_KEY=your_qstash_next_signing_key
ADMIN_API_KEY=your_admin_api_key_for_secure_endpoints

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
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

This project uses the FlightAware AeroAPI to fetch real-time flight data. To use the API:

1. Sign up for an account at [flightaware.com/aeroapi](https://flightaware.com/aeroapi/)
2. Get your API key from the dashboard
3. Add your API key to the `.env.local` file as `FLIGHTAWARE_AERO_API_KEY`

Note: AeroAPI offers different pricing tiers based on the number of requests and features needed. Review their pricing page for more details.

## Authentication

The application uses NextAuth.js for authentication with the following providers:

- Google OAuth
- Email/Password (credentials)

To set up Google OAuth, you'll need to create an OAuth application in the Google Developer Console and add the client ID and secret to your `.env.local` file.

### About NEXTAUTH_SECRET

The NEXTAUTH_SECRET is a cryptographic key used by NextAuth.js for:
- Encrypting JWT tokens used for sessions
- Signing cookies to prevent tampering
- Securing the overall authentication flow

Always use a strong, randomly generated secret and never commit it to your repository.

## Email Notification System

The Flight Tracker application includes an email notification system that sends alerts to users about changes to their tracked flights.

### Key Features

- **Real-time Alerts**: Receive email notifications for flight status changes, delays, gate changes, departures, and arrivals.
- **Automated Updates**: The system periodically checks for flight updates and sends notifications when changes are detected.
- **Production Ready**: Can be configured to use any SMTP service for production.

## QStash Integration

The application uses Upstash QStash for reliable background processing and scheduled tasks. For detailed information, see [QStash-README.md](./QStash-README.md).

### Key Features

- **Scheduled Rule Processing**: QStash handles periodic execution of flight tracking rules.
- **Reliable Background Jobs**: Ensures critical tasks run even during deployment or server restarts.
- **Webhook Integration**: Processes incoming webhooks from QStash to trigger rule evaluation.

To set up QStash:
1. Create an Upstash account and set up QStash
2. Add your QStash credentials to the `.env.local` file
3. Deploy your application
4. Configure QStash schedules using the admin API endpoint

## Development

- `npm run dev` - Start development server
- `npm run build` - Build production bundle
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

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
