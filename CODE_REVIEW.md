# Code Review — BM GotYaBack

> Thorough review covering security vulnerabilities, authorization gaps, race conditions, non-atomic operations, performance issues, and code correctness across backend and frontend.
>
> Each item is a discrete task. Check it off once addressed.

---

## 1. Critical Security Vulnerabilities

- [ ] **`.env` file must be excluded from version control**
  Verify `.env` is in `.gitignore`. If it was ever committed, rotate all credentials (MongoDB URI, JWT_SECRET, SMTP password, AWS keys, Stripe keys) and purge it from git history (`git filter-branch` or `git-filter-repo`).
  _File: `backend/.env`, `backend/.gitignore`_

- [ ] **Weak / placeholder JWT secret**
  `JWT_SECRET` is a short, guessable string. Replace with a randomly generated secret of at least 64 hex characters (`openssl rand -hex 64`). Weak secrets allow any party who knows the algorithm to forge valid tokens.
  _File: `backend/.env` line 3_

- [ ] **Hardcoded fallback `SESSION_SECRET` in `session.ts`**
  `session.ts:21` falls back to the literal string `'change-this-to-a-secure-random-string-min-32-chars-long-please'` when `SESSION_SECRET` is unset. If the env var is missing in production, sessions are signed with this public value.
  Replace the fallback with a startup crash: throw an error if `SESSION_SECRET` is not set.
  _File: `frontend/src/utils/session.ts` line 21_

- [ ] **`express-mongo-sanitize` was removed — NoSQL injection risk**
  `app.ts:45` shows `express-mongo-sanitize` was commented out due to "compatibility issues." Without it, user-supplied objects containing `$where`, `$gt`, etc. can be passed directly to Mongoose queries.
  Fix the compatibility issue or find an alternative (e.g., `mongo-sanitize` applied manually in validation middleware) and re-enable sanitization.
  _File: `backend/src/app.ts` line 5_

- [ ] **Auth token and full user object stored in `localStorage`**
  `auth.service.ts:21,37` stores the JWT and the entire user object in `localStorage`. Any XSS payload on the domain can read both. Store only what is strictly needed, prefer `sessionStorage` for the short-lived token, and never store the full user object — derive it from the token or a `/me` endpoint call.
  _File: `frontend/src/services/auth.service.ts` lines 20–21, 36–37_

---

## 2. Authorization & Access Control Gaps

- [x] **`uploadLogo` endpoint has no authentication and no ownership check**
  Added `protect` middleware to route and campaign ownership assertion in controller.
  _File: `backend/src/routes/sponsorship.routes.ts` lines 62–67, `backend/src/controllers/sponsorship.controller.ts` lines 224–247_

- [x] **`markAsPaid` and `updatePaymentStatus` do not verify campaign ownership**
  Already implemented — service fetches sponsorship → campaign and compares `campaign.ownerId` to `req.user._id`.
  _File: `backend/src/services/sponsorship.service.ts`_

- [x] **`approveLogo` and `getPendingLogos` do not verify campaign ownership**
  Already implemented — service verifies `campaign.ownerId` for both `approveLogoSponsorship` and `getPendingLogoApprovals`.
  _File: `backend/src/services/sponsorship.service.ts`_

- [x] **`getSponsors` (admin list) does not verify campaign ownership at service level**
  Added `userId` parameter to `getSponsorsByCampaign` with ownership check; controller now passes `userId` to the service.
  _File: `backend/src/controllers/sponsorship.controller.ts`, `backend/src/services/sponsorship.service.ts`_

- [x] **`JSON.parse` on untrusted `req.body.data` with no error handling**
  Wrapped all `JSON.parse` calls in try/catch blocks returning `400 Invalid JSON in request body` in both `sponsorship.controller.ts` and `campaign.controller.ts` (`createCampaign` and `updateCampaign`).
  _File: `backend/src/controllers/sponsorship.controller.ts`, `backend/src/controllers/campaign.controller.ts`_

---

## 3. Race Conditions & Non-Atomic Operations

- [x] **Position reservation is not atomic across the payment flow**
  `createPaymentIntent` (payment.service.ts:51–73) does an optimistic check that the position is free, then creates a Stripe PaymentIntent. The actual atomic `reservePosition` call happens later in `createSponsorship` (sponsorship.service.ts:52–59) when the webhook fires. Between those two moments, another user's webhook can also call `createSponsorship` for the same position. The first to reach `reservePosition` wins; the second gets a refund — but both were charged.
  Correct approach: reserve (lock) the position _before_ creating the PaymentIntent. Release the lock if Stripe intent creation fails or after a timeout without a confirmed payment.
  _File: `backend/src/services/payment.service.ts` lines 50–73, `backend/src/services/sponsorship.service.ts` lines 52–59_

- [x] **Slug generation has a TOCTOU race condition**
  `generateUniqueSlug` (campaign.service.ts:15–25) loops `findOne({ slug })` until it finds a free slug. Two concurrent campaign creations with the same title both read "no conflict" and then both insert, violating the uniqueness invariant.
  Use a unique index on `Campaign.slug` and handle the duplicate-key error with a retry, or use `findOneAndUpdate` with `upsert` semantics.
  _File: `backend/src/services/campaign.service.ts` lines 14–25_

- [x] **`createSponsorship` → position reserved, then `SponsorEntry.create` can fail leaving position locked**
  `sponsorship.service.ts:52–59` atomically reserves the position, then `SponsorEntry.create` runs (lines 108–127). If the DB write fails, the catch block calls `releasePosition` (lines 131–143). But if `releasePosition` itself fails, the error is re-thrown with no log of which campaign/position is now permanently locked.
  Add explicit logging of the `campaignId` + `positionId` in the inner catch so operators can manually release it.
  _File: `backend/src/services/sponsorship.service.ts` lines 130–143_

- [x] **`sponsorship.paymentStatus = "paid"` followed by `sponsorship.save()` is not atomic with `Transaction.create`**
  `payment.service.ts:163–174`: the status is updated, saved, and then a `Transaction` document is created separately. If the process crashes between the two writes, the sponsorship is marked paid but has no transaction record, or vice versa. Use a MongoDB session/transaction (`session.withTransaction`) to wrap both operations.
  _File: `backend/src/services/payment.service.ts` lines 163–174_

---

## 4. Payment & Financial Integrity

- [x] **Failed refunds are silently swallowed — no persistent failure record**
  `payment.service.ts:197–204`: when an automatic refund fails, the code logs `CRITICAL:` to `console.error` and moves on. In production this means a customer has been charged, received no position, and the failure is only visible if someone reads logs in time.
  Write a `FailedRefund` document (or equivalent) to the database before throwing so there is a durable record for manual reconciliation.
  _File: `backend/src/services/payment.service.ts` lines 197–204_

- [x] **`handlePaymentFailure` is completely empty**
  `payment.service.ts:209–214` has a comment saying "could implement cleanup logic here" but does nothing. For `payment_intent.payment_failed` events, any partially reserved state or pending sponsorship record is never cleaned up.
  At a minimum, release any reserved position whose `positionId` is stored in the PaymentIntent metadata.
  _File: `backend/src/services/payment.service.ts` lines 209–214_

- [x] **`paymentMethod` stored as `payment_method_types?.[0]`**
  `payment.service.ts:157`: `payment_method_types[0]` for Afterpay is `"afterpay_clearpay"`, not `"afterpay"`. The `SponsorEntry` schema only accepts `["card", "cash", "afterpay"]`, so this value fails schema validation silently (Mongoose ignores unknown enum values by default or rejects the doc).
  Map the Stripe value explicitly: `const methodMap = { card: "card", afterpay_clearpay: "afterpay" }`.
  _File: `backend/src/services/payment.service.ts` line 157, `backend/src/models/SponsorEntry.ts` line 17_

- [x] **Duplicate `amount` validation is missing for cash sponsorships**
  For `pay-what-you-want` campaigns with cash payment, the amount sent by the client is stored directly without being cross-checked against any minimum or maximum. A sponsor can submit an amount of `0.01` (the validation floor) for a "large" tier display size.
  Enforce the tier minimum server-side during `createSponsorship`.
  _File: `backend/src/services/sponsorship.service.ts`_

---

## 5. Input Validation & Sanitization

- [x] **`apiClient.ts` has a hardcoded `localhost:5000` base URL**
  `frontend/src/services/apiClient.ts:4` sets `baseURL: 'http://localhost:5000/api'`. This will not work in production (or staging) unless overridden elsewhere. Use `import.meta.env.VITE_API_URL` and fail the build if the variable is absent.
  _File: `frontend/src/services/apiClient.ts` line 4_

- [x] **Campaign `description` is not HTML-sanitized before render**
  `validation.middleware.ts:111–113` trims the description but does not escape HTML. The QuillEditor produces HTML, which is stored as-is and rendered on the public campaign page. If the backend is ever populated via the API directly (bypassing the Quill UI), stored XSS is possible.
  Run stored HTML through a server-side sanitizer (e.g., `sanitize-html` or `DOMPurify` on the frontend before display).
  _File: `backend/src/middleware/validation.middleware.ts` lines 110–113_

- [x] **`QuillEditor` calls `dangerouslyPasteHTML` on stored content**
  `QuillEditor.tsx:77,124`: content loaded from the database is pasted directly via `quill.clipboard.dangerouslyPasteHTML(value)`. If the stored HTML contains a script tag (from a direct API write), it will be rendered in the editor context.
  Sanitize the incoming `value` before passing it to `dangerouslyPasteHTML`.
  _File: `frontend/src/components/QuillEditor.tsx` lines 77, 124_

- [x] **File upload relies solely on client-reported MIME type**
  `upload.service.ts:61–65` checks `mimeType` passed in from the request. The MIME type comes from the browser's `Content-Type` header, which is trivially spoofed. Use a library like `file-type` (checks magic bytes) to verify the actual content type regardless of what the client claims.
  _File: `backend/src/services/upload.service.ts` lines 61–65_

- [x] **`customSanitizer` in `validateCreateSponsorship` is a no-op**
  `validation.middleware.ts:141–147`: both branches of the `if` condition return `value` unchanged. The comment says "only normalize email in production" but neither branch normalizes. Remove the dead code or implement the intended normalization.
  _File: `backend/src/middleware/validation.middleware.ts` lines 141–147_

- [x] **`getSponsorsByCampaign` accepts unvalidated filter strings**
  `sponsorship.service.ts:157–159`: `paymentStatus` and `logoApprovalStatus` are copied directly from `filters` into the Mongoose query object. While Mongoose enum validation prevents invalid values from matching documents, an attacker can still probe valid enum values. Whitelist-validate filter inputs before building the query.
  _File: `backend/src/services/sponsorship.service.ts` lines 157–159_

- [x] **`positionId` in payment metadata could be manipulated**
  The `positionId` stored in Stripe PaymentIntent metadata comes from the client. When the webhook fires, this value is used directly to reserve the position. A crafted `positionId` that matches a position in a different campaign could cross-contaminate layouts if the layout lookup is not scoped by `campaignId`.
  Verify that `positionId` belongs to the correct campaign during `createSponsorship`.
  _File: `backend/src/services/payment.service.ts` lines 150–161, `backend/src/services/sponsorship.service.ts`_

---

## 6. Performance & Database Optimization

- [x] **N+1 query pattern in `getPublicProfile`**
  `user.service.ts:136–176`: for each active campaign, two separate database queries are fired — `SponsorEntry.countDocuments` and `ShirtLayout.findOne`. For a user with 20 campaigns this is 41 queries per page load.
  Replace with a single aggregation pipeline using `$lookup` with `$count` to fetch all data in one round-trip.
  _File: `backend/src/services/user.service.ts` lines 136–176_

- [x] **`getPositionDetails` loads the entire layout document to extract one position**
  `shirtLayout.service.ts:274+`: `ShirtLayout.findById(layoutId)` loads all placements (potentially hundreds) then uses `.find()` on the array in JavaScript. Use MongoDB's `$elemMatch` projection to return only the matching placement:
  ```js
  ShirtLayout.findOne({ _id: layoutId, "placements.positionId": positionId },
    { "placements.$": 1 })
  ```
  _File: `backend/src/services/shirtLayout.service.ts` lines 274–290_

- [x] **Missing compound indexes for common query patterns**
  The following query combinations appear in code but have no index:
  - `{ campaignId, sponsorType }` — used in rendering/filtering
  - `{ userId, isRevoked, expiresAt }` on `RefreshToken` — used during token cleanup
  Add these indexes to the respective model schemas.
  _File: `backend/src/models/SponsorEntry.ts`, `backend/src/models/RefreshToken.ts`_

- [x] **`dynamic import()` of `SponsorEntry` and `ShirtLayout` inside a hot loop**
  `user.service.ts:133–134`: `require()` calls inside `Promise.all` (a loop) re-evaluate the module require cache on each iteration in some bundler configurations. Move these imports to the top of the file.
  _File: `backend/src/services/user.service.ts` lines 133–134_

---

## 7. Configuration & Startup Issues

- [x] **Environment validation is commented out**
  `server.ts:24–26` imports `validateEnvironment` but the call is commented out with a note "for development." If a required env var is missing in production, the server starts silently and fails at the first request that uses that variable.
  Uncomment `validateEnvironment()` or implement a startup guard that crashes with a clear message if any required variable is absent.
  _File: `backend/src/server.ts` lines 24–26_

- [x] **No Sentry warning when running in production without `SENTRY_DSN`**
  `server.ts:10` only initializes Sentry when both `NODE_ENV === 'production'` and `SENTRY_DSN` is set. If production runs without the DSN, errors are silently swallowed. Log a clear warning at startup when `NODE_ENV === 'production'` and `SENTRY_DSN` is absent.
  _File: `backend/src/server.ts` lines 10–21_

- [x] **Database connection has no retry logic**
  `db.ts:9` calls `process.exit(1)` on connection failure. A transient network blip during deploy will kill the process with no chance to recover.
  Implement exponential back-off retry (e.g., 3 attempts, 1s/2s/4s delays) before giving up, and distinguish transient errors from permanent ones.
  _File: `backend/src/config/db.ts`_

- [x] **`trust proxy` is set to `1` globally without documentation**
  `app.ts:22` sets `app.set('trust proxy', 1)`. This is correct behind a single-hop proxy (AWS ALB, nginx) but wrong behind a multi-hop setup. Document the expected deployment topology and use a specific IP/CIDR range instead of `1` for stricter control.
  _File: `backend/src/app.ts` line 22_

- [x] **`imgSrc` in CSP allows all HTTPS origins**
  `app.ts:34`: `imgSrc: ["'self'", "data:", "https:"]` effectively whitelists every image from any HTTPS URL. Restrict to your known origins (S3 bucket URL, CDN host) to prevent CSP bypass via external image injection.
  _File: `backend/src/app.ts` line 34_

---

## 8. Code Correctness & Bug-Prone Blocks

- [ ] **Dead conditional in `createSponsorship` — `paymentStatus` always `"pending"`**
  `sponsorship.service.ts:118–119`:
  ```ts
  paymentStatus: sponsorData.paymentMethod === "cash" ? "pending" : "pending"
  ```
  Both branches return the same value. This is almost certainly a leftover from a refactor. Decide the intended logic (cash → `"pending"`, card → something else?) and fix it.
  _File: `backend/src/services/sponsorship.service.ts` lines 118–119_

- [ ] **Legacy `generateToken` function still in production code with 30-day expiry**
  `user.service.ts:186–189` is marked "legacy — kept for backward compatibility." It generates tokens with a `30d` expiry, much longer than the access tokens in `tokenService`. If it is actually called anywhere, it bypasses the short-lived token architecture. Trace all callers and remove it or redirect them to `tokenService.generateAccessToken`.
  _File: `backend/src/services/user.service.ts` lines 184–189_

- [ ] **Logout does not revoke the server-side refresh token**
  `auth.service.ts:47–55`: logout clears `localStorage` and redirects, but never calls the backend logout endpoint. If a refresh token exists in a cookie or elsewhere, it remains valid until expiry. Call `POST /api/auth/logout` before clearing local state.
  _File: `frontend/src/services/auth.service.ts` lines 47–55_

- [ ] **`isAuthenticated()` checks only for the existence of a stored object, not token validity**
  `auth.service.ts:79–81`: returns `true` if `localStorage` has a `user` key, regardless of whether the token is expired. This means a user whose JWT has expired is still considered "authenticated" by the client until they make an actual API call that returns 401.
  Decode the JWT (without verifying the signature, which is fine client-side for expiry) and check `exp` against `Date.now()`.
  _File: `frontend/src/services/auth.service.ts` lines 79–81_

- [ ] **`axios` `validateStatus` accepts all status codes including 5xx**
  `apiClient.ts:9–13` returns `true` for any status `200–599`. This disables Axios's built-in error throwing, and the response interceptor must manually check for `>=400`. If a developer adds a new API call without checking the status, 500 errors will appear as successful responses. Revert to the default (`status < 400`) and handle the one known exception (404 on layout) more narrowly.
  _File: `frontend/src/services/apiClient.ts` lines 9–13_

- [ ] **`validateStatus` swallows 401 — no automatic redirect to login**
  Because all 4xx/5xx are caught by the interceptor, there is no global 401 → redirect-to-login handler. Users whose tokens expire mid-session see broken UI instead of being redirected.
  Add a response interceptor case for `status === 401` that clears the stored user and redirects.
  _File: `frontend/src/services/apiClient.ts` lines 34–56_

- [ ] **`path.extname` and `path.basename` on user-supplied filenames without sanitization**
  `s3Upload.ts:33–35`: the file name used to build the S3 key is derived from `originalName` (user input). A name like `../../../etc/passwd.png` could produce an unexpected S3 key path. Sanitize the base name by stripping non-alphanumeric characters before constructing the key.
  _File: `backend/src/utils/s3Upload.ts` lines 33–35_

---

## 9. Observability & Error Tracking

- [ ] **Payment fulfillment failures and refund failures only log to `console.error`**
  `payment.service.ts:176, 200–203`: errors during `handlePaymentSuccess` and failed automatic refunds are only written to `console.error`. In a cloud environment, console logs are ephemeral. Persist these failures to a database collection (e.g., `FailedOperation`) so they are queryable and alertable.
  _File: `backend/src/services/payment.service.ts` lines 175–205_

- [ ] **No payment audit log for successful charges**
  The `Transaction` document is created on success (payment.service.ts:168–174), but there is no audit event logged for payment success, failure, or refund. Extend the existing `auditLogger` (used in auth flows) to cover all financial operations.
  _File: `backend/src/services/payment.service.ts` lines 163–174_

- [ ] **Position release failure is not logged with identifying context**
  `sponsorship.service.ts:131–143`: if `SponsorEntry.create` fails and the subsequent `releasePosition` also fails, the error is re-thrown but the `campaignId` and `positionId` are not included in the log output. An operator cannot identify which position is stuck without cross-referencing timestamps.
  Log `{ campaignId, positionId }` alongside the error before rethrowing.
  _File: `backend/src/services/sponsorship.service.ts` lines 130–143_

---

## 10. Minor / Low-Priority Improvements

- [ ] **`styleSrc: ["'unsafe-inline'"]` in CSP**
  `app.ts:32` allows inline styles globally. This weakens the CSP against style-based injection attacks. Prefer a nonce-based approach or move styles to external sheets.
  _File: `backend/src/app.ts` line 32_

- [ ] **Rate limiter on `/refresh` token endpoint is too lenient**
  `auth.routes.ts` applies only the general `apiLimiter` (100 req/15 min) to the refresh token endpoint. A stolen refresh token could be used to generate many access tokens before being revoked. Create a dedicated `refreshLimiter` (e.g., 10 req/15 min per IP).
  _File: `backend/src/routes/auth.routes.ts`, `backend/src/middleware/rateLimiter.middleware.ts`_

- [ ] **`STRIPE_WEBHOOK_SECRET` is cast as `string` without a null check**
  `payment.service.ts:108`: `process.env.STRIPE_WEBHOOK_SECRET as string` silently passes `undefined` to `stripe.webhooks.constructEvent`. If the variable is missing, every webhook will throw with a confusing Stripe error instead of a clear startup/config failure.
  Add `if (!webhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET is not configured")`.
  _File: `backend/src/services/payment.service.ts` line 108_

- [ ] **`payment_method_types` hardcoded as `["card", "afterpay_clearpay"]`**
  `payment.service.ts:94`: Afterpay is hard-coded for all campaigns regardless of region or campaign settings. Afterpay is only available for NZD/AUD/USD and not all Stripe accounts. Derive the available payment methods from campaign currency and server-side Stripe account capabilities.
  _File: `backend/src/services/payment.service.ts` line 94_

- [ ] **TypeScript `strict` mode should be confirmed enabled**
  Verify `backend/tsconfig.json` has `"strict": true`. Strict mode catches many null-safety issues at compile time (e.g., `process.env.X as string` bypasses would surface more naturally).
  _File: `backend/tsconfig.json`_
