# Vercel Deployment Guide

This guide helps ensure proper configuration of the Flight Tracker application when deploying to Vercel.

## Required Environment Variables

Make sure to set the following environment variables in your Vercel project settings:

### Authentication Variables

```
NEXTAUTH_SECRET=your_secure_random_secret
NEXTAUTH_URL=https://your-deployed-url.vercel.app
```

⚠️ **IMPORTANT**: The `NEXTAUTH_URL` must be set to your complete production URL with HTTPS.

### OAuth Providers

```
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### Database Configuration

```
DATABASE_URL=your_production_database_url
DIRECT_URL=your_production_database_direct_url
```

### API Keys

```
NEXT_PUBLIC_AVIATIONSTACK_API_KEY=your_apikey
AERO_API_KEY=your_aero_api_key
```

### Security Keys

```
CRON_SECRET=your_cron_secret_key
```

## Troubleshooting Authentication Issues

If you experience authentication issues in production:

1. **Check Environment Variables**: Verify `NEXTAUTH_URL` and `NEXTAUTH_SECRET` are correctly set.

2. **Cookie Settings**: Make sure cookies are working properly:
   - Check that your domain is correctly configured
   - Ensure secure cookies are enabled for HTTPS

3. **Session Handling**: If sessions aren't persisting:
   - Clear browser cookies and cache
   - Try a different browser
   - Check network requests for any blocked cookies

4. **Database Connection**: If database sessions aren't working:
   - Verify database connection strings
   - Check that schema migrations have been applied

## Vercel Specific Settings

1. **Add Custom Domain**: For better authentication reliability, add a custom domain.

2. **Production Environment Protection**: Enable environment protection for production.

3. **Configure Headers**: Consider adding security headers in `next.config.js`:

```js
headers: async () => [
  {
    source: '/(.*)',
    headers: [
      {
        key: 'Cache-Control',
        value: 'no-store, max-age=0',
      },
    ],
  },
],
```

4. **Session Duration**: Session timeout is set to 12 hours. To change this, modify `maxAge` in `src/lib/auth.ts`.

## Testing After Deployment

After deploying, verify that:

1. User registration and login work properly
2. Session persistence works when navigating between pages
3. Protected routes like Flight Search require authentication
4. Auto-logout works correctly when the browser is closed

## Contact

If you encounter issues with deployment that are not covered in this guide, please open an issue in the project repository. 