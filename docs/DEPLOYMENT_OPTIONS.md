# Deployment Options Comparison

Choose the deployment strategy that best fits your needs.

## 📊 Quick Comparison

| Feature | Single Instance | Two Instances |
|---------|----------------|---------------|
| **Monthly Cost** | ~$25-35 | ~$58 |
| **Complexity** | Simple | Moderate |
| **Instances** | 1 | 2 |
| **Scaling** | Coupled | Independent |
| **Deployment Time** | Faster | Slower |
| **CORS Setup** | Not needed | Required |
| **Best For** | Small-medium apps | Large apps |

---

## 🎯 Recommendation

### 👉 **Start with Single Instance**

For most users, especially those just getting started, we recommend the **single instance deployment**:

- ✅ **50% cheaper** (~$30/month savings)
- ✅ **Simpler to set up** (one service vs two)
- ✅ **Easier to manage** (one set of logs, one URL)
- ✅ **No CORS complexity** (everything on same domain)
- ✅ **Faster deployment** (one image to build/push)

You can always migrate to two instances later if needed.

---

## Option 1: Single Instance (Recommended)

### Architecture
```
User → Nginx:8080 → Frontend (static files)
                  → /api → Node:3000 → MongoDB/S3/Stripe
```

### Cost Breakdown
- **App Runner**: 1 vCPU, 2 GB = ~$25/month
- **MongoDB Atlas**: Free tier or $9/month
- **S3**: ~$1-5/month
- **Total**: **~$35-40/month**

### Pros
- ✅ Lower cost (50% savings)
- ✅ Single URL (no CORS issues)
- ✅ Simpler deployment
- ✅ Easier to manage
- ✅ Faster (no network hop)

### Cons
- ⚠️ Frontend and backend scale together
- ⚠️ Larger Docker image (~400MB)
- ⚠️ Must rebuild for frontend changes
- ⚠️ Slightly more complex Dockerfile

### When to Use
- ✅ You're cost-conscious
- ✅ Low to medium traffic (< 10k users/month)
- ✅ You deploy frontend and backend together
- ✅ You want simplicity

### Files Needed
- `Dockerfile.combined`
- `nginx.combined.conf`
- `supervisord.conf`
- `.dockerignore.combined`

### Deployment Guide
📖 **[SINGLE_INSTANCE_DEPLOYMENT.md](SINGLE_INSTANCE_DEPLOYMENT.md)**

### Quick Start
```bash
# Windows
.\deploy-combined.ps1

# Mac/Linux
chmod +x deploy-combined.sh
./deploy-combined.sh
```

---

## Option 2: Two Instances (Original)

### Architecture
```
User → Frontend (Nginx:8080) → Backend (Node:8080) → MongoDB/S3/Stripe
```

### Cost Breakdown
- **Backend App Runner**: 1 vCPU, 2 GB = ~$46/month
- **Frontend App Runner**: 0.25 vCPU, 0.5 GB = ~$12/month
- **MongoDB Atlas**: Free tier or $9/month
- **S3**: ~$1-5/month
- **Total**: **~$68-80/month**

### Pros
- ✅ Independent scaling
- ✅ Smaller individual images
- ✅ Deploy frontend/backend separately
- ✅ Better for microservices architecture

### Cons
- ⚠️ Higher cost (2x instances)
- ⚠️ CORS configuration required
- ⚠️ More complex setup
- ⚠️ Two services to manage

### When to Use
- ✅ High traffic with different patterns
- ✅ Need independent scaling
- ✅ Deploy frontend and backend separately
- ✅ Want maximum flexibility
- ✅ Microservices architecture

### Files Needed
- `backend/Dockerfile`
- `frontend/Dockerfile`
- `frontend/nginx.conf`
- Backend/Frontend `.dockerignore`

### Deployment Guide
📖 **[QUICK_START_DEPLOYMENT.md](QUICK_START_DEPLOYMENT.md)**

### Quick Start
```bash
# Windows
.\deploy-to-ecr.ps1

# Mac/Linux
chmod +x deploy-to-ecr.sh
./deploy-to-ecr.sh
```

---

## 🔄 Migration Between Options

### From Single → Two Instances

**Why migrate:**
- Traffic has grown significantly
- Need independent scaling
- Want to deploy frontend/backend separately

**How to migrate:**
1. Build separate images using existing Dockerfiles
2. Create two App Runner services
3. Configure CORS in backend
4. Update frontend environment variables
5. Redeploy

**Estimated time:** 30-45 minutes

### From Two → Single Instance

**Why migrate:**
- Reduce costs
- Simplify management
- Lower traffic than expected

**How to migrate:**
1. Build combined image using `Dockerfile.combined`
2. Create single App Runner service
3. Remove CORS configuration
4. Update Stripe webhook URL
5. Delete old services

**Estimated time:** 20-30 minutes

---

## 💡 Decision Tree

```
Start here
    ↓
Are you cost-conscious?
    ├─ Yes → Single Instance ✅
    └─ No → Continue
              ↓
Do you have > 10k users/month?
    ├─ Yes → Two Instances
    └─ No → Continue
              ↓
Do you deploy frontend/backend separately?
    ├─ Yes → Two Instances
    └─ No → Single Instance ✅
```

---

## 📈 Scaling Considerations

### Single Instance Scaling
- **0.25 vCPU / 0.5 GB**: ~500 users/month (~$12/month)
- **1 vCPU / 2 GB**: ~5k users/month (~$25/month) ⭐ Recommended
- **2 vCPU / 4 GB**: ~20k users/month (~$50/month)

### Two Instance Scaling
- **Backend**: Scale based on API load
- **Frontend**: Usually needs less resources
- **Independent**: Can scale each service differently

---

## 🧪 Testing Both Options

You can test both locally before deploying:

### Test Single Instance
```bash
docker build -f Dockerfile.combined -t test-combined .
docker run -p 8080:8080 -e MONGO_URI=... test-combined
# Visit http://localhost:8080
```

### Test Two Instances
```bash
# Backend
docker build -t test-backend ./backend
docker run -p 8080:8080 -e MONGO_URI=... test-backend

# Frontend (in another terminal)
docker build -t test-frontend ./frontend
docker run -p 3000:8080 test-frontend
# Visit http://localhost:3000
```

---

## 📊 Real-World Examples

### Startup / MVP (< 1k users)
**Recommendation:** Single Instance (0.25 vCPU)
- **Cost:** ~$12/month
- **Why:** Minimal cost, easy to manage

### Small Business (1k-10k users)
**Recommendation:** Single Instance (1 vCPU) ⭐
- **Cost:** ~$25/month
- **Why:** Good balance of cost and performance

### Growing Business (10k-50k users)
**Recommendation:** Two Instances
- **Cost:** ~$60-80/month
- **Why:** Better scaling, more flexibility

### Enterprise (> 50k users)
**Recommendation:** Two Instances + CDN
- **Cost:** $100+/month
- **Why:** Maximum performance and scalability

---

## 🎯 Our Recommendation

### For Most Users: **Single Instance** 🏆

Start with the single instance deployment:
1. **Lower cost** - Save ~$30/month
2. **Simpler** - One service to manage
3. **Faster** - Quick to deploy
4. **Sufficient** - Handles most use cases

You can always upgrade to two instances later if you need:
- Independent scaling
- Separate deployment cycles
- Microservices architecture

---

## 📚 Documentation

- **Single Instance**: [SINGLE_INSTANCE_DEPLOYMENT.md](SINGLE_INSTANCE_DEPLOYMENT.md)
- **Two Instances**: [QUICK_START_DEPLOYMENT.md](QUICK_START_DEPLOYMENT.md)
- **Detailed Guide**: [AWS_APPRUNNER_DEPLOYMENT_GUIDE.md](AWS_APPRUNNER_DEPLOYMENT_GUIDE.md)

---

**Ready to deploy?** Choose your option and follow the guide! 🚀

