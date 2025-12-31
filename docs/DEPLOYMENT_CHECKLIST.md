# AWS App Runner Deployment Checklist

Use this checklist to track your deployment progress.

## Pre-Deployment Setup

### AWS Account
- [ ] AWS account created and billing enabled
- [ ] AWS CLI installed (`aws --version`)
- [ ] AWS CLI configured (`aws configure`)
- [ ] IAM user has ECR, App Runner, and S3 permissions

### MongoDB Atlas
- [ ] MongoDB Atlas account created
- [ ] Cluster created (free tier or paid)
- [ ] Database user created with password
- [ ] Network access: `0.0.0.0/0` whitelisted
- [ ] Connection string copied (format: `mongodb+srv://...`)

### Stripe
- [ ] Stripe account created
- [ ] API keys obtained (test and live)
- [ ] Publishable key: `pk_test_...` or `pk_live_...`
- [ ] Secret key: `sk_test_...` or `sk_live_...`

### AWS S3
- [ ] S3 bucket created
- [ ] Bucket name noted
- [ ] IAM user with S3 access created
- [ ] Access key ID and secret access key saved
- [ ] Bucket region noted

### Domain (Optional)
- [ ] Domain registered
- [ ] Access to DNS settings

---

## Environment Variables Collected

### Backend Variables
```
PORT=8080
MONGO_URI=
JWT_SECRET=
AWS_S3_REGION=
AWS_S3_BUCKET=
AWS_S3_ACCESS_KEY=
AWS_S3_SECRET_ACCESS_KEY=
AWS_S3_SERVER_URL=
STRIPE_SECRET_KEY=
STRIPE_PUBLIC_KEY=
STRIPE_WEBHOOK_SECRET=
FRONTEND_URL=
```

### Frontend Variables
```
VITE_API_URL=
VITE_STRIPE_PUBLIC_KEY=
```

---

## Deployment Steps

### Phase 1: ECR Setup
- [ ] Backend ECR repository created
- [ ] Frontend ECR repository created
- [ ] Repository URIs saved

### Phase 2: Docker Images
- [ ] Docker installed and running
- [ ] Authenticated to ECR
- [ ] Backend image built
- [ ] Backend image pushed to ECR
- [ ] Frontend `.env.production` created
- [ ] Frontend image built
- [ ] Frontend image pushed to ECR

### Phase 3: Backend Deployment
- [ ] App Runner backend service created
- [ ] Service name: `bm-gotyaback-backend`
- [ ] Port configured: `8080`
- [ ] All environment variables added
- [ ] Health check configured: `/api`
- [ ] Service deployed successfully
- [ ] Backend URL saved: `https://_____.awsapprunner.com`

### Phase 4: Stripe Webhook
- [ ] Stripe webhook endpoint created
- [ ] Webhook URL: `https://BACKEND_URL/api/payment/webhook`
- [ ] Events selected (checkout.session.completed, etc.)
- [ ] Webhook secret copied
- [ ] Backend env var `STRIPE_WEBHOOK_SECRET` updated
- [ ] Backend service redeployed

### Phase 5: Frontend Deployment
- [ ] Frontend `.env.production` updated with backend URL
- [ ] Frontend image rebuilt and pushed
- [ ] App Runner frontend service created
- [ ] Service name: `bm-gotyaback-frontend`
- [ ] Port configured: `8080`
- [ ] Environment variables added
- [ ] Health check configured: `/health`
- [ ] Service deployed successfully
- [ ] Frontend URL saved: `https://_____.awsapprunner.com`

### Phase 6: Final Configuration
- [ ] Backend `FRONTEND_URL` env var updated
- [ ] Backend service redeployed
- [ ] CORS tested and working

---

## Testing

### Backend Tests
- [ ] Health check: `curl https://BACKEND_URL/api`
- [ ] Returns: "API is running"
- [ ] Logs show no errors

### Frontend Tests
- [ ] Homepage loads
- [ ] Can register new user
- [ ] Can login
- [ ] Can create campaign
- [ ] Images upload to S3

### Integration Tests
- [ ] Create test campaign
- [ ] Add sponsor with Stripe payment
- [ ] Use test card: 4242 4242 4242 4242
- [ ] Payment succeeds
- [ ] Webhook receives event
- [ ] Sponsorship marked as paid

---

## Custom Domain (Optional)

### Backend Domain
- [ ] Custom domain linked in App Runner
- [ ] CNAME record added to DNS
- [ ] Domain validated
- [ ] Backend env vars updated
- [ ] Stripe webhook URL updated

### Frontend Domain
- [ ] Custom domain linked in App Runner
- [ ] CNAME record added to DNS
- [ ] Domain validated
- [ ] Frontend rebuilt with new API URL

---

## Post-Deployment

### Monitoring
- [ ] CloudWatch logs accessible
- [ ] Alarms configured for CPU/memory
- [ ] Error tracking set up

### Security
- [ ] All secrets stored securely
- [ ] `.env` files not committed to git
- [ ] MongoDB IP whitelist reviewed
- [ ] S3 bucket permissions reviewed

### Backups
- [ ] MongoDB backup strategy defined
- [ ] S3 versioning enabled
- [ ] Disaster recovery plan documented

### Documentation
- [ ] Deployment process documented
- [ ] Environment variables documented
- [ ] Runbook created for common issues

---

## Troubleshooting Reference

**Service won't start:**
- Check logs in App Runner console
- Verify all env vars are set
- Test MongoDB connection string locally

**CORS errors:**
- Verify `FRONTEND_URL` in backend
- Check CORS config in `backend/src/app.ts`

**Stripe webhook fails:**
- Verify webhook URL is publicly accessible
- Check webhook secret matches
- Review App Runner logs for errors

**Images not uploading:**
- Verify S3 credentials
- Check bucket permissions
- Ensure region matches

---

## Quick Commands

```bash
# Get AWS account ID
aws sts get-caller-identity --query Account --output text

# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-east-1.amazonaws.com

# View backend logs
aws logs tail /aws/apprunner/bm-gotyaback-backend --follow

# Trigger deployment
aws apprunner start-deployment --service-arn arn:aws:apprunner:us-east-1:ACCOUNT_ID:service/SERVICE_NAME/SERVICE_ID
```

