# Optional Stripe Payment Implementation Guide

## Overview
This guide outlines the implementation plan to make Stripe payment processing optional at the campaign level. Campaign owners can choose to use the platform purely for pledge collection with manual payment processing, or enable Stripe for automated online payments.

## Current State

### Existing Payment Flow
1. **Stripe (Card) Payment**: Always available, processes payments automatically via Stripe
2. **Offline Payment**: Available when `allowOfflinePayments` is true, requires manual confirmation

### Current Limitations
- Stripe is always initialized, even if not needed
- `STRIPE_SECRET_KEY` is required in environment variables
- Frontend always loads Stripe SDK
- No way to disable online payments entirely

## Proposed Changes

### 1. Database Schema Changes

#### Campaign Model (`backend/src/models/Campaign.ts`)
Add new field:
```typescript
enableStripePayments: { type: Boolean, default: false }
```

**Migration Considerations:**
- Existing campaigns should default to `false` (safer default)
- Or set to `true` if `STRIPE_SECRET_KEY` exists in environment

#### Updated Campaign Interface
```typescript
interface Campaign {
  // ... existing fields
  allowOfflinePayments: boolean;  // existing
  enableStripePayments: boolean;  // NEW
}
```

### 2. Backend Changes

#### A. Payment Service (`backend/src/services/payment.service.ts`)
**Changes:**
- Make Stripe initialization conditional
- Add validation to check if campaign has Stripe enabled before creating payment intents
- Return helpful error if Stripe is not configured

```typescript
const getStripe = (campaignId?: string) => {
    // If campaignId provided, check if campaign has Stripe enabled
    // Only throw error if Stripe is actually needed
    if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error('Stripe is not configured for this campaign');
    }
    // ... existing code
};

export const createPaymentIntent = async (...) => {
    const campaign = await campaignService.getCampaignById(campaignId);
    
    // Validate Stripe is enabled for this campaign
    if (!campaign.enableStripePayments) {
        throw new Error('Online payments are not enabled for this campaign');
    }
    
    // ... rest of existing code
};
```

#### B. Payment Controller (`backend/src/controllers/payment.controller.ts`)
**Changes:**
- Update `getConfig` to return null/empty if Stripe not configured
- Add campaign-specific config endpoint

```typescript
export const getConfig = async (req: Request, res: Response) => {
    try {
        if (!process.env.STRIPE_SECRET_KEY) {
            return res.json({ publishableKey: null, stripeEnabled: false });
        }
        const publishableKey = paymentService.getStripePublishableKey();
        res.json({ publishableKey, stripeEnabled: true });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// NEW: Get campaign-specific payment config
export const getCampaignConfig = async (req: Request, res: Response) => {
    try {
        const { campaignId } = req.params;
        const campaign = await campaignService.getCampaignById(campaignId);
        
        res.json({
            enableStripePayments: campaign.enableStripePayments,
            allowOfflinePayments: campaign.allowOfflinePayments,
            publishableKey: campaign.enableStripePayments ? paymentService.getStripePublishableKey() : null
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
```

#### C. Campaign Service (`backend/src/services/campaign.service.ts`)
**Changes:**
- Add validation when creating/updating campaigns
- Ensure `enableStripePayments` can only be true if Stripe is configured

```typescript
export const createCampaign = async (userId: string, campaignData: any) => {
    // Validate Stripe configuration if enableStripePayments is true
    if (campaignData.enableStripePayments && !process.env.STRIPE_SECRET_KEY) {
        throw new Error('Cannot enable Stripe payments: Stripe is not configured');
    }
    
    // ... existing code
};
```

#### D. Routes (`backend/src/routes/payment.routes.ts`)
**Changes:**
- Add new campaign-specific config endpoint

```typescript
router.get('/campaigns/:campaignId/config', paymentController.getCampaignConfig);
```

### 3. Frontend Changes

#### A. Types (`frontend/src/types/campaign.types.ts`)
**Changes:**
- Add `enableStripePayments` to Campaign interface
- Add to CreateCampaignRequest interface

```typescript
export interface Campaign {
    // ... existing fields
    enableStripePayments: boolean;  // NEW
}

export interface CreateCampaignRequest {
    // ... existing fields
    enableStripePayments?: boolean;  // NEW
}
```

#### B. Stripe Utility (`frontend/src/utils/stripe.ts`)
**Changes:**
- Make Stripe loading conditional
- Handle cases where Stripe is not configured

```typescript
const getStripe = async (campaignId?: string) => {
    try {
        const endpoint = campaignId 
            ? `/api/payment/campaigns/${campaignId}/config`
            : '/api/payment/config';
            
        const res = await fetch(`http://localhost:5000${endpoint}`);
        const data = await res.json();
        
        if (!data.publishableKey || !data.stripeEnabled) {
            return null;  // Stripe not available
        }
        
        return loadStripe(data.publishableKey);
    } catch (error) {
        console.error('Failed to load Stripe:', error);
        return null;
    }
};
```

#### C. Sponsor Checkout Modal (`frontend/src/components/SponsorCheckoutModal.tsx`)
**Changes:**
- Conditionally load Stripe based on campaign settings
- Hide card payment option if Stripe not enabled
- Show appropriate messaging

**Key Changes:**
1. Fetch campaign payment config on mount
2. Conditionally render payment method options
3. Handle Stripe not being available

```typescript
const [paymentConfig, setPaymentConfig] = useState<{
    enableStripePayments: boolean;
    allowOfflinePayments: boolean;
}>({ enableStripePayments: false, allowOfflinePayments: true });

useEffect(() => {
    // Fetch campaign payment configuration
    fetchCampaignPaymentConfig(campaignId);
}, [campaignId]);

// In payment method selection:
{paymentConfig.enableStripePayments && (
    <Radio value="card">Credit/Debit Card</Radio>
)}
{paymentConfig.allowOfflinePayments && (
    <Radio value="cash">Cash / Bank Transfer (Offline)</Radio>
)}
```

#### D. Campaign Creation/Edit Forms
**Changes:**
- Add toggle for "Enable Online Payments (Stripe)"
- Add toggle for "Allow Offline Payments"
- Show validation/warning if Stripe not configured on server

**UI Logic:**
```typescript
<Form.Item
    label="Enable Online Payments (Stripe)"
    name="enableStripePayments"
    valuePropName="checked"
    tooltip="Allow sponsors to pay with credit/debit cards via Stripe"
>
    <Switch />
</Form.Item>

<Form.Item
    label="Allow Offline Payments"
    name="allowOfflinePayments"
    valuePropName="checked"
    tooltip="Allow sponsors to pledge and pay manually (cash, bank transfer, etc.)"
>
    <Switch />
</Form.Item>
```

**Validation:**
- At least one payment method must be enabled
- Show warning if neither is enabled

### 4. Payment Method Scenarios

| enableStripePayments | allowOfflinePayments | Available Options | Use Case |
|---------------------|---------------------|-------------------|----------|
| `false` | `true` | Offline only | Pledge collection only, manual payment processing |
| `true` | `false` | Card only | Online payments only, immediate processing |
| `true` | `true` | Both | Maximum flexibility, sponsors choose |
| `false` | `false` | ❌ Invalid | Must enable at least one payment method |

### 5. Environment Variables

#### Optional Stripe Configuration
Make these optional in `.env`:
```bash
# Optional: Only required if campaigns use enableStripePayments=true
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

#### Backend Startup
- Don't fail if Stripe keys are missing
- Log warning if Stripe not configured
- Only fail when trying to create payment intent without Stripe configured

### 6. Implementation Steps

#### Phase 1: Database & Backend Core
1. ✅ Add `enableStripePayments` field to Campaign model
2. ✅ Update campaign creation/update services
3. ✅ Make Stripe initialization conditional in payment service
4. ✅ Add campaign-specific payment config endpoint
5. ✅ Update validation logic

#### Phase 2: Frontend Core
1. ✅ Update TypeScript types
2. ✅ Update Stripe utility to handle null/unavailable state
3. ✅ Update SponsorCheckoutModal to conditionally show payment options
4. ✅ Add payment config fetching logic

#### Phase 3: UI/UX
1. ✅ Add payment settings to campaign creation form
2. ✅ Add payment settings to campaign edit form
3. ✅ Add validation for payment method selection
4. ✅ Update messaging/help text

#### Phase 4: Testing & Migration
1. ✅ Test campaign creation with Stripe enabled
2. ✅ Test campaign creation with Stripe disabled
3. ✅ Test sponsorship flow with each payment method
4. ✅ Test environment without Stripe configured
5. ✅ Migrate existing campaigns (decide default value)

### 7. Migration Strategy

#### Option A: Conservative (Recommended)
```javascript
// Set all existing campaigns to enableStripePayments: false
db.campaigns.updateMany(
    {},
    { $set: { enableStripePayments: false } }
);
```
- Safer default
- Campaign owners must explicitly enable Stripe
- No unexpected behavior

#### Option B: Preserve Current Behavior
```javascript
// Set to true only if Stripe is configured
const stripeConfigured = !!process.env.STRIPE_SECRET_KEY;
db.campaigns.updateMany(
    {},
    { $set: { enableStripePayments: stripeConfigured } }
);
```
- Maintains current functionality
- Existing campaigns continue working as before

### 8. Error Handling

#### Backend Errors
- `"Online payments are not enabled for this campaign"` - When trying to create payment intent for campaign with `enableStripePayments: false`
- `"Stripe is not configured"` - When trying to enable Stripe payments without env vars
- `"At least one payment method must be enabled"` - When both flags are false

#### Frontend Errors
- Show clear message if Stripe fails to load
- Disable card payment option gracefully
- Guide users to offline payment if Stripe unavailable

### 9. Documentation Updates

#### For Campaign Owners
- Explain the difference between online and offline payments
- Document how to enable/disable payment methods
- Explain Stripe setup requirements

#### For Platform Admins
- Document Stripe configuration steps
- Explain when Stripe keys are required
- Migration guide for existing campaigns

### 10. Future Enhancements

#### Potential Additions
- Support for other payment providers (PayPal, Square, etc.)
- Per-campaign Stripe account (Stripe Connect)
- Payment method analytics
- Automatic payment reminders for pending offline payments

## Testing Checklist

### Backend Tests
- [ ] Campaign creation with `enableStripePayments: true` (Stripe configured)
- [ ] Campaign creation with `enableStripePayments: true` (Stripe NOT configured) - should fail
- [ ] Campaign creation with `enableStripePayments: false` - should succeed
- [ ] Payment intent creation for campaign with Stripe enabled
- [ ] Payment intent creation for campaign with Stripe disabled - should fail
- [ ] Get campaign payment config endpoint

### Frontend Tests
- [ ] Campaign form shows payment method toggles
- [ ] Campaign form validates at least one payment method enabled
- [ ] Checkout modal shows only offline payment when Stripe disabled
- [ ] Checkout modal shows both options when both enabled
- [ ] Checkout modal shows only card when only Stripe enabled
- [ ] Stripe loads correctly when enabled
- [ ] Graceful handling when Stripe fails to load

### Integration Tests
- [ ] End-to-end sponsorship with Stripe payment
- [ ] End-to-end sponsorship with offline payment
- [ ] Campaign without Stripe env vars (offline only)
- [ ] Campaign with Stripe env vars (both methods)

## Rollback Plan

If issues arise:
1. Set all campaigns to `enableStripePayments: false, allowOfflinePayments: true`
2. Revert frontend changes to always show both options
3. Revert backend to always initialize Stripe (with try-catch)
4. Deploy hotfix
5. Investigate and fix issues
6. Re-deploy with proper testing

## Success Criteria

- ✅ Campaigns can be created without Stripe configuration
- ✅ Campaigns with Stripe enabled process payments correctly
- ✅ Campaigns with Stripe disabled only show offline payment option
- ✅ No breaking changes to existing functionality
- ✅ Clear error messages for misconfiguration
- ✅ Smooth user experience regardless of payment method availability


