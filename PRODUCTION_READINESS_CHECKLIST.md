# Production Readiness Checklist

This document outlines the security, performance, and reliability improvements needed before deploying the application to production.

## ✅ Completed Items

### 1. Admin Pages Protection
- [x] Server-side admin role verification middleware implemented
- [x] All admin endpoints protected with `requireAdmin` middleware
- [x] Frontend admin route checks user role and redirects non-admins
- [x] Proper HTTP status codes (401 for auth, 403 for authorization)

### 2. Data Privacy & Filtering
- [x] Created sanitization utilities (`backend/src/utils/sanitizers.ts`)
- [x] Created pagination utilities (`backend/src/utils/pagination.ts`)
- [x] Updated auth middleware to only select necessary user fields
- [x] Fixed campaign owner data exposure in public endpoints
- [x] Added pagination to admin campaigns endpoint
- [x] Fixed sponsor data exposure in public endpoints
- [x] Updated frontend to handle paginated responses

### 3. Performance Optimization
- [x] Added database indexes to Campaign model
- [x] Added database indexes to SponsorEntry model
- [x] Added database indexes to ShirtLayout model
- [x] Added database indexes to User model

---

## 🔒 Security & Authorization

### 2. Rate Limiting ✅
- [x] Implement rate limiting on all API endpoints
- [x] Add stricter rate limits on authentication endpoints (login, register, password reset)
- [x] Using `express-rate-limit` middleware
- [x] Set appropriate limits based on expected usage patterns
  - General API: 100 requests per 15 minutes
  - Auth endpoints: 5 attempts per 15 minutes
  - Password reset: 3 requests per hour
  - Payment: 10 requests per 15 minutes
  - File uploads: 20 uploads per 15 minutes
  - Sponsorship creation: 10 per hour
  - Public read: 200 per 15 minutes

### 3. Input Validation & Sanitization ✅
- [x] Add comprehensive input validation on all endpoints
- [x] Sanitize user inputs to prevent XSS attacks
- [x] Validate file uploads (type, size, content)
- [x] Using `express-validator` for validation
- [x] Validate MongoDB ObjectIDs before queries
- [x] Using `express-mongo-sanitize` to prevent MongoDB injection

### 4. HTTPS Only
- [ ] Ensure all production traffic uses HTTPS
- [ ] Redirect HTTP to HTTPS
- [ ] Set `secure` flag on cookies
- [ ] Update CORS configuration for HTTPS origins only

### 5. Environment Variables Security ✅
- [x] Audit all environment variables
- [x] Ensure no secrets are committed to version control
- [x] Validate required environment variables on server startup
- [x] Created `validateEnv.ts` utility to check all required variables
- [ ] Use strong, randomly generated secrets for JWT_SECRET (verify in production)
- [ ] Rotate secrets regularly (establish schedule)
- [ ] Document all required environment variables in `.env.example` (future enhancement)

### 6. Database Security
- [ ] Enable MongoDB authentication
- [ ] Use encrypted connections (TLS/SSL) to MongoDB
- [ ] Create database user with minimal required permissions
- [ ] Enable MongoDB audit logging
- [ ] Regular database backups with encryption
- [ ] Implement connection pooling limits

### 7. CORS Configuration
- [ ] Review and tighten CORS settings for production
- [ ] Remove localhost origins from production CORS config
- [ ] Whitelist only specific production domains
- [ ] Disable credentials for public endpoints if not needed

### 8. Session Management
- [ ] Implement JWT token expiration (currently 30 days - consider reducing)
- [ ] Add refresh token mechanism
- [ ] Implement token revocation/blacklisting
- [ ] Add "remember me" option with different expiration times
- [ ] Clear tokens on logout (both client and server-side)

### 9. Security Headers ✅
- [x] Install and configure `helmet.js`
- [x] Set Content Security Policy (CSP)
- [x] Set X-Frame-Options to prevent clickjacking
- [x] Set X-Content-Type-Options to prevent MIME sniffing
- [ ] Enable HSTS (HTTP Strict Transport Security) - requires HTTPS in production

### 10. Audit Logging ✅
- [x] Log all admin actions (create, update, delete operations)
- [x] Log authentication events (login, logout, failed attempts)
- [x] Include user ID, timestamp, IP address, and action details
- [x] Created comprehensive audit logging utility (`auditLogger.ts`)
- [x] Added audit logging to admin controller (seedSponsors, getAllCampaigns, deleteCampaign)
- [x] Added audit logging to auth controller (register, login, forgotPassword, resetPassword)
- [ ] Log payment transactions (future enhancement)
- [ ] Store logs in database for long-term retention (future enhancement)
- [ ] Set up alerts for suspicious activities (future enhancement)

---

## 📊 Data Privacy & Filtering

### 11. Filter Data Packets Sent to Frontend
**Critical**: Data packets sent to the frontend should only include the required data to perform the specific task.

#### Current Issues to Address:

**User Data:**
- [x] Remove `passwordHash` from all user responses (done in auth middleware)
- [x] Remove `resetPasswordToken` and `resetPasswordExpires` from user objects
- [x] Create separate DTOs (Data Transfer Objects) for different contexts
- [x] Don't send full user list to frontend - paginate and filter

**Campaign Data:**
- [x] Filter campaign owner data - only send necessary fields (name, organizerProfile)
- [x] Don't send internal fields like `__v`, `updatedAt` unless needed
- [x] For public campaigns, exclude sensitive owner information

**Sponsorship Data:**
- [x] Filter sponsor contact information based on user role
- [x] Campaign owners should see full sponsor details (sanitizeSponsorForOwner)
- [x] Public endpoints should only show approved, paid sponsors
- [x] Don't expose email/phone to public viewers

**Payment Data:**
- [x] Never send Stripe secret keys to frontend
- [x] Filter payment intent details - only send client_secret when needed
- [x] Don't expose full payment history to unauthorized users
- [x] Transaction records not exposed to any public endpoints
- [x] Payment status removed from public sponsor endpoints

#### Implementation Strategy:
```javascript
// Example: Create response DTOs
const sanitizeUserForResponse = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  organizerProfile: user.organizerProfile,
  // Explicitly exclude: passwordHash, resetPasswordToken, resetPasswordExpires
});

const sanitizeCampaignForPublic = (campaign) => ({
  _id: campaign._id,
  title: campaign.title,
  slug: campaign.slug,
  description: campaign.description,
  // ... only public fields
  owner: {
    name: campaign.ownerId.name,
    organizerProfile: campaign.ownerId.organizerProfile,
    // Don't include email, role, etc.
  }
});
```

**Action Items:**
- [x] Audit all API endpoints and identify what data is being sent
- [x] Create sanitization/DTO functions for each data model
- [x] Apply sanitization before sending responses
- [x] Use MongoDB `.select()` to exclude fields at query level
- [x] Review and update all controller responses

---

## ⚡ Performance & Scalability

### 12. Check for Slow and Clunky Requests
**Critical**: Identify and optimize requests that will become slow when the database has large amounts of data.

#### Areas to Audit:

**Queries Without Indexes:**
- [x] Review all MongoDB queries and ensure proper indexes exist
- [x] Add indexes on frequently queried fields:
  - [x] `User.email` (already unique, has index)
  - [x] `User.organizerProfile.slug` (for organizer lookups)
  - [x] `Campaign.slug` (already unique, has index)
  - [x] `Campaign.ownerId` (for filtering user's campaigns)
  - [x] `Campaign.isClosed` and `endDate` (for filtering active campaigns)
  - [x] `SponsorEntry.campaignId` (for getting campaign sponsors)
  - [x] `SponsorEntry.paymentStatus` (for filtering paid/pending)
  - [x] `SponsorEntry.logoApprovalStatus` (for pending logo queries)
  - [x] `ShirtLayout.campaignId` (for layout lookups)

**Queries Without Pagination:**
- [x] `GET /api/admin/campaigns` - Returns ALL campaigns (will be slow with many campaigns)
  - [x] Add pagination with limit/skip
  - [x] Add sorting options
  - [ ] Add filtering by status, owner, date range (future enhancement)

- [ ] `GET /api/campaigns/:id/sponsors` - Returns ALL sponsors for a campaign
  - [ ] Add pagination
  - [ ] Consider virtual scroll for large lists

- [ ] `GET /api/campaigns/:id/pending-logos` - Could be slow with many pending logos
  - [ ] Add pagination
  - [ ] Add date range filtering

**N+1 Query Problems:**
- [ ] Check for N+1 queries when populating related documents
- [ ] Use `.populate()` efficiently or aggregate queries
- [ ] Example: Getting campaigns with owner details
  ```javascript
  // Bad: N+1 query
  const campaigns = await Campaign.find();
  // Each campaign.ownerId requires separate query

  // Good: Single query with populate
  const campaigns = await Campaign.find().populate('ownerId', 'name email organizerProfile');
  ```

**Unoptimized Aggregations:**
- [ ] Review campaign statistics calculations
- [ ] Consider caching frequently accessed stats
- [ ] Use MongoDB aggregation pipeline for complex calculations
- [ ] Example: Campaign stats in `campaignService.getCampaignById()`

**Large Document Transfers:**
- [ ] Limit the number of sponsors returned in public views
- [ ] Implement cursor-based pagination for infinite scroll
- [ ] Use field projection to only fetch needed fields
  ```javascript
  // Only select needed fields
  await Campaign.find().select('title slug description headerImageUrl');
  ```

**File Upload Handling:**
- [ ] Verify file size limits are enforced (currently 2MB for logos, 5MB for headers)
- [ ] Consider implementing image compression/optimization
- [ ] Use streaming for large file uploads
- [ ] Implement cleanup for orphaned files in S3

#### Implementation Strategy:

**Add Database Indexes:**
```javascript
// In model files, add indexes
campaignSchema.index({ ownerId: 1, createdAt: -1 });
sponsorEntrySchema.index({ campaignId: 1, paymentStatus: 1 });
sponsorEntrySchema.index({ campaignId: 1, logoApprovalStatus: 1 });
```

**Implement Pagination Helper:**
```javascript
// utils/pagination.js
export const paginate = (query, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  return query.skip(skip).limit(limit);
};

export const getPaginationMeta = async (model, filter, page, limit) => {
  const total = await model.countDocuments(filter);
  return {
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
    hasNext: page * limit < total,
    hasPrev: page > 1,
  };
};
```

**Action Items:**
- [ ] Run `db.collection.getIndexes()` on all collections to verify indexes
- [ ] Use MongoDB explain() to analyze slow queries
- [ ] Add pagination to all list endpoints
- [ ] Implement query result caching for frequently accessed data
- [ ] Set up database query monitoring/logging
- [ ] Load test with realistic data volumes (1000+ campaigns, 10000+ sponsors)

---

## 🔍 Monitoring & Observability

### 13. Error Handling & Logging ✅
- [x] Implement centralized error handling middleware
- [x] Created custom AppError class for operational errors
- [x] Implemented errorHandler middleware to catch all errors
- [x] Implemented notFoundHandler for 404 errors
- [x] Implemented requestLogger for request/response logging
- [x] Log levels: ERROR, WARN, INFO
- [x] Don't log sensitive information (passwords, tokens, credit cards)
- [ ] Set up log aggregation (e.g., ELK stack, CloudWatch, Datadog) - production setup
- [ ] Implement error tracking (e.g., Sentry, Rollbar) - production setup

### 14. Application Monitoring
- [ ] Set up application performance monitoring (APM)
- [ ] Monitor API response times
- [ ] Track error rates and types
- [ ] Monitor database query performance
- [ ] Set up uptime monitoring
- [ ] Create dashboards for key metrics

### 15. Health Checks
- [ ] Implement detailed health check endpoint
- [ ] Check database connectivity
- [ ] Check external service availability (Stripe, AWS S3)
- [ ] Return appropriate status codes
  ```javascript
  app.get('/health', async (req, res) => {
    const health = {
      uptime: process.uptime(),
      timestamp: Date.now(),
      database: 'checking...',
      stripe: 'checking...',
      s3: 'checking...',
    };

    try {
      await mongoose.connection.db.admin().ping();
      health.database = 'connected';
    } catch (error) {
      health.database = 'disconnected';
    }

    // Check other services...

    const isHealthy = health.database === 'connected';
    res.status(isHealthy ? 200 : 503).json(health);
  });
  ```

---

## 🧪 Testing

### 16. Test Coverage
- [ ] Write unit tests for critical business logic
- [ ] Write integration tests for API endpoints
- [ ] Test authentication and authorization flows
- [ ] Test payment processing (use Stripe test mode)
- [ ] Test file upload functionality
- [ ] Test error scenarios and edge cases
- [ ] Aim for >80% code coverage on critical paths

### 17. Load Testing
- [ ] Perform load testing with realistic traffic patterns
- [ ] Test with large datasets (1000+ campaigns, 10000+ sponsors)
- [ ] Identify bottlenecks and optimize
- [ ] Test concurrent user scenarios
- [ ] Test file upload under load

---

## 🚀 Deployment & Infrastructure

### 18. Environment Configuration
- [ ] Separate configurations for dev, staging, production
- [ ] Use environment-specific database instances
- [ ] Configure production-grade MongoDB (replica set, sharding if needed)
- [ ] Set up CDN for static assets
- [ ] Configure proper DNS and SSL certificates

### 19. Backup & Disaster Recovery
- [ ] Implement automated database backups
- [ ] Test backup restoration process
- [ ] Set up backup retention policy
- [ ] Document disaster recovery procedures
- [ ] Store backups in separate geographic location

### 20. CI/CD Pipeline
- [ ] Set up automated testing in CI pipeline
- [ ] Implement automated deployments
- [ ] Use blue-green or canary deployments
- [ ] Implement rollback procedures
- [ ] Run security scans in CI pipeline

---

## 📱 Frontend Security

### 21. Client-Side Security
- [ ] Sanitize user-generated content before rendering
- [ ] Implement Content Security Policy
- [ ] Validate all user inputs on client-side (in addition to server-side)
- [ ] Use HTTPS for all API calls
- [ ] Implement CSRF protection for state-changing operations
- [ ] Secure local storage usage (don't store sensitive data)

### 22. Dependency Security
- [ ] Run `npm audit` and fix vulnerabilities
- [ ] Keep dependencies up to date
- [ ] Use `npm audit fix` regularly
- [ ] Consider using Snyk or Dependabot for automated security updates
- [ ] Review and minimize third-party dependencies

---

## 📋 Documentation

### 23. API Documentation
- [ ] Document all API endpoints
- [ ] Include request/response examples
- [ ] Document authentication requirements
- [ ] Document rate limits
- [ ] Consider using Swagger/OpenAPI

### 24. Deployment Documentation
- [ ] Document deployment process
- [ ] Document environment variables
- [ ] Document database setup and migrations
- [ ] Document monitoring and alerting setup
- [ ] Create runbooks for common issues

---

## ✅ Pre-Launch Checklist

Before going live, verify:

- [ ] All items in this checklist are addressed or have a plan
- [ ] Security audit completed
- [ ] Performance testing completed
- [ ] Backup and recovery tested
- [ ] Monitoring and alerting configured
- [ ] SSL certificates installed and tested
- [ ] Domain and DNS configured
- [ ] Error tracking configured
- [ ] Load testing completed successfully
- [ ] All secrets rotated and secured
- [ ] Team trained on production procedures
- [ ] Incident response plan documented

---

## 🎯 Priority Levels

### 🔴 Critical (Must fix before production)
- Admin pages protection ✅
- Filter data packets sent to frontend ✅
- Check for slow and clunky requests ✅
- Input validation & sanitization ✅
- Environment variables security ✅
- HTTPS only (production deployment)
- Database security (production deployment)

### 🟡 High Priority (Should fix before production)
- Rate limiting ✅
- Security headers ✅
- Audit logging ✅
- Error handling & logging ✅
- Session management improvements
- Health checks
- Dependency security

### 🟢 Medium Priority (Fix soon after launch)
- Application monitoring
- Test coverage
- Load testing
- API documentation
- CORS tightening

### 🔵 Low Priority (Nice to have)
- Advanced caching strategies
- CDN setup
- Advanced monitoring dashboards

---

## 📞 Support & Maintenance

After launch, ensure:
- [ ] 24/7 monitoring is in place
- [ ] On-call rotation is established
- [ ] Incident response procedures are documented
- [ ] Regular security audits are scheduled
- [ ] Performance reviews are scheduled
- [ ] Backup verification is automated

---

**Last Updated:** 2026-02-05
**Next Review:** Before production deployment



