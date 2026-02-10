# Quick Start: Comprehensive Test Campaigns

## What This Script Does

Creates **21 test campaigns** covering every combination of:
- 3 Campaign Types (Fixed, Positional, Pay What You Want)
- 7 Type/Layout Combinations
- 3 Sponsor Display Types (Text Only, Logo Only, Both)

Each campaign is automatically seeded with **10 sponsors**.

## Usage

### Step 1: Build the Backend
```bash
cd backend
npm run build
```

### Step 2: Run the Script
```bash
node backend/scripts/create-comprehensive-test-campaigns.js your@email.com
```

Replace `your@email.com` with your registered user email.

### Step 3: View Results
Open your application and navigate to the campaigns page to see all 21 test campaigns.

## What Gets Created

### 21 Campaigns Total

**Fixed Pricing (6 campaigns)**
1. test - fixed - cloud - text
2. test - fixed - cloud - logo
3. test - fixed - cloud - text+logo
4. test - fixed - list - text
5. test - fixed - list - logo
6. test - fixed - list - text+logo

**Positional Pricing (9 campaigns)**
7. test - positional - ordered - text
8. test - positional - ordered - logo
9. test - positional - ordered - text+logo
10. test - positional - sections - text
11. test - positional - sections - logo
12. test - positional - sections - text+logo
13. test - positional - cloud - text
14. test - positional - cloud - logo
15. test - positional - cloud - text+logo

**Pay What You Want (6 campaigns)**
16. test - pay what you want - ordered list - text
17. test - pay what you want - ordered list - logo
18. test - pay what you want - ordered list - text+logo
19. test - pay what you want - cloud - text
20. test - pay what you want - cloud - logo
21. test - pay what you want - cloud - text+logo

### Each Campaign Includes
- ✅ Appropriate pricing configuration
- ✅ Correct layout (grid, sections, or flexible)
- ✅ 10 seeded sponsors (paid and approved)
- ✅ Descriptive title and descriptions
- ✅ Proper sponsor display type configuration

## Cleanup

To remove all test campaigns:
```bash
node backend/scripts/cleanup-test-campaigns.js
```

## Troubleshooting

**"User not found"**
- Register a user account first through the application
- Make sure you're using the correct email address

**"Cannot connect to MongoDB"**
- Ensure MongoDB is running
- Check your `.env` file for correct database connection string

**"Campaign already exists"**
- The script automatically skips existing campaigns
- Use the cleanup script to remove them first if you want to recreate

## Files Created

1. **create-comprehensive-test-campaigns.js** - Main script
2. **README_COMPREHENSIVE_TEST_CAMPAIGNS.md** - Detailed documentation
3. **CAMPAIGN_COMBINATIONS_REFERENCE.md** - Complete campaign matrix
4. **QUICK_START_COMPREHENSIVE.md** - This file

## Next Steps

After running the script:
1. Browse campaigns in your application
2. Test different layout styles
3. Verify sponsor display types
4. Test campaign editing
5. Test sponsor management
6. Verify public campaign pages

Enjoy testing! 🎉

