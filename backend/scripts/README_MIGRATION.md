# Campaign Payment Settings Migration

## Overview
This migration adds the new `enableStripePayments` field to all existing campaigns to support optional Stripe payment processing.

## Migration Strategies

### 1. Conservative (Recommended)
Sets all existing campaigns to `enableStripePayments: false`

**Pros:**
- Safer default
- No unexpected behavior changes
- Campaign owners must explicitly enable Stripe
- Prevents accidental Stripe usage

**Cons:**
- Campaign owners need to manually enable Stripe if they want it

**Usage:**
```bash
cd backend
node scripts/migrate-campaign-payment-settings.js
```

### 2. Preserve Behavior
Sets `enableStripePayments: true` only if Stripe is configured on the server

**Pros:**
- Maintains current functionality
- Existing campaigns continue working as before
- No action needed from campaign owners

**Cons:**
- May enable Stripe for campaigns that don't want it
- Less explicit

**Usage:**
```bash
cd backend
node scripts/migrate-campaign-payment-settings.js --preserve-behavior
```

## Before Running Migration

1. **Backup your database**
   ```bash
   mongodump --uri="mongodb://localhost:27017/fundraising-platform" --out=./backup
   ```

2. **Ensure environment variables are set**
   - Make sure your `.env` file is properly configured
   - The script will check if `STRIPE_SECRET_KEY` exists

3. **Test in development first**
   - Run the migration on a development/staging database first
   - Verify the results before running on production

## Running the Migration

### Development
```bash
cd backend
node scripts/migrate-campaign-payment-settings.js
```

### Production (Conservative)
```bash
cd backend
NODE_ENV=production node scripts/migrate-campaign-payment-settings.js
```

### Production (Preserve Behavior)
```bash
cd backend
NODE_ENV=production node scripts/migrate-campaign-payment-settings.js --preserve-behavior
```

## What the Migration Does

1. Connects to MongoDB using `MONGODB_URI` from environment variables
2. Finds all campaigns without the `enableStripePayments` field
3. Sets `enableStripePayments` based on chosen strategy
4. Also ensures `allowOfflinePayments` is set to `true` (default)
5. Shows migration results and sample campaigns

## After Migration

### If using Conservative strategy:
1. Notify campaign owners about the new payment settings
2. Campaign owners can enable Stripe in their campaign settings if needed
3. All campaigns will have offline payments enabled by default

### If using Preserve Behavior strategy:
1. Campaigns should continue working as before
2. Campaign owners can adjust payment settings as needed

## Verification

After running the migration, verify the results:

```javascript
// In MongoDB shell or Compass
db.campaigns.find({}, { 
    title: 1, 
    enableStripePayments: 1, 
    allowOfflinePayments: 1 
}).pretty()
```

## Rollback

If you need to rollback the migration:

```javascript
// Remove the enableStripePayments field
db.campaigns.updateMany(
    {},
    { $unset: { enableStripePayments: "" } }
)
```

Or restore from backup:
```bash
mongorestore --uri="mongodb://localhost:27017/fundraising-platform" ./backup
```

## Troubleshooting

### "Cannot connect to MongoDB"
- Check your `MONGODB_URI` in `.env`
- Ensure MongoDB is running
- Check network connectivity

### "Migration failed"
- Check the error message
- Ensure you have write permissions to the database
- Verify MongoDB version compatibility

### "No campaigns need migration"
- Migration has already been run
- Or there are no campaigns in the database

## Support

If you encounter issues, check:
1. MongoDB connection string
2. Environment variables
3. Database permissions
4. MongoDB server status

