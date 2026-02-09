# Monitoring Setup Guide

**Date**: February 9, 2026  
**Status**: ✅ Code Ready - Configuration Needed

---

## 📋 Overview

This guide will help you set up production monitoring for the Got Ya Back platform. Monitoring has been **pre-configured in the code** - you just need to create accounts and add the credentials.

### What's Already Done ✅

1. ✅ **Sentry SDK installed** (backend & frontend)
2. ✅ **Sentry initialization code added** to:
   - `backend/src/server.ts`
   - `backend/src/app.ts`
   - `frontend/src/routes/__root.tsx`
3. ✅ **Environment variable templates** updated
4. ✅ **Production-only activation** (won't run in development)

### What You Need to Do 🔧

1. Create Sentry account and get DSN
2. Create UptimeRobot account for uptime monitoring
3. Add credentials to environment variables
4. Deploy and verify

---

## 🚀 Step 1: Set Up Sentry (30 minutes)

### 1.1 Create Sentry Account

1. Go to https://sentry.io/signup/
2. Sign up for free account (10,000 errors/month free)
3. Choose "Create a new organization"

### 1.2 Create Backend Project

1. Click "Create Project"
2. Select **Node.js** as platform
3. Set alert frequency: "On every new issue"
4. Name: `gotyaback-backend`
5. Click "Create Project"
6. **Copy the DSN** (looks like: `https://xxx@xxx.ingest.sentry.io/xxx`)

### 1.3 Create Frontend Project

1. Click "Projects" → "Create Project"
2. Select **React** as platform
3. Name: `gotyaback-frontend`
4. Click "Create Project"
5. **Copy the DSN** (different from backend)

### 1.4 Configure Environment Variables

**Backend** (`backend/.env` or AWS App Runner):
```bash
SENTRY_DSN=https://your-backend-dsn@sentry.io/your-project-id
```

**Frontend** (`frontend/.env.production` or AWS App Runner):
```bash
VITE_SENTRY_DSN=https://your-frontend-dsn@sentry.io/your-project-id
```

### 1.5 Test Sentry (After Deployment)

**Backend Test**:
```bash
# SSH into your backend or use AWS CloudShell
curl https://your-backend-url.com/api/test-error
```

**Frontend Test**:
Open browser console and run:
```javascript
throw new Error("Test Sentry Error");
```

Check Sentry dashboard - you should see the errors appear within seconds.

---

## 📊 Step 2: Set Up UptimeRobot (15 minutes)

### 2.1 Create Account

1. Go to https://uptimerobot.com/
2. Sign up for free account (50 monitors free)
3. Verify email

### 2.2 Add Backend Monitor

1. Click "Add New Monitor"
2. **Monitor Type**: HTTP(s)
3. **Friendly Name**: Got Ya Back Backend
4. **URL**: `https://your-backend-url.awsapprunner.com/health`
5. **Monitoring Interval**: 5 minutes
6. Click "Create Monitor"

### 2.3 Add Frontend Monitor

1. Click "Add New Monitor"
2. **Monitor Type**: HTTP(s)
3. **Friendly Name**: Got Ya Back Frontend
4. **URL**: `https://your-frontend-url.awsapprunner.com/`
5. **Monitoring Interval**: 5 minutes
6. Click "Create Monitor"

### 2.4 Configure Alerts

1. Go to "My Settings" → "Alert Contacts"
2. Add your email (already added during signup)
3. **Optional but recommended**: Add SMS alerts
   - Click "Add Alert Contact"
   - Select "SMS"
   - Enter phone number
   - Verify

### 2.5 Test Alerts

1. Click on a monitor
2. Click "Pause Monitoring"
3. Wait 5 minutes - you should receive a "down" alert
4. Click "Resume Monitoring"
5. You should receive an "up" alert

---

## 🔍 Step 3: Verify Monitoring (10 minutes)

### 3.1 Check Sentry Dashboard

1. Go to https://sentry.io/
2. Select your organization
3. You should see both projects:
   - `gotyaback-backend`
   - `gotyaback-frontend`

### 3.2 Check UptimeRobot Dashboard

1. Go to https://uptimerobot.com/dashboard
2. You should see both monitors showing "Up" (green)
3. Check "Response Time" graphs

### 3.3 Verify Health Endpoints

```bash
# Backend health check
curl https://your-backend-url.awsapprunner.com/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2026-02-09T...",
  "services": {
    "database": "connected",
    "stripe": "configured",
    "s3": "configured"
  }
}
```

---

## 📈 Step 4: Configure Monitoring Best Practices

### 4.1 Sentry Alert Rules

1. Go to Sentry → Project Settings → Alerts
2. Create alert for "High error rate":
   - Condition: "Errors > 10 in 1 hour"
   - Action: Email team
3. Create alert for "New issue":
   - Condition: "A new issue is created"
   - Action: Email team

### 4.2 UptimeRobot Status Page (Optional)

1. Go to "Public Status Pages"
2. Click "Add New Status Page"
3. Select monitors to include
4. Customize branding
5. Share URL with stakeholders

---

## 🚨 Monitoring Checklist

### Pre-Launch:
- [ ] Sentry backend project created
- [ ] Sentry frontend project created
- [ ] Backend SENTRY_DSN configured
- [ ] Frontend VITE_SENTRY_DSN configured
- [ ] UptimeRobot account created
- [ ] Backend health monitor added
- [ ] Frontend monitor added
- [ ] Email alerts configured
- [ ] Test error sent to Sentry (backend)
- [ ] Test error sent to Sentry (frontend)
- [ ] UptimeRobot alert test completed

### Post-Launch (First 24 Hours):
- [ ] Check Sentry every 2 hours
- [ ] Verify UptimeRobot shows "Up"
- [ ] Review error rates
- [ ] Check response times
- [ ] Verify alerts are working

---

## 📊 What to Monitor

### Sentry Metrics:
- **Error Rate**: Should be < 1%
- **New Issues**: Investigate immediately
- **Performance**: p95 response time < 500ms
- **User Impact**: Number of users affected

### UptimeRobot Metrics:
- **Uptime**: Target > 99.9%
- **Response Time**: Target < 500ms
- **Downtime Alerts**: Investigate immediately

---

## 🔧 Troubleshooting

### Sentry Not Receiving Errors

**Check 1**: Verify DSN is set
```bash
# Backend
echo $SENTRY_DSN

# Frontend (in browser console)
console.log(import.meta.env.VITE_SENTRY_DSN)
```

**Check 2**: Verify NODE_ENV is production
```bash
echo $NODE_ENV  # Should be "production"
```

**Check 3**: Check logs
```bash
# Should see: "✅ Sentry initialized for production monitoring"
```

### UptimeRobot Showing Down

**Check 1**: Verify URL is accessible
```bash
curl -I https://your-backend-url.com/health
# Should return: HTTP/2 200
```

**Check 2**: Check AWS App Runner status
- Go to AWS Console → App Runner
- Verify service is "Running"

**Check 3**: Check health endpoint
```bash
curl https://your-backend-url.com/health
# Should return JSON with status: "healthy"
```

---

## 💰 Cost Estimate

### Sentry Free Tier:
- 10,000 errors/month
- 10,000 transactions/month
- 1 GB attachments
- **Cost**: $0/month

### UptimeRobot Free Tier:
- 50 monitors
- 5-minute intervals
- Email alerts
- **Cost**: $0/month

### Total Monthly Cost: **$0** 🎉

---

## 📞 Support

### Sentry:
- Docs: https://docs.sentry.io/
- Support: https://sentry.io/support/

### UptimeRobot:
- Docs: https://uptimerobot.com/help/
- Support: support@uptimerobot.com

---

## ✅ Success Criteria

You'll know monitoring is working when:

1. ✅ Sentry dashboard shows both projects
2. ✅ Test errors appear in Sentry within seconds
3. ✅ UptimeRobot shows both monitors as "Up"
4. ✅ You receive email alerts when monitors go down
5. ✅ Health endpoints return 200 OK
6. ✅ No errors in application logs about Sentry

---

**Next Steps**: After monitoring is set up, proceed to **Task 3: Configure Production Secrets** in the `PRODUCTION_LAUNCH_ACTION_PLAN.md`

