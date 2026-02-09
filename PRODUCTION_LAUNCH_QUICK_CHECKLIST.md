# Production Launch Quick Checklist
**Date**: February 9, 2026  
**Estimated Time**: 6-8 hours  
**Status**: Ready to Execute

---

## 🔴 CRITICAL TASKS (Must Complete Before Launch)

### Task 1: Fix Frontend Security Vulnerabilities ⏱️ 1-2 hours
**Priority**: CRITICAL

```bash
# Navigate to frontend
cd frontend

# Check current vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# If needed (may have breaking changes):
# npm audit fix --force

# Test the application
npm run build
npm run dev

# Verify all features work:
# - Campaign creation
# - Sponsorship submission
# - File uploads
# - Payment flow
```

**Verification:**
- [ ] Run `npm audit` and confirm 0 high/critical vulnerabilities
- [ ] Application builds without errors
- [ ] All features tested and working

---

### Task 2: Configure Production Secrets ⏱️ 2-3 hours
**Priority**: CRITICAL

#### 2.1 Generate JWT Secret (5 minutes)
```bash
# Generate a strong 64-character secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Copy the output and save it securely
```
- [ ] JWT_SECRET generated and saved

#### 2.2 MongoDB Atlas Production Setup (30 minutes)
1. Go to https://cloud.mongodb.com
2. Create new cluster (M10+ recommended for production)
3. Create database user:
   - Username: `gotyaback_prod`
   - Password: Generate strong password
   - Permissions: Read/Write to specific database
4. Network Access:
   - Add IP: `0.0.0.0/0` (for AWS App Runner)
   - Or specific AWS region IP ranges
5. Get connection string:
   ```
   mongodb+srv://gotyaback_prod:<password>@cluster.mongodb.net/gotyaback?retryWrites=true&w=majority
   ```

- [ ] MongoDB Atlas cluster created
- [ ] Database user created
- [ ] Connection string obtained
- [ ] Connection tested

#### 2.3 AWS S3 Production Bucket (30 minutes)
1. Create S3 bucket: `gotyaback-prod-uploads`
2. Enable versioning
3. Configure CORS:
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
       "AllowedOrigins": ["https://your-frontend-domain.com"],
       "ExposeHeaders": ["ETag"]
     }
   ]
   ```
4. Create IAM user: `gotyaback-s3-user`
5. Attach policy: `AmazonS3FullAccess` (or custom policy)
6. Generate access keys

- [ ] S3 bucket created
- [ ] CORS configured
- [ ] IAM user created
- [ ] Access keys generated

#### 2.4 Mailgun Production Setup (30 minutes)
1. Go to https://www.mailgun.com
2. Add domain: `mg.yourdomain.com`
3. Configure DNS records (provided by Mailgun):
   - TXT record for SPF
   - TXT record for DKIM
   - CNAME records
4. Wait for verification (can take 24-48 hours)
5. Get API key from dashboard

- [ ] Domain added to Mailgun
- [ ] DNS records configured
- [ ] Domain verified
- [ ] API key obtained

#### 2.5 Update Environment Variables (15 minutes)

**Backend `.env.production`:**
```bash
NODE_ENV=production
PORT=8080
MONGO_URI=mongodb+srv://gotyaback_prod:<password>@cluster.mongodb.net/gotyaback?retryWrites=true&w=majority
JWT_SECRET=<your-64-char-secret>
FRONTEND_URL=https://your-frontend-url.com

# AWS S3
AWS_S3_REGION=us-east-1
AWS_S3_BUCKET=gotyaback-prod-uploads
AWS_S3_ACCESS_KEY=<your-access-key>
AWS_S3_SECRET_ACCESS_KEY=<your-secret-key>
AWS_S3_SERVER_URL=https://gotyaback-prod-uploads.s3.amazonaws.com/

# Stripe (keep test keys until ready for real payments)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Mailgun
MAILGUN_API_KEY=<your-api-key>
MAILGUN_DOMAIN=mg.yourdomain.com
EMAIL_FROM=noreply@yourdomain.com

# Monitoring (optional for now)
SENTRY_DSN=<your-sentry-dsn>
```

**Frontend `.env.production`:**
```bash
VITE_API_URL=https://your-backend-url.com/api
VITE_STRIPE_PUBLIC_KEY=pk_test_...
VITE_SENTRY_DSN=<your-frontend-sentry-dsn>
```

- [ ] Backend environment variables configured
- [ ] Frontend environment variables configured
- [ ] All secrets stored securely (password manager)

---

### Task 3: Set Up Basic Monitoring ⏱️ 2-3 hours
**Priority**: CRITICAL

#### 3.1 UptimeRobot (30 minutes)
1. Go to https://uptimerobot.com
2. Create free account
3. Add monitor:
   - Type: HTTP(s)
   - URL: `https://your-backend-url/health`
   - Interval: 5 minutes
4. Configure alerts:
   - Email: your-email@domain.com
   - SMS: your-phone-number (optional)

- [ ] UptimeRobot account created
- [ ] Health endpoint monitor added
- [ ] Alerts configured
- [ ] Test alert received

#### 3.2 Sentry Error Tracking (Optional - 2 hours)
**Backend:**
```bash
cd backend
npm install @sentry/node @sentry/profiling-node
```

Add to `backend/src/server.ts`:
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

**Frontend:**
```bash
cd frontend
npm install @sentry/react
```

- [ ] Sentry account created (optional)
- [ ] Backend Sentry configured (optional)
- [ ] Frontend Sentry configured (optional)

---

### Task 4: Deploy to Production ⏱️ 2 hours
**Priority**: CRITICAL

#### 4.1 Build and Test Locally (30 minutes)
```bash
# Backend
cd backend
npm run build
npm start

# Frontend
cd frontend
npm run build
```

- [ ] Backend builds successfully
- [ ] Frontend builds successfully
- [ ] No build errors

#### 4.2 Deploy Backend (45 minutes)
```bash
cd d:\Coding\bm-gotyaback
.\scripts\deploy-to-ecr.ps1 -DeployBackend
```

- [ ] Docker image built
- [ ] Image pushed to ECR
- [ ] App Runner service created/updated
- [ ] Environment variables configured in App Runner
- [ ] Deployment successful
- [ ] Backend URL noted

#### 4.3 Deploy Frontend (45 minutes)
```bash
# Update VITE_API_URL with backend URL
.\scripts\deploy-to-ecr.ps1 -DeployFrontend
```

- [ ] Frontend built with correct API URL
- [ ] Image pushed to ECR
- [ ] App Runner service created/updated
- [ ] Deployment successful
- [ ] Frontend URL noted

---

### Task 5: Verify and Test ⏱️ 1 hour
**Priority**: CRITICAL

#### 5.1 Health Endpoints (10 minutes)
```bash
# Replace with your actual backend URL
curl https://your-backend-url/health
curl https://your-backend-url/health/live
curl https://your-backend-url/health/ready
```

- [ ] `/health` returns 200 with all services healthy
- [ ] `/health/live` returns 200
- [ ] `/health/ready` returns 200

#### 5.2 Smoke Tests (50 minutes)

**User Authentication (10 minutes)**
- [ ] Register new user
- [ ] Login with credentials
- [ ] Logout
- [ ] Password reset flow

**Campaign Management (15 minutes)**
- [ ] Create new campaign
- [ ] Upload header image
- [ ] Edit campaign details
- [ ] View campaign public page

**Sponsorship (15 minutes)**
- [ ] Submit sponsorship (text)
- [ ] Submit sponsorship (logo)
- [ ] Verify email notification sent
- [ ] Approve logo (as campaign owner)

**Payment Processing (10 minutes)**
- [ ] Create sponsorship with payment
- [ ] Use Stripe test card: 4242 4242 4242 4242
- [ ] Verify payment success
- [ ] Check Stripe dashboard

---

## ✅ Launch Checklist

- [ ] All critical tasks completed
- [ ] All smoke tests passed
- [ ] Monitoring configured and working
- [ ] Team notified of launch
- [ ] Documentation updated with production URLs
- [ ] Backup plan ready (rollback procedure)

---

## 🚨 Emergency Contacts

**During Launch:**
- Technical Lead: [Name, Phone, Email]
- DevOps: [Name, Phone, Email]

**External Support:**
- AWS Support: [Your support plan]
- MongoDB Atlas: support@mongodb.com
- Stripe: https://support.stripe.com

---

## 📊 Post-Launch Monitoring (First 24 Hours)

**Hour 1-4: Active Monitoring**
- [ ] Check UptimeRobot every 30 minutes
- [ ] Monitor Sentry for errors (if configured)
- [ ] Check AWS CloudWatch logs
- [ ] Verify health endpoint status

**Hour 4-24: Periodic Checks**
- [ ] Check every 2-4 hours
- [ ] Review error rates
- [ ] Monitor response times
- [ ] Check database performance

---

**Last Updated**: February 9, 2026  
**Status**: Ready to Execute  
**Estimated Completion**: 6-8 hours

