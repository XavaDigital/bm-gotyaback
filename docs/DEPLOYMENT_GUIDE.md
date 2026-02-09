# Production Deployment Guide

This guide covers deploying the GotYaBack sponsorship platform to production.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Variables](#environment-variables)
3. [Database Setup](#database-setup)
4. [Backend Deployment](#backend-deployment)
5. [Frontend Deployment](#frontend-deployment)
6. [Post-Deployment Checklist](#post-deployment-checklist)
7. [Monitoring & Maintenance](#monitoring--maintenance)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Services

- **MongoDB Atlas** (or self-hosted MongoDB with TLS)
- **AWS Account** (for S3 file storage)
- **Mailgun Account** (for transactional emails)
- **Stripe Account** (optional, for payment processing)
- **Hosting Platform** (AWS App Runner, Heroku, DigitalOcean, etc.)

### Required Tools

- Node.js 18+ and npm
- Git
- MongoDB Compass (optional, for database management)

---

## Environment Variables

### Backend Environment Variables

Create a `.env` file in the `backend/` directory with the following variables:

#### **Critical Variables (Required)**

```bash
# Server Configuration
NODE_ENV=production
PORT=8080

# Database - MongoDB Connection
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority

# Authentication - JWT Secret (MUST be 32+ characters)
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long

# Frontend URL - For CORS and password reset emails
FRONTEND_URL=https://your-production-domain.com
```

#### **AWS S3 Configuration (Required for file uploads)**

```bash
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_S3_BUCKET_NAME=your-s3-bucket-name
```

#### **Email Configuration (Required for password reset)**

```bash
# Mailgun Configuration
MAILGUN_API_KEY=your-mailgun-api-key
MAILGUN_DOMAIN=mg.your-domain.com
MAILGUN_FROM_EMAIL=noreply@your-domain.com
```

#### **Stripe Configuration (Optional - only if using payments)**

```bash
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_PUBLIC_KEY=pk_live_your_stripe_public_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

### Frontend Environment Variables

Create a `.env` file in the `frontend/` directory:

```bash
# Backend API URL
VITE_API_URL=https://your-backend-api.com/api

# Session Secret (32+ characters)
SESSION_SECRET=your-session-secret-minimum-32-characters-long

# Stripe Public Key (if using payments)
VITE_STRIPE_PUBLIC_KEY=pk_live_your_stripe_public_key
```

### Environment Variable Validation

The backend automatically validates required environment variables on startup. If any critical variables are missing, the server will log detailed error messages and exit.

**Validation Levels:**
- **Critical** (all environments): `MONGODB_URI`, `JWT_SECRET`
- **Production Required**: All AWS, Mailgun, and FRONTEND_URL variables
- **Optional**: Stripe variables (only needed if payments are enabled)

---

## Database Setup

### MongoDB Atlas Setup (Recommended)

1. **Create a MongoDB Atlas Cluster**
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Create a new cluster (M0 free tier for testing, M10+ for production)
   - Choose a region close to your application servers

2. **Configure Database Access**
   ```
   - Create a database user with read/write permissions
   - Use a strong password (avoid special characters that need URL encoding)
   - Note: Username and password will be used in MONGODB_URI
   ```

3. **Configure Network Access**
   ```
   - Add your application server's IP address
   - For cloud platforms (AWS App Runner, Heroku), you may need to allow all IPs (0.0.0.0/0)
   - Enable "Allow access from anywhere" only if using dynamic IPs
   ```

4. **Get Connection String**
   ```
   - Click "Connect" → "Connect your application"
   - Copy the connection string
   - Replace <password> with your database user password
   - Replace <dbname> with your database name (e.g., "gotyaback-prod")
   ```

5. **Enable Security Features**
   ```
   - Enable encryption at rest (available on M10+)
   - Enable TLS/SSL (enabled by default)
   - Set up automated backups
   - Enable audit logging (M10+)
   ```


---

## Backend Deployment

### Option 1: AWS App Runner (Recommended)

AWS App Runner provides automatic deployments from GitHub with minimal configuration.

#### Step 1: Prepare Your Repository

1. Ensure your backend code is in a GitHub repository
2. Create a `Dockerfile` in the `backend/` directory (if not exists):

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 8080

# Start server
CMD ["npm", "start"]
```

3. Ensure your `package.json` has the correct scripts:

```json
{
  "scripts": {
    "build": "tsc",
    "start": "node dist/server.js",
    "dev": "tsx watch src/server.ts"
  }
}
```

#### Step 2: Create App Runner Service

1. Go to AWS App Runner console
2. Click "Create service"
3. **Source:**
   - Repository type: Source code repository
   - Connect to GitHub and select your repository
   - Branch: `main` or `production`
   - Source directory: `/backend`

4. **Build settings:**
   - Runtime: Node.js 18
   - Build command: `npm install && npm run build`
   - Start command: `npm start`
   - Port: `8080`

5. **Service settings:**
   - Service name: `gotyaback-backend-prod`
   - Virtual CPU: 1 vCPU
   - Memory: 2 GB
   - Environment variables: Add all backend environment variables

6. **Auto-scaling:**
   - Min instances: 1
   - Max instances: 3
   - Concurrency: 100

7. Click "Create & deploy"

#### Step 3: Configure Custom Domain (Optional)

1. In App Runner service, go to "Custom domains"
2. Add your domain (e.g., `api.your-domain.com`)
3. Add the CNAME records to your DNS provider
4. Wait for SSL certificate validation

### Option 2: Heroku

```bash
# Install Heroku CLI
npm install -g heroku

# Login to Heroku
heroku login

# Create new app
heroku create gotyaback-backend-prod

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI="your-mongodb-uri"
heroku config:set JWT_SECRET="your-jwt-secret"
# ... set all other environment variables

# Deploy
git subtree push --prefix backend heroku main

# View logs
heroku logs --tail
```

### Option 3: DigitalOcean App Platform

1. Go to DigitalOcean App Platform
2. Create new app from GitHub repository
3. Configure:
   - Source directory: `/backend`
   - Build command: `npm install && npm run build`
   - Run command: `npm start`
   - HTTP port: `8080`
4. Add environment variables
5. Deploy

---

## Frontend Deployment

### Option 1: Vercel (Recommended for TanStack Start)

```bash
# Install Vercel CLI
npm install -g vercel

# Navigate to frontend directory
cd frontend

# Deploy
vercel --prod

# Set environment variables in Vercel dashboard
# - VITE_API_URL
# - SESSION_SECRET
# - VITE_STRIPE_PUBLIC_KEY
```

### Option 2: Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Navigate to frontend directory
cd frontend

# Build
npm run build

# Deploy
netlify deploy --prod --dir=.output/public

# Set environment variables in Netlify dashboard
```

### Option 3: AWS Amplify

1. Go to AWS Amplify console
2. Connect your GitHub repository
3. Configure build settings:
   - Build command: `npm run build`
   - Output directory: `.output/public`
   - Base directory: `frontend`
4. Add environment variables
5. Deploy

---

## Post-Deployment Checklist

### Security Verification

- [ ] **HTTPS Enabled** - All traffic uses HTTPS
- [ ] **Environment Variables Secure** - No secrets in code or logs
- [ ] **CORS Configured** - Only production domains allowed
- [ ] **Rate Limiting Active** - Check `/api/auth/login` is rate-limited
- [ ] **Security Headers** - Verify with [securityheaders.com](https://securityheaders.com)
- [ ] **Database Authentication** - MongoDB requires username/password
- [ ] **Database Encryption** - TLS enabled for MongoDB connections

### Functionality Testing

- [ ] **Health Check** - `GET /health` returns 200 OK
- [ ] **User Registration** - Can create new account
- [ ] **User Login** - Can login with credentials
- [ ] **Token Refresh** - Access token refresh works
- [ ] **Password Reset** - Email sent and reset works
- [ ] **File Upload** - Logo upload to S3 works
- [ ] **Campaign Creation** - Can create new campaign
- [ ] **Sponsorship** - Can add sponsor to campaign
- [ ] **Payment** (if enabled) - Stripe payment flow works
- [ ] **Admin Panel** - Admin users can access admin routes

### Performance Testing

- [ ] **Response Times** - API responds in < 500ms
- [ ] **Database Queries** - No N+1 queries or slow queries
- [ ] **File Upload Speed** - S3 uploads complete in reasonable time
- [ ] **Pagination** - Large datasets load quickly

### Monitoring Setup

- [ ] **Error Tracking** - Set up Sentry or similar
- [ ] **Uptime Monitoring** - Set up UptimeRobot or Pingdom
- [ ] **Log Aggregation** - CloudWatch, Papertrail, or Logtail
- [ ] **Performance Monitoring** - New Relic or Datadog (optional)


---

## Monitoring & Maintenance

### Health Check Endpoints

The application provides three health check endpoints:

1. **Full Health Check** - `GET /health`
   ```json
   {
     "status": "healthy",
     "timestamp": "2024-01-15T10:30:00.000Z",
     "uptime": 3600,
     "database": "connected",
     "stripe": "configured",
     "s3": "configured"
   }
   ```

2. **Liveness Probe** - `GET /health/live`
   - Returns 200 if server is running
   - Use for Kubernetes liveness probes

3. **Readiness Probe** - `GET /health/ready`
   - Returns 200 if server is ready to accept traffic
   - Checks database connection
   - Use for Kubernetes readiness probes

### Monitoring Recommendations

#### Application Monitoring

**Sentry (Error Tracking)**
```bash
npm install @sentry/node

# In backend/src/server.ts
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});
```

**Uptime Monitoring**
- Set up UptimeRobot or Pingdom to monitor `/health` endpoint
- Alert on downtime > 2 minutes
- Monitor from multiple regions

#### Database Monitoring

**MongoDB Atlas Monitoring**
- Enable performance advisor
- Set up alerts for:
  - High CPU usage (> 80%)
  - High memory usage (> 80%)
  - Slow queries (> 100ms)
  - Connection count (> 80% of limit)

#### Log Management

**CloudWatch Logs (AWS)**
```bash
# Install CloudWatch agent
npm install winston-cloudwatch

# Configure in backend/src/utils/logger.ts
```

**Papertrail or Logtail**
- Aggregate logs from all services
- Set up alerts for error patterns
- Retain logs for 30+ days

### Backup Strategy

#### Database Backups

**MongoDB Atlas (Automated)**
- Enable continuous backups (M10+)
- Retention: 7 days minimum
- Test restore process monthly

**Manual Backup**
```bash
# Export database
mongodump --uri="your-mongodb-uri" --out=./backup-$(date +%Y%m%d)

# Restore database
mongorestore --uri="your-mongodb-uri" ./backup-20240115
```

#### S3 Backups

- Enable S3 versioning for uploaded files
- Set up lifecycle policy to archive old versions
- Consider cross-region replication for critical files

### Maintenance Tasks

#### Daily
- [ ] Check error logs for critical issues
- [ ] Monitor uptime and response times
- [ ] Review failed payment transactions

#### Weekly
- [ ] Review slow query logs
- [ ] Check disk space and database size
- [ ] Review security audit logs
- [ ] Update dependencies (patch versions)

#### Monthly
- [ ] Test backup restore process
- [ ] Review and rotate access keys
- [ ] Update dependencies (minor versions)
- [ ] Review and optimize database indexes
- [ ] Security audit of new features

#### Quarterly
- [ ] Penetration testing
- [ ] Performance load testing
- [ ] Disaster recovery drill
- [ ] Review and update documentation

---

## Troubleshooting

### Common Issues

#### 1. Database Connection Failed

**Symptoms:**
- Server crashes on startup
- Error: "MongoServerError: Authentication failed"

**Solutions:**
```bash
# Check MongoDB URI format
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname

# Verify credentials in MongoDB Atlas
# Check IP whitelist includes your server IP
# Ensure database user has read/write permissions
```

#### 2. JWT Token Errors

**Symptoms:**
- "Not authorized, token failed"
- "Invalid or expired access token"

**Solutions:**
```bash
# Verify JWT_SECRET is set and matches between deployments
# Check JWT_SECRET is at least 32 characters
# Ensure access tokens are being refreshed properly

# Generate new JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### 3. File Upload Fails

**Symptoms:**
- "Failed to upload file to S3"
- 500 error on logo upload

**Solutions:**
```bash
# Verify AWS credentials
aws s3 ls s3://your-bucket-name

# Check S3 bucket permissions
# Ensure CORS is configured on S3 bucket
# Verify AWS_REGION matches bucket region
```

#### 4. Email Not Sending

**Symptoms:**
- Password reset emails not received
- Console shows "Mailgun Not Configured"

**Solutions:**
```bash
# Verify Mailgun credentials
curl -s --user 'api:YOUR_API_KEY' \
  https://api.mailgun.net/v3/domains

# Check MAILGUN_DOMAIN is correct
# Verify sender email is authorized in Mailgun
# Check spam folder
```

#### 5. CORS Errors

**Symptoms:**
- "Access to fetch blocked by CORS policy"
- Frontend can't connect to backend

**Solutions:**
```bash
# Verify FRONTEND_URL matches your frontend domain
FRONTEND_URL=https://your-frontend-domain.com

# Check backend CORS configuration in app.ts
# Ensure no trailing slash in FRONTEND_URL
# Clear browser cache and cookies
```

#### 6. Rate Limiting Issues

**Symptoms:**
- "Too many authentication attempts"
- Legitimate users getting blocked

**Solutions:**
```bash
# Adjust rate limits in backend/src/middleware/rateLimiter.middleware.ts
# Consider implementing IP whitelist for trusted sources
# Use Redis for distributed rate limiting (multi-instance deployments)
```

### Emergency Procedures

#### Server Down

1. Check health endpoint: `curl https://your-api.com/health`
2. Check server logs for errors
3. Verify database connection
4. Restart application server
5. If persistent, rollback to previous deployment

#### Database Issues

1. Check MongoDB Atlas status page
2. Verify connection from application server
3. Check database metrics (CPU, memory, connections)
4. If corrupted, restore from backup
5. Contact MongoDB support if needed

#### Security Breach

1. **Immediate Actions:**
   - Rotate all secrets (JWT_SECRET, API keys)
   - Revoke all refresh tokens: `db.refreshtokens.updateMany({}, {$set: {isRevoked: true}})`
   - Review audit logs for suspicious activity
   - Block suspicious IP addresses

2. **Investigation:**
   - Review access logs
   - Check for unauthorized database access
   - Scan for malware or backdoors
   - Document timeline of events

3. **Recovery:**
   - Patch security vulnerabilities
   - Force password reset for affected users
   - Notify users if data was compromised
   - Update security documentation

---

## Additional Resources

- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [AWS App Runner Documentation](https://docs.aws.amazon.com/apprunner/)
- [Stripe API Documentation](https://stripe.com/docs/api)
- [Mailgun Documentation](https://documentation.mailgun.com/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

---

## Support

For deployment issues or questions:
- Check the [GitHub Issues](https://github.com/your-repo/issues)
- Review the [Production Readiness Checklist](../PRODUCTION_READINESS_CHECKLIST.md)
- Contact the development team

**Last Updated:** 2024-01-15


### Database Indexes

The application automatically creates indexes on startup. Verify indexes are created:

```javascript
// User indexes
db.users.getIndexes()
// Should include: email, organizerProfile.slug

// Campaign indexes
db.campaigns.getIndexes()
// Should include: slug, ownerId

// SponsorEntry indexes
db.sponsorentries.getIndexes()
// Should include: campaignId, paymentStatus, logoApprovalStatus

// RefreshToken indexes
db.refreshtokens.getIndexes()
// Should include: userId, token, expiresAt (TTL), isRevoked
```


