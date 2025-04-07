# Railway Deployment Guide

This document outlines how to deploy the UNDR API on Railway.

## Required Environment Variables

Make sure the following environment variables are properly set in your Railway deployment:

### Database Connection

```
DATABASE_URL=postgresql://[username]:[password]@[host]:[port]/[database]
```

Railway automatically provides this variable when you link a PostgreSQL database.

**Important**: The application uses DATABASE_URL for all database connections in production. Do not set individual database connection parameters like DATABASE_HOST, DATABASE_PORT, etc. in production as they might conflict with the DATABASE_URL setting.

### Basic Configuration

```
NODE_ENV=production
PORT=3001
JWT_SECRET=[secure-random-string]
ENCRYPTION_KEY=[secure-random-string]
```

### Frontend URLs

```
FRONTEND_URL=https://undr-frontend.vercel.app
ADMIN_URL=https://your-production-admin-url.com
PRODUCTION_URLS=https://undr-frontend.vercel.app,https://undr-frontend-dev.vercel.app,https://undr-api-production.up.railway.app
```

**Note:** Ensure that both your Vercel frontend URL and Railway API URL are included in the `PRODUCTION_URLS` list to properly enable CORS. If you have multiple environments (dev, staging, etc.), include all of those URLs as well.

### Authentication

```
JWT_EXPIRATION=1d
REFRESH_TOKEN_SECRET=[secure-random-string]
REFRESH_TOKEN_EXPIRATION=7d
```

### Stripe Integration

```
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Email Configuration

```
SMTP_HOST=smtp.provider.com
SMTP_PORT=587
SMTP_SECURE=true
SMTP_USER=your@email.com
SMTP_PASS=your-smtp-password
SMTP_FROM=no-reply@yourdomain.com
```

Or if using SendGrid:

```
SENDGRID_API_KEY=SG.your-sendgrid-key
```

## Troubleshooting Database Connections

If you're having issues with database connections:

1. Verify DATABASE_URL is correctly set in your Railway environment
2. Make sure the connection URL is properly formatted (postgresql://[username]:[password]@[host]:[port]/[database])
3. Check that no conflicting database parameters (DB_HOST, POSTGRES_HOST, etc.) are set that might override the DATABASE_URL
4. If using SSL, ensure SSL connections are enabled in your PostgreSQL instance
5. Check Railway's logs for specific error messages
6. If you see ECONNREFUSED errors, it may indicate the application is trying to connect to localhost instead of the remote database

**Note about Multiple Database Connections**: This application uses TypeORM connections in both app.module.ts and database.module.ts. Both must be configured to use DATABASE_URL in production to avoid conflicts.

### Common Railway PostgreSQL Issues

#### ECONNREFUSED Error

If you're getting ECONNREFUSED errors, this usually means:

1. **Wrong Database URL**: Check if the DATABASE_URL is correctly formatted and points to the right host. Railway auto-generates this variable when you connect a PostgreSQL service.

2. **Missing Database Plugin**: Make sure you've connected the PostgreSQL plugin to your service in the Railway dashboard.

3. **Database Not Started**: Check if your PostgreSQL service is actually running in Railway.

4. **Database Variables**: The automatically provided DATABASE_URL should be used. Don't override it with manual host/port settings.

#### Diagnostic Script

The project includes a diagnostic script that will run before the application starts:

```bash
node scripts/diagnose-db-connection.js
```

This will provide detailed information about database connection attempts and can help identify the source of connection issues.

#### Reset Railway Environment

If all else fails, try these steps in the Railway dashboard:

1. Remove any manually added database-related variables
2. Reconnect the PostgreSQL plugin to your service
3. Redeploy your application

## Running Migrations

Migrations will automatically run on deployment via the start command in `railway.toml`:

```toml
startCommand = "NODE_ENV=production node scripts/diagnose-db-connection.js && NODE_ENV=production npm run migration:prod && NODE_ENV=production node dist/src/main"
```

To run migrations manually:

```
railway run npm run migration:prod
```
