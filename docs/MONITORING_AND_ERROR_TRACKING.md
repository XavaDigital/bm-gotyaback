# Monitoring and Error Tracking Setup

## 🎯 Overview

This guide covers setting up production monitoring, error tracking, and logging for the Got Ya Back platform.

---

## 1. Error Tracking with Sentry

### Setup Instructions

#### Backend Setup

1. **Install Sentry SDK**:
   ```bash
   cd backend
   npm install @sentry/node @sentry/profiling-node
   ```

2. **Create Sentry Account**: https://sentry.io

3. **Create New Project**:
   - Platform: Node.js
   - Copy the DSN (Data Source Name)

4. **Add to Environment Variables**:
   ```bash
   SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
   ```

5. **Initialize Sentry** (add to `backend/src/server.ts`):
   ```typescript
   import * as Sentry from "@sentry/node";
   import { ProfilingIntegration } from "@sentry/profiling-node";

   // Initialize Sentry BEFORE any other code
   if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
     Sentry.init({
       dsn: process.env.SENTRY_DSN,
       integrations: [
         new ProfilingIntegration(),
       ],
       tracesSampleRate: 0.1, // 10% of transactions
       profilesSampleRate: 0.1,
       environment: process.env.NODE_ENV,
     });
   }
   ```

6. **Add Error Handler** (in `backend/src/app.ts`):
   ```typescript
   import * as Sentry from "@sentry/node";

   // Add BEFORE other error handlers
   app.use(Sentry.Handlers.requestHandler());
   app.use(Sentry.Handlers.tracingHandler());

   // Add AFTER all routes, BEFORE other error handlers
   app.use(Sentry.Handlers.errorHandler());
   ```

#### Frontend Setup

1. **Install Sentry SDK**:
   ```bash
   cd frontend
   npm install @sentry/react
   ```

2. **Initialize Sentry** (in `frontend/src/main.tsx`):
   ```typescript
   import * as Sentry from "@sentry/react";

   if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
     Sentry.init({
       dsn: import.meta.env.VITE_SENTRY_DSN,
       integrations: [
         Sentry.browserTracingIntegration(),
         Sentry.replayIntegration(),
       ],
       tracesSampleRate: 0.1,
       replaysSessionSampleRate: 0.1,
       replaysOnErrorSampleRate: 1.0,
     });
   }
   ```

3. **Add to `.env.production`**:
   ```bash
   VITE_SENTRY_DSN=https://your-frontend-sentry-dsn@sentry.io/project-id
   ```

---

## 2. Logging with AWS CloudWatch

### Backend Logging

1. **Install Winston** (structured logging):
   ```bash
   npm install winston winston-cloudwatch
   ```

2. **Create Logger** (`backend/src/utils/logger.ts`):
   ```typescript
   import winston from 'winston';
   import CloudWatchTransport from 'winston-cloudwatch';

   const logger = winston.createLogger({
     level: process.env.LOG_LEVEL || 'info',
     format: winston.format.combine(
       winston.format.timestamp(),
       winston.format.errors({ stack: true }),
       winston.format.json()
     ),
     defaultMeta: { service: 'gotyaback-backend' },
     transports: [
       new winston.transports.Console({
         format: winston.format.simple(),
       }),
     ],
   });

   // Add CloudWatch in production
   if (process.env.NODE_ENV === 'production' && process.env.AWS_CLOUDWATCH_GROUP) {
     logger.add(new CloudWatchTransport({
       logGroupName: process.env.AWS_CLOUDWATCH_GROUP,
       logStreamName: `${process.env.NODE_ENV}-${new Date().toISOString().split('T')[0]}`,
       awsRegion: process.env.AWS_REGION || 'us-east-1',
     }));
   }

   export default logger;
   ```

3. **Use Logger Throughout App**:
   ```typescript
   import logger from './utils/logger';

   logger.info('Campaign created', { campaignId, userId });
   logger.error('Payment failed', { error, sponsorshipId });
   logger.warn('Rate limit exceeded', { ip, endpoint });
   ```

---

## 3. Application Performance Monitoring (APM)

### Option A: New Relic

1. **Install New Relic**:
   ```bash
   npm install newrelic
   ```

2. **Configure** (`backend/newrelic.js`):
   ```javascript
   exports.config = {
     app_name: ['Got Ya Back Backend'],
     license_key: process.env.NEW_RELIC_LICENSE_KEY,
     logging: {
       level: 'info'
     },
     allow_all_headers: true,
     attributes: {
       exclude: [
         'request.headers.cookie',
         'request.headers.authorization',
       ]
     }
   };
   ```

3. **Require at App Start** (first line of `server.ts`):
   ```typescript
   if (process.env.NODE_ENV === 'production') {
     require('newrelic');
   }
   ```

### Option B: AWS X-Ray

1. **Install AWS X-Ray SDK**:
   ```bash
   npm install aws-xray-sdk
   ```

2. **Configure** (in `app.ts`):
   ```typescript
   import AWSXRay from 'aws-xray-sdk';
   import AWS from 'aws-sdk';

   if (process.env.NODE_ENV === 'production') {
     AWSXRay.captureAWS(AWS);
     AWSXRay.captureHTTPsGlobal(require('http'));
     AWSXRay.captureHTTPsGlobal(require('https'));
     
     app.use(AWSXRay.express.openSegment('GotyaBack'));
     // ... your routes ...
     app.use(AWSXRay.express.closeSegment());
   }
   ```

---

## 4. Uptime Monitoring

### UptimeRobot Setup

1. **Create Account**: https://uptimerobot.com
2. **Add Monitors**:
   - **Backend Health**: `https://your-backend-url.com/api/health`
   - **Frontend**: `https://your-frontend-url.com`
   - **Interval**: 5 minutes
3. **Configure Alerts**:
   - Email notifications
   - Slack/Discord webhooks
   - SMS (optional)

### Alternative: Pingdom

1. **Create Account**: https://www.pingdom.com
2. **Add Uptime Checks**
3. **Set up Real User Monitoring (RUM)** for frontend

---

## 5. Database Monitoring

### MongoDB Atlas Built-in Monitoring

1. **Enable Alerts**:
   - Atlas → Alerts → Create Alert
   - Monitor: Connections, CPU, Memory, Disk
   - Thresholds: 80% for warnings, 90% for critical

2. **Performance Advisor**:
   - Review slow queries
   - Add recommended indexes

3. **Real-Time Performance Panel**:
   - Monitor active operations
   - Track query performance

---

## 6. Custom Metrics Dashboard

### Create Health Check Endpoint

Already implemented in `backend/src/routes/health.routes.ts`:

```typescript
router.get("/", async (req: Request, res: Response) => {
  const health = {
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    mongodb: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    memory: process.memoryUsage(),
  };
  res.json(health);
});
```

### Grafana Dashboard (Optional)

1. **Set up Prometheus** to scrape metrics
2. **Install Grafana**
3. **Create dashboards** for:
   - Request rate
   - Error rate
   - Response times
   - Database connections
   - Memory usage

---

## 7. Alert Configuration

### Critical Alerts (Immediate Response)

- API downtime > 2 minutes
- Error rate > 5%
- Database connection failures
- Payment processing failures
- S3 upload failures

### Warning Alerts (Monitor)

- Response time > 2 seconds
- Memory usage > 80%
- Database connections > 80% of limit
- Disk space > 80%

### Notification Channels

1. **Email**: Primary team members
2. **Slack/Discord**: Development channel
3. **PagerDuty**: On-call rotation (optional)

---

## 8. Log Retention Policy

- **Production Logs**: 90 days
- **Error Logs**: 1 year
- **Audit Logs**: 7 years (compliance)
- **Access Logs**: 30 days

---

## 9. Monitoring Checklist

- [ ] Sentry configured for backend and frontend
- [ ] CloudWatch logs streaming
- [ ] Uptime monitoring active
- [ ] Database alerts configured
- [ ] Error rate alerts set up
- [ ] Performance monitoring enabled
- [ ] Health check endpoint tested
- [ ] Alert notification channels tested
- [ ] Log retention policy implemented
- [ ] Dashboard created for key metrics

---

## 10. Incident Response

### When Alert Fires:

1. **Acknowledge** the alert
2. **Check** health dashboard
3. **Review** recent logs in Sentry/CloudWatch
4. **Investigate** root cause
5. **Fix** the issue
6. **Document** in incident log
7. **Post-mortem** for major incidents

### Incident Log Template:

```markdown
## Incident: [Title]
- **Date**: YYYY-MM-DD HH:MM
- **Duration**: X minutes
- **Severity**: Critical/High/Medium/Low
- **Impact**: X users affected
- **Root Cause**: [Description]
- **Resolution**: [What was done]
- **Prevention**: [How to prevent in future]
```

