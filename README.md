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
- **Authentication**: Social login and email/password

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- npm or yarn

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
# Add environment variables here
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
├── app/                    # Next.js App Router directory
├── components/            # Reusable UI components
├── config/               # Configuration files
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions
├── providers/            # React context providers
└── public/               # Static assets
```

## Development

- `npm run dev` - Start development server
- `npm run build` - Build production bundle
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## License

[MIT License](LICENSE)
