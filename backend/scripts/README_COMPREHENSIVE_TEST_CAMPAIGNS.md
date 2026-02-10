# Comprehensive Test Campaign Generator

This script creates a complete set of test campaigns covering all possible combinations of campaign types, layout styles, and sponsor display types.

## Overview

The script generates **21 campaigns** total:
- **7 campaign type/layout combinations** × **3 sponsor display types** = **21 campaigns**
- Each campaign is automatically seeded with **10 sponsors**

### Campaign Type & Layout Combinations (7 total)

1. **Fixed Pricing**
   - Word Cloud layout
   - List layout (size-ordered)

2. **Positional Pricing**
   - Ordered layout (size-ordered)
   - Sections layout (amount-ordered)
   - Word Cloud layout

3. **Pay What You Want**
   - Ordered List layout (amount-ordered)
   - Word Cloud layout

### Sponsor Display Types (3 total)

1. **Text Only** - Sponsors displayed as text names only
2. **Logo Only** - Sponsors displayed as logos only
3. **Both** - Sponsors can be either text or logo (mixed)

## Usage

### Prerequisites

1. Make sure the backend is built:
   ```bash
   cd backend
   npm run build
   ```

2. Ensure you have a user account created in the database. You'll need the email address.

### Running the Script

```bash
node backend/scripts/create-comprehensive-test-campaigns.js <your-email@example.com>
```

**Example:**
```bash
node backend/scripts/create-comprehensive-test-campaigns.js user@example.com
```

### What the Script Does

For each of the 21 combinations, the script will:

1. ✅ Create a campaign with appropriate:
   - Title (e.g., "test - fixed - cloud - text")
   - Short description
   - Full HTML description explaining the campaign type
   - Pricing configuration
   - Layout style
   - Sponsor display type

2. ✅ Create the appropriate layout:
   - Grid layout (20 positions) for fixed and regular positional campaigns
   - Section layout (30 positions: 5 top, 10 middle, 15 bottom) for positional with sections
   - Flexible layout for pay-what-you-want campaigns

3. ✅ Seed 10 sponsors with:
   - Random names (mix of person names and company names)
   - Appropriate amounts based on campaign type
   - Correct sponsor type (text/logo) based on display type
   - Paid status
   - Approved logos (for logo sponsors)

### Campaign Naming Convention

Campaigns are named using this pattern:
```
test - {campaign-type} - {layout-name} - {display-type}
```

**Examples:**
- `test - fixed - cloud - text`
- `test - positional - sections - logo`
- `test - pay what you want - ordered list - text+logo`

## Output

The script provides detailed output showing:
- Connection status
- User lookup
- Each campaign creation with ID
- Layout creation details
- Sponsor seeding confirmation
- Final summary with counts

**Example Output:**
```
Creating comprehensive test campaigns...

Total campaigns to create: 7 × 3 = 21

✓ Created: test - fixed - cloud - text
  ID: 507f1f77bcf86cd799439011
  ✓ Created grid layout (20 positions)
  ✓ Seeded 10 sponsors

...

================================================================================
SUMMARY
================================================================================
Created:  21 campaigns (each with 10 sponsors)
Skipped:  0 campaigns (already exist)
Total:    21 possible combinations
================================================================================
```

## Cleanup

To remove all test campaigns created by this script, you can use the cleanup script:

```bash
node backend/scripts/cleanup-test-campaigns.js
```

This will remove all campaigns with titles starting with "test -".

## Notes

- The script will skip campaigns that already exist (based on slug)
- All campaigns are created with:
  - Garment type: T-shirt
  - Currency: NZD
  - Offline payments enabled
  - Stripe payments disabled
  - Campaign status: Open (not closed)
- Sponsors are marked as "paid" so they appear immediately
- Logo sponsors have approval status set to "approved"

## Troubleshooting

**Error: User not found**
- Make sure you've registered a user account through the application
- Verify the email address is correct

**Error: Cannot connect to MongoDB**
- Check that MongoDB is running
- Verify your `.env` file has the correct `MONGO_URI` or `MONGODB_URI`

**Error: Campaign already exists**
- The script will skip existing campaigns automatically
- Use the cleanup script if you want to recreate them

