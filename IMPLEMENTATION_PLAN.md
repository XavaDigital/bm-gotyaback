# Complete Implementation Plan: Pricing Strategies & Sponsor Types

## Executive Summary

**Goal**: Implement flexible pricing strategies, logo sponsor support, and multiple layout options.

**Timeline**: Immediate implementation
**Scope**: New campaigns only (no migration of existing campaigns)

---

## Requirements Summary

### Campaign Types (Pricing Strategies)

1. **Fixed** - All positions cost the same price
2. **Positional** - Position-based pricing (position N costs $N, e.g., position 1 = $1, position 40 = $40)
3. **Pay What You Want** - Sponsors choose amount (above minimum), size proportional to payment

### Sponsor Types

- **Text Only** - Text-based sponsors
- **Logo Only** - Logo-based sponsors with image upload
- **Both** - Campaign accepts both text and logo sponsors

### Layout Styles

- **Grid** - Traditional grid layout (rows × columns) - for Fixed & Positional
- **Size-Ordered** - Ordered by size (largest first) - for Pay What You Want
- **Amount-Ordered** - Ordered by amount paid (highest first) - for Pay What You Want
- **Word-Cloud** - Artistic cloud-style arrangement - for Pay What You Want

### Technical Specs

- **Logo Storage**: AWS S3 (already configured)
- **Logo Approval**: Organizer must approve logos before public display
- **Logo Approval States**: pending → approved/rejected

---

## Database Schema

### 1. Campaign Model Updates

**File**: `backend/src/models/Campaign.ts`

```typescript
{
  // Existing fields...

  // REPLACE campaignType enum
  campaignType: 'fixed' | 'positional' | 'pay-what-you-want'

  // NEW: Sponsor type configuration
  sponsorDisplayType: 'text-only' | 'logo-only' | 'both'

  // NEW: Layout style
  layoutStyle: 'grid' | 'size-ordered' | 'amount-ordered' | 'word-cloud'

  // NEW: Pricing configuration object
  pricingConfig: {
    // For fixed pricing
    fixedPrice: Number  // e.g., $50

    // For positional pricing
    basePrice: Number          // e.g., $10 (position 1 = $10 + $1 = $11)
    pricePerPosition: Number   // e.g., $1 (position 40 = $10 + $40 = $50)

    // For pay-what-you-want
    minimumAmount: Number      // e.g., $5
    suggestedAmounts: [Number] // e.g., [10, 25, 50, 100]

    // Size tiers for pay-what-you-want
    sizeTiers: [{
      size: 'small' | 'medium' | 'large' | 'xlarge'
      minAmount: Number
      maxAmount: Number  // optional, null for highest tier
      textFontSize: Number  // px for text sponsors
      logoWidth: Number     // px for logo sponsors
    }]
  }
}
```

**Status**: ✅ Partially complete (needs pricingConfig added)

---

### 2. SponsorEntry Model Updates

**File**: `backend/src/models/SponsorEntry.ts`

```typescript
{
  // Existing fields...

  // NEW: Sponsor type
  sponsorType: "text" | "logo";

  // NEW: Logo URL (S3 path)
  logoUrl: String; // optional

  // NEW: Logo approval workflow
  logoApprovalStatus: "pending" | "approved" | "rejected";
  logoRejectionReason: String; // optional

  // NEW: Display size (calculated based on amount/tier)
  displaySize: "small" | "medium" | "large" | "xlarge";

  // NEW: Calculated pixel size for rendering
  calculatedFontSize: Number; // for text
  calculatedLogoWidth: Number; // for logos
}
```

**Status**: ✅ Partially complete (needs approval fields)

---

### 3. ShirtLayout Model Updates

**File**: `backend/src/models/ShirtLayout.ts`

```typescript
{
  campaignId: ObjectId

  // NEW: Layout type
  layoutType: 'grid' | 'flexible'

  // FOR GRID LAYOUTS (fixed, positional)
  rows: Number
  columns: Number
  placements: [{
    positionId: String      // e.g., "A1", "B5"
    row: Number
    col: Number
    price: Number           // Calculated based on pricing strategy
    isTaken: Boolean
    sponsorId: ObjectId     // Reference to SponsorEntry
  }]

  // FOR FLEXIBLE LAYOUTS (pay-what-you-want)
  maxSponsors: Number  // Optional limit
  // Sponsors positioned dynamically, no fixed placements
}
```

**Status**: ⏳ Needs update

---

## Implementation Phases

### PHASE 3: Backend API Endpoints

**Estimated Time**: 2-3 hours

#### 3.1 Campaign Controller Updates

**File**: `backend/src/controllers/campaign.controller.ts`

- [ ] Update `createCampaign` endpoint to accept pricingConfig
- [ ] Update `updateCampaign` endpoint to handle pricing changes
- [ ] Add validation middleware for pricing config

#### 3.2 Sponsorship Controller Updates

**File**: `backend/src/controllers/sponsorship.controller.ts`

- [ ] Update `createSponsorship` to handle logo uploads
- [ ] Add `POST /api/sponsorships/:id/approve-logo` endpoint
- [ ] Add `POST /api/sponsorships/:id/reject-logo` endpoint
- [ ] Add `GET /api/campaigns/:id/pending-logos` endpoint (for organizers)

#### 3.3 Public API Updates

**File**: `backend/src/controllers/public.controller.ts`

- [ ] Update `getPublicCampaign` to include:
  - Pricing config
  - Only approved logo sponsors
  - Calculated sizes for display

---

### PHASE 4: Frontend Types & Interfaces

**Estimated Time**: 1-2 hours

#### 4.1 Update Campaign Types

**File**: `frontend/src/types/campaign.types.ts`

```typescript
export type CampaignType = "fixed" | "positional" | "pay-what-you-want";
export type SponsorDisplayType = "text-only" | "logo-only" | "both";
export type LayoutStyle =
  | "grid"
  | "size-ordered"
  | "amount-ordered"
  | "word-cloud";

export interface SizeTier {
  size: "small" | "medium" | "large" | "xlarge";
  minAmount: number;
  maxAmount?: number;
  textFontSize: number;
  logoWidth: number;
}

export interface PricingConfig {
  // Fixed pricing
  fixedPrice?: number;

  // Positional pricing
  basePrice?: number;
  pricePerPosition?: number;

  // Pay what you want
  minimumAmount?: number;
  suggestedAmounts?: number[];
  sizeTiers?: SizeTier[];
}

export interface Campaign {
  // ... existing fields
  campaignType: CampaignType;
  sponsorDisplayType: SponsorDisplayType;
  layoutStyle: LayoutStyle;
  pricingConfig: PricingConfig;
}

export interface SponsorEntry {
  // ... existing fields
  sponsorType: "text" | "logo";
  logoUrl?: string;
  logoApprovalStatus: "pending" | "approved" | "rejected";
  logoRejectionReason?: string;
  displaySize: "small" | "medium" | "large" | "xlarge";
  calculatedFontSize?: number;
  calculatedLogoWidth?: number;
}
```

#### 4.2 Update API Service

**File**: `frontend/src/services/campaign.service.ts`

- [ ] Update `createCampaign` to send pricingConfig
- [ ] Update `updateCampaign` to send pricingConfig
- [ ] Add `approveLogo(sponsorshipId: string, approved: boolean, reason?: string)`
- [ ] Add `getPendingLogos(campaignId: string)`

---

### PHASE 5: Campaign Creation UI

**Estimated Time**: 6-8 hours

#### 5.1 Update CreateCampaign Page

**File**: `frontend/src/pages/CreateCampaign.tsx`

**Step 1: Campaign Type Selection**

- [ ] Update campaign type selector:
  - Fixed Price
  - Positional Pricing
  - Pay What You Want
- [ ] Add descriptions for each type

**Step 2: Sponsor Type Selection**

- [ ] Add sponsor type selector:
  - Text Only
  - Logo Only
  - Both Text and Logo
- [ ] Show preview of what each looks like

**Step 3: Pricing Configuration**

- [ ] Create `PricingConfigForm` component
  - For Fixed: Single price input
  - For Positional: Base price + price per position inputs
  - For Pay What You Want: Minimum amount + suggested amounts

**Step 4: Layout Style Selection**

- [ ] Add layout style selector (conditional on campaign type):
  - Grid (for fixed/positional)
  - Size-Ordered (for pay-what-you-want)
  - Amount-Ordered (for pay-what-you-want)
  - Word-Cloud (for pay-what-you-want)

**Step 5: Size Tiers Configuration (Pay What You Want only)**

- [ ] Create `SizeTiersForm` component
  - Add/remove tiers
  - Set amount ranges
  - Set font sizes and logo widths
  - Preview of sizes

#### 5.2 Create New Components

**Component**: `PricingConfigForm.tsx`

```typescript
interface Props {
  campaignType: CampaignType;
  value: PricingConfig;
  onChange: (config: PricingConfig) => void;
}
```

- [ ] Conditional rendering based on campaign type
- [ ] Validation (prices > 0, etc.)
- [ ] Preview of pricing

**Component**: `SizeTiersEditor.tsx`

```typescript
interface Props {
  tiers: SizeTier[];
  onChange: (tiers: SizeTier[]) => void;
  sponsorDisplayType: SponsorDisplayType;
}
```

- [ ] Add/remove tier buttons
- [ ] Amount range inputs
- [ ] Font size slider (for text)
- [ ] Logo width slider (for logos)
- [ ] Visual preview of sizes

**Component**: `LayoutStyleSelector.tsx`

```typescript
interface Props {
  campaignType: CampaignType;
  value: LayoutStyle;
  onChange: (style: LayoutStyle) => void;
}
```

- [ ] Radio buttons with previews
- [ ] Conditional options based on campaign type

---

### PHASE 6: Layout Editor Updates

**Estimated Time**: 3-4 hours

#### 6.1 Update ShirtLayoutEditor

**File**: `frontend/src/components/ShirtLayoutEditor.tsx`

- [ ] Add support for positional pricing display

  - Show calculated price for each position
  - Visual indication of price gradient

- [ ] Add support for flexible layouts (pay-what-you-want)
  - No grid editor needed
  - Just show max sponsors limit input

#### 6.2 Create Layout Preview Components

**Component**: `GridLayoutPreview.tsx`

- [ ] Show grid with position prices
- [ ] Color-code by price (gradient)

**Component**: `FlexibleLayoutPreview.tsx`

- [ ] Show example sponsors at different sizes
- [ ] Demonstrate size tiers visually

---

### PHASE 7: Sponsor Submission Flow

**Estimated Time**: 5-6 hours

#### 7.1 Update Public Campaign Page

**File**: `frontend/src/pages/PublicCampaign.tsx`

- [ ] Display pricing information based on campaign type

  - Fixed: "All positions $X"
  - Positional: "Positions from $X to $Y"
  - Pay What You Want: "Minimum $X, suggested amounts..."

- [ ] Show sponsor type options (text/logo/both)

#### 7.2 Update Sponsor Form

**File**: `frontend/src/components/SponsorForm.tsx`

**For Fixed/Positional:**

- [ ] Show grid with available positions
- [ ] Display price for each position
- [ ] Add sponsor type selector (if campaign allows both)
- [ ] Conditional: Logo upload field
- [ ] Show calculated price

**For Pay What You Want:**

- [ ] Amount input with minimum validation
- [ ] Show suggested amounts as quick-select buttons
- [ ] Display which size tier they'll get
- [ ] Preview of their sponsor display size
- [ ] Add sponsor type selector (if campaign allows both)
- [ ] Conditional: Logo upload field

#### 7.3 Create Logo Upload Component

**Component**: `LogoUpload.tsx`

```typescript
interface Props {
  value?: File;
  onChange: (file: File) => void;
  maxSize?: number; // MB
  minDimensions?: { width: number; height: number };
}
```

- [ ] Drag & drop or click to upload
- [ ] Image preview
- [ ] Validation:
  - File type (PNG, JPG, SVG)
  - File size (max 2MB)
  - Dimensions (min 200x200px)
  - Aspect ratio warning (recommend square)
- [ ] Crop/resize tool (optional but nice)

#### 7.4 Update Sponsorship Service

**File**: `frontend/src/services/sponsorship.service.ts`

- [ ] Update `createSponsorship` to handle:
  - Logo file upload (multipart/form-data)
  - Sponsor type
  - Amount validation

---

### PHASE 8: Admin Dashboard - Logo Approval

**Estimated Time**: 3-4 hours

#### 8.1 Create Logo Approval Page

**File**: `frontend/src/pages/LogoApproval.tsx` (NEW)

- [ ] List all pending logo sponsors for campaign
- [ ] Show:
  - Sponsor name
  - Amount paid
  - Logo preview
  - Position (if applicable)
- [ ] Actions:
  - Approve button
  - Reject button (with reason input)
- [ ] Bulk approve/reject

#### 8.2 Add to Campaign Dashboard

**File**: `frontend/src/pages/CampaignDashboard.tsx`

- [ ] Add "Pending Logos" badge/notification
- [ ] Link to logo approval page
- [ ] Show count of pending approvals

#### 8.3 Create Logo Approval Component

**Component**: `LogoApprovalCard.tsx`

```typescript
interface Props {
  sponsor: SponsorEntry;
  onApprove: () => void;
  onReject: (reason: string) => void;
}
```

- [ ] Large logo preview
- [ ] Sponsor details
- [ ] Approve/Reject buttons
- [ ] Rejection reason modal

---

### PHASE 9: Public Display & Rendering

**Estimated Time**: 6-8 hours

#### 9.1 Update Shirt Display Component

**File**: `frontend/src/components/ShirtDisplay.tsx`

- [ ] Detect layout style and render accordingly
- [ ] Pass approved sponsors only

#### 9.2 Create Layout Renderers

**Component**: `GridLayoutRenderer.tsx`

- [ ] Render sponsors in grid positions
- [ ] Support text and logo sponsors
- [ ] Apply calculated sizes

**Component**: `SizeOrderedRenderer.tsx`

- [ ] Sort sponsors by display size (largest first)
- [ ] Render in flowing layout
- [ ] Support text and logo sponsors

**Component**: `AmountOrderedRenderer.tsx`

- [ ] Sort sponsors by amount paid (highest first)
- [ ] Render in flowing layout
- [ ] Support text and logo sponsors

**Component**: `WordCloudRenderer.tsx`

- [ ] Use word cloud algorithm
- [ ] Position sponsors artistically
- [ ] Vary sizes based on amount
- [ ] Support text and logo sponsors
- [ ] Libraries to consider: `react-wordcloud` or custom implementation

#### 9.3 Create Sponsor Display Components

**Component**: `TextSponsor.tsx`

```typescript
interface Props {
  name: string;
  fontSize: number;
  message?: string;
}
```

- [ ] Render text at calculated size
- [ ] Optional message tooltip

**Component**: `LogoSponsor.tsx`

```typescript
interface Props {
  name: string;
  logoUrl: string;
  logoWidth: number;
  message?: string;
}
```

- [ ] Render logo at calculated size
- [ ] Fallback to name if logo fails to load
- [ ] Optional message tooltip
- [ ] Alt text for accessibility

---

### PHASE 10: Testing & Validation

**Estimated Time**: 4-5 hours

#### 10.1 Backend Testing

- [ ] Unit tests for pricing calculation service

  - Test fixed pricing
  - Test positional pricing (various positions)
  - Test pay-what-you-want tier calculation

- [ ] Integration tests for campaign creation

  - Create campaign with each pricing strategy
  - Validate pricing config

- [ ] Integration tests for sponsorship
  - Create text sponsorship
  - Create logo sponsorship
  - Test logo approval workflow
  - Test S3 upload

#### 10.2 Frontend Testing

- [ ] Test campaign creation flow

  - All three pricing strategies
  - All sponsor types
  - All layout styles

- [ ] Test sponsor submission

  - Fixed pricing
  - Positional pricing
  - Pay what you want
  - Logo upload

- [ ] Test logo approval workflow

  - Approve logo
  - Reject logo
  - Email notifications

- [ ] Test public display
  - Grid layout rendering
  - Size-ordered rendering
  - Amount-ordered rendering
  - Word cloud rendering
  - Text sponsors
  - Logo sponsors
  - Mixed sponsors

#### 10.3 Edge Cases & Validation

- [ ] Invalid pricing config
- [ ] Logo file too large
- [ ] Logo wrong format
- [ ] Amount below minimum
- [ ] Position already taken
- [ ] Campaign closed
- [ ] Unapproved logos not showing publicly
- [ ] Responsive design on mobile

---

### PHASE 11: Documentation & Deployment

**Estimated Time**: 2-3 hours

#### 11.1 Update Documentation

- [ ] API documentation for new endpoints
- [ ] User guide for organizers

  - How to choose pricing strategy
  - How to configure size tiers
  - How to approve logos

- [ ] User guide for sponsors
  - How to upload logos
  - Logo requirements
  - What happens after submission

#### 11.2 Database Migration (if needed)

- [ ] Add default values for existing campaigns:
  - `campaignType`: Map from old `campaignType`
  - `sponsorDisplayType`: 'text-only'
  - `layoutStyle`: 'grid'
  - `pricingConfig`: Extract from existing layout

#### 11.3 Deployment Checklist

- [ ] Environment variables for S3

  - AWS_ACCESS_KEY_ID
  - AWS_SECRET_ACCESS_KEY
  - AWS_S3_BUCKET_NAME
  - AWS_S3_REGION

- [ ] Database indexes

  - SponsorEntry.logoApprovalStatus
  - SponsorEntry.campaignId + logoApprovalStatus

- [ ] CDN/CloudFront for logo delivery (optional)

---

## Summary of Changes

### New Files to Create

**Backend:**

1. `backend/src/services/pricing.service.ts` - Pricing calculations
2. `backend/src/services/upload.service.ts` - S3 logo uploads
3. `backend/src/types/campaign.types.ts` - TypeScript interfaces
4. `backend/src/middleware/upload.middleware.ts` - Multer config for file uploads

**Frontend:**

1. `frontend/src/components/PricingConfigForm.tsx` - Pricing configuration UI
2. `frontend/src/components/SizeTiersEditor.tsx` - Size tier editor
3. `frontend/src/components/LayoutStyleSelector.tsx` - Layout style picker
4. `frontend/src/components/LogoUpload.tsx` - Logo upload component
5. `frontend/src/components/GridLayoutPreview.tsx` - Grid preview
6. `frontend/src/components/FlexibleLayoutPreview.tsx` - Flexible layout preview
7. `frontend/src/pages/LogoApproval.tsx` - Logo approval page
8. `frontend/src/components/LogoApprovalCard.tsx` - Logo approval card
9. `frontend/src/components/GridLayoutRenderer.tsx` - Grid renderer
10. `frontend/src/components/SizeOrderedRenderer.tsx` - Size-ordered renderer
11. `frontend/src/components/AmountOrderedRenderer.tsx` - Amount-ordered renderer
12. `frontend/src/components/WordCloudRenderer.tsx` - Word cloud renderer
13. `frontend/src/components/TextSponsor.tsx` - Text sponsor display
14. `frontend/src/components/LogoSponsor.tsx` - Logo sponsor display

### Files to Modify

**Backend:**

1. `backend/src/models/Campaign.ts` ✅ Partially done
2. `backend/src/models/SponsorEntry.ts` ✅ Partially done
3. `backend/src/models/ShirtLayout.ts`
4. `backend/src/services/campaign.service.ts`
5. `backend/src/services/shirtLayout.service.ts`
6. `backend/src/services/sponsorship.service.ts`
7. `backend/src/controllers/campaign.controller.ts`
8. `backend/src/controllers/sponsorship.controller.ts`
9. `backend/src/controllers/public.controller.ts`
10. `backend/src/routes/sponsorship.routes.ts`

**Frontend:**

1. `frontend/src/types/campaign.types.ts`
2. `frontend/src/services/campaign.service.ts`
3. `frontend/src/services/sponsorship.service.ts`
4. `frontend/src/pages/CreateCampaign.tsx`
5. `frontend/src/pages/PublicCampaign.tsx`
6. `frontend/src/pages/CampaignDashboard.tsx`
7. `frontend/src/components/ShirtLayoutEditor.tsx`
8. `frontend/src/components/SponsorForm.tsx`
9. `frontend/src/components/ShirtDisplay.tsx`

---

## Estimated Total Time

| Phase     | Description          | Time            |
| --------- | -------------------- | --------------- |
| Phase 1   | Database & Models    | 2-3 hours       |
| Phase 2   | Backend Services     | 4-5 hours       |
| Phase 3   | Backend API          | 2-3 hours       |
| Phase 4   | Frontend Types       | 1-2 hours       |
| Phase 5   | Campaign Creation UI | 6-8 hours       |
| Phase 6   | Layout Editor        | 3-4 hours       |
| Phase 7   | Sponsor Submission   | 5-6 hours       |
| Phase 8   | Logo Approval        | 3-4 hours       |
| Phase 9   | Public Display       | 6-8 hours       |
| Phase 10  | Testing              | 4-5 hours       |
| Phase 11  | Documentation        | 2-3 hours       |
| **TOTAL** |                      | **38-51 hours** |

---

## Implementation Order Recommendation

For efficient development, implement in this order:

### Week 1: Foundation

1. **Day 1-2**: Phase 1 & 2 (Backend foundation)
2. **Day 3**: Phase 3 (Backend API)
3. **Day 4**: Phase 4 (Frontend types)

### Week 2: Fixed Pricing (Simplest)

4. **Day 5-6**: Phase 5 (Campaign creation - Fixed pricing only)
5. **Day 7**: Phase 7 (Sponsor submission - Fixed pricing)
6. **Day 8**: Phase 9 (Display - Grid layout)
7. **Day 9**: Testing fixed pricing end-to-end

### Week 3: Positional Pricing

8. **Day 10-11**: Add positional pricing to campaign creation
9. **Day 12**: Add positional pricing to sponsor submission
10. **Day 13**: Testing positional pricing

### Week 4: Pay What You Want

11. **Day 14-15**: Add PWYW to campaign creation (with size tiers)
12. **Day 16**: Add PWYW to sponsor submission
13. **Day 17**: Implement size-ordered and amount-ordered layouts
14. **Day 18**: Implement word cloud layout

### Week 5: Logo Support

15. **Day 19-20**: Add logo upload to sponsor submission
16. **Day 21**: Implement S3 upload service
17. **Day 22**: Create logo approval page
18. **Day 23**: Update all renderers for logo support

### Week 6: Polish & Testing

19. **Day 24-25**: Comprehensive testing
20. **Day 26**: Bug fixes
21. **Day 27**: Documentation
22. **Day 28**: Deployment

---

## Next Steps

Ready to begin implementation! Recommended approach:

1. **Start with Phase 1**: Update database models
2. **Then Phase 2**: Build backend services
3. **Incremental testing**: Test each pricing strategy as we build

Would you like me to:

- **A)** Start implementing Phase 1 now (database models)
- **B)** Review/adjust the plan first
- **C)** Focus on a specific phase you want prioritized

Let me know and I'll begin! 🚀

**Component**: `SizeOrderedRenderer.tsx`

- [ ] Sort sponsors by display size (largest first)
- [ ] Render in flowing layout
- [ ] Support text and logo sponsors

**Component**: `AmountOrderedRenderer.tsx`

- [ ] Sort sponsors by amount paid (highest first)
- [ ] Render in flowing layout
- [ ] Support text and logo sponsors

**Component**: `WordCloudRenderer.tsx`

- [ ] Use word cloud algorithm
- [ ] Position sponsors artistically
- [ ] Vary sizes based on amount
- [ ] Support text and logo sponsors
- [ ] Libraries to consider: `react-wordcloud` or custom implementation

#### 9.3 Create Sponsor Display Components

**Component**: `TextSponsor.tsx`

```typescript
interface Props {
  name: string;
  fontSize: number;
  message?: string;
}
```

- [ ] Render text at calculated size
- [ ] Optional message tooltip

**Component**: `LogoSponsor.tsx`

```typescript
interface Props {
  name: string;
  logoUrl: string;
  logoWidth: number;
  message?: string;
}
```

- [ ] Render logo at calculated size
- [ ] Fallback to name if logo fails to load
- [ ] Optional message tooltip
- [ ] Alt text for accessibility

---

### PHASE 1: Database & Models (Backend Foundation)

**Estimated Time**: 2-3 hours

#### 1.1 Update Campaign Model

- [ ] Add `pricingConfig` field with schema
- [ ] Update `campaignType` enum to: fixed, positional, pay-what-you-want
- [ ] Add `sponsorDisplayType` field
- [ ] Add `layoutStyle` field
- [ ] Remove old `pricingStrategy` field (was temporary)

#### 1.2 Update SponsorEntry Model

- [ ] Add `logoApprovalStatus` field
- [ ] Add `logoRejectionReason` field
- [ ] Add `calculatedFontSize` field
- [ ] Add `calculatedLogoWidth` field

#### 1.3 Update ShirtLayout Model

- [ ] Add `layoutType` field
- [ ] Make `rows` and `columns` optional (not needed for flexible layouts)
- [ ] Make `placements` optional (not needed for flexible layouts)
- [ ] Add `maxSponsors` field

#### 1.4 Create TypeScript Interfaces

**File**: `backend/src/types/campaign.types.ts` (create if doesn't exist)

- [ ] Define `PricingConfig` interface
- [ ] Define `SizeTier` interface
- [ ] Define `PlacementPosition` interface

---

### PHASE 2: Backend Services & Logic

**Estimated Time**: 4-5 hours

#### 2.1 Pricing Calculation Service

**File**: `backend/src/services/pricing.service.ts` (NEW)

- [ ] `calculatePositionPrice(position: number, config: PricingConfig): number`

  - For positional: basePrice + (position × pricePerPosition)

- [ ] `calculateSizeTier(amount: number, tiers: SizeTier[]): SizeTier`

  - Determine which tier based on amount paid

- [ ] `calculateDisplaySizes(amount: number, tier: SizeTier, sponsorType: 'text' | 'logo'): { fontSize?, logoWidth? }`
  - Return calculated pixel sizes

#### 2.2 Update Campaign Service

**File**: `backend/src/services/campaign.service.ts`

- [ ] Update `createCampaign()` to accept new pricing config
- [ ] Add validation for pricing config based on campaign type
- [ ] Update `updateCampaign()` to handle pricing config changes

#### 2.3 Update Layout Service

**File**: `backend/src/services/shirtLayout.service.ts`

- [ ] Update `createLayout()` for grid layouts

  - Calculate price for each position (fixed vs positional)

- [ ] Add `createFlexibleLayout()` for pay-what-you-want
  - No fixed positions, just max sponsors limit

#### 2.4 Update Sponsorship Service

**File**: `backend/src/services/sponsorship.service.ts`

- [ ] Update `createSponsorship()` to handle:

  - Logo uploads (S3)
  - Logo approval status (default: pending)
  - Calculate display size based on amount
  - Validate amount against pricing config

- [ ] Add `approveLogoSponsorship(sponsorshipId, approved: boolean, reason?: string)`
  - Update logoApprovalStatus
  - Send email notification to sponsor

#### 2.5 Image Upload Service

**File**: `backend/src/services/upload.service.ts` (may already exist)

- [ ] `uploadLogoToS3(file: Buffer, sponsorshipId: string): Promise<string>`
  - Upload to S3
  - Return S3 URL
  - Validate file type (PNG, JPG, SVG)
  - Validate file size (max 2MB)
  - Validate dimensions (min 200x200px, square preferred)

---
