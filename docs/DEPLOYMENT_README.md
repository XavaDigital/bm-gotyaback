# 🚀 AWS App Runner Deployment Guide

Complete deployment setup for the **bm-gotyaback** fundraising platform on AWS App Runner.

## 📚 Documentation Overview

This deployment package includes everything you need to deploy your application to AWS App Runner:

### Quick Start (Recommended)
👉 **[QUICK_START_DEPLOYMENT.md](QUICK_START_DEPLOYMENT.md)** - Get deployed in 30-40 minutes

### Detailed Guides
- **[AWS_APPRUNNER_DEPLOYMENT_GUIDE.md](AWS_APPRUNNER_DEPLOYMENT_GUIDE.md)** - Complete step-by-step guide with troubleshooting
- **[DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)** - Track your deployment progress
- **[DEPLOYMENT_SUMMARY.md](DEPLOYMENT_SUMMARY.md)** - Overview and architecture

---

## 🎯 What's Included

### Docker Configuration
```
backend/
├── Dockerfile              # Multi-stage Node.js build
└── .dockerignore          # Optimized build context

frontend/
├── Dockerfile              # Multi-stage React + Nginx build
├── nginx.conf             # SPA routing configuration
└── .dockerignore          # Optimized build context
```

### Deployment Scripts
```
deploy-to-ecr.sh           # Bash script (Mac/Linux)
deploy-to-ecr.ps1          # PowerShell script (Windows)
```

### Environment Templates
```
backend/.env.example                    # Backend configuration
frontend/.env.production.example        # Frontend configuration
```

### Updated Code
- ✅ `backend/src/server.ts` - Port 8080, bind to 0.0.0.0
- ✅ `backend/src/app.ts` - Enhanced CORS configuration

---

## ⚡ Quick Start

### 1. Prerequisites (5 min)
- AWS account with CLI configured
- MongoDB Atlas account (free tier works)
- Stripe account (test mode is fine)
- Docker installed

### 2. Deploy (30-40 min)
Follow **[QUICK_START_DEPLOYMENT.md](QUICK_START_DEPLOYMENT.md)**

### 3. Test
- Open your frontend URL
- Register, create campaign, test payment

---

## 🏗️ Architecture

```
Users → Frontend (App Runner) → Backend (App Runner) → MongoDB Atlas
                                      ↓
                                   AWS S3 + Stripe
```

**Services:**
- **Frontend**: Nginx + React (0.25 vCPU, 0.5 GB) - ~$12/month
- **Backend**: Node.js + Express (1 vCPU, 2 GB) - ~$46/month
- **Database**: MongoDB Atlas (Free tier or $9/month)
- **Storage**: AWS S3 (Pay per use)

**Total Cost: ~$60-80/month**

---

## 📋 Deployment Steps Summary

1. **Prepare** - Set up MongoDB, AWS, Stripe
2. **Build** - Create Docker images
3. **Push** - Upload to ECR
4. **Deploy Backend** - Create App Runner service
5. **Configure** - Set up Stripe webhook
6. **Deploy Frontend** - Create App Runner service
7. **Test** - Verify everything works

---

## 🔧 Environment Variables

### Backend (11 variables)
```bash
PORT=8080
MONGO_URI=mongodb+srv://...
JWT_SECRET=...
AWS_S3_REGION=us-east-1
AWS_S3_BUCKET=...
AWS_S3_ACCESS_KEY=...
AWS_S3_SECRET_ACCESS_KEY=...
STRIPE_SECRET_KEY=sk_...
STRIPE_PUBLIC_KEY=pk_...
STRIPE_WEBHOOK_SECRET=whsec_...
FRONTEND_URL=https://...
```

### Frontend (2 variables)
```bash
VITE_API_URL=https://.../api
VITE_STRIPE_PUBLIC_KEY=pk_...
```

---

## 🚀 Deployment Commands

### Windows (PowerShell)
```powershell
# Deploy both services
.\deploy-to-ecr.ps1

# Deploy individually
.\deploy-to-ecr.ps1 -Backend
.\deploy-to-ecr.ps1 -Frontend
```

### Mac/Linux
```bash
# Make executable
chmod +x deploy-to-ecr.sh

# Deploy both services
./deploy-to-ecr.sh

# Deploy individually
./deploy-to-ecr.sh backend
./deploy-to-ecr.sh frontend
```

---

## ✅ Testing Checklist

After deployment, verify:
- [ ] Backend health: `curl https://backend-url/api`
- [ ] Frontend loads in browser
- [ ] User registration works
- [ ] Campaign creation works
- [ ] Image upload works
- [ ] Stripe payment works (test card: 4242 4242 4242 4242)
- [ ] No CORS errors

---

## 🆘 Common Issues

| Issue | Quick Fix |
|-------|-----------|
| Service won't start | Check logs in App Runner console |
| CORS errors | Update `FRONTEND_URL` in backend, redeploy |
| MongoDB connection fails | Whitelist `0.0.0.0/0` in Atlas |
| Stripe webhook fails | Verify webhook URL and secret |

See **[AWS_APPRUNNER_DEPLOYMENT_GUIDE.md](AWS_APPRUNNER_DEPLOYMENT_GUIDE.md)** for detailed troubleshooting.

---

## 📊 Monitoring

### View Logs
```bash
# Backend logs
aws logs tail /aws/apprunner/bm-gotyaback-backend --follow

# Frontend logs
aws logs tail /aws/apprunner/bm-gotyaback-frontend --follow
```

### CloudWatch Metrics
- CPU/Memory utilization
- Request count
- HTTP errors
- Response time

---

## 🔒 Security Best Practices

- ✅ All secrets in environment variables
- ✅ `.env` files in `.gitignore`
- ✅ HTTPS enforced (automatic)
- ✅ MongoDB network access configured
- ✅ S3 bucket permissions reviewed
- ✅ CORS properly configured

---

## 🎯 Next Steps

After successful deployment:

1. **Custom Domain** - Add your own domain
2. **Monitoring** - Set up CloudWatch alarms
3. **Backups** - Configure MongoDB backups
4. **CI/CD** - Automate deployments with GitHub Actions
5. **Production** - Switch Stripe to live mode

---

## 📞 Support

- **AWS App Runner**: https://docs.aws.amazon.com/apprunner/
- **MongoDB Atlas**: https://docs.atlas.mongodb.com/
- **Stripe**: https://stripe.com/docs/webhooks
- **Docker**: https://docs.docker.com/

---

## 🎉 Ready to Deploy?

Start here: **[QUICK_START_DEPLOYMENT.md](QUICK_START_DEPLOYMENT.md)**

Good luck! 🚀

