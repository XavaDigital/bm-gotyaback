# Test Campaign Creation Script

This script creates test campaigns with all combinations of campaign types and layout styles for testing purposes.

## Overview

The script generates campaigns following this naming convention:
```
test - {campaignType} - {layoutStyle}
```

For example:
- `test - pay what you want - cloud`
- `test - fixed - grid`
- `test - positional - amount ordered`

## Campaign Combinations

The script creates campaigns for all valid combinations based on the UI:

### Fixed Price (2 layouts)
- **cloud** - Artistic word cloud arrangement
- **list** - Ordered list display

### Positional Pricing (3 layouts)
- **ordered** - Ordered by position number
- **sections** - Grouped by price tier
- **cloud** - Artistic word cloud

### Pay What You Want (2 layouts)
- **ordered list** - Highest payers first
- **cloud** - Size based on contribution

**Total combinations: 7 campaigns**

## Prerequisites

1. **MongoDB must be running**
   ```bash
   # Make sure MongoDB is running on localhost:27017
   # or set MONGODB_URI in your .env file
   ```

2. **Backend must be built**
   ```bash
   cd backend
   npm run build
   ```

3. **User account must exist**
   - You need a registered user account
   - You'll provide the email address when running the script

## Usage

### Basic Usage

```bash
cd backend
node scripts/create-test-campaigns.js <email>
```

### Example

```bash
node scripts/create-test-campaigns.js user@example.com
```

## What the Script Does

For each campaign combination, the script:

1. **Creates a Campaign** with:
   - Title following the naming convention
   - Appropriate pricing configuration
   - Short description
   - Garment type: T-shirt
   - Sponsor display type: Text-only
   - Currency: NZD
   - Offline payments enabled

2. **Creates a Layout**:
   - **For fixed/positional**: Grid layout with 20 positions (4 columns × 5 rows)
   - **For pay-what-you-want**: Flexible layout with unlimited sponsors

## Pricing Configurations

### Fixed Pricing
- Fixed price: $50 per position

### Positional Pricing
- Base price: $30
- Price per position: $5
- Formula: `$30 + (position × $5)`

### Pay-What-You-Want
- Minimum amount: $10
- Suggested amounts: $20, $50, $100
- Size tiers:
  - Small: $10-$49 (12px text / 50px logo)
  - Medium: $50-$99 (16px text / 75px logo)
  - Large: $100-$199 (20px text / 100px logo)
  - XLarge: $200+ (24px text / 150px logo)

## Output

The script provides detailed output:

```
Connecting to MongoDB...
✓ Connected to MongoDB

Looking for user with email: user@example.com...
✓ Found user: John Doe (ID: 507f1f77bcf86cd799439011)

Creating test campaigns...

✓ Created: test - fixed - grid (ID: 507f1f77bcf86cd799439012)
  ✓ Created grid layout (20 positions) for campaign 507f1f77bcf86cd799439012
✓ Created: test - fixed - size ordered (ID: 507f1f77bcf86cd799439013)
  ✓ Created grid layout (20 positions) for campaign 507f1f77bcf86cd799439013
...

============================================================
Summary:
  Created: 12 campaigns
  Skipped: 0 campaigns (already exist)
  Total combinations: 12
============================================================

✓ Database connection closed
```

## Re-running the Script

If you run the script again with the same user:
- Existing campaigns will be **skipped** (not duplicated)
- Only new combinations will be created
- The script checks for existing campaigns by slug

## Troubleshooting

### Error: Email address is required
```bash
# Make sure to provide an email address
node scripts/create-test-campaigns.js user@example.com
```

### Error: User not found
```bash
# The user must exist in the database
# Register a user through the application first
```

### Error: Cannot find module
```bash
# Make sure the backend is built
cd backend
npm run build
```

### Error: Connection refused
```bash
# Make sure MongoDB is running
# Check your MONGODB_URI in .env
```

## Cleaning Up

To remove all test campaigns:

```javascript
// In MongoDB shell or Compass
db.campaigns.deleteMany({ title: /^test - / })
db.shirtlayouts.deleteMany({ campaignId: { $in: [/* campaign IDs */] } })
```

Or create a cleanup script if needed.

## Notes

- All campaigns are created with `isClosed: false` (active)
- Stripe payments are disabled by default
- Offline payments are enabled
- All campaigns use the same garment type (T-shirt)
- Layouts are created automatically for each campaign

