# Prisma Setup

This folder contains the Prisma schema and database migration files for the Flight Tracker application.

## Quick Start

1. Make sure your `.env` file contains proper database connection strings:

```
DATABASE_URL="postgresql://prisma_user:password@localhost:5432/flight_tracker?schema=public"
DIRECT_URL="postgresql://prisma_user:password@localhost:5432/flight_tracker?schema=public"
```

2. Generate the Prisma client:

```bash
npx prisma generate
```

3. Sync the schema with your database:

```bash
npx prisma db push
```

4. Test the connection:

```bash
node src/lib/db-test.ts
```

## Connection String Format

The connection string format should be:

```
postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=SCHEMA
```

Ensure your password is properly URL encoded if it contains special characters. For example:
- Original: `p@ssw0rd!`
- Encoded: `p%40ssw0rd%21`

## Troubleshooting

If you encounter authentication issues:

1. Verify your database user exists and has the proper permissions
2. Check that your password is correctly URL encoded in the connection string
3. Ensure your Postgres server allows connections from your application
4. Run `npx prisma migrate reset` to reset your database (⚠️ This will delete all data)

## Common Commands

- `npx prisma studio`: Open the Prisma data browser
- `npx prisma db push`: Push schema changes to the database
- `npx prisma migrate dev`: Create a migration for schema changes
- `npx prisma generate`: Regenerate the Prisma client 