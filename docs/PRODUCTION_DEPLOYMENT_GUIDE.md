# Production Deployment Guide

## 🚀 Pre-Deployment Checklist

### 1. Environment Variables Configuration

#### **Backend Environment Variables (.env)**

Create a `.env` file in the `backend/` directory with the following variables:

```bash
# Application Environment
NODE_ENV=production
PORT=5000

# Database
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority

# Authentication
JWT_SECRET=<generate-a-strong-random-secret-minimum-32-characters>
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Frontend URL (your production domain)
FRONTEND_URL=https://your-production-domain.com

# AWS S3 Configuration
AWS_S3_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name
AWS_S3_ACCESS_KEY=<your-aws-access-key>
AWS_S3_SECRET_ACCESS_KEY=<your-aws-secret-key>
AWS_S3_SERVER_URL=https://your-bucket-name.s3.amazonaws.com/

# Stripe Configuration (Production Keys)
STRIPE_SECRET_KEY=sk_live_<your-stripe-secret-key>
STRIPE_PUBLIC_KEY=pk_live_<your-stripe-public-key>
STRIPE_WEBHOOK_SECRET=whsec_<your-stripe-webhook-secret>

# Mailgun Configuration
MAILGUN_API_KEY=<your-mailgun-api-key>
MAILGUN_DOMAIN=<your-mailgun-domain>
EMAIL_FROM=noreply@your-domain.com
```

#### **Frontend Environment Variables (.env.production)**

Create a `.env.production` file in the `frontend/` directory:

```bash
VITE_API_URL=https://your-backend-api-url.com/api
VITE_STRIPE_PUBLIC_KEY=pk_live_<your-stripe-public-key>
```

---

## 📋 Step-by-Step Deployment

### Step 1: Set Up MongoDB Atlas (Production Database)

1. **Create MongoDB Atlas Account**: https://www.mongodb.com/cloud/atlas
2. **Create a Cluster**:
   - Choose a cloud provider (AWS recommended)
   - Select region closest to your users
   - Choose M10 or higher for production
3. **Create Database User**:
   - Database Access → Add New Database User
   - Use strong password
   - Grant read/write access
4. **Whitelist IP Addresses**:
   - Network Access → Add IP Address
   - For AWS App Runner, add `0.0.0.0/0` (or use VPC peering for better security)
5. **Get Connection String**:
   - Clusters → Connect → Connect your application
   - Copy the connection string
   - Replace `<password>` and `<database>` in the string

### Step 2: Set Up AWS S3 (File Storage)

1. **Create S3 Bucket**:
   ```bash
   aws s3 mb s3://your-bucket-name --region us-east-1
   ```

2. **Configure Bucket CORS**:
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
       "AllowedOrigins": ["https://your-production-domain.com"],
       "ExposeHeaders": ["ETag"]
     }
   ]
   ```

3. **Create IAM User**:
   - IAM → Users → Add User
   - Enable programmatic access
   - Attach policy: `AmazonS3FullAccess` (or create custom policy)
   - Save Access Key ID and Secret Access Key

### Step 3: Set Up Stripe (Payment Processing)

1. **Create Stripe Account**: https://stripe.com
2. **Get API Keys**:
   - Dashboard → Developers → API Keys
   - Copy Publishable Key and Secret Key
3. **Set Up Webhook**:
   - Dashboard → Developers → Webhooks
   - Add endpoint: `https://your-backend-url.com/api/payment/webhook`
   - Select events: `checkout.session.completed`, `payment_intent.succeeded`
   - Copy Webhook Secret

### Step 4: Set Up Mailgun (Email Service)

1. **Create Mailgun Account**: https://www.mailgun.com
2. **Add Domain**:
   - Sending → Domains → Add New Domain
   - Follow DNS configuration instructions
3. **Get API Key**:
   - Settings → API Keys
   - Copy Private API Key

### Step 5: Deploy Backend (AWS App Runner)

1. **Build Docker Image**:
   ```bash
   cd backend
   docker build -t gotyaback-backend .
   ```

2. **Push to AWS ECR**:
   ```bash
   # Create ECR repository
   aws ecr create-repository --repository-name gotyaback-backend

   # Login to ECR
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

   # Tag and push
   docker tag gotyaback-backend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/gotyaback-backend:latest
   docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/gotyaback-backend:latest
   ```

3. **Create App Runner Service**:
   - AWS Console → App Runner → Create Service
   - Source: Container registry (ECR)
   - Select your image
   - Configure:
     - Port: 5000
     - CPU: 1 vCPU
     - Memory: 2 GB
   - Add environment variables from your `.env` file
   - Deploy

4. **Note the App Runner URL** for frontend configuration

### Step 6: Deploy Frontend

1. **Update Environment Variables**:
   - Set `VITE_API_URL` to your App Runner backend URL

2. **Build Frontend**:
   ```bash
   cd frontend
   npm run build
   ```

3. **Deploy to Hosting** (Choose one):
   - **Vercel**: `vercel --prod`
   - **Netlify**: `netlify deploy --prod`
   - **AWS S3 + CloudFront**: Upload `dist/` folder

---

## 🔒 Security Checklist

- [ ] All environment variables are set correctly
- [ ] JWT_SECRET is a strong random string (32+ characters)
- [ ] MongoDB uses strong password and IP whitelist
- [ ] S3 bucket has proper CORS configuration
- [ ] Stripe webhook secret is configured
- [ ] CORS only allows production frontend URL
- [ ] HTTPS is enabled on all endpoints
- [ ] Rate limiting is active
- [ ] Helmet security headers are enabled

---

## 📊 Post-Deployment Monitoring

### Recommended Tools:

1. **Error Tracking**: Sentry (https://sentry.io)
2. **Logging**: AWS CloudWatch or Logtail
3. **Uptime Monitoring**: UptimeRobot or Pingdom
4. **Performance**: New Relic or Datadog

---

## 🧪 Testing Production Deployment

1. **Health Check**:
   ```bash
   curl https://your-backend-url.com/api/health
   ```

2. **Create Test Campaign**
3. **Test Sponsorship Flow**
4. **Test Payment Processing** (use Stripe test mode first)
5. **Test Email Notifications**
6. **Test File Uploads**

---

## 🔄 Continuous Deployment

Set up GitHub Actions for automatic deployment:

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Build and push Docker image
        # Add your deployment steps here
```

---

## 📞 Support & Troubleshooting

### Common Issues:

1. **CORS Errors**: Check FRONTEND_URL matches exactly
2. **Database Connection**: Verify MongoDB IP whitelist
3. **File Upload Fails**: Check S3 credentials and CORS
4. **Payment Fails**: Verify Stripe webhook is receiving events
5. **Emails Not Sending**: Check Mailgun domain verification

### Logs:

- **Backend**: AWS App Runner → Logs
- **Frontend**: Browser console + hosting platform logs
- **Database**: MongoDB Atlas → Metrics

---

## 🎯 Next Steps

After successful deployment:

1. Set up monitoring and alerts
2. Configure backup strategy for MongoDB
3. Set up SSL certificate renewal (if self-managed)
4. Create runbook for common operations
5. Document incident response procedures

