# Deployment Troubleshooting Guide

Common issues and solutions for deploying to AWS App Runner.

---

## 🔧 ECR Repository Issues

### Error: "The repository with name 'X' does not exist"

**Problem:** ECR repository hasn't been created yet.

**Solution 1 - Automatic (Recommended):**
The updated deployment scripts now automatically create repositories. Just run:

```bash
# Windows
.\deploy-combined.ps1

# Mac/Linux
./deploy-combined.sh
```

**Solution 2 - Manual:**
Create the repository manually:

```bash
# For single instance
aws ecr create-repository --repository-name bm-gotyaback-combined --region us-east-1

# For two instances
aws ecr create-repository --repository-name bm-gotyaback-backend --region us-east-1
aws ecr create-repository --repository-name bm-gotyaback-frontend --region us-east-1
```

---

## 🔐 AWS Authentication Issues

### Error: "Unable to locate credentials"

**Problem:** AWS CLI is not configured.

**Solution:**

```bash
aws configure
```

Enter your:

- AWS Access Key ID
- AWS Secret Access Key
- Default region (e.g., us-east-1)
- Default output format (json)

### Error: "An error occurred (AccessDeniedException)"

**Problem:** Your AWS user doesn't have the required permissions.

**Solution:** Ensure your IAM user has these policies:

- `AmazonEC2ContainerRegistryFullAccess`
- `AWSAppRunnerFullAccess`
- Or create a custom policy with ECR and App Runner permissions

---

## 🐳 Docker Build Issues

### Error: "docker: command not found"

**Problem:** Docker is not installed or not in PATH.

**Solution:**

1. Install Docker Desktop
2. Start Docker Desktop
3. Verify: `docker --version`

### Error: "Cannot connect to the Docker daemon"

**Problem:** Docker Desktop is not running.

**Solution:**

1. Start Docker Desktop
2. Wait for it to fully start
3. Try again

### Build is very slow (> 5 minutes)

**Problem:** Too much context being sent to Docker.

**Solution:** The `.dockerignore` file should exclude unnecessary files. Verify it exists and contains:

```
**/node_modules
backend/dist
frontend/dist
*.md
.git
```

---

## 🚀 App Runner Deployment Issues

### Service fails to start

**Problem:** Missing or incorrect environment variables.

**Solution:** Verify all required environment variables are set:

**Required for all deployments:**

```
MONGO_URI=mongodb+srv://...
JWT_SECRET=your-secret
AWS_S3_REGION=us-east-1
AWS_S3_BUCKET=your-bucket
AWS_S3_ACCESS_KEY=...
AWS_S3_SECRET_ACCESS_KEY=...
STRIPE_SECRET_KEY=sk_...
STRIPE_PUBLIC_KEY=pk_...
```

**Additional for single instance:**

```
PORT=3000
```

**Additional for two instances (frontend):**

```
VITE_API_URL=https://backend-url/api
VITE_STRIPE_PUBLIC_KEY=pk_...
```

### Health check failing

**Problem:** Health check endpoint not responding.

**Solution:**

**Single instance:** Health check path should be `/health`

**Two instances:**

- Backend: `/api` or `/health`
- Frontend: `/` (default)

Check CloudWatch logs for errors.

### Service starts but shows 502/503 errors

**Problem:** Application is crashing or not listening on correct port.

**Solution:**

1. Check CloudWatch logs: `/aws/apprunner/your-service-name`
2. Verify port configuration:
   - Single instance: Port 8080
   - Two instances: Port 8080 for both
3. Check environment variables
4. Verify MongoDB connection

---

## 🗄️ MongoDB Connection Issues

### Error: "MongoServerError: bad auth"

**Problem:** Incorrect MongoDB credentials.

**Solution:**

1. Verify `MONGO_URI` is correct
2. Check username and password
3. Ensure user has read/write permissions

### Error: "MongooseServerSelectionError"

**Problem:** MongoDB Atlas network access not configured.

**Solution:**

1. Go to MongoDB Atlas → Network Access
2. Add IP address: `0.0.0.0/0` (allow from anywhere)
3. Wait 1-2 minutes for changes to propagate

### Connection timeout

**Problem:** Network access restrictions or incorrect URI.

**Solution:**

1. Verify MongoDB Atlas cluster is running
2. Check Network Access whitelist
3. Verify connection string format:
   ```
   mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
   ```

---

## 💳 Stripe Integration Issues

### Webhook not receiving events

**Problem:** Webhook URL not configured or incorrect.

**Solution:**

1. Go to Stripe Dashboard → Webhooks
2. Verify endpoint URL:
   - Single instance: `https://your-url/api/payment/webhook`
   - Two instances: `https://backend-url/api/payment/webhook`
3. Verify webhook secret matches `STRIPE_WEBHOOK_SECRET`
4. Check webhook events are selected

### Payment fails with CORS error

**Problem:** CORS not configured (two instances only).

**Solution:** Verify backend CORS configuration includes frontend URL:

```javascript
cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
});
```

---

## 📦 S3 Upload Issues

### Error: "Access Denied"

**Problem:** S3 bucket permissions or incorrect credentials.

**Solution:**

1. Verify IAM user has S3 permissions
2. Check bucket policy allows uploads
3. Verify `AWS_S3_ACCESS_KEY` and `AWS_S3_SECRET_ACCESS_KEY`

### Images upload but don't display

**Problem:** Bucket not public or incorrect URL.

**Solution:**

1. Make bucket public or configure bucket policy
2. Verify `AWS_S3_SERVER_URL` is correct:
   ```
   https://your-bucket.s3.us-east-1.amazonaws.com/
   ```

---

## 🌐 CORS Issues (Two Instances Only)

### Error: "CORS policy: No 'Access-Control-Allow-Origin' header"

**Problem:** Backend not configured to allow frontend origin.

**Solution:**

1. Set `FRONTEND_URL` environment variable in backend
2. Verify CORS middleware is configured
3. Redeploy backend

---

## 📊 CloudWatch Logs

### How to view logs

**AWS Console:**

1. Go to CloudWatch → Log groups
2. Find `/aws/apprunner/your-service-name`
3. View log streams

**AWS CLI:**

```bash
# Tail logs (follow)
aws logs tail /aws/apprunner/your-service-name --follow

# View recent logs
aws logs tail /aws/apprunner/your-service-name --since 1h
```

---

## 🔄 Redeployment Issues

### Changes not appearing after deployment

**Problem:** Browser cache or deployment not triggered.

**Solution:**

1. Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)
2. Verify new image was pushed to ECR
3. Trigger manual deployment in App Runner console
4. Check deployment status in App Runner

### Old image still running

**Problem:** App Runner didn't pull new image.

**Solution:**

1. Verify image tag is `:latest`
2. Manually trigger deployment:
   ```bash
   aws apprunner start-deployment --service-arn YOUR_SERVICE_ARN
   ```

---

## 💰 Unexpected Costs

### Higher than expected charges

**Problem:** Resources not optimized or unexpected usage.

**Solution:**

1. Check App Runner instance size (reduce if possible)
2. Verify auto-scaling settings
3. Check CloudWatch metrics for actual usage
4. Consider single instance deployment to save costs

---

## 🆘 Still Having Issues?

### Debugging Steps:

1. **Check CloudWatch Logs** - Most issues show up here
2. **Verify Environment Variables** - Missing vars cause most failures
3. **Test Locally** - Run Docker image locally to isolate issues
4. **Check AWS Service Health** - Verify no AWS outages
5. **Review Documentation** - Check deployment guides again

### Get Help:

- Review: [DEPLOYMENT_QUICK_REFERENCE.md](DEPLOYMENT_QUICK_REFERENCE.md)
- Detailed guide: [AWS_APPRUNNER_DEPLOYMENT_GUIDE.md](AWS_APPRUNNER_DEPLOYMENT_GUIDE.md)
- AWS Support: https://console.aws.amazon.com/support

---

## ✅ Quick Checklist

Before asking for help, verify:

- [ ] AWS CLI is configured (`aws sts get-caller-identity`)
- [ ] Docker is running (`docker ps`)
- [ ] ECR repository exists
- [ ] All environment variables are set
- [ ] MongoDB Atlas network access allows 0.0.0.0/0
- [ ] S3 bucket exists and has correct permissions
- [ ] Stripe keys are correct (test vs live)
- [ ] CloudWatch logs checked for errors
- [ ] Health check endpoint is correct
- [ ] Port configuration is correct (8080 for App Runner)

---

**Most issues are related to environment variables or network access. Double-check these first!** 🔍
