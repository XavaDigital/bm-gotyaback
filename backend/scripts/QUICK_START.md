# Quick Start: Create Test Campaigns

## TL;DR

```bash
# 1. Build the backend (if not already built)
cd backend
npm run build

# 2. Run the script with your user email
node scripts/create-test-campaigns.js your-email@example.com
```

This will create **7 test campaigns** with all valid combinations of pricing strategies and layout styles.

## Campaign Names Created

Following the naming convention `test - {type} - {layout}`:

**Fixed Price (2):**
1. `test - fixed - cloud`
2. `test - fixed - list`

**Positional Pricing (3):**
3. `test - positional - ordered`
4. `test - positional - sections`
5. `test - positional - cloud`

**Pay What You Want (2):**
6. `test - pay what you want - ordered list`
7. `test - pay what you want - cloud`

## Prerequisites

✅ MongoDB running  
✅ Backend built (`npm run build`)  
✅ User account exists (register through the app)

## Example Output

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
  Created: 7 campaigns
  Skipped: 0 campaigns (already exist)
  Total combinations: 7
============================================================

✓ Database connection closed
```

## What Gets Created

Each campaign includes:
- ✅ Campaign with proper type and layout configuration
- ✅ Pricing configuration (appropriate for the campaign type)
- ✅ Layout (grid with 20 positions OR flexible for pay-what-you-want)
- ✅ Unique slug for URL access

## Need More Info?

See `README_TEST_CAMPAIGNS.md` for detailed documentation.

