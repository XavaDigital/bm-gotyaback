# Production Launch Action Plan

**Target Launch Date**: [Set your date]  
**Current Status**: 85% Ready  
**Time to Production Ready**: 8-10 hours

---

## 🚨 Critical Path (Must Complete Before Launch)

### Task 1: Fix Frontend Security Vulnerabilities
**Priority**: 🔴 CRITICAL  
**Time**: 1-2 hours  
**Owner**: [Assign]

**Steps**:
```bash
cd frontend
npm audit
npm audit fix
# Test the application after fixes
npm run build
npm run dev
# Verify all features still work
```

**Verification**:
- [ ] Run `npm audit` and confirm 0 vulnerabilities
- [ ] Test campaign creation
- [ ] Test sponsorship submission
- [ ] Test file uploads
- [ ] Test payment flow

---

### Task 2: Set Up Basic Monitoring
**Priority**: 🔴 CRITICAL  
**Time**: 2 hours  
**Owner**: [Assign]

**Minimum Viable Monitoring**:

1. **UptimeRobot** (30 minutes)
   - [ ] Create account at https://uptimerobot.com
   - [ ] Add monitor for `https://your-backend-url/health`
   - [ ] Set check interval to 5 minutes
   - [ ] Configure email alerts
   - [ ] Add SMS alerts (optional but recommended)

2. **Sentry Error Tracking** (1.5 hours)
   
   **Backend**:
   ```bash
   cd backend
   npm install @sentry/node @sentry/profiling-node
   ```
   
   Add to `backend/src/server.ts` (before other imports):
   ```typescript
   import * as Sentry from "@sentry/node";
   
   if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
     Sentry.init({
       dsn: process.env.SENTRY_DSN,
       environment: process.env.NODE_ENV,
       tracesSampleRate: 0.1,
     });
   }
   ```
   
   **Frontend**:
   ```bash
   cd frontend
   npm install @sentry/react
   ```
   
   Add to `frontend/src/routes/__root.tsx`:
   ```typescript
   import * as Sentry from "@sentry/react";
   
   if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
     Sentry.init({
       dsn: import.meta.env.VITE_SENTRY_DSN,
       environment: import.meta.env.MODE,
       tracesSampleRate: 0.1,
     });
   }
   ```

**Verification**:
- [ ] UptimeRobot shows "Up" status
- [ ] Receive test alert from UptimeRobot
- [ ] Sentry dashboard shows project
- [ ] Test error is captured in Sentry

---

### Task 3: Configure Production Secrets
**Priority**: 🔴 CRITICAL  
**Time**: 2-3 hours  
**Owner**: [Assign]

**Checklist**:

1. **Generate JWT Secret** (5 minutes)
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```
   - [ ] Copy generated secret
   - [ ] Store securely (password manager)

2. **MongoDB Atlas** (30 minutes)
   - [ ] Create production cluster at https://cloud.mongodb.com
   - [ ] Choose appropriate tier (M10+ for production)
   - [ ] Enable authentication
   - [ ] Create database user with minimal permissions
   - [ ] Whitelist App Runner IP ranges
   - [ ] Get connection string
   - [ ] Test connection

3. **AWS S3** (30 minutes)
   - [ ] Create S3 bucket (e.g., `gotyaback-prod-uploads`)
   - [ ] Enable versioning
   - [ ] Configure CORS for your frontend domain
   - [ ] Create IAM user with S3-only permissions
   - [ ] Generate access keys
   - [ ] Test upload/download

4. **Stripe** (15 minutes)
   - [ ] Switch to production mode in Stripe dashboard
   - [ ] Get production API keys
   - [ ] Configure webhook endpoint
   - [ ] Get webhook secret
   - [ ] Test with small transaction

5. **Mailgun** (30 minutes)
   - [ ] Add and verify your domain
   - [ ] Get API key
   - [ ] Configure DNS records (SPF, DKIM)
   - [ ] Test email sending

6. **Update Environment Variables** (15 minutes)
   - [ ] Update backend `.env.production`
   - [ ] Update frontend `.env.production`
   - [ ] Configure in AWS App Runner
   - [ ] Verify all variables are set

**Environment Variables Template**:
```bash
# Backend
NODE_ENV=production
PORT=8080
MONGO_URI=mongodb+srv://[user]:[pass]@[cluster].mongodb.net/gotyaback?retryWrites=true&w=majority
JWT_SECRET=[generated-secret]
FRONTEND_URL=https://your-frontend-url.com
AWS_S3_REGION=us-east-1
AWS_S3_BUCKET=gotyaback-prod-uploads
AWS_S3_ACCESS_KEY=[your-key]
AWS_S3_SECRET_ACCESS_KEY=[your-secret]
AWS_S3_SERVER_URL=https://gotyaback-prod-uploads.s3.amazonaws.com/
STRIPE_SECRET_KEY=sk_live_[your-key]
STRIPE_PUBLIC_KEY=pk_live_[your-key]
STRIPE_WEBHOOK_SECRET=whsec_[your-secret]
MAILGUN_API_KEY=[your-key]
MAILGUN_DOMAIN=mg.yourdomain.com
EMAIL_FROM=noreply@yourdomain.com
SENTRY_DSN=[your-sentry-dsn]

# Frontend
VITE_API_URL=https://your-backend-url.com/api
VITE_STRIPE_PUBLIC_KEY=pk_live_[your-key]
VITE_SENTRY_DSN=[your-frontend-sentry-dsn]
```

---

### Task 4: Deploy to Production
**Priority**: 🔴 CRITICAL  
**Time**: 2 hours  
**Owner**: [Assign]

**Steps**:

1. **Build and Test Locally** (30 minutes)
   ```bash
   # Backend
   cd backend
   npm run build
   npm start
   
   # Frontend
   cd frontend
   npm run build
   npm run start
   ```
   - [ ] Verify builds complete without errors
   - [ ] Test locally with production build

2. **Deploy Backend** (45 minutes)
   ```bash
   cd d:\Coding\bm-gotyaback
   .\scripts\deploy-to-ecr.ps1 -DeployBackend
   ```
   - [ ] Build Docker image
   - [ ] Push to ECR
   - [ ] Create/Update App Runner service
   - [ ] Configure environment variables
   - [ ] Wait for deployment to complete
   - [ ] Note the App Runner URL

3. **Deploy Frontend** (45 minutes)
   - [ ] Update `VITE_API_URL` with backend URL
   - [ ] Build frontend
   ```bash
   .\scripts\deploy-to-ecr.ps1 -DeployFrontend
   ```
   - [ ] Push to ECR
   - [ ] Create/Update App Runner service
   - [ ] Configure environment variables
   - [ ] Wait for deployment to complete

---

### Task 5: Verify Health Endpoints
**Priority**: 🔴 CRITICAL  
**Time**: 30 minutes  
**Owner**: [Assign]

**Tests**:
```bash
# Replace with your actual backend URL
BACKEND_URL=https://your-backend-url.awsapprunner.com

# Test health endpoint
curl $BACKEND_URL/health

# Test liveness probe
curl $BACKEND_URL/health/live

# Test readiness probe
curl $BACKEND_URL/health/ready
```

**Expected Responses**:
- [ ] `/health` returns 200 with database, stripe, and s3 status
- [ ] `/health/live` returns 200 with alive status
- [ ] `/health/ready` returns 200 when database is connected

---

### Task 6: Enable HTTPS
**Priority**: 🔴 CRITICAL  
**Time**: 1 hour  
**Owner**: [Assign]

**Steps**:
1. **AWS App Runner** (automatic)
   - [ ] Verify App Runner has HTTPS enabled (default)
   - [ ] Get the HTTPS URL
   - [ ] Test HTTPS access

2. **Update CORS** (already done)
   - [x] Backend CORS configured for production URL
   - [x] Environment-aware CORS settings

3. **Custom Domain** (optional, 30 minutes)
   - [ ] Add custom domain in App Runner
   - [ ] Configure DNS CNAME record
   - [ ] Wait for SSL certificate provisioning
   - [ ] Verify HTTPS on custom domain

---

## 🧪 Smoke Tests (Before Going Live)

**Priority**: 🔴 CRITICAL  
**Time**: 1 hour  
**Owner**: [Assign]

### Test Checklist:

1. **User Authentication** (10 minutes)
   - [ ] Register new user
   - [ ] Login with credentials
   - [ ] Logout
   - [ ] Password reset flow

2. **Campaign Management** (15 minutes)
   - [ ] Create new campaign
   - [ ] Upload header image
   - [ ] Edit campaign details
   - [ ] View campaign public page

3. **Sponsorship** (15 minutes)
   - [ ] Submit sponsorship (text)
   - [ ] Submit sponsorship (logo)
   - [ ] Verify email notification sent
   - [ ] Approve logo (as campaign owner)

4. **Payment Processing** (15 minutes)
   - [ ] Create sponsorship with Stripe payment
   - [ ] Use Stripe test card: 4242 4242 4242 4242
   - [ ] Verify payment success
   - [ ] Check Stripe dashboard for transaction
   - [ ] Verify webhook received

5. **File Uploads** (5 minutes)
   - [ ] Upload campaign header image
   - [ ] Upload sponsor logo
   - [ ] Verify images appear correctly
   - [ ] Check S3 bucket for files

---

## 📊 Post-Launch Monitoring (First 24 Hours)

**Priority**: 🟡 HIGH  
**Owner**: [Assign]

### Hour 1-4: Active Monitoring
- [ ] Check UptimeRobot every 30 minutes
- [ ] Monitor Sentry for errors
- [ ] Check server logs in AWS CloudWatch
- [ ] Verify health endpoint status

### Hour 4-24: Periodic Checks
- [ ] Check every 2-4 hours
- [ ] Review error rates in Sentry
- [ ] Monitor response times
- [ ] Check database performance

### Metrics to Watch:
- [ ] Error rate < 1%
- [ ] Response time < 500ms (p95)
- [ ] Uptime > 99.9%
- [ ] No critical errors in Sentry

---

## 🚨 Rollback Plan

**If critical issues occur**:

1. **Immediate Actions**:
   - [ ] Notify team
   - [ ] Document the issue
   - [ ] Check Sentry for error details

2. **Rollback Steps**:
   ```bash
   # Rollback to previous version in App Runner
   # AWS Console → App Runner → Deployments → Previous version → Deploy
   ```

3. **Communication**:
   - [ ] Update status page (if you have one)
   - [ ] Notify users (if applicable)
   - [ ] Post-mortem after resolution

---

## ✅ Launch Day Timeline

**Recommended Schedule**:

### Morning (9 AM - 12 PM)
- 9:00 - 10:00: Fix frontend vulnerabilities
- 10:00 - 11:00: Set up monitoring
- 11:00 - 12:00: Configure production secrets

### Afternoon (1 PM - 5 PM)
- 1:00 - 3:00: Deploy to production
- 3:00 - 3:30: Verify health endpoints
- 3:30 - 4:00: Enable HTTPS
- 4:00 - 5:00: Run smoke tests

### Evening (5 PM - 6 PM)
- 5:00 - 5:30: Final verification
- 5:30 - 6:00: Go live announcement
- 6:00+: Active monitoring

---

## 📞 Emergency Contacts

**During Launch**:
- Technical Lead: [Name, Phone, Email]
- DevOps: [Name, Phone, Email]
- Product Owner: [Name, Phone, Email]

**External Support**:
- AWS Support: [Your support plan]
- MongoDB Atlas: support@mongodb.com
- Stripe: https://support.stripe.com
- Mailgun: support@mailgun.com

---

**Last Updated**: February 9, 2026  
**Status**: Ready to Execute

