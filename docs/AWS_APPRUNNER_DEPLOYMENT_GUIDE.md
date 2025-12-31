# AWS App Runner Deployment Guide

This guide walks you through deploying the **bm-gotyaback** fundraising platform to AWS App Runner.

## Architecture Overview

Your application will be deployed as:

- **Backend API**: App Runner service (Node.js/Express)
- **Frontend SPA**: App Runner service (React/Vite served by Nginx)
- **Database**: MongoDB Atlas (managed)
- **Storage**: AWS S3 (already configured)
- **Payments**: Stripe (already configured)

## Prerequisites

### 1. AWS Account Setup

- [ ] AWS account with billing enabled
- [ ] AWS CLI installed and configured
- [ ] IAM user with permissions for:
  - ECR (Elastic Container Registry)
  - App Runner
  - S3 (already have)
  - IAM role creation

### 2. MongoDB Atlas Setup

- [ ] MongoDB Atlas account (free tier available)
- [ ] Create a cluster
- [ ] Get connection string (format: `mongodb+srv://username:password@cluster.mongodb.net/dbname`)
- [ ] Whitelist IP: `0.0.0.0/0` (allow all - App Runner uses dynamic IPs)

### 3. Domain Setup (Optional but Recommended)

- [ ] Domain name registered
- [ ] Access to DNS settings

### 4. Required Environment Variables

Collect these values before deployment:

**Backend:**

```
PORT=8080
MONGO_URI=mongodb+srv://...
JWT_SECRET=your-secure-random-string-here
AWS_S3_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name
AWS_S3_ACCESS_KEY=your-access-key
AWS_S3_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_SERVER_URL=https://your-bucket.s3.amazonaws.com/
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLIC_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
FRONTEND_URL=https://your-frontend-url.awsapprunner.com
```

**Frontend:**

```
VITE_API_URL=https://your-backend-url.awsapprunner.com/api
VITE_STRIPE_PUBLIC_KEY=pk_live_...
```

---

## Step-by-Step Deployment

### Phase 1: Prepare Your Code

#### 1.1 Update Backend for App Runner

App Runner uses port 8080 by default. Update `backend/src/server.ts`:

```typescript
const PORT = process.env.PORT || 8080;
```

#### 1.2 Update Frontend API Configuration

Create `frontend/.env.production`:

```
VITE_API_URL=https://YOUR_BACKEND_URL.awsapprunner.com/api
VITE_STRIPE_PUBLIC_KEY=pk_live_YOUR_KEY
```

You'll update `YOUR_BACKEND_URL` after deploying the backend.

---

### Phase 2: Set Up AWS Infrastructure

#### 2.1 Install AWS CLI (if not already installed)

**Windows (PowerShell):**

```powershell
msiexec.exe /i https://awscli.amazonaws.com/AWSCLIV2.msi
```

**Verify installation:**

```bash
aws --version
```

#### 2.2 Configure AWS CLI

```bash
aws configure
```

Enter:

- AWS Access Key ID
- AWS Secret Access Key
- Default region (e.g., `us-east-1`)
- Default output format: `json`

#### 2.3 Create ECR Repositories

```bash
# Create repository for backend
aws ecr create-repository \
    --repository-name bm-gotyaback-backend \
    --region us-east-1

# Create repository for frontend
aws ecr create-repository \
    --repository-name bm-gotyaback-frontend \
    --region us-east-1
```

Save the repository URIs from the output (format: `123456789.dkr.ecr.us-east-1.amazonaws.com/bm-gotyaback-backend`)

---

### Phase 3: Build and Push Docker Images

#### 3.1 Authenticate Docker to ECR

```bash
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789.dkr.ecr.us-east-1.amazonaws.com
```

Replace `123456789` with your AWS account ID.

#### 3.2 Build and Push Backend Image

```bash
cd backend

# Build the image
docker build -t bm-gotyaback-backend .

# Tag the image
docker tag bm-gotyaback-backend:latest 123456789.dkr.ecr.us-east-1.amazonaws.com/bm-gotyaback-backend:latest

# Push to ECR
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/bm-gotyaback-backend:latest

cd ..
```

#### 3.3 Build and Push Frontend Image

```bash
cd frontend

# Build the image
docker build -t bm-gotyaback-frontend .

# Tag the image
docker tag bm-gotyaback-frontend:latest 123456789.dkr.ecr.us-east-1.amazonaws.com/bm-gotyaback-frontend:latest

# Push to ECR
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/bm-gotyaback-frontend:latest

cd ..
```

---

### Phase 4: Deploy to App Runner

#### 4.1 Deploy Backend Service

1. Go to AWS Console → App Runner
2. Click **Create service**
3. **Source:**
   - Repository type: **Container registry**
   - Provider: **Amazon ECR**
   - Container image URI: Select `bm-gotyaback-backend:latest`
   - Deployment trigger: **Manual** (or Automatic for CI/CD)
4. **Service settings:**
   - Service name: `bm-gotyaback-backend`
   - Port: `8080`
   - CPU: `1 vCPU`
   - Memory: `2 GB`
5. **Environment variables:** Add all backend env vars (see list above)
6. **Health check:**
   - Path: `/api`
   - Interval: 10 seconds
   - Timeout: 5 seconds
7. Click **Create & deploy**

Wait for deployment (5-10 minutes). Note the service URL (e.g., `https://abc123.us-east-1.awsapprunner.com`)

#### 4.2 Configure Stripe Webhook

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click **Add endpoint**
3. Endpoint URL: `https://YOUR_BACKEND_URL.awsapprunner.com/api/payment/webhook`
4. Select events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Copy the **Signing secret** (starts with `whsec_`)
6. Update App Runner backend service:
   - Go to Configuration → Environment variables
   - Update `STRIPE_WEBHOOK_SECRET` with the new value
   - Deploy new version

#### 4.3 Deploy Frontend Service

1. Update `frontend/.env.production` with the backend URL:

   ```
   VITE_API_URL=https://YOUR_BACKEND_URL.awsapprunner.com/api
   ```

2. Rebuild and push frontend image:

   ```bash
   cd frontend
   docker build -t bm-gotyaback-frontend .
   docker tag bm-gotyaback-frontend:latest 123456789.dkr.ecr.us-east-1.amazonaws.com/bm-gotyaback-frontend:latest
   docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/bm-gotyaback-frontend:latest
   cd ..
   ```

3. Go to AWS Console → App Runner
4. Click **Create service**
5. **Source:**
   - Repository type: **Container registry**
   - Provider: **Amazon ECR**
   - Container image URI: Select `bm-gotyaback-frontend:latest`
6. **Service settings:**
   - Service name: `bm-gotyaback-frontend`
   - Port: `8080`
   - CPU: `0.25 vCPU`
   - Memory: `0.5 GB`
7. **Environment variables:** Add frontend env vars
8. **Health check:**
   - Path: `/health`
   - Interval: 10 seconds
9. Click **Create & deploy**

Wait for deployment. Note the frontend URL.

#### 4.4 Update Backend CORS

Update the backend App Runner service environment variables:

- `FRONTEND_URL`: Add your frontend URL

Redeploy the backend service.

---

### Phase 5: Custom Domain Setup (Optional)

#### 5.1 Add Custom Domain to App Runner

**For Backend (api.yourdomain.com):**

1. Go to App Runner → `bm-gotyaback-backend` → Custom domains
2. Click **Link domain**
3. Domain: `api.yourdomain.com`
4. Copy the CNAME records shown
5. Add CNAME records to your DNS provider
6. Wait for validation (can take up to 48 hours)

**For Frontend (yourdomain.com or app.yourdomain.com):**

1. Go to App Runner → `bm-gotyaback-frontend` → Custom domains
2. Click **Link domain**
3. Domain: `yourdomain.com` or `app.yourdomain.com`
4. Copy the CNAME records
5. Add to DNS provider
6. Wait for validation

#### 5.2 Update Environment Variables with Custom Domains

**Backend:**

- `FRONTEND_URL=https://yourdomain.com`

**Frontend:**

- Rebuild with `VITE_API_URL=https://api.yourdomain.com/api`

**Stripe Webhook:**

- Update endpoint to `https://api.yourdomain.com/api/payment/webhook`

---

### Phase 6: Testing & Verification

#### 6.1 Test Backend API

```bash
# Health check
curl https://YOUR_BACKEND_URL.awsapprunner.com/api

# Should return: "API is running"
```

#### 6.2 Test Frontend

1. Open `https://YOUR_FRONTEND_URL.awsapprunner.com` in browser
2. Verify the homepage loads
3. Try to register/login
4. Create a test campaign

#### 6.3 Test Full Flow

1. Create a campaign
2. Add sponsors
3. Test Stripe payment (use test card: 4242 4242 4242 4242)
4. Verify webhook receives events
5. Check S3 for uploaded images

---

### Phase 7: Monitoring & Maintenance

#### 7.1 View Logs

**AWS Console:**

1. Go to App Runner → Your service
2. Click **Logs** tab
3. View application logs and deployment logs

**AWS CLI:**

```bash
# Backend logs
aws logs tail /aws/apprunner/bm-gotyaback-backend --follow

# Frontend logs
aws logs tail /aws/apprunner/bm-gotyaback-frontend --follow
```

#### 7.2 Set Up Alarms

1. Go to CloudWatch → Alarms
2. Create alarms for:
   - High CPU usage (>80%)
   - High memory usage (>80%)
   - HTTP 5xx errors
   - Request count drops to 0

#### 7.3 Auto Scaling

App Runner automatically scales based on traffic:

- Default: 1-25 instances
- Configure in Service settings → Auto scaling

---

## Cost Estimation

**App Runner Pricing (us-east-1):**

- Backend (1 vCPU, 2 GB): ~$0.064/hour = ~$46/month (if running 24/7)
- Frontend (0.25 vCPU, 0.5 GB): ~$0.016/hour = ~$12/month
- **Total: ~$58/month** (plus data transfer)

**Additional Costs:**

- MongoDB Atlas: Free tier (512 MB) or $9/month (2 GB)
- S3 Storage: ~$0.023/GB/month
- Data transfer: ~$0.09/GB

**Estimated Total: $60-80/month** for low-medium traffic

---

## CI/CD Setup (Optional)

### Using GitHub Actions

Create `.github/workflows/deploy-backend.yml`:

```yaml
name: Deploy Backend to App Runner

on:
  push:
    branches: [main]
    paths:
      - "backend/**"

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1

      - name: Build and push Docker image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          ECR_REPOSITORY: bm-gotyaback-backend
          IMAGE_TAG: ${{ github.sha }}
        run: |
          cd backend
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG

      - name: Deploy to App Runner
        run: |
          aws apprunner start-deployment \
            --service-arn ${{ secrets.APPRUNNER_SERVICE_ARN }}
```

Add similar workflow for frontend.

---

## Troubleshooting

### Issue: Service fails to start

**Check:**

1. View logs in App Runner console
2. Verify all environment variables are set
3. Check MongoDB connection string
4. Ensure port 8080 is exposed

### Issue: Cannot connect to MongoDB

**Solutions:**

1. Whitelist `0.0.0.0/0` in MongoDB Atlas
2. Verify connection string format
3. Check username/password encoding (use URL encoding for special chars)

### Issue: Stripe webhook not working

**Check:**

1. Webhook URL is correct
2. `STRIPE_WEBHOOK_SECRET` matches Stripe dashboard
3. Endpoint is publicly accessible
4. Check App Runner logs for webhook errors

### Issue: Images not uploading to S3

**Check:**

1. S3 bucket permissions
2. IAM credentials are correct
3. Bucket region matches `AWS_S3_REGION`
4. CORS configuration on S3 bucket

### Issue: CORS errors

**Solutions:**

1. Verify `FRONTEND_URL` in backend env vars
2. Check backend CORS configuration in `app.ts`
3. Ensure frontend is using correct API URL

---

## Security Best Practices

1. **Environment Variables:**

   - Never commit `.env` files
   - Use AWS Secrets Manager for sensitive data (advanced)

2. **MongoDB:**

   - Use strong passwords
   - Enable IP whitelisting when possible
   - Regular backups

3. **S3:**

   - Enable bucket versioning
   - Set up lifecycle policies
   - Use IAM roles instead of access keys (when possible)

4. **App Runner:**
   - Enable VPC connector for private resources
   - Use HTTPS only
   - Regular security updates (rebuild images)

---

## Next Steps

After successful deployment:

1. ✅ Set up monitoring and alerts
2. ✅ Configure automated backups for MongoDB
3. ✅ Set up CI/CD pipeline
4. ✅ Add custom domain
5. ✅ Configure CDN (CloudFront) for frontend (optional)
6. ✅ Set up staging environment
7. ✅ Document runbooks for common issues

---

## Support & Resources

- [AWS App Runner Documentation](https://docs.aws.amazon.com/apprunner/)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)

---

## Quick Reference Commands

```bash
# Build and push backend
cd backend && docker build -t backend . && \
docker tag backend:latest $ECR_URI/bm-gotyaback-backend:latest && \
docker push $ECR_URI/bm-gotyaback-backend:latest

# Build and push frontend
cd frontend && docker build -t frontend . && \
docker tag frontend:latest $ECR_URI/bm-gotyaback-frontend:latest && \
docker push $ECR_URI/bm-gotyaback-frontend:latest

# View logs
aws logs tail /aws/apprunner/bm-gotyaback-backend --follow

# Trigger deployment
aws apprunner start-deployment --service-arn YOUR_SERVICE_ARN
```
