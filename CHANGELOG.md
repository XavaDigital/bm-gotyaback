# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### [CHANGE-002] - 2025-12-31 - Password Reset Workflow and Mailgun Email Integration

#### Added

- **Password Reset Backend**

  - Added `resetPasswordToken` and `resetPasswordExpires` fields to User model
  - Implemented `requestPasswordReset()` service method with secure token generation (32-byte crypto random)
  - Implemented `resetPassword()` service method with token validation and expiry checking
  - Added `POST /api/auth/forgot-password` endpoint for requesting password resets
  - Added `POST /api/auth/reset-password` endpoint for resetting passwords with token
  - Tokens are hashed before database storage for security
  - Tokens expire after 1 hour
  - Email enumeration attack prevention (always returns success regardless of email existence)

- **Email Service with Mailgun Integration**

  - Created `backend/src/services/email.service.ts` with Mailgun API integration
  - Installed `mailgun.js@12.4.1` and `form-data@4.0.5` packages
  - Implemented smart fallback: logs to console if Mailgun not configured, sends via API if configured
  - Added `sendEmail()` function with HTML and plain text support
  - Added `sendPasswordResetEmail()` function with branded email template
  - Email template features BeastMode branding (#C8102E red), responsive design, and clear CTA button
  - Graceful error handling with fallback to console logging in development
  - Environment variables: `MAILGUN_API_KEY`, `MAILGUN_DOMAIN`, `EMAIL_FROM`

- **Password Reset Frontend Pages**

  - Created `frontend/src/pages/ForgotPassword.tsx` - Email input page with dark theme
  - Created `frontend/src/pages/ResetPassword.tsx` - New password entry page with validation
  - Both pages match existing dark theme (#1f1f1f, #2a2a2a backgrounds, #C8102E accents)
  - Added routes `/forgot-password` and `/reset-password` to App.tsx
  - Both routes protected by GuestGuard (redirect logged-in users)
  - Password validation: minimum 6 characters, confirm password matching
  - Success states with clear user feedback and navigation

- **Documentation**
  - Created `MAILGUN_SETUP.md` - Comprehensive Mailgun setup guide (200+ lines)
    - Account creation and API key retrieval
    - Sandbox vs custom domain configuration
    - DNS setup instructions (SPF, DKIM, MX records)
    - AWS App Runner environment variable configuration
    - Troubleshooting guide with common issues
    - Pricing and limits information
  - Created `MAILGUN_QUICK_START.md` - 5-minute quick start guide
    - Fast setup steps for development
    - Environment variable reference table
    - Common issues and solutions
    - Quick links to resources
  - Created `SECURITY_FIX.md` - Documentation of security alert resolution
    - Analysis of GitHub secret scanning false positives
    - Explanation of placeholder vs real credentials
    - Steps taken to remove .env.production from git tracking
    - Updated documentation format to prevent future false positives

#### Modified

- **Backend Configuration**

  - Updated `backend/.env.example` with Mailgun environment variables
  - Updated `backend/.env.production` with Mailgun configuration (local only, not in git)
  - Modified `backend/package.json` to include mailgun.js and form-data dependencies

- **Frontend Login Page**

  - Added "Forgot Password?" link above login button in `frontend/src/pages/Login.tsx`
  - Link styled in brand red (#C8102E) and right-aligned for better UX
  - Link navigates to `/forgot-password` route

- **Frontend Error Handling**

  - Updated `frontend/src/pages/ForgotPassword.tsx` error handling
  - Development mode: Shows actual error messages for debugging
  - Production mode: Shows generic success message to prevent email enumeration
  - Added console logging of errors in development mode

- **Documentation Updates**
  - Updated `docs/QUICK_START_DEPLOYMENT.md` - Changed MongoDB URI format from `username:password` to `<username>:<password>` to prevent GitHub secret scanning false positives
  - Updated `docs/TROUBLESHOOTING.md` - Changed MongoDB URI format to use placeholder brackets

#### Security

- **Removed .env.production Files from Git Tracking**

  - Removed `backend/.env.production` from git (contained only placeholder values)
  - Removed `frontend/.env.production` from git (contained only placeholder values)
  - Files still exist locally but are now protected by .gitignore
  - No real secrets were exposed (all values were placeholders like "username:password")

- **GitHub Secret Scanning Alerts Resolution**

  - Analyzed 3 GitHub alerts for "MongoDB Atlas Database URI with credentials"
  - All alerts confirmed as false positives (placeholder values only)
  - Updated documentation to use `<placeholder>` format instead of literal text
  - Prevents future false positive alerts from GitHub secret scanning

- **Password Reset Security Features**
  - Cryptographically secure token generation (32 bytes random)
  - Tokens hashed with crypto.createHash('sha256') before storage
  - 1-hour token expiration
  - One-time use tokens (cleared after successful reset)
  - Email enumeration prevention (consistent response regardless of email existence)
  - Password requirements enforced (minimum 6 characters)

#### Technical Details

- **Email Flow**

  1. User requests password reset → Backend generates secure token
  2. Token hashed and stored in database with 1-hour expiry
  3. Unhashed token sent via email (Mailgun API or console log)
  4. User clicks link → Frontend shows reset form
  5. User submits new password → Backend validates token and expiry
  6. Password updated and token cleared → User redirected to login

- **Mailgun Integration Modes**

  - **Console Mode** (no Mailgun config): Logs email content to backend console for testing
  - **Production Mode** (Mailgun configured): Sends actual emails via Mailgun API
  - **Fallback Mode** (Mailgun fails): Logs to console in development, throws error in production

- **Environment Variables Added**
  - `MAILGUN_API_KEY` - Mailgun private API key (format: `key-xxxxxxxx`)
  - `MAILGUN_DOMAIN` - Mailgun sending domain (e.g., `mg.yourdomain.com` or sandbox)
  - `EMAIL_FROM` - From email address (must match Mailgun domain)
  - `FRONTEND_URL` - Frontend URL for password reset links (e.g., `http://localhost:5173`)

#### Files Added

- `backend/src/services/email.service.ts` - Email service with Mailgun integration
- `frontend/src/pages/ForgotPassword.tsx` - Password reset request page
- `frontend/src/pages/ResetPassword.tsx` - Password reset form page
- `MAILGUN_SETUP.md` - Comprehensive Mailgun setup documentation
- `MAILGUN_QUICK_START.md` - Quick start guide for Mailgun
- `SECURITY_FIX.md` - Security alert resolution documentation

#### Files Modified

- `backend/src/models/User.ts` - Added reset token fields
- `backend/src/services/user.service.ts` - Added password reset methods
- `backend/src/controllers/auth.controller.ts` - Added password reset endpoints
- `backend/src/routes/auth.routes.ts` - Added password reset routes
- `backend/.env.example` - Added Mailgun environment variables
- `backend/package.json` - Added mailgun.js and form-data dependencies
- `backend/package-lock.json` - Updated with new dependencies
- `frontend/src/App.tsx` - Added password reset routes
- `frontend/src/pages/Login.tsx` - Added forgot password link
- `docs/QUICK_START_DEPLOYMENT.md` - Updated MongoDB URI format
- `docs/TROUBLESHOOTING.md` - Updated MongoDB URI format

#### Dependencies Added

- `mailgun.js@12.4.1` - Official Mailgun Node.js SDK
- `form-data@4.0.5` - Required for Mailgun multipart form data

#### Breaking Changes

None

#### Migration Notes

- Add Mailgun environment variables to `.env` file for email functionality
- Without Mailgun configuration, emails will be logged to console (development mode)
- For production, sign up for Mailgun and configure API credentials
- See `MAILGUN_QUICK_START.md` for 5-minute setup guide

---

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
