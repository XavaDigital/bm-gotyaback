# Shirt Layout Display Combinations

This document explains how the shirt layout is displayed based on different combinations of **Campaign Type**, **Layout Style**, and **Sponsor Display Type**.

## Overview

The app uses different renderers to display sponsors on the shirt based on the campaign configuration:

### Main Components
1. **ShirtLayoutComponent** - Traditional grid showing position numbers and prices (for selection)
2. **GridLayoutRenderer** - Grid layout showing actual sponsors in their positions
3. **FlexibleLayoutRenderer** - Delegates to specific renderers based on layout style
4. **SizeOrderedRenderer** - Shows sponsors sorted by position/size
5. **AmountOrderedRenderer** - Shows sponsors grouped by price tiers
6. **WordCloudRenderer** - Shows sponsors in a word cloud formation

---

## Campaign Type Combinations

### 1. Fixed Price Campaign

| Layout Style | Layout Type | Renderer Used | Sponsor Display Type | Display Behavior |
|-------------|-------------|---------------|---------------------|------------------|
| `grid` | `grid` | ShirtLayoutComponent | Any | Shows grid with position numbers, all same price |
| `size-ordered` | `grid` | GridLayoutRenderer | `text-only` | Shows sponsors in grid positions as text |
| `size-ordered` | `grid` | GridLayoutRenderer | `logo-only` | Shows sponsors in grid positions as logos (or text for text sponsors) |
| `size-ordered` | `grid` | GridLayoutRenderer | `both` | Shows sponsors in grid positions as logos with names or text |
| `word-cloud` | `flexible` | WordCloudRenderer | `text-only` | Uses wordcloud2.js library for professional word cloud |
| `word-cloud` | `flexible` | WordCloudRenderer | `logo-only` | Custom spiral placement for logo cloud |
| `word-cloud` | `flexible` | WordCloudRenderer | `both` | Custom spiral placement for mixed logo/text cloud |

### 2. Positional Pricing Campaign

| Layout Style | Layout Type | Renderer Used | Sponsor Display Type | Display Behavior |
|-------------|-------------|---------------|---------------------|------------------|
| `grid` | `grid` | ShirtLayoutComponent | Any | Shows grid with position numbers, varying prices |
| `size-ordered` | `grid` | GridLayoutRenderer | `text-only` | Shows sponsors in grid positions as text |
| `size-ordered` | `grid` | GridLayoutRenderer | `logo-only` | Shows sponsors in grid positions as logos |
| `size-ordered` | `grid` | GridLayoutRenderer | `both` | Shows sponsors in grid positions as logos with names or text |
| `amount-ordered` | `grid` (section-based) | GridLayoutRenderer | `text-only` | Shows sponsors in sections (top/middle/bottom) as text |
| `amount-ordered` | `grid` (section-based) | GridLayoutRenderer | `logo-only` | Shows sponsors in sections as logos |
| `amount-ordered` | `grid` (section-based) | GridLayoutRenderer | `both` | Shows sponsors in sections as logos with names or text |
| `word-cloud` | `flexible` | WordCloudRenderer | `text-only` | Professional word cloud (position affects price only) |
| `word-cloud` | `flexible` | WordCloudRenderer | `logo-only` | Logo cloud (position affects price only) |
| `word-cloud` | `flexible` | WordCloudRenderer | `both` | Mixed cloud (position affects price only) |

### 3. Pay-What-You-Want Campaign

| Layout Style | Layout Type | Renderer Used | Sponsor Display Type | Display Behavior |
|-------------|-------------|---------------|---------------------|------------------|
| `size-ordered` | `flexible` | SizeOrderedRenderer | `text-only` | Shows sponsors sorted by amount (largest first) as text |
| `size-ordered` | `flexible` | SizeOrderedRenderer | `logo-only` | Shows sponsors sorted by amount as logos |
| `size-ordered` | `flexible` | SizeOrderedRenderer | `both` | Shows sponsors sorted by amount as logos with names or text |
| `amount-ordered` | `flexible` | AmountOrderedRenderer | `text-only` | Shows sponsors grouped in price tiers (top/center/bottom) as text |
| `amount-ordered` | `flexible` | AmountOrderedRenderer | `logo-only` | Shows sponsors grouped in price tiers as logos |
| `amount-ordered` | `flexible` | AmountOrderedRenderer | `both` | Shows sponsors grouped in price tiers as logos with names or text |
| `word-cloud` | `flexible` | WordCloudRenderer | `text-only` | Professional word cloud with varying sizes based on amount |
| `word-cloud` | `flexible` | WordCloudRenderer | `logo-only` | Logo cloud with varying sizes based on amount |
| `word-cloud` | `flexible` | WordCloudRenderer | `both` | Mixed cloud with varying sizes based on amount |

---

## Sponsor Display Type Details

### Text-Only
- Shows sponsor names as text
- Font size varies based on:
  - **PWYW**: Amount paid (higher amount = larger text)
  - **Fixed/Positional**: All same size or position-based
- Uses `TextSponsor` component

### Logo-Only
- Shows sponsor logos
- For text sponsors (no logo), falls back to text display
- Logo size varies based on:
  - **PWYW**: Amount paid (higher amount = larger logo)
  - **Fixed/Positional**: All same size or position-based
- Uses `LogoSponsor` component
- Shows "Reserved" for logos pending approval

### Both
- Shows logos with display names underneath (if `displayName` provided)
- Shows logos only (if no `displayName`)
- Shows text for text sponsors
- Uses `LogoWithNameSponsor`, `LogoSponsor`, or `TextSponsor` components
- Shows "Reserved" for logos pending approval

---

## Backend Layout Creation Logic

The backend determines which layout type to create based on campaign configuration:

```typescript
// Section-based layout (Positional + Amount-ordered with sections)
if (campaignType === "positional" && layoutStyle === "amount-ordered" && pricingConfig?.sections) {
  layout = createSectionLayout() // Creates grid layout with section positions
}
// Flexible layout (Word-cloud or PWYW with size/amount-ordered)
else if (
  layoutStyle === "word-cloud" ||
  (layoutStyle === "size-ordered" && campaignType === "pay-what-you-want") ||
  (layoutStyle === "amount-ordered" && campaignType === "pay-what-you-want")
) {
  layout = createFlexibleLayout() // Creates flexible layout (no fixed positions)
}
// Grid layout (Fixed/Positional with size-ordered or grid)
else {
  layout = createLayout() // Creates grid layout with positions
}
```

---

## Key Files

### Frontend Components
- `frontend/src/components/ShirtLayout.tsx` - Traditional grid for position selection
- `frontend/src/components/GridLayoutRenderer.tsx` - Grid with sponsors in positions
- `frontend/src/components/FlexibleLayoutRenderer.tsx` - Delegates to specific renderers
- `frontend/src/components/SizeOrderedRenderer.tsx` - Sorted by size/position
- `frontend/src/components/AmountOrderedRenderer.tsx` - Grouped by price tiers
- `frontend/src/components/WordCloudRenderer.tsx` - Word cloud formation
- `frontend/src/components/TextSponsor.tsx` - Text sponsor display
- `frontend/src/components/LogoSponsor.tsx` - Logo sponsor display
- `frontend/src/components/LogoWithNameSponsor.tsx` - Logo with name display

### Backend Services
- `backend/src/controllers/shirtLayout.controller.ts` - Layout creation logic
- `backend/src/services/shirtLayout.service.ts` - Layout generation functions

### Page
- `frontend/src/pages/CampaignDetail.tsx` - Main page that determines which renderer to use

---

## Special Cases and Behaviors

### Logo Approval Status
- **Pending Approval**: Shows "Reserved" 🔒 in the position
  - Only for `logo-only` and `both` display types
  - Text-only sponsors never show "Reserved" (no approval needed)
- **Approved**: Shows the logo normally
- **Rejected**: Logo is not displayed

### Sponsor Type Handling in "Both" Display Type
- **Logo sponsor with displayName**: Shows `LogoWithNameSponsor` (logo + name underneath)
- **Logo sponsor without displayName**: Shows `LogoSponsor` (logo only)
- **Text sponsor**: Shows `TextSponsor` (text only)

### Size Calculation
- **Pay-What-You-Want**: Size based on amount paid
  - Text: `calculatedFontSize` varies by amount
  - Logo: `calculatedLogoWidth` varies by amount
- **Fixed/Positional**: Size based on position or uniform
  - Fixed: All same size
  - Positional: May vary by position tier

### Grid vs Flexible Layout
- **Grid Layout**: Fixed positions, sponsors occupy specific cells
  - Shows position numbers for empty spots
  - Shows "Available" for empty positions
  - Shows "Reserved" for taken but pending approval
- **Flexible Layout**: Dynamic positioning, no fixed grid
  - No position numbers
  - Sponsors arranged by algorithm (spiral, tiers, etc.)
  - No empty spots shown

### Word Cloud Implementations
- **Text-only mode**: Uses `wordcloud2.js` library
  - Professional word cloud algorithm
  - Automatic text rotation (30% chance)
  - Tight packing
  - Random colors for variety
- **Logo-only and Both modes**: Custom spiral placement
  - Collision detection
  - Tighter packing for better visual density
  - Sorted by size (largest first) for optimal placement
  - Hover effects (scale 1.1x)

### Amount-Ordered Price Tiers
The `AmountOrderedRenderer` groups sponsors into tiers:
- **1 price point**: All in center
- **2 price points**: High in center, low at bottom
- **3+ price points**: Divided into thirds
  - Top tier: Medium-high prices
  - Center tier: Highest prices
  - Bottom tier: Lowest prices

### Section-Based Layout (Positional + Amount-Ordered)
When using positional pricing with amount-ordered layout and sections:
- Backend creates grid layout with `section` property on each position
- Positions grouped into: `top`, `middle`, `bottom`
- Each section has fixed number of slots and price
- Displayed using `GridLayoutRenderer`

---

## Example Scenarios

### Scenario 1: Fixed Price + Grid + Text-Only
- **Campaign Type**: Fixed
- **Layout Style**: Grid
- **Sponsor Display Type**: Text-only
- **Result**: Traditional grid showing position numbers and prices (all same price)
- **Use Case**: Simple fundraiser where all sponsors pay the same amount

### Scenario 2: Positional + Size-Ordered + Logo-Only
- **Campaign Type**: Positional
- **Layout Style**: Size-ordered
- **Sponsor Display Type**: Logo-only
- **Result**: Grid showing sponsors in their positions as logos, sorted by position (highest price first)
- **Use Case**: Premium sponsor placement with logo display

### Scenario 3: PWYW + Word-Cloud + Both
- **Campaign Type**: Pay-What-You-Want
- **Layout Style**: Word-cloud
- **Sponsor Display Type**: Both
- **Result**: Mixed cloud with logos and text, sizes vary by amount paid
- **Use Case**: Creative display where higher donors get more prominence

### Scenario 4: Positional + Amount-Ordered + Both (with sections)
- **Campaign Type**: Positional
- **Layout Style**: Amount-ordered
- **Sponsor Display Type**: Both
- **Pricing Config**: Has sections (top/middle/bottom)
- **Result**: Grid layout with sponsors grouped in sections, showing logos with names
- **Use Case**: Tiered sponsorship with clear visual separation

### Scenario 5: PWYW + Amount-Ordered + Text-Only
- **Campaign Type**: Pay-What-You-Want
- **Layout Style**: Amount-ordered
- **Sponsor Display Type**: Text-only
- **Result**: Sponsors grouped in price tiers (top/center/bottom), text sizes vary
- **Use Case**: Text-based display with clear tier separation

---

## Testing Combinations

To test different combinations, you can:

1. **Create test campaigns** using the backend script:
   ```bash
   node backend/scripts/create-comprehensive-test-campaigns.js
   ```

2. **Manually create campaigns** through the Campaign Wizard with different settings

3. **Check the CampaignDetail page** to see how sponsors are displayed

4. **Verify renderer selection** by checking browser console logs or React DevTools

---

## Troubleshooting

### Issue: Sponsors not showing
- Check if sponsors have `paymentStatus === "paid"`
- For logo sponsors, check `logoApprovalStatus === "approved"`
- Verify layout exists for the campaign

### Issue: Wrong renderer being used
- Check `layout.layoutType` (grid vs flexible)
- Check `campaign.layoutStyle` (grid, size-ordered, amount-ordered, word-cloud)
- Check `campaign.campaignType` (fixed, positional, pay-what-you-want)

### Issue: "Reserved" showing when it shouldn't
- Check `sponsorDisplayType` (only shows for logo-only and both)
- Check `logoApprovalStatus` (shows when not approved)
- For text-only campaigns, "Reserved" should never show

### Issue: Logos not displaying
- Check if logo URL is valid
- Check if `logoApprovalStatus === "approved"`
- Check if `sponsorType === "logo"`
- Verify `sponsorDisplayType` allows logos (logo-only or both)

