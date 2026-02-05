# Critical Production Fixes - Quick Reference

This document provides specific implementation guidance for the most critical production readiness issues.

---

## 🔴 1. Filter Data Packets Sent to Frontend

### Problem
Currently, some endpoints send entire documents to the frontend, including sensitive or unnecessary data.

### Specific Issues Found

#### Issue 1.1: User Data Exposure
**Location:** `backend/src/services/user.service.ts`

**Current Code:**
```typescript
// Returns user with all fields
req.user = await User.findById(decoded.id).select('-passwordHash');
```

**Problem:** Still exposes `resetPasswordToken`, `resetPasswordExpires`, and other internal fields.

**Fix:**
```typescript
// Create a sanitization function
export const sanitizeUserForResponse = (user: any) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  organizerProfile: user.organizerProfile,
  createdAt: user.createdAt,
});

// In auth middleware
req.user = await User.findById(decoded.id)
  .select('_id name email role organizerProfile createdAt');
```

#### Issue 1.2: Campaign Owner Data in Public Endpoints
**Location:** `backend/src/controllers/campaign.controller.ts` - `getPublicCampaign`

**Current Code:**
```typescript
const campaign = await Campaign.findOne({ slug })
  .populate('ownerId');
```

**Problem:** Populates entire user document including email and other private data.

**Fix:**
```typescript
const campaign = await Campaign.findOne({ slug })
  .populate('ownerId', 'name organizerProfile'); // Only select needed fields

// Or create a sanitization layer
const sanitizedCampaign = {
  ...campaign.toObject(),
  owner: {
    name: campaign.ownerId.name,
    organizerProfile: campaign.ownerId.organizerProfile,
  },
};
delete sanitizedCampaign.ownerId;
```

#### Issue 1.3: Admin Endpoint Returns All Campaigns
**Location:** `backend/src/controllers/admin.controller.ts` - `getAllCampaigns`

**Current Code:**
```typescript
export const getAllCampaigns = async (req: Request, res: Response) => {
  try {
    const campaigns = await campaignService.getAllCampaigns();
    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};
```

**Problem:** Returns ALL campaigns without pagination or filtering.

**Fix:**
```typescript
export const getAllCampaigns = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [campaigns, total] = await Promise.all([
      Campaign.find()
        .populate('ownerId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Campaign.countDocuments(),
    ]);

    res.json({
      campaigns,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};
```

#### Issue 1.4: Sponsor Data Exposure
**Location:** `backend/src/controllers/sponsorship.controller.ts`

**Current Code:**
```typescript
export const getPublicSponsors = async (req: Request, res: Response) => {
  try {
    const campaignId = req.params.id;
    const sponsors = await sponsorshipService.getPublicSponsors(campaignId);
    res.json(sponsors);
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};
```

**Problem:** Check what `getPublicSponsors` returns - should NOT include email, phone, or other contact info.

**Fix in Service:**
```typescript
export const getPublicSponsors = async (campaignId: string) => {
  const sponsors = await SponsorEntry.find({
    campaignId,
    paymentStatus: 'paid',
    logoApprovalStatus: { $in: ['approved', 'pending'] },
  })
  .select('name displayName amount sponsorType logoUrl displaySize calculatedFontSize calculatedLogoWidth message')
  .sort({ amount: -1 });

  return sponsors;
};
```

### Implementation Checklist

- [ ] Create `utils/sanitizers.ts` with sanitization functions for each model
- [ ] Update all `.populate()` calls to specify fields
- [ ] Use `.select()` to exclude sensitive fields at query level
- [ ] Review all API responses and remove unnecessary data
- [ ] Test each endpoint to verify only required data is sent

---

## 🔴 2. Check for Slow and Clunky Requests

### Problem
Several queries will become extremely slow as the database grows.

### Specific Issues Found

#### Issue 2.1: Missing Database Indexes

**Action Required:** Add indexes to frequently queried fields.

**File:** `backend/src/models/Campaign.ts`
```typescript
// Add after schema definition, before export
campaignSchema.index({ ownerId: 1, createdAt: -1 }); // For user's campaigns
campaignSchema.index({ slug: 1 }); // Already unique, but explicit
campaignSchema.index({ isClosed: 1, endDate: 1 }); // For filtering active campaigns
```

**File:** `backend/src/models/SponsorEntry.ts`
```typescript
sponsorEntrySchema.index({ campaignId: 1, paymentStatus: 1 }); // For filtering sponsors
sponsorEntrySchema.index({ campaignId: 1, logoApprovalStatus: 1 }); // For pending logos
sponsorEntrySchema.index({ campaignId: 1, createdAt: -1 }); // For sorting
```

**File:** `backend/src/models/ShirtLayout.ts`
```typescript
shirtLayoutSchema.index({ campaignId: 1 }); // For layout lookups
```

**File:** `backend/src/models/User.ts`
```typescript
userSchema.index({ email: 1 }); // Already unique
userSchema.index({ 'organizerProfile.slug': 1 }); // For organizer lookups
```

#### Issue 2.2: Unpaginated Sponsor Lists

**Location:** `backend/src/services/sponsorship.service.ts` - `getSponsorsByCampaign`

**Current Implementation:**
```typescript
export const getSponsorsByCampaign = async (campaignId: string) => {
  // ... validation ...
  const sponsors = await SponsorEntry.find({ campaignId })
    .sort({ createdAt: -1 });
  return sponsors;
};
```

**Problem:** Returns ALL sponsors for a campaign. With 1000+ sponsors, this will be slow.

**Fix:**
```typescript
export const getSponsorsByCampaign = async (
  campaignId: string,
  page: number = 1,
  limit: number = 50,
  filters?: { paymentStatus?: string; logoApprovalStatus?: string }
) => {
  // ... validation ...
  
  const query: any = { campaignId };
  if (filters?.paymentStatus) query.paymentStatus = filters.paymentStatus;
  if (filters?.logoApprovalStatus) query.logoApprovalStatus = filters.logoApprovalStatus;

  const skip = (page - 1) * limit;

  const [sponsors, total] = await Promise.all([
    SponsorEntry.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    SponsorEntry.countDocuments(query),
  ]);

  return {
    sponsors,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  };
};
```

**Update Controller:**
```typescript
export const getSponsors = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    const campaignId = req.params.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const filters = {
      paymentStatus: req.query.paymentStatus as string,
      logoApprovalStatus: req.query.logoApprovalStatus as string,
    };

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const result = await sponsorshipService.getSponsorsByCampaign(
      campaignId,
      page,
      limit,
      filters
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};
```

#### Issue 2.3: Campaign Statistics Calculation

**Location:** `backend/src/services/campaign.service.ts` - `getCampaignById`

**Current Implementation:** Likely calculates stats on every request.

**Problem:** Recalculating sponsor counts, totals, etc. on every request is inefficient.

**Fix Option 1 - Optimize Query:**
```typescript
export const getCampaignStats = async (campaignId: string) => {
  const stats = await SponsorEntry.aggregate([
    { $match: { campaignId: new mongoose.Types.ObjectId(campaignId) } },
    {
      $group: {
        _id: null,
        totalPledged: {
          $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$amount', 0] }
        },
        totalPending: {
          $sum: { $cond: [{ $eq: ['$paymentStatus', 'pending'] }, '$amount', 0] }
        },
        sponsorCount: {
          $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, 1, 0] }
        },
        pendingCount: {
          $sum: { $cond: [{ $eq: ['$paymentStatus', 'pending'] }, 1, 0] }
        },
      },
    },
  ]);

  return stats[0] || {
    totalPledged: 0,
    totalPending: 0,
    sponsorCount: 0,
    pendingCount: 0,
  };
};
```

**Fix Option 2 - Cache Stats:**
```typescript
// Add to Campaign model
const campaignSchema = new mongoose.Schema({
  // ... existing fields ...
  cachedStats: {
    totalPledged: { type: Number, default: 0 },
    totalPending: { type: Number, default: 0 },
    sponsorCount: { type: Number, default: 0 },
    pendingCount: { type: Number, default: 0 },
    lastUpdated: { type: Date },
  },
});

// Update stats when sponsors are added/updated
export const updateCampaignStats = async (campaignId: string) => {
  const stats = await getCampaignStats(campaignId);
  await Campaign.findByIdAndUpdate(campaignId, {
    cachedStats: {
      ...stats,
      lastUpdated: new Date(),
    },
  });
};

// Call this after sponsor operations
// In sponsorship.service.ts
export const createSponsorship = async (...) => {
  // ... create sponsor ...
  await updateCampaignStats(campaignId);
  return sponsor;
};
```

#### Issue 2.4: N+1 Query in Campaign List

**Location:** `backend/src/services/campaign.service.ts` - `getAllCampaigns`

**Current Implementation:**
```typescript
export const getAllCampaigns = async () => {
  const campaigns = await Campaign.find().populate('ownerId');
  return campaigns;
};
```

**Problem:** If you later need to get stats for each campaign, it becomes N+1 queries.

**Fix:**
```typescript
export const getAllCampaigns = async (page = 1, limit = 20) => {
  const skip = (page - 1) * limit;

  const campaigns = await Campaign.find()
    .populate('ownerId', 'name email organizerProfile')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean(); // Use lean() for better performance when not modifying

  // If you need stats, use aggregation instead
  const campaignsWithStats = await Campaign.aggregate([
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: limit },
    {
      $lookup: {
        from: 'users',
        localField: 'ownerId',
        foreignField: '_id',
        as: 'owner',
      },
    },
    { $unwind: '$owner' },
    {
      $lookup: {
        from: 'sponsorentries',
        let: { campaignId: '$_id' },
        pipeline: [
          { $match: { $expr: { $eq: ['$campaignId', '$$campaignId'] } } },
          {
            $group: {
              _id: null,
              totalPledged: {
                $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$amount', 0] }
              },
              sponsorCount: {
                $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, 1, 0] }
              },
            },
          },
        ],
        as: 'stats',
      },
    },
    {
      $project: {
        title: 1,
        slug: 1,
        description: 1,
        campaignType: 1,
        isClosed: 1,
        createdAt: 1,
        'owner.name': 1,
        'owner.email': 1,
        stats: { $arrayElemAt: ['$stats', 0] },
      },
    },
  ]);

  return campaignsWithStats;
};
```

### Implementation Checklist

- [ ] Add all database indexes to model files
- [ ] Test index creation in development
- [ ] Add pagination to all list endpoints
- [ ] Implement query result caching for stats
- [ ] Use aggregation pipelines for complex queries
- [ ] Add `.lean()` to queries that don't need Mongoose documents
- [ ] Load test with realistic data (1000+ campaigns, 10000+ sponsors)
- [ ] Monitor query performance with MongoDB profiler

---

## 🔧 Quick Implementation Guide

### Step 1: Add Database Indexes (15 minutes)

1. Update model files with indexes
2. Restart the application
3. Verify indexes were created:
   ```javascript
   // In MongoDB shell or Compass
   db.campaigns.getIndexes()
   db.sponsorentries.getIndexes()
   db.users.getIndexes()
   db.shirtlayouts.getIndexes()
   ```

### Step 2: Create Sanitization Utilities (30 minutes)

Create `backend/src/utils/sanitizers.ts`:
```typescript
export const sanitizeUser = (user: any) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  organizerProfile: user.organizerProfile,
  createdAt: user.createdAt,
});

export const sanitizeUserForPublic = (user: any) => ({
  name: user.name,
  organizerProfile: user.organizerProfile,
});

export const sanitizeCampaignForPublic = (campaign: any) => {
  const sanitized = { ...campaign };
  if (campaign.ownerId) {
    sanitized.owner = sanitizeUserForPublic(campaign.ownerId);
    delete sanitized.ownerId;
  }
  return sanitized;
};

export const sanitizeSponsorForPublic = (sponsor: any) => ({
  _id: sponsor._id,
  name: sponsor.name,
  displayName: sponsor.displayName,
  amount: sponsor.amount,
  sponsorType: sponsor.sponsorType,
  logoUrl: sponsor.logoUrl,
  displaySize: sponsor.displaySize,
  calculatedFontSize: sponsor.calculatedFontSize,
  calculatedLogoWidth: sponsor.calculatedLogoWidth,
  message: sponsor.message,
  // Explicitly exclude: email, phone, paymentMethod
});
```

### Step 3: Add Pagination Helper (15 minutes)

Create `backend/src/utils/pagination.ts`:
```typescript
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export const getPaginationParams = (query: any): Required<PaginationParams> => ({
  page: parseInt(query.page) || 1,
  limit: Math.min(parseInt(query.limit) || 20, 100), // Max 100 items per page
});

export const createPaginationResult = <T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginationResult<T> => ({
  data,
  pagination: {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
    hasNext: page * limit < total,
    hasPrev: page > 1,
  },
});
```

### Step 4: Update Controllers (1-2 hours)

Apply pagination and sanitization to all endpoints:

1. `admin.controller.ts` - getAllCampaigns
2. `sponsorship.controller.ts` - getSponsors, getPublicSponsors
3. `campaign.controller.ts` - getPublicCampaign, getMyCampaigns
4. Any other list endpoints

### Step 5: Update Frontend (1-2 hours)

Update frontend services to handle pagination:

```typescript
// frontend/src/services/campaign.service.ts
export const getAllCampaigns = async (page = 1, limit = 20) => {
  const response = await apiClient.get(`/admin/campaigns?page=${page}&limit=${limit}`);
  return response.data;
};
```

Update components to handle paginated data:
- Add pagination controls
- Update state management
- Handle loading states

### Step 6: Test Everything (1 hour)

1. Test with small dataset (current)
2. Seed large dataset (1000+ campaigns, 10000+ sponsors)
3. Test all list endpoints with pagination
4. Verify performance improvements
5. Check that sensitive data is not exposed

---

## 📊 Performance Benchmarks

After implementing these fixes, you should see:

- **Query Time:** <100ms for paginated lists (vs potentially seconds without pagination)
- **Response Size:** <100KB for most endpoints (vs potentially MBs)
- **Database Load:** Reduced by 50-80% with proper indexing
- **Memory Usage:** Stable even with large datasets

---

## 🎯 Priority Order

1. **Add database indexes** (15 min) - Immediate performance improvement
2. **Add pagination to admin endpoints** (30 min) - Prevents slowdowns
3. **Sanitize user data** (30 min) - Security critical
4. **Sanitize public endpoints** (1 hour) - Privacy critical
5. **Optimize campaign stats** (1 hour) - Performance improvement
6. **Update frontend** (2 hours) - Complete the implementation

**Total Estimated Time:** 5-6 hours

---

**Last Updated:** 2026-02-05
**Status:** Ready for implementation



