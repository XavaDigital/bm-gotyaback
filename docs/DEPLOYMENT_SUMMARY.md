# AWS App Runner Deployment - Summary

## 📁 Files Created

### Docker Configuration
- ✅ `backend/Dockerfile` - Multi-stage build for Node.js backend
- ✅ `backend/.dockerignore` - Excludes unnecessary files
- ✅ `frontend/Dockerfile` - Multi-stage build with Nginx
- ✅ `frontend/nginx.conf` - Nginx configuration for SPA routing
- ✅ `frontend/.dockerignore` - Excludes unnecessary files

### Deployment Scripts
- ✅ `deploy-to-ecr.sh` - Bash script for Mac/Linux
- ✅ `deploy-to-ecr.ps1` - PowerShell script for Windows

### Documentation
- ✅ `AWS_APPRUNNER_DEPLOYMENT_GUIDE.md` - Complete step-by-step guide
- ✅ `QUICK_START_DEPLOYMENT.md` - Fast-track deployment (30-40 min)
- ✅ `DEPLOYMENT_CHECKLIST.md` - Checklist to track progress

### Configuration Templates
- ✅ `backend/.env.example` - Backend environment variables template
- ✅ `frontend/.env.production.example` - Frontend environment variables template

### Code Updates
- ✅ `backend/src/server.ts` - Updated to use port 8080, bind to 0.0.0.0
- ✅ `backend/src/app.ts` - Enhanced CORS configuration

---

## 🚀 Deployment Overview

### Architecture
```
┌─────────────────┐
│   Users/Browsers│
└────────┬────────┘
         │
         ├──────────────────────────────────┐
         │                                  │
         ▼                                  ▼
┌─────────────────┐              ┌─────────────────┐
│  App Runner     │              │  App Runner     │
│  (Frontend)     │◄────────────►│  (Backend API)  │
│  Nginx + React  │   CORS       │  Node.js/Express│
└─────────────────┘              └────────┬────────┘
                                          │
                    ┌─────────────────────┼─────────────────────┐
                    │                     │                     │
                    ▼                     ▼                     ▼
            ┌──────────────┐      ┌──────────────┐    ┌──────────────┐
            │  MongoDB     │      │   AWS S3     │    │   Stripe     │
            │  Atlas       │      │  (Images)    │    │  (Payments)  │
            └──────────────┘      └──────────────┘    └──────────────┘
```

### Services
1. **Backend App Runner Service**
   - Container: Node.js 20 Alpine
   - Port: 8080
   - Resources: 1 vCPU, 2 GB RAM
   - Auto-scaling: 1-25 instances
   - Cost: ~$46/month

2. **Frontend App Runner Service**
   - Container: Nginx Alpine
   - Port: 8080
   - Resources: 0.25 vCPU, 0.5 GB RAM
   - Auto-scaling: 1-25 instances
   - Cost: ~$12/month

3. **MongoDB Atlas**
   - Managed database
   - Free tier: 512 MB
   - Paid: $9/month for 2 GB

4. **AWS S3**
   - Image storage
   - Pay per use: ~$0.023/GB/month

---

## 📋 Deployment Steps (Quick Reference)

### 1. Prerequisites
- AWS account + CLI configured
- MongoDB Atlas cluster
- Stripe account
- Docker installed

### 2. Create ECR Repositories
```bash
aws ecr create-repository --repository-name bm-gotyaback-backend
aws ecr create-repository --repository-name bm-gotyaback-frontend
```

### 3. Build & Push Images
```powershell
# Windows
.\deploy-to-ecr.ps1

# Mac/Linux
./deploy-to-ecr.sh
```

### 4. Deploy Backend
- AWS Console → App Runner → Create service
- Select ECR image: `bm-gotyaback-backend:latest`
- Configure environment variables
- Deploy

### 5. Configure Stripe Webhook
- Stripe Dashboard → Add webhook endpoint
- URL: `https://backend-url/api/payment/webhook`
- Update backend with webhook secret

### 6. Deploy Frontend
- Update `.env.production` with backend URL
- Rebuild and push image
- Create App Runner service
- Deploy

### 7. Final Config
- Update backend `FRONTEND_URL` env var
- Redeploy backend

---

## 🔧 Environment Variables

### Backend (11 variables)
```
PORT=8080
NODE_ENV=production
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
```
VITE_API_URL=https://.../api
VITE_STRIPE_PUBLIC_KEY=pk_...
```

---

## ✅ Testing Checklist

- [ ] Backend health check: `curl https://backend-url/api`
- [ ] Frontend loads in browser
- [ ] User registration works
- [ ] User login works
- [ ] Campaign creation works
- [ ] Image upload to S3 works
- [ ] Stripe test payment works (4242 4242 4242 4242)
- [ ] Webhook receives events
- [ ] No CORS errors in browser console

---

## 💰 Cost Breakdown

| Service | Configuration | Monthly Cost |
|---------|--------------|--------------|
| Backend App Runner | 1 vCPU, 2 GB | ~$46 |
| Frontend App Runner | 0.25 vCPU, 0.5 GB | ~$12 |
| MongoDB Atlas | Free tier / 2 GB | $0 / $9 |
| S3 Storage | Pay per use | ~$1-5 |
| Data Transfer | Pay per use | ~$1-5 |
| **Total** | | **$60-80/month** |

*Costs based on low-medium traffic. Auto-scaling may increase costs during high traffic.*

---

## 🔒 Security Checklist

- [ ] All secrets in environment variables (not in code)
- [ ] `.env` files in `.gitignore`
- [ ] MongoDB network access configured
- [ ] S3 bucket permissions reviewed
- [ ] CORS properly configured
- [ ] HTTPS enforced (automatic with App Runner)
- [ ] Stripe webhook secret configured
- [ ] JWT secret is strong and random

---

## 📊 Monitoring

### CloudWatch Logs
```bash
# View backend logs
aws logs tail /aws/apprunner/bm-gotyaback-backend --follow

# View frontend logs
aws logs tail /aws/apprunner/bm-gotyaback-frontend --follow
```

### Metrics to Monitor
- CPU utilization
- Memory utilization
- Request count
- HTTP 4xx/5xx errors
- Response time

---

## 🔄 CI/CD (Optional)

GitHub Actions workflow files can be created for automatic deployment on push to main branch.

See `AWS_APPRUNNER_DEPLOYMENT_GUIDE.md` for GitHub Actions setup.

---

## 📚 Documentation Files

1. **QUICK_START_DEPLOYMENT.md** - Start here! (30-40 min deployment)
2. **AWS_APPRUNNER_DEPLOYMENT_GUIDE.md** - Detailed guide with troubleshooting
3. **DEPLOYMENT_CHECKLIST.md** - Track your progress
4. **This file** - Overview and summary

---

## 🆘 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Service won't start | Check logs, verify env vars, test MongoDB connection |
| CORS errors | Update `FRONTEND_URL` in backend, redeploy |
| MongoDB connection fails | Whitelist `0.0.0.0/0`, check connection string |
| Stripe webhook fails | Verify URL, check webhook secret, review logs |
| Images not uploading | Check S3 credentials, verify bucket permissions |

---

## 🎯 Next Steps After Deployment

1. Set up custom domain (optional)
2. Configure CloudWatch alarms
3. Set up automated MongoDB backups
4. Implement CI/CD pipeline
5. Switch Stripe to live mode (when ready)
6. Set up staging environment
7. Configure CDN (CloudFront) for better performance

---

## 📞 Support Resources

- [AWS App Runner Docs](https://docs.aws.amazon.com/apprunner/)
- [MongoDB Atlas Docs](https://docs.atlas.mongodb.com/)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)

---

**Ready to deploy?** Start with `QUICK_START_DEPLOYMENT.md`! 🚀

