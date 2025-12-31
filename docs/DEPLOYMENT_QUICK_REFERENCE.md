# Deployment Quick Reference Card

## 🚀 Choose Your Deployment

### Option 1: Single Instance (Recommended) 💰
**Cost:** ~$25/month | **Setup Time:** 20 min | **Complexity:** ⭐⭐☆☆☆

```bash
# Windows
.\deploy-combined.ps1

# Mac/Linux
chmod +x deploy-combined.sh && ./deploy-combined.sh
```

📖 **Guide:** [SINGLE_INSTANCE_DEPLOYMENT.md](SINGLE_INSTANCE_DEPLOYMENT.md)

---

### Option 2: Two Instances (Advanced) 🔧
**Cost:** ~$58/month | **Setup Time:** 40 min | **Complexity:** ⭐⭐⭐⭐☆

```bash
# Windows
.\deploy-to-ecr.ps1

# Mac/Linux
chmod +x deploy-to-ecr.sh && ./deploy-to-ecr.sh
```

📖 **Guide:** [QUICK_START_DEPLOYMENT.md](QUICK_START_DEPLOYMENT.md)

---

## 📋 Prerequisites (Both Options)

- [ ] AWS account + CLI configured (`aws configure`)
- [ ] MongoDB Atlas cluster (free tier OK)
- [ ] Stripe account (test mode OK)
- [ ] Docker installed and running

---

## 🔑 Environment Variables

### Backend (Both Options)
```bash
PORT=3000                    # 3000 for single, 8080 for two
NODE_ENV=production
MONGO_URI=mongodb+srv://...
JWT_SECRET=your-secret
AWS_S3_REGION=us-east-1
AWS_S3_BUCKET=your-bucket
AWS_S3_ACCESS_KEY=...
AWS_S3_SECRET_ACCESS_KEY=...
AWS_S3_SERVER_URL=https://...
STRIPE_SECRET_KEY=sk_...
STRIPE_PUBLIC_KEY=pk_...
STRIPE_WEBHOOK_SECRET=whsec_...
FRONTEND_URL=https://...
```

### Frontend (Two Instances Only)
```bash
VITE_API_URL=https://backend-url/api
VITE_STRIPE_PUBLIC_KEY=pk_...
```

---

## 🏗️ Architecture Comparison

### Single Instance
```
User → Nginx:8080 → React (static)
                  → /api → Node:3000
```

### Two Instances
```
User → Frontend:8080 (Nginx + React)
     → Backend:8080 (Node.js)
```

---

## 💰 Cost Comparison

| Item | Single | Two |
|------|--------|-----|
| App Runner | $25 | $58 |
| MongoDB | $0-9 | $0-9 |
| S3 | $1-5 | $1-5 |
| **Total** | **$26-39** | **$59-72** |

---

## ⚡ Quick Commands

### Create ECR Repository
```bash
# Single instance
aws ecr create-repository --repository-name bm-gotyaback-combined

# Two instances
aws ecr create-repository --repository-name bm-gotyaback-backend
aws ecr create-repository --repository-name bm-gotyaback-frontend
```

### Build Locally
```bash
# Single instance
docker build -f Dockerfile.combined -t combined .

# Two instances
docker build -t backend ./backend
docker build -t frontend ./frontend
```

### Test Locally
```bash
# Single instance
docker run -p 8080:8080 -e MONGO_URI=... combined

# Two instances
docker run -p 8080:8080 -e MONGO_URI=... backend
docker run -p 3000:8080 frontend
```

### View Logs
```bash
# Single instance
aws logs tail /aws/apprunner/bm-gotyaback --follow

# Two instances
aws logs tail /aws/apprunner/bm-gotyaback-backend --follow
aws logs tail /aws/apprunner/bm-gotyaback-frontend --follow
```

---

## ✅ Testing Checklist

- [ ] Health check: `curl https://your-url/health`
- [ ] API check: `curl https://your-url/api`
- [ ] Frontend loads in browser
- [ ] User registration works
- [ ] Campaign creation works
- [ ] Image upload works
- [ ] Stripe payment works (4242 4242 4242 4242)

---

## 🆘 Common Issues

| Issue | Solution |
|-------|----------|
| Service won't start | Check CloudWatch logs, verify env vars |
| API 404 errors | Check Nginx proxy config (single) or CORS (two) |
| MongoDB connection fails | Whitelist 0.0.0.0/0 in Atlas |
| Stripe webhook fails | Verify URL and secret |

---

## 📊 Resource Recommendations

### Single Instance
| Traffic | CPU | Memory | Cost |
|---------|-----|--------|------|
| Low | 0.25 | 0.5 GB | $12 |
| Medium | 1 | 2 GB | $25 ⭐ |
| High | 2 | 4 GB | $50 |

### Two Instances
| Service | CPU | Memory | Cost |
|---------|-----|--------|------|
| Backend | 1 | 2 GB | $46 |
| Frontend | 0.25 | 0.5 GB | $12 |

---

## 🔄 Update & Redeploy

### Single Instance
```bash
# Rebuild and push
.\deploy-combined.ps1

# Trigger deployment
aws apprunner start-deployment --service-arn YOUR_ARN
```

### Two Instances
```bash
# Backend only
.\deploy-to-ecr.ps1 -Backend

# Frontend only
.\deploy-to-ecr.ps1 -Frontend

# Both
.\deploy-to-ecr.ps1
```

---

## 📚 Full Documentation

- **Comparison**: [DEPLOYMENT_OPTIONS.md](DEPLOYMENT_OPTIONS.md)
- **Single Instance**: [SINGLE_INSTANCE_DEPLOYMENT.md](SINGLE_INSTANCE_DEPLOYMENT.md)
- **Two Instances**: [QUICK_START_DEPLOYMENT.md](QUICK_START_DEPLOYMENT.md)
- **Detailed Guide**: [AWS_APPRUNNER_DEPLOYMENT_GUIDE.md](AWS_APPRUNNER_DEPLOYMENT_GUIDE.md)
- **Checklist**: [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)

---

## 🎯 Decision Helper

**Choose Single Instance if:**
- ✅ Cost is a priority
- ✅ Traffic < 10k users/month
- ✅ You want simplicity

**Choose Two Instances if:**
- ✅ Need independent scaling
- ✅ High traffic (> 10k users/month)
- ✅ Deploy frontend/backend separately

---

**Still unsure?** Start with Single Instance - you can always migrate later! 🚀

