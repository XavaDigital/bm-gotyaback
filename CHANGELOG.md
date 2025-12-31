# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### [CHANGE-001] - 2025-12-31 - Project Reorganization and AWS Deployment Infrastructure

#### Added
- **Documentation Structure**
  - Created `docs/` directory with comprehensive deployment and development documentation (18 files)
  - Added `docs/README.md` as documentation index with categorized guides
  - Created deployment guides:
    - `DEPLOYMENT_QUICK_REFERENCE.md` - Quick start commands and tips
    - `DEPLOYMENT_OPTIONS.md` - Single vs two-instance deployment comparison
    - `SINGLE_INSTANCE_DEPLOYMENT.md` - Recommended deployment guide (~$25/month)
    - `QUICK_START_DEPLOYMENT.md` - Two-instance deployment guide (~$58/month)
    - `AWS_APPRUNNER_DEPLOYMENT_GUIDE.md` - Detailed step-by-step AWS setup
    - `DEPLOYMENT_README.md`, `DEPLOYMENT_SUMMARY.md`, `DEPLOYMENT_COMPLETE.md`
    - `DEPLOYMENT_CHECKLIST.md` - Progress tracking checklist
  - Created technical documentation:
    - `TROUBLESHOOTING.md` - Common issues and solutions
    - `DOCKER_BUILD_FIXES.md` - Build issues resolved
    - `QUICK_REFERENCE.md` - Command reference
  - Moved development guides to `docs/`:
    - `IMPLEMENTATION_PLAN.md` - Feature roadmap
    - `project_structure_guidelines.md` - Code organization
    - `fundraising_shirt_campaign_platform_full_build_guide.md` - Complete feature list
    - `optional_stripe_payment_implementation_guide.md` - Stripe integration
    - `organizer_profile_and_multi-campaign_guide.md` - User profiles

- **Deployment Scripts**
  - Created `scripts/` directory for all deployment automation
  - Added single-instance deployment scripts:
    - `deploy-combined.ps1` (Windows PowerShell)
    - `deploy-combined.sh` (Mac/Linux Bash)
  - Added two-instance deployment scripts:
    - `deploy-to-ecr.ps1` (Windows PowerShell)
    - `deploy-to-ecr.sh` (Mac/Linux Bash)
  - Added IAM role creation scripts:
    - `create-apprunner-role.ps1` (Windows PowerShell)
    - `create-apprunner-role.sh` (Mac/Linux Bash)

- **Docker Infrastructure**
  - Created `docker/` directory for Docker-related files
  - Added `docker/Dockerfile.combined` - Single-instance multi-stage build
  - Added `docker/nginx.combined.conf` - Nginx configuration for combined deployment
  - Added `docker/supervisord.conf` - Process manager for Nginx + Node.js
  - Added `docker/.dockerignore` - Docker build exclusions
  - Added `.dockerignore.combined` - Combined deployment exclusions

- **Backend Docker Support**
  - Added `backend/Dockerfile` - Backend-only Docker build
  - Added `backend/.dockerignore` - Backend build exclusions
  - Added `backend/.env.example` - Environment variable template
  - Added `backend/.env.production` - Production environment configuration

- **Frontend Docker Support**
  - Added `frontend/Dockerfile` - Frontend-only Docker build with Nginx
  - Added `frontend/nginx.conf` - Frontend Nginx configuration
  - Added `frontend/.dockerignore` - Frontend build exclusions
  - Added `frontend/.env.production` - Production environment configuration
  - Added `frontend/.env.production.example` - Production environment template

- **Root Configuration**
  - Added `.dockerignore` - Root-level Docker exclusions
  - Enhanced `README.md` with comprehensive project documentation:
    - Quick start guide
    - Architecture diagrams
    - Cost breakdown comparison
    - Tech stack overview
    - Environment variables reference
    - Available scripts documentation
    - Links to all documentation

#### Changed
- **Backend Configuration**
  - Updated `backend/src/app.ts`:
    - Added `/health` endpoint for health checks
    - Improved CORS configuration for production
    - Enhanced error handling
  - Updated `backend/src/server.ts`:
    - Made port configurable via environment variable (default: 3000)
    - Added graceful shutdown handling
  - Updated `backend/tsconfig.json`:
    - Added `resolveJsonModule: true` for JSON imports

- **Frontend Configuration**
  - Updated `frontend/src/App.tsx`:
    - Removed development-only code
    - Cleaned up imports
  - Updated `frontend/tsconfig.app.json`:
    - Improved TypeScript configuration for production builds
    - Enhanced module resolution

#### Removed
- Moved documentation files from root to `docs/`:
  - `IMPLEMENTATION_PLAN.md` → `docs/IMPLEMENTATION_PLAN.md`
  - `QUICK_REFERENCE.md` → `docs/QUICK_REFERENCE.md`
  - `fundraising_shirt_campaign_platform_full_build_guide.md` → `docs/`
  - `optional_stripe_payment_implementation_guide.md` → `docs/`
  - `organizer_profile_and_multi-campaign_guide.md` → `docs/`
  - `project_structure_guidelines.md` → `docs/`

#### Technical Details
- **Deployment Architecture**:
  - Single-instance: Nginx (port 8080) → React static files + proxy to Node.js (port 3000)
  - Two-instance: Separate frontend (Nginx:8080) and backend (Node.js:8080) services
  - Cost savings: Single-instance ~$25/month vs Two-instance ~$58/month

- **Docker Multi-Stage Builds**:
  - Combined: Frontend build → Backend build → Alpine runtime with Nginx + Node.js
  - Optimized image sizes with Alpine Linux base
  - Supervisor manages both processes in single container

- **Health Check Configuration**:
  - Single-instance: `/health` endpoint (Nginx responds immediately)
  - Two-instance: Backend `/api`, Frontend `/`

#### Migration Notes
- All deployment scripts moved to `scripts/` directory
- Update any CI/CD pipelines to reference new script paths:
  - `./deploy-combined.ps1` → `./scripts/deploy-combined.ps1`
  - `./deploy-to-ecr.ps1` → `./scripts/deploy-to-ecr.ps1`
- Docker files moved to `docker/` directory
- Build commands updated to reference `docker/Dockerfile.combined`

#### Files Changed
- **Added**: 45 files (4,853 insertions)
- **Modified**: 6 files (21 deletions)
- **Moved**: 6 documentation files to `docs/`

---

## [1.0.0] - Initial Release

### Added
- Initial project structure
- Backend API with Express and TypeScript
- Frontend with React, TypeScript, and Vite
- MongoDB integration
- Basic authentication
- Campaign management features

