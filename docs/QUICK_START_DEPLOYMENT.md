# Quick Start: Deploy to AWS App Runner

This is a condensed guide to get you deployed quickly. For detailed instructions, see `AWS_APPRUNNER_DEPLOYMENT_GUIDE.md`.

## Prerequisites (5 minutes)

1. **AWS Account** with billing enabled
2. **MongoDB Atlas** account (free tier works)
3. **Stripe** account (test mode is fine)
4. **AWS CLI** installed: `aws --version`
5. **Docker** installed: `docker --version`

## Step 1: Set Up MongoDB Atlas (5 minutes)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create free cluster
3. Create database user (username + password)
4. Network Access → Add IP: `0.0.0.0/0` (allow all)
5. Copy connection string: `mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<dbname>`

## Step 2: Configure AWS CLI (2 minutes)

```bash
aws configure
```

Enter your AWS credentials when prompted.

## Step 3: Create ECR Repositories (2 minutes)

```bash
# Backend repository
aws ecr create-repository --repository-name bm-gotyaback-backend --region us-east-1

# Frontend repository
aws ecr create-repository --repository-name bm-gotyaback-frontend --region us-east-1
```

Save the repository URIs from the output.

## Step 4: Prepare Environment Variables

### Backend

Copy `backend/.env.example` to create your environment variables list:

```
PORT=8080
MONGO_URI=mongodb+srv://...  (from Step 1)
JWT_SECRET=your-random-secret-here
AWS_S3_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name
AWS_S3_ACCESS_KEY=your-key
AWS_S3_SECRET_ACCESS_KEY=your-secret
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLIC_KEY=pk_test_...
FRONTEND_URL=  (leave empty for now)
```

### Frontend

Create `frontend/.env.production`:

```
VITE_API_URL=  (leave empty for now)
VITE_STRIPE_PUBLIC_KEY=pk_test_...
```

## Step 5: Build and Push Docker Images (10 minutes)

### Windows (PowerShell):

```powershell
# Deploy both backend and frontend
.\deploy-to-ecr.ps1

# Or deploy individually
.\deploy-to-ecr.ps1 -Backend
.\deploy-to-ecr.ps1 -Frontend
```

### Mac/Linux:

```bash
# Make script executable
chmod +x deploy-to-ecr.sh

# Deploy both
./deploy-to-ecr.sh

# Or deploy individually
./deploy-to-ecr.sh backend
./deploy-to-ecr.sh frontend
```

## Step 6: Deploy Backend to App Runner (10 minutes)

1. Go to [AWS App Runner Console](https://console.aws.amazon.com/apprunner)
2. Click **Create service**
3. **Source:**
   - Repository type: **Container registry**
   - Provider: **Amazon ECR**
   - Container image URI: Select `bm-gotyaback-backend:latest`
   - Deployment trigger: **Manual**
4. **Service settings:**
   - Service name: `bm-gotyaback-backend`
   - Port: `8080`
   - CPU: `1 vCPU`
   - Memory: `2 GB`
5. **Environment variables:** Add all backend variables from Step 4
6. **Health check:**
   - Path: `/api`
   - Interval: 10 seconds
7. Click **Create & deploy**

Wait 5-10 minutes. **Save the service URL** (e.g., `https://abc123.us-east-1.awsapprunner.com`)

## Step 7: Configure Stripe Webhook (3 minutes)

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. Click **Add endpoint**
3. Endpoint URL: `https://YOUR_BACKEND_URL/api/payment/webhook`
4. Select events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Copy the **Signing secret** (starts with `whsec_`)
6. Update App Runner backend:
   - Configuration → Environment variables
   - Add/Update: `STRIPE_WEBHOOK_SECRET=whsec_...`
   - Click **Deploy**

## Step 8: Deploy Frontend (10 minutes)

1. Update `frontend/.env.production`:

   ```
   VITE_API_URL=https://YOUR_BACKEND_URL/api
   VITE_STRIPE_PUBLIC_KEY=pk_test_...
   ```

2. Rebuild and push frontend:

   ```powershell
   # Windows
   .\deploy-to-ecr.ps1 -Frontend

   # Mac/Linux
   ./deploy-to-ecr.sh frontend
   ```

3. Create App Runner service:
   - Repository: `bm-gotyaback-frontend:latest`
   - Service name: `bm-gotyaback-frontend`
   - Port: `8080`
   - CPU: `0.25 vCPU`, Memory: `0.5 GB`
   - Health check path: `/health`
   - Environment variables: (from `.env.production`)

**Save the frontend URL**

## Step 9: Final Configuration (2 minutes)

Update backend App Runner service:

- Environment variables → `FRONTEND_URL`: Add your frontend URL
- Click **Deploy**

## Step 10: Test! (5 minutes)

1. Open your frontend URL in browser
2. Register a new account
3. Create a test campaign
4. Try uploading an image
5. Test a payment with card: `4242 4242 4242 4242`

## ✅ You're Live!

Your application is now running on AWS App Runner!

---

## Costs

- **Backend**: ~$46/month (1 vCPU, 2 GB)
- **Frontend**: ~$12/month (0.25 vCPU, 0.5 GB)
- **MongoDB Atlas**: Free tier or $9/month
- **Total**: ~$60-70/month

---

## Common Issues

### "Service failed to start"

- Check logs in App Runner console
- Verify MongoDB connection string
- Ensure all environment variables are set

### "CORS error"

- Verify `FRONTEND_URL` in backend matches your frontend URL exactly
- Redeploy backend after updating

### "Cannot connect to database"

- Check MongoDB Atlas network access allows `0.0.0.0/0`
- Verify connection string format
- Check username/password (URL encode special characters)

---

## Next Steps

- [ ] Set up custom domain (see full guide)
- [ ] Configure CloudWatch alarms
- [ ] Set up CI/CD with GitHub Actions
- [ ] Enable MongoDB backups
- [ ] Switch to Stripe live mode

---

## Need Help?

See the detailed guide: `AWS_APPRUNNER_DEPLOYMENT_GUIDE.md`

Or check the troubleshooting section in the full guide.
