# Single Instance Deployment Guide

Deploy both frontend and backend on a **single AWS App Runner instance** to save costs.

## 💰 Cost Comparison

| Deployment Type | Monthly Cost | Instances |
|----------------|--------------|-----------|
| **Two Instances** (Current) | ~$58/month | Backend + Frontend |
| **Single Instance** (This Guide) | ~$25-35/month | Combined |
| **Savings** | **~$30/month** | 50% reduction |

---

## 🏗️ Architecture

### Two Instance Setup (Current)
```
User → Frontend (Nginx:8080) → Backend (Node:8080) → MongoDB/S3/Stripe
       $12/month                 $46/month
```

### Single Instance Setup (This Guide)
```
User → Nginx:8080 → Frontend (static files)
                  → /api → Node:3000 → MongoDB/S3/Stripe
       $25-35/month
```

**How it works:**
- Nginx listens on port 8080 (App Runner requirement)
- Nginx serves React static files for all non-API requests
- Nginx proxies `/api/*` requests to Node.js backend on port 3000
- Supervisor manages both Nginx and Node.js processes
- Single Docker image, single App Runner service

---

## 📋 Prerequisites

Same as the two-instance deployment:
- AWS account with CLI configured
- MongoDB Atlas cluster
- Stripe account
- Docker installed

---

## 🚀 Quick Deployment Steps

### 1. Create ECR Repository

```bash
aws ecr create-repository --repository-name bm-gotyaback-combined --region us-east-1
```

Save the repository URI (e.g., `123456789.dkr.ecr.us-east-1.amazonaws.com/bm-gotyaback-combined`)

### 2. Build the Combined Image

```bash
# Build
docker build -f Dockerfile.combined -t bm-gotyaback-combined .

# Test locally (optional)
docker run -p 8080:8080 \
  -e MONGO_URI=your_mongodb_uri \
  -e JWT_SECRET=your_secret \
  -e AWS_S3_REGION=us-east-1 \
  -e AWS_S3_BUCKET=your_bucket \
  -e AWS_S3_ACCESS_KEY=your_key \
  -e AWS_S3_SECRET_ACCESS_KEY=your_secret \
  -e STRIPE_SECRET_KEY=sk_test_... \
  -e STRIPE_PUBLIC_KEY=pk_test_... \
  bm-gotyaback-combined

# Visit http://localhost:8080
```

### 3. Push to ECR

```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Tag image
docker tag bm-gotyaback-combined:latest YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/bm-gotyaback-combined:latest

# Push
docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/bm-gotyaback-combined:latest
```

### 4. Create App Runner Service

1. Go to [AWS App Runner Console](https://console.aws.amazon.com/apprunner)
2. Click **Create service**
3. **Source:**
   - Repository type: **Container registry**
   - Provider: **Amazon ECR**
   - Container image URI: Select `bm-gotyaback-combined:latest`
   - Deployment trigger: **Manual**
4. **Service settings:**
   - Service name: `bm-gotyaback`
   - Port: `8080`
   - CPU: **1 vCPU**
   - Memory: **2 GB**
5. **Environment variables:** Add all these:
   ```
   PORT=3000
   NODE_ENV=production
   MONGO_URI=mongodb+srv://...
   JWT_SECRET=your-secret
   AWS_S3_REGION=us-east-1
   AWS_S3_BUCKET=your-bucket
   AWS_S3_ACCESS_KEY=your-key
   AWS_S3_SECRET_ACCESS_KEY=your-secret
   AWS_S3_SERVER_URL=https://your-bucket.s3.amazonaws.com/
   STRIPE_SECRET_KEY=sk_...
   STRIPE_PUBLIC_KEY=pk_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   FRONTEND_URL=https://your-service-url.awsapprunner.com
   ```
6. **Health check:**
   - Path: `/health`
   - Interval: 10 seconds
7. Click **Create & deploy**

### 5. Configure Stripe Webhook

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. Add endpoint: `https://YOUR_SERVICE_URL/api/payment/webhook`
3. Select events: `checkout.session.completed`, `payment_intent.succeeded`, etc.
4. Copy webhook secret
5. Update App Runner environment variable: `STRIPE_WEBHOOK_SECRET=whsec_...`
6. Redeploy service

### 6. Update CORS

After deployment, update the `FRONTEND_URL` environment variable with your actual App Runner URL and redeploy.

---

## ✅ Testing

1. **Frontend**: Visit `https://your-service-url.awsapprunner.com`
2. **API**: Visit `https://your-service-url.awsapprunner.com/api`
3. **Health**: Visit `https://your-service-url.awsapprunner.com/health`

Test the full flow:
- Register a user
- Create a campaign
- Upload an image
- Make a test payment

---

## 🔧 Environment Variables

All environment variables from the backend are needed. The frontend is built at Docker build time, so it uses the production build.

**Important:** If you need to change the API URL for the frontend, you'll need to:
1. Update `frontend/.env.production`
2. Rebuild the Docker image
3. Push to ECR
4. Redeploy App Runner service

---

## 📊 Resource Recommendations

| Traffic Level | CPU | Memory | Cost/Month |
|--------------|-----|--------|------------|
| Low (< 1000 users/month) | 0.25 vCPU | 0.5 GB | ~$12 |
| Medium (< 10k users/month) | 1 vCPU | 2 GB | ~$25 |
| High (< 50k users/month) | 2 vCPU | 4 GB | ~$50 |

Start with **1 vCPU / 2 GB** and adjust based on CloudWatch metrics.

---

## 🔄 Updates and Redeployment

When you make code changes:

```bash
# Rebuild
docker build -f Dockerfile.combined -t bm-gotyaback-combined .

# Tag and push
docker tag bm-gotyaback-combined:latest YOUR_ECR_URI:latest
docker push YOUR_ECR_URI:latest

# Trigger deployment in App Runner console or:
aws apprunner start-deployment --service-arn YOUR_SERVICE_ARN
```

---

## ⚖️ Pros and Cons

### ✅ Advantages
- **50% cost savings** (~$30/month less)
- **Simpler deployment** (one service vs two)
- **Single URL** (no CORS complexity)
- **Easier to manage** (one set of logs, one service)
- **Faster** (no network hop between services)

### ⚠️ Considerations
- **Coupled scaling** (frontend and backend scale together)
- **Larger image** (~400MB vs 350MB + 80MB)
- **Rebuild required** for frontend changes (can't update independently)
- **More complex Dockerfile** (but we've handled that for you)

---

## 🆚 When to Use Which?

### Use Single Instance If:
- ✅ You're cost-conscious
- ✅ You have low-medium traffic
- ✅ You deploy frontend and backend together
- ✅ You want simplicity

### Use Two Instances If:
- ✅ You need independent scaling
- ✅ You have high traffic with different patterns
- ✅ You deploy frontend and backend separately
- ✅ You want maximum flexibility

---

## 🐛 Troubleshooting

### Service won't start
- Check CloudWatch logs for both Nginx and backend
- Verify all environment variables are set
- Test MongoDB connection

### API requests fail
- Check Nginx proxy configuration
- Verify backend is running on port 3000
- Check CloudWatch logs

### Frontend not loading
- Verify Nginx is serving files from `/usr/share/nginx/html`
- Check build output in Docker logs

---

## 📞 Support

For issues, check:
- CloudWatch logs: `/aws/apprunner/bm-gotyaback`
- Health check: `https://your-url/health`
- API check: `https://your-url/api`

---

**Ready to save $30/month?** Follow the steps above! 🚀

