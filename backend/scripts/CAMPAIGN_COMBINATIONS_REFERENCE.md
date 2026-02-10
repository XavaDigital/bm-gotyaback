# Campaign Combinations Reference

This document lists all 21 campaigns that will be created by the comprehensive test campaign script.

## Campaign Matrix

| # | Campaign Type | Layout Style | Sponsor Display | Campaign Title |
|---|---------------|--------------|-----------------|----------------|
| 1 | Fixed | Word Cloud | Text Only | test - fixed - cloud - text |
| 2 | Fixed | Word Cloud | Logo Only | test - fixed - cloud - logo |
| 3 | Fixed | Word Cloud | Both | test - fixed - cloud - text+logo |
| 4 | Fixed | List (size-ordered) | Text Only | test - fixed - list - text |
| 5 | Fixed | List (size-ordered) | Logo Only | test - fixed - list - logo |
| 6 | Fixed | List (size-ordered) | Both | test - fixed - list - text+logo |
| 7 | Positional | Ordered (size-ordered) | Text Only | test - positional - ordered - text |
| 8 | Positional | Ordered (size-ordered) | Logo Only | test - positional - ordered - logo |
| 9 | Positional | Ordered (size-ordered) | Both | test - positional - ordered - text+logo |
| 10 | Positional | Sections (amount-ordered) | Text Only | test - positional - sections - text |
| 11 | Positional | Sections (amount-ordered) | Logo Only | test - positional - sections - logo |
| 12 | Positional | Sections (amount-ordered) | Both | test - positional - sections - text+logo |
| 13 | Positional | Word Cloud | Text Only | test - positional - cloud - text |
| 14 | Positional | Word Cloud | Logo Only | test - positional - cloud - logo |
| 15 | Positional | Word Cloud | Both | test - positional - cloud - text+logo |
| 16 | Pay What You Want | Ordered List (amount-ordered) | Text Only | test - pay what you want - ordered list - text |
| 17 | Pay What You Want | Ordered List (amount-ordered) | Logo Only | test - pay what you want - ordered list - logo |
| 18 | Pay What You Want | Ordered List (amount-ordered) | Both | test - pay what you want - ordered list - text+logo |
| 19 | Pay What You Want | Word Cloud | Text Only | test - pay what you want - cloud - text |
| 20 | Pay What You Want | Word Cloud | Logo Only | test - pay what you want - cloud - logo |
| 21 | Pay What You Want | Word Cloud | Both | test - pay what you want - cloud - text+logo |

## Breakdown by Category

### By Campaign Type
- **Fixed Pricing**: 6 campaigns (2 layouts × 3 display types)
- **Positional Pricing**: 9 campaigns (3 layouts × 3 display types)
- **Pay What You Want**: 6 campaigns (2 layouts × 3 display types)

### By Layout Style
- **Word Cloud**: 9 campaigns (3 campaign types × 3 display types)
- **Size-Ordered (List/Ordered)**: 6 campaigns (2 campaign types × 3 display types)
- **Amount-Ordered (Sections/Ordered List)**: 6 campaigns (2 campaign types × 3 display types)

### By Sponsor Display Type
- **Text Only**: 7 campaigns (all 7 type/layout combinations)
- **Logo Only**: 7 campaigns (all 7 type/layout combinations)
- **Both**: 7 campaigns (all 7 type/layout combinations)

## Pricing Configuration Details

### Fixed Pricing Campaigns
- **Price**: $50 NZD per position
- **Positions**: 20 positions in a 4×5 grid

### Positional Pricing Campaigns

#### Regular Positional (Ordered & Word Cloud)
- **Base Price**: $30 NZD
- **Price Per Position**: $5 NZD
- **Formula**: Price = $30 + (position × $5)
- **Positions**: 20 positions in a 4×5 grid
- **Price Range**: $35 - $130

#### Sections Layout
- **Top Section**: $100 NZD (5 slots)
- **Middle Section**: $50 NZD (10 slots)
- **Bottom Section**: $25 NZD (15 slots)
- **Total Positions**: 30 positions

### Pay What You Want Campaigns
- **Minimum Amount**: $10 NZD
- **Suggested Amounts**: $20, $50, $100
- **Size Tiers**:
  - Small: $10-49 (12px text / 50px logo)
  - Medium: $50-99 (16px text / 75px logo)
  - Large: $100-199 (20px text / 100px logo)
  - XLarge: $200+ (24px text / 150px logo)
- **Positions**: Unlimited (flexible layout)

## Sponsor Seeding Details

Each campaign receives **10 sponsors** with the following characteristics:

### Sponsor Names
- Mix of individual names (e.g., "John Smith") and company names (e.g., "Tech Solutions")
- Randomly selected from predefined lists

### Sponsor Amounts
- **Fixed**: All sponsors pay $50
- **Positional**: Sponsors randomly assigned to available positions (prices vary)
- **Pay What You Want**: Random amounts distributed across size tiers:
  - 10% Small ($10-49)
  - 30% Medium ($50-99)
  - 40% Large ($100-199)
  - 20% XLarge ($200-499)

### Sponsor Types
- **Text Only campaigns**: All sponsors are text type
- **Logo Only campaigns**: All sponsors are logo type
- **Both campaigns**: Random mix of text and logo sponsors (50/50 split)

### Sponsor Status
- **Payment Status**: All marked as "paid" (visible immediately)
- **Logo Approval**: All logos pre-approved
- **Payment Method**: Cash (offline)

## Testing Coverage

This comprehensive set of campaigns allows you to test:

✅ All pricing strategies (fixed, positional, pay-what-you-want)
✅ All layout styles (word cloud, size-ordered, amount-ordered)
✅ All sponsor display modes (text-only, logo-only, both)
✅ Grid layouts with different pricing models
✅ Section-based layouts with tiered pricing
✅ Flexible layouts with variable sizing
✅ Sponsor rendering in different contexts
✅ Campaign browsing and filtering
✅ Public campaign pages
✅ Sponsor management workflows

## Quick Start

1. Build the backend:
   ```bash
   cd backend
   npm run build
   ```

2. Run the script:
   ```bash
   node backend/scripts/create-comprehensive-test-campaigns.js your@email.com
   ```

3. View campaigns in the application at:
   ```
   http://localhost:5173/campaigns
   ```

