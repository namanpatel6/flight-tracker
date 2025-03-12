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

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- npm or yarn
- AviationStack API key (get one at [aviationstack.com](https://aviationstack.com/))

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
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000

# OAuth Providers
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GITHUB_ID=your_github_id_here
GITHUB_SECRET=your_github_secret_here

# Database
DATABASE_URL="postgresql://username:password@localhost:5432/flight_tracker"
```

4. Run the development server:
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

## Development

- `npm run dev` - Start development server
- `npm run build` - Build production bundle
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## License

[MIT License](LICENSE)
