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


Fundraising Shirt Campaign Platform - A platform for creating and managing fundraising campaigns with custom shirt placements.

## 📁 Project Structure

```
bm-gotyaback/
├── backend/                 # Node.js + Express + MongoDB backend
├── frontend/                # Current Vite + React frontend
├── tanstack/                # NEW: TanStack Start migration (in progress)
└── docs/                    # Documentation files
```

## 🚀 Current Stack

### Backend
- **Framework**: Express.js + TypeScript
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT
- **Payments**: Stripe
- **Storage**: AWS S3

### Frontend (Current - Vite)
- **Framework**: React 19.2.0
- **Build Tool**: Vite 7.2.4
- **Routing**: React Router DOM 7.10.1
- **UI Library**: Ant Design 6.1.1
- **Language**: TypeScript

### Frontend (New - TanStack Start)
- **Framework**: TanStack Start (SSR)
- **Routing**: TanStack Router (file-based)
- **UI Library**: Ant Design 6.1.1 (preserved)
- **Language**: TypeScript

## 📖 Documentation

### Main Documentation
- **[TANSTACK_MIGRATION_SUMMARY.md](./TANSTACK_MIGRATION_SUMMARY.md)** - Start here for migration overview

### TanStack Migration Docs (in `tanstack/` folder)
- **[INDEX.md](./tanstack/INDEX.md)** - Navigation guide
- **[README.md](./tanstack/README.md)** - Project overview
- **[QUICK_START.md](./tanstack/QUICK_START.md)** - Get started in 30 minutes
- **[QUICK_REFERENCE.md](./tanstack/QUICK_REFERENCE.md)** - One-page cheat sheet
- **[MIGRATION_GUIDE.md](./tanstack/MIGRATION_GUIDE.md)** - Complete migration guide
- **[MIGRATION_CHECKLIST.md](./tanstack/MIGRATION_CHECKLIST.md)** - Progress tracker
- **[COMPARISON.md](./tanstack/COMPARISON.md)** - Vite vs TanStack comparison
- **[TEMPLATES.md](./tanstack/TEMPLATES.md)** - Code templates
- **[TROUBLESHOOTING.md](./tanstack/TROUBLESHOOTING.md)** - Common issues

### Existing Documentation
- **[fundraising_shirt_campaign_platform_full_build_guide.md](./fundraising_shirt_campaign_platform_full_build_guide.md)**
- **[optional_stripe_payment_implementation_guide.md](./optional_stripe_payment_implementation_guide.md)**
- **[organizer_profile_and_multi-campaign_guide.md](./organizer_profile_and_multi-campaign_guide.md)**
- **[project_structure_guidelines.md](./project_structure_guidelines.md)**
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)**

## 🏃 Quick Start

### Backend
```bash
cd backend
npm install
cp .env.example .env  # Configure your environment
npm run dev           # Starts on port 5000
```

### Frontend (Current - Vite)
```bash
cd frontend
npm install
npm run dev           # Starts on port 5173
```

### Frontend (New - TanStack Start)
```bash
cd tanstack
# Follow QUICK_START.md for setup
npm run dev           # Will start on port 3000
```

## 🔄 Migration Status

**Status**: Documentation complete, implementation ready to begin

The TanStack Start migration documentation is complete with:
- ✅ 12 comprehensive documentation files
- ✅ 4 visual diagrams
- ✅ 14+ code templates
- ✅ 150+ checklist items
- ✅ Step-by-step migration guide

**Next Steps**:
1. Read [TANSTACK_MIGRATION_SUMMARY.md](./TANSTACK_MIGRATION_SUMMARY.md)
2. Follow [tanstack/QUICK_START.md](./tanstack/QUICK_START.md)
3. Execute migration using [tanstack/MIGRATION_GUIDE.md](./tanstack/MIGRATION_GUIDE.md)

## 🎯 Features

- ✅ User authentication and authorization
- ✅ Campaign creation and management
- ✅ Custom shirt placement grid
- ✅ Sponsorship checkout with Stripe
- ✅ Organizer profiles and landing pages
- ✅ Public campaign pages
- ✅ Image uploads to AWS S3
- ✅ Rich text editor for campaign descriptions

## 🛠️ Tech Stack Details

### Backend Dependencies
- express
- mongoose
- jsonwebtoken
- bcryptjs
- stripe
- @aws-sdk/client-s3
- multer
- cors

### Frontend Dependencies (Current)
- react
- react-dom
- react-router-dom
- antd
- axios
- @stripe/stripe-js
- @stripe/react-stripe-js
- quill (rich text editor)

### Frontend Dependencies (New - TanStack)
- @tanstack/start
- @tanstack/react-router
- @tanstack/react-query
- antd (preserved)
- axios (preserved)
- @stripe/stripe-js (preserved)

## 📝 Environment Variables

### Backend (.env)
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/bm-gotyaback
JWT_SECRET=your_jwt_secret
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_S3_BUCKET=your_bucket_name
STRIPE_SECRET_KEY=sk_test_...
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
VITE_STRIPE_PUBLIC_KEY=pk_test_...
```

## 🚢 Deployment

### Backend
- Can be deployed to any Node.js hosting (Heroku, Railway, DigitalOcean, etc.)
- Requires MongoDB connection
- Requires AWS S3 for file storage

### Frontend (Current - Vite)
- Static site deployment (Vercel, Netlify, etc.)
- Build: `npm run build`
- Output: `dist/` folder

### Frontend (New - TanStack Start)
- SSR deployment (Vercel recommended)
- Build: `npm run build`
- Start: `npm start`
- See [tanstack/MIGRATION_GUIDE.md](./tanstack/MIGRATION_GUIDE.md) Phase 9 for details

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📄 License

[Add your license here]

## 🆘 Support

For migration help, see:
- [TANSTACK_MIGRATION_SUMMARY.md](./TANSTACK_MIGRATION_SUMMARY.md)
- [tanstack/TROUBLESHOOTING.md](./tanstack/TROUBLESHOOTING.md)

---

**Current Version**: 1.0.0
**Last Updated**: 2026-01-07