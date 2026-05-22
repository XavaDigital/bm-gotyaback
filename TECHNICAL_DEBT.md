# Technical Debt & Design Analysis

> Structural review of accumulated technical debt from iterative development.
> Each item is a discrete improvement. Security and race-condition fixes are tracked separately in `CODE_REVIEW.md`.

---

## 1. The `PricingConfig` God Object

**File:** `backend/src/types/campaign.types.ts`

The `PricingConfig` interface has 9 optional fields serving three completely different campaign types. You cannot know which fields are relevant without also knowing `campaignType`:

```ts
// Current — which fields apply? Depends on context you don't have
interface PricingConfig {
  fixedPrice?: number;
  basePrice?: number;
  pricePerPosition?: number;
  priceMultiplier?: number;
  pricingOrder?: "ascending" | "descending";
  sections?: { top?: ...; middle?: ...; bottom?: ... };
  minimumAmount?: number;
  suggestedAmounts?: number[];
  sizeTiers?: SizeTier[];
}
```

The right structure is a discriminated union:

```ts
type CampaignPricing =
  | { type: "fixed"; fixedPrice: number }
  | { type: "positional"; mode: "additive"; basePrice: number; pricePerPosition: number; pricingOrder?: "ascending" | "descending" }
  | { type: "positional"; mode: "multiplicative"; priceMultiplier: number }
  | { type: "positional"; mode: "sections"; sections: SectionMap }
  | { type: "pay-what-you-want"; minimumAmount: number; suggestedAmounts?: number[]; sizeTiers?: SizeTier[] }
```

This would simplify `calculatePositionPrice` — the current dead-code fallback reasoning at `pricing.service.ts:48–76` (what to do when `totalPositions` is missing) exists because the function can't tell from types alone which mode it's in. The `as any` casts in `createSponsorship:36` and throughout `createCampaign` are a direct symptom of this.

**Priority:** Medium. Worth addressing before adding another campaign type or pricing mode — `validatePricingConfig` and `calculatePositionPrice` will keep growing in complexity otherwise.

---

## 2. Copy-Paste Ownership Check Pattern

**File:** `backend/src/services/campaign.service.ts`

The pattern `Campaign.findById → check ownerId → handle populated vs plain ObjectId` is duplicated 5 times:

- `updateCampaign` (lines 120–134)
- `closeCampaign` (lines 185–192)
- `reopenCampaign` (lines 418–425)
- `updateCampaignPricing` (lines 340–347)

All four contain this exact workaround:

```ts
const ownerId =
  typeof campaign.ownerId === "object" && campaign.ownerId._id
    ? campaign.ownerId._id.toString()
    : campaign.ownerId.toString();
```

This workaround exists because `getCampaignById` always populates `ownerId` but other finders don't, leaving callers to detect the shape. The fix: one internal helper:

```ts
async function assertCampaignOwner(campaignId: string, userId: string): Promise<CampaignDocument>
```

That helper does the find, checks ownership, and returns the document. All operations use it. Zero duplication, and the populated-ownerId workaround lives in exactly one place.

**Priority:** Low-medium. Each new campaign operation copy-pastes the bug surface.

---

## 3. `updateCampaignPricing` Is in the Wrong Service

**File:** `backend/src/services/campaign.service.ts` lines 331–409

The campaign service mutates layout placements by bypassing its own import:

```ts
const ShirtLayout = mongoose.model("ShirtLayout"); // dynamic model lookup — not the imported model
const layout = await ShirtLayout.findOne({ campaignId });
layout.placements.forEach((placement: any, index: number) => { ... });
await layout.save();
```

This dynamic `mongoose.model()` call is a circular-dependency workaround that leaked into production. Pricing recalculation belongs in `shirtLayout.service.ts`. Same issue in `deleteCampaign` (lines 457–463), which uses dynamic lookups for cascade deletes that are also not wrapped in a transaction — if `ShirtLayout.deleteMany` succeeds but the process crashes before `SponsorEntry.deleteMany`, orphaned sponsor entries remain.

**Priority:** Medium. The cascade delete gap is a data integrity risk.

---

## 4. `SponsorEntry` Has Mutually Exclusive Nullable Fields

**File:** `backend/src/models/SponsorEntry.ts`

Three fields exist on every sponsor record:

| Field | `text` sponsor | `logo` sponsor |
|---|---|---|
| `displaySize` | set | set |
| `calculatedFontSize` | set | always `undefined` |
| `calculatedLogoWidth` | always `undefined` | set |

`displaySize` is also fully derivable from the font/logo size and tier config — it is redundant stored data. For every record, one of the two size fields is always null. A cleaner model:

```ts
// Either of:
displayMetrics: { type: "text"; fontSize: number } | { type: "logo"; logoWidth: number } | null

// Or at minimum: drop displaySize (re-derive it), and rename the remaining field.
```

**Priority:** Low. No functional bug, but every query reading display data pulls three fields where one is always null and one is computable.

---

## 5. `ShirtLayout` Has No Timestamps

**File:** `backend/src/models/ShirtLayout.ts`

Every other model uses `{ timestamps: true }`. `ShirtLayout` does not. You cannot tell when a layout was created or last modified, or correlate layout changes with the payment timeline. This is a one-line fix:

```ts
const shirtLayoutSchema = new mongoose.Schema({ ... }, { timestamps: true });
```

**Priority:** Low. Add before you need to debug a "when did this layout change?" question in production.

---

## 6. `auditLogger` Is Console-Only for a Financial App

**File:** `backend/src/utils/auditLogger.ts` lines 79–98

The audit logger writes everything to `console.log/warn/error` with a stub comment:

```ts
// In production, you would also:
// 1. Write to a database table for audit trail
// await AuditLog.create(logEntry);
```

For an app handling money, refunds, and failed transactions this is not deferred work — it is a gap. `FailedRefund` was added correctly as a persistent record. `PAYMENT_SUCCESS`, `PAYMENT_FULFILLMENT_FAILURE`, `SPONSORSHIP_LOGO_APPROVE`, and all other audit events produce only ephemeral logs.

A `AuditLog` Mongoose model backed by the same schema as `AuditLogEntry` gives a queryable financial audit trail. The `logAudit` function signature does not need to change — just add a non-blocking `AuditLog.create(logEntry).catch(...)` call inside it.

**Priority:** High. This is the most significant remaining gap after the `CODE_REVIEW.md` items.

---

## 7. Backward-Compat `token` Field Has Overstayed

**Files:** `backend/src/services/user.service.ts` lines 48, 79, 248

Every auth response returns both `token: accessToken` and `accessToken`:

```ts
return {
  ...
  token: accessToken,   // "keep for backward compatibility"
  accessToken,
  refreshToken,
};
```

If you own both the frontend and backend, there is nothing to be backward-compatible with. Every consumer is in the same repo. Remove `token` from all auth responses and update frontend consumers to use `accessToken`.

**Priority:** Low. Cosmetic, but it trains new contributors to use the wrong field name.

---

## 8. Two Rich Text Editor Libraries Coexist

**Files:** `frontend/src/components/QuillEditor.tsx`, `frontend/src/components/RichTextEditor.tsx`, `frontend/src/components/ToolbarPlugin.tsx`

The frontend ships both `quill ^2.0.3` and `lexical ^0.39.0` plus 7 `@lexical/*` packages. This is ~200KB+ of JS overhead from an editor migration that was never completed. There is also `WordCloudRenderer.legacy.tsx` alongside `WordCloudRenderer.tsx`.

Check which editor is actually used in pages and routes:
```
grep -r "QuillEditor\|RichTextEditor" frontend/src/pages frontend/src/routes
```

Remove whichever is unused, its dependency, and the `.legacy.tsx` file.

**Priority:** Low-medium. Meaningfully affects bundle size and dependency surface.

---

## 9. `validateCampaignIsOpen` Returns `true` But Nobody Checks It

**File:** `backend/src/services/campaign.service.ts` lines 319–329

```ts
export const validateCampaignIsOpen = (campaign: any) => {
  if (campaign.isClosed) throw new Error("Campaign is closed");
  if (campaign.endDate && new Date() > new Date(campaign.endDate)) throw new Error("Campaign has ended");
  return true; // ← no caller checks this
};
```

All callers discard the return value — they call it only for the throw side effect. The return type should be `void`. Returning `true` implies callers might inspect the result; they never do.

**Priority:** Low. Misleading signal-to-noise.

---

## 10. `FailedRefund.campaignId` Is a String, Not an ObjectId

**File:** `backend/src/models/FailedRefund.ts` line 6

```ts
campaignId: { type: String, required: true }, // ← inconsistent with all other models
```

Every other model with a `campaignId` uses `{ type: mongoose.Schema.Types.ObjectId, ref: "Campaign" }`. This means `$lookup` joins from `FailedRefund` to `Campaign` don't work cleanly and Mongoose won't populate it. The value comes from `paymentIntent.metadata.campaignId` which is already a string — but it should be cast to `ObjectId` on write.

**Priority:** Low. Will cause pain if you build admin tooling that joins failed refunds to campaigns.

---

## 11. `Object.assign` on a Mongoose Document

**File:** `backend/src/services/campaign.service.ts` line 172

```ts
Object.assign(campaign, updates); // updates is typed `any`
await campaign.save();
```

`Object.assign` bypasses Mongoose's path setter machinery — change tracking, setters, and virtuals may not behave as expected with bulk assignment. Use `campaign.set(updates)` instead, which routes through Mongoose's path tracking.

**Priority:** Low. No known bug currently, but a footgun for future updates.

---

## 12. `handlePaymentSuccess` Has 3 Levels of Nested Try/Catch

**File:** `backend/src/services/payment.service.ts` lines 149–298

The function is 150 lines with nested try/catch three levels deep: outer fulfillment, `session.withTransaction`, inner refund attempt, inner-inner `FailedRefund.create`. This is clear evidence of iterative hardening — each production fix added a layer.

The logic should be extracted into named functions:

- `attemptFulfillment(paymentIntent)` — creates the sponsorship and transaction
- `attemptRefund(paymentIntent, fulfillmentError)` — issues the Stripe refund
- `persistFailedRefund(paymentIntentId, fulfillmentError, refundError?)` — writes the DB record

Same error handling, but each piece is independently testable. As-is, the function requires mocking 5 dependencies simultaneously to unit test.

**Priority:** Low-medium. The current structure is correct but will be hard to extend.

---

## Summary

| # | Item | Priority | Effort |
|---|---|---|---|
| 6 | Persist audit logs to database | High | Medium |
| 1 | `PricingConfig` discriminated union | Medium | Large |
| 2 | `assertCampaignOwner` helper | Medium | Small |
| 3 | Move layout mutations out of campaign service + atomic delete | Medium | Medium |
| 8 | Remove unused rich text editor + legacy files | Medium | Small |
| 12 | Refactor `handlePaymentSuccess` into named functions | Medium | Small |
| 4 | Consolidate `SponsorEntry` display fields | Low | Medium |
| 5 | Add `timestamps` to `ShirtLayout` | Low | Trivial |
| 7 | Remove backward-compat `token` field | Low | Small |
| 9 | Change `validateCampaignIsOpen` return type to `void` | Low | Trivial |
| 10 | Fix `FailedRefund.campaignId` to `ObjectId` | Low | Small |
| 11 | Replace `Object.assign` with `campaign.set()` | Low | Trivial |
