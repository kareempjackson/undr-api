# Escrow System Deployment Guide

This guide provides instructions for deploying and maintaining the escrow system.

## Prerequisites

- Node.js v14+ and npm
- PostgreSQL 12+
- Access to the application's source code repository

## Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd undr-api
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file based on the provided example:

   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with appropriate database credentials and other environment-specific settings.

5. Run database migrations:
   ```bash
   npm run migration:run
   ```

## Configuration Options

### Automatic Escrow Release

The escrow system is configured to automatically release funds to sellers after a predetermined period. By default, this is set to 3 days after the escrow is funded. This can be adjusted in the `EscrowService.createEscrow` method.

You can modify the scheduler timing by editing the cron expression in `src/tasks/escrow-scheduler.service.ts`:

```typescript
@Cron(CronExpression.EVERY_4_HOURS)
async handleScheduledReleases() {
  // ...
}
```

Available cron patterns include:

- `CronExpression.EVERY_HOUR`
- `CronExpression.EVERY_DAY_AT_MIDNIGHT`
- `CronExpression.EVERY_WEEK`
- Custom cron expressions ('0 _/4 _ \* \*' for every 4 hours)

## Monitoring

The escrow scheduler logs important events to the application log. You should monitor these logs for any errors or unexpected behavior:

- Successful releases: Look for "Successfully processed X scheduled escrow releases"
- Failed releases: Look for "Error processing scheduled escrow releases" or "Failed to release escrow"

## Maintenance

### Checking for Stuck Escrows

Occasionally escrows may get stuck in a particular state. Use the following SQL query to identify escrows that have been funded but not completed for more than 7 days:

```sql
SELECT id, title, total_amount, status, created_at, buyer_id, seller_id
FROM escrows
WHERE status = 'FUNDED' AND created_at < NOW() - INTERVAL '7 days';
```

### Manual Intervention

If you need to manually release an escrow:

1. Identify the escrow ID from the database
2. Use the admin API endpoint to release the escrow:
   ```bash
   curl -X POST https://api.example.com/admin/escrows/{escrowId}/complete \
     -H "Authorization: Bearer {admin_token}" \
     -H "Content-Type: application/json"
   ```

## Troubleshooting

### Common Issues

1. **Scheduled releases not running**

   - Check if the TasksModule is properly imported in the AppModule
   - Verify the cron job is running by checking logs
   - Make sure the database connection is working

2. **Escrow release failing**

   - Check database permissions
   - Verify seller's wallet exists and is active
   - Check for transaction logs for specific errors

3. **Database migration issues**
   - If you encounter errors when running migrations, try:
     ```bash
     npm run migration:revert
     npm run migration:run
     ```

## Testing

Run the escrow system tests to verify everything is working correctly:

```bash
npm test src/modules/security/escrow.e2e.spec.ts
```

## Deployment Checklist

Before deploying to production:

- [ ] Run all tests
- [ ] Verify database migrations apply cleanly
- [ ] Check environment variables are correctly set
- [ ] Ensure encryption keys are properly configured
- [ ] Test automatic escrow release functionality
- [ ] Verify transaction logging is working
- [ ] Set up monitoring for the escrow scheduler logs
