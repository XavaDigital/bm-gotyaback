# Production Setup Guide
**Date**: February 9, 2026  
**Estimated Time**: 2-3 hours  
**Status**: Ready to Execute

---

## 🎯 Overview

This guide walks you through setting up all production services needed for the Got Ya Back platform.

**What You'll Set Up:**
1. MongoDB Atlas Production Cluster (30 minutes)
2. AWS S3 Production Bucket (30 minutes)
3. Mailgun Production Domain (30 minutes)
4. Production Environment Variables (15 minutes)
5. Monitoring Services (30-60 minutes)

---

## 1️⃣ MongoDB Atlas Production Setup

### Step 1: Create Production Cluster (15 minutes)

1. **Go to MongoDB Atlas**: https://cloud.mongodb.com
2. **Sign in** or create account
3. **Create New Cluster**:
   - Click "Build a Database"
   - Choose **M10** tier (recommended for production)
   - Region: Choose closest to your users (e.g., us-east-1)
   - Cluster Name: `gotyaback-production`

### Step 2: Configure Security (10 minutes)

1. **Create Database User**:
   - Go to "Database Access"
   - Click "Add New Database User"
   - Username: `gotyaback_prod`
   - Password: Generate strong password (save in password manager!)
   - Database User Privileges: "Read and write to any database"

2. **Configure Network Access**:
   - Go to "Network Access"
   - Click "Add IP Address"
   - For AWS App Runner: Add `0.0.0.0/0` (allows all IPs)
   - Or add specific AWS region IP ranges for better security

### Step 3: Get Connection String (5 minutes)

1. Go to "Database" → "Connect"
2. Choose "Connect your application"
3. Driver: Node.js, Version: 4.1 or later
4. Copy connection string:
   ```
   mongodb+srv://gotyaback_prod:<password>@gotyaback-production.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Replace `<password>` with your actual password
6. Add database name: `/gotyaback-prod`

**Final Connection String**:
```
mongodb+srv://gotyaback_prod:YOUR_PASSWORD@gotyaback-production.xxxxx.mongodb.net/gotyaback-prod?retryWrites=true&w=majority
```

### Step 4: Test Connection (5 minutes)

```bash
# Update backend/.env with new connection string
# Then test:
cd backend
npm start
# Check logs for "MongoDB connected successfully"
```

✅ **Checklist**:
- [ ] M10+ cluster created
- [ ] Database user created with strong password
- [ ] Network access configured
- [ ] Connection string obtained
- [ ] Connection tested successfully

---

## 2️⃣ AWS S3 Production Bucket Setup

### Step 1: Create S3 Bucket (10 minutes)

1. **Go to AWS S3 Console**: https://s3.console.aws.amazon.com
2. **Create Bucket**:
   - Bucket name: `gotyaback-prod-uploads`
   - Region: `us-east-1` (or your preferred region)
   - Block Public Access: Keep enabled (we'll use signed URLs)
   - Versioning: Enable
   - Encryption: Enable (SSE-S3)

### Step 2: Configure CORS (5 minutes)

1. Go to bucket → Permissions → CORS
2. Add CORS configuration:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedOrigins": [
      "https://your-frontend-domain.com",
      "http://localhost:3000"
    ],
    "ExposeHeaders": ["ETag", "x-amz-server-side-encryption"],
    "MaxAgeSeconds": 3000
  }
]
```

### Step 3: Create IAM User (10 minutes)

1. **Go to IAM Console**: https://console.aws.amazon.com/iam
2. **Create User**:
   - Username: `gotyaback-s3-user`
   - Access type: Programmatic access
3. **Attach Policy**:
   - Create custom policy or use `AmazonS3FullAccess`
   - Better: Create custom policy with minimal permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::gotyaback-prod-uploads",
        "arn:aws:s3:::gotyaback-prod-uploads/*"
      ]
    }
  ]
}
```

4. **Generate Access Keys**:
   - Save Access Key ID
   - Save Secret Access Key (shown only once!)

### Step 4: Test Upload (5 minutes)

Update `.env` with S3 credentials and test file upload through the application.

✅ **Checklist**:
- [ ] S3 bucket created with versioning
- [ ] CORS configured
- [ ] IAM user created
- [ ] Access keys generated and saved
- [ ] Test upload successful

---

## 3️⃣ Mailgun Production Setup

### Step 1: Add Domain (10 minutes)

1. **Go to Mailgun**: https://www.mailgun.com
2. **Sign in** or create account
3. **Add Domain**:
   - Go to "Sending" → "Domains"
   - Click "Add New Domain"
   - Domain: `mg.yourdomain.com` (subdomain recommended)

### Step 2: Configure DNS (15 minutes)

Mailgun will provide DNS records to add to your domain:

1. **TXT Records** (for SPF and DKIM):
   ```
   TXT @ "v=spf1 include:mailgun.org ~all"
   TXT k1._domainkey.[your-values-from-mailgun]
   ```

2. **CNAME Records**:
   ```
   CNAME email.mg.yourdomain.com mailgun.org
   ```

3. **MX Records** (if receiving emails):
   ```
   MX @ mxa.mailgun.org (priority 10)
   MX @ mxb.mailgun.org (priority 10)
   ```

**Note**: DNS propagation can take 24-48 hours

### Step 3: Get API Key (5 minutes)

1. Go to "Settings" → "API Keys"
2. Copy your Private API Key
3. Save securely in password manager

### Step 4: Test Email (5 minutes)

```bash
# Update .env with Mailgun credentials
# Test by triggering password reset or registration
```

✅ **Checklist**:
- [ ] Domain added to Mailgun
- [ ] DNS records configured
- [ ] Domain verified (may take 24-48 hours)
- [ ] API key obtained
- [ ] Test email sent successfully

---

## 4️⃣ Update Environment Variables

### Backend Environment Variables

1. **Copy template**:
   ```bash
   cd backend
   cp .env.production.template .env.production
   ```

2. **Fill in values** from steps above:
   - MongoDB connection string
   - AWS S3 credentials
   - Mailgun API key
   - JWT_SECRET (already generated in template)

3. **Verify all required variables are set**

### Frontend Environment Variables

Create `frontend/.env.production`:

```bash
VITE_API_URL=https://your-backend-url.awsapprunner.com/api
VITE_STRIPE_PUBLIC_KEY=pk_test_51SfEo6I3raXmStiAnQDtpR8OyA2pYCZn57SenSnygniSCpzgBojBpl1MFG9aNeTzCqOmeGYvnL1oGnEDgAqwTARY009FyQ6Vmu
```

✅ **Checklist**:
- [ ] Backend .env.production created and filled
- [ ] Frontend .env.production created
- [ ] All secrets stored in password manager
- [ ] No .env files committed to git

---

## 5️⃣ Set Up Monitoring

### UptimeRobot (30 minutes)

1. **Create Account**: https://uptimerobot.com
2. **Add Monitor**:
   - Type: HTTP(s)
   - URL: `https://your-backend-url/health`
   - Monitoring Interval: 5 minutes
3. **Configure Alerts**:
   - Email: your-email@domain.com
   - SMS: your-phone (optional)
4. **Test**: Trigger alert by stopping server

### Sentry (Optional - 30 minutes)

1. **Create Account**: https://sentry.io
2. **Create Project**: Node.js (backend) and React (frontend)
3. **Get DSN**: Copy from project settings
4. **Install**:
   ```bash
   cd backend
   npm install @sentry/node @sentry/profiling-node
   
   cd ../frontend
   npm install @sentry/react
   ```
5. **Configure** (see PRODUCTION_LAUNCH_QUICK_CHECKLIST.md)

✅ **Checklist**:
- [ ] UptimeRobot configured
- [ ] Test alert received
- [ ] Sentry configured (optional)

---

## ✅ Final Verification

Run through this checklist before deploying:

### Services
- [ ] MongoDB Atlas cluster accessible
- [ ] S3 bucket accepts uploads
- [ ] Mailgun sends emails
- [ ] UptimeRobot monitoring active

### Environment Variables
- [ ] Backend .env.production complete
- [ ] Frontend .env.production complete
- [ ] JWT_SECRET is 128 characters
- [ ] All passwords are strong and unique

### Security
- [ ] No secrets in version control
- [ ] All secrets in password manager
- [ ] 2FA enabled on all service accounts
- [ ] Network access properly configured

---

## 🚀 Next Steps

After completing this setup:

1. **Deploy to Production** (see PRODUCTION_LAUNCH_QUICK_CHECKLIST.md)
2. **Run Smoke Tests**
3. **Monitor for 24 hours**
4. **Go Live!**

---

**Setup Complete!** ✅  
You're now ready to deploy to production.

