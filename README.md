# BM GotYaBack - Fundraising Campaign Platform

A full-stack fundraising platform for selling custom t-shirts to support causes and campaigns.

## 🚀 Quick Start

### Local Development

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

### Deploy to AWS App Runner

**Recommended: Single Instance Deployment** (saves 50% on costs)

```bash
# Windows
.\deploy-combined.ps1

# Mac/Linux
chmod +x deploy-combined.sh
./deploy-combined.sh
```

Then follow the [deployment guide](docs/SINGLE_INSTANCE_DEPLOYMENT.md).

---

## 📚 Documentation

### Getting Started

- **[Deployment Quick Reference](docs/DEPLOYMENT_QUICK_REFERENCE.md)** - Start here! ⭐
- **[Deployment Options](docs/DEPLOYMENT_OPTIONS.md)** - Compare single vs two-instance deployment

### Deployment Guides

- **[Single Instance Deployment](docs/SINGLE_INSTANCE_DEPLOYMENT.md)** - Recommended (~$25/month)
- **[Two Instance Deployment](docs/QUICK_START_DEPLOYMENT.md)** - Advanced (~$58/month)
- **[Detailed AWS Guide](docs/AWS_APPRUNNER_DEPLOYMENT_GUIDE.md)** - Step-by-step instructions

### Reference

- **[Troubleshooting](docs/TROUBLESHOOTING.md)** - Common issues and solutions
- **[Deployment Checklist](docs/DEPLOYMENT_CHECKLIST.md)** - Track your progress
- **[Docker Build Fixes](docs/DOCKER_BUILD_FIXES.md)** - Issues resolved

### Development Guides

- **[Implementation Plan](docs/IMPLEMENTATION_PLAN.md)** - Feature roadmap
- **[Project Structure](docs/project_structure_guidelines.md)** - Code organization
- **[Full Build Guide](docs/fundraising_shirt_campaign_platform_full_build_guide.md)** - Complete feature list

---

## 🏗️ Architecture

### Single Instance (Recommended)

```
User → Nginx:8080 → React (static files)
                  → /api → Node.js:3000 → MongoDB/S3/Stripe
```

**Cost:** ~$25/month

### Two Instances

```
User → Frontend (Nginx + React):8080
     → Backend (Node.js):8080 → MongoDB/S3/Stripe
```

**Cost:** ~$58/month

---

## 🛠️ Tech Stack

### Frontend

- React + TypeScript
- Vite
- Ant Design
- React Router

### Backend

- Node.js + Express
- TypeScript
- MongoDB + Mongoose
- JWT Authentication

### Infrastructure

- AWS App Runner
- AWS ECR (Docker Registry)
- AWS S3 (Image Storage)
- MongoDB Atlas
- Stripe (Payments)

---

## 💰 Cost Breakdown

### Single Instance

| Service                   | Cost/Month  |
| ------------------------- | ----------- |
| App Runner (1 vCPU, 2 GB) | ~$25        |
| MongoDB Atlas (Free tier) | $0          |
| S3 Storage                | ~$1-5       |
| **Total**                 | **~$26-30** |

### Two Instances

| Service                   | Cost/Month  |
| ------------------------- | ----------- |
| Backend App Runner        | ~$46        |
| Frontend App Runner       | ~$12        |
| MongoDB Atlas (Free tier) | $0          |
| S3 Storage                | ~$1-5       |
| **Total**                 | **~$59-63** |

---

## 🔑 Environment Variables

### Backend

```bash
PORT=3000                    # 3000 for single, 8080 for two instances
NODE_ENV=production
MONGO_URI=mongodb+srv://...
JWT_SECRET=your-secret
AWS_S3_REGION=us-east-1
AWS_S3_BUCKET=your-bucket
AWS_S3_ACCESS_KEY=...
AWS_S3_SECRET_ACCESS_KEY=...
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

## 📦 Available Scripts

### Deployment

- `deploy-combined.ps1` / `deploy-combined.sh` - Deploy single instance
- `deploy-to-ecr.ps1` / `deploy-to-ecr.sh` - Deploy two instances
- `create-apprunner-role.ps1` / `create-apprunner-role.sh` - Create IAM role

### Docker

- `Dockerfile.combined` - Single instance build
- `backend/Dockerfile` - Backend only
- `frontend/Dockerfile` - Frontend only

---

## 🧪 Testing

```bash
# Test single instance locally
docker build -f Dockerfile.combined -t test .
docker run -p 8080:8080 -e MONGO_URI=... test

# Test two instances locally
docker build -t backend ./backend
docker run -p 8080:8080 -e MONGO_URI=... backend

docker build -t frontend ./frontend
docker run -p 3000:8080 frontend
```

---

## 🆘 Support

- **Quick Help:** [Deployment Quick Reference](docs/DEPLOYMENT_QUICK_REFERENCE.md)
- **Issues:** [Troubleshooting Guide](docs/TROUBLESHOOTING.md)
- **Detailed Guide:** [AWS App Runner Deployment](docs/AWS_APPRUNNER_DEPLOYMENT_GUIDE.md)

---

## 📄 License

MIT

---

**Ready to deploy?** Start with the [Deployment Quick Reference](docs/DEPLOYMENT_QUICK_REFERENCE.md)! 🚀
