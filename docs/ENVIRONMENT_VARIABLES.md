# Environment Variables Reference

Complete reference for all environment variables used in the GotYaBack application.

## Backend Environment Variables

### Server Configuration

| Variable | Required | Default | Description | Example |
|----------|----------|---------|-------------|---------|
| `NODE_ENV` | Production | `development` | Application environment | `production`, `development`, `test` |
| `PORT` | No | `8080` | Server port | `8080`, `5000` |

### Database

| Variable | Required | Default | Description | Example |
|----------|----------|---------|-------------|---------|
| `MONGODB_URI` | **Yes** | - | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/dbname` |

**Important Notes:**
- Use MongoDB Atlas for production (includes TLS/SSL by default)
- Ensure connection string includes `retryWrites=true&w=majority`
- URL-encode special characters in username/password
- Use separate databases for production, staging, and development

### Authentication

| Variable | Required | Default | Description | Example |
|----------|----------|---------|-------------|---------|
| `JWT_SECRET` | **Yes** | - | Secret key for JWT signing (32+ chars) | `a1b2c3d4e5f6...` (64 chars) |

**Security Requirements:**
- **Minimum 32 characters** (64+ recommended)
- Use cryptographically secure random string
- Never commit to version control
- Rotate periodically (quarterly recommended)

**Generate secure JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### AWS S3 Configuration

| Variable | Required | Default | Description | Example |
|----------|----------|---------|-------------|---------|
| `AWS_REGION` | Production | - | AWS region for S3 bucket | `us-east-1`, `ap-southeast-2` |
| `AWS_ACCESS_KEY_ID` | Production | - | AWS IAM access key ID | `AKIAIOSFODNN7EXAMPLE` |
| `AWS_SECRET_ACCESS_KEY` | Production | - | AWS IAM secret access key | `wJalrXUtnFEMI/K7MDENG/...` |
| `AWS_S3_BUCKET_NAME` | Production | - | S3 bucket name for file uploads | `gotyaback-uploads-prod` |

**Setup Instructions:**
1. Create S3 bucket in AWS console
2. Create IAM user with S3 permissions
3. Attach policy: `AmazonS3FullAccess` or custom policy
4. Generate access keys for IAM user
5. Configure CORS on S3 bucket to allow frontend uploads

**S3 Bucket CORS Configuration:**
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["https://your-frontend-domain.com"],
    "ExposeHeaders": ["ETag"]
  }
]
```

### Email Configuration (Mailgun)

| Variable | Required | Default | Description | Example |
|----------|----------|---------|-------------|---------|
| `MAILGUN_API_KEY` | Production | - | Mailgun API key | `key-1234567890abcdef...` |
| `MAILGUN_DOMAIN` | Production | - | Mailgun sending domain | `mg.your-domain.com` |
| `MAILGUN_FROM_EMAIL` | Production | - | Default sender email address | `noreply@your-domain.com` |

**Setup Instructions:**
1. Sign up for Mailgun account
2. Add and verify your domain
3. Get API key from Mailgun dashboard
4. Configure DNS records (SPF, DKIM, CNAME)

**Development Mode:**
- If Mailgun is not configured, emails are logged to console
- Useful for local development without email service

### Stripe Configuration (Optional)

| Variable | Required | Default | Description | Example |
|----------|----------|---------|-------------|---------|
| `STRIPE_SECRET_KEY` | If payments enabled | - | Stripe secret key | `sk_live_...` or `sk_test_...` |
| `STRIPE_PUBLIC_KEY` | If payments enabled | - | Stripe publishable key | `pk_live_...` or `pk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | If webhooks used | - | Stripe webhook signing secret | `whsec_...` |

**Important Notes:**
- Use test keys (`sk_test_`, `pk_test_`) for development
- Use live keys (`sk_live_`, `pk_live_`) for production
- Never expose secret key to frontend
- Webhook secret is obtained when creating webhook endpoint in Stripe dashboard

### CORS Configuration

| Variable | Required | Default | Description | Example |
|----------|----------|---------|-------------|---------|
| `FRONTEND_URL` | Production | `http://localhost:5173` | Frontend URL for CORS and emails | `https://app.your-domain.com` |

**Important Notes:**
- Must match exact frontend domain (no trailing slash)
- Used for CORS origin whitelist
- Used in password reset email links
- Multiple origins can be added in code if needed

---

## Frontend Environment Variables

### API Configuration

| Variable | Required | Default | Description | Example |
|----------|----------|---------|-------------|---------|
| `VITE_API_URL` | **Yes** | - | Backend API base URL | `https://api.your-domain.com/api` |

**Important Notes:**
- Must include `/api` path
- No trailing slash
- Use `http://localhost:5000/api` for local development

### Session Configuration

| Variable | Required | Default | Description | Example |
|----------|----------|---------|-------------|---------|
| `SESSION_SECRET` | **Yes** | - | Secret for session encryption (32+ chars) | `a1b2c3d4e5f6...` (64 chars) |

**Generate secure SESSION_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Stripe Configuration (Optional)

| Variable | Required | Default | Description | Example |
|----------|----------|---------|-------------|---------|
| `VITE_STRIPE_PUBLIC_KEY` | If payments enabled | - | Stripe publishable key | `pk_live_...` or `pk_test_...` |

**Important Notes:**
- Only public key is used in frontend
- Prefixed with `VITE_` to expose to client
- Use test key for development, live key for production


### Production (.env.production)

```bash
# Backend
NODE_ENV=production
PORT=8080
MONGODB_URI=mongodb+srv://produser:STRONG_PASSWORD@cluster.mongodb.net/gotyaback-prod?retryWrites=true&w=majority
JWT_SECRET=GENERATE_SECURE_64_CHARACTER_STRING
FRONTEND_URL=https://app.your-domain.com

# AWS S3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_S3_BUCKET_NAME=gotyaback-uploads-prod

# Mailgun
MAILGUN_API_KEY=key-1234567890abcdef1234567890abcdef
MAILGUN_DOMAIN=mg.your-domain.com
MAILGUN_FROM_EMAIL=noreply@your-domain.com

# Stripe (live mode)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLIC_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Frontend
VITE_API_URL=https://api.your-domain.com/api
SESSION_SECRET=GENERATE_SECURE_64_CHARACTER_STRING
VITE_STRIPE_PUBLIC_KEY=pk_live_...
```

### Staging (.env.staging)

```bash
# Backend
NODE_ENV=staging
PORT=8080
MONGODB_URI=mongodb+srv://staginguser:PASSWORD@cluster.mongodb.net/gotyaback-staging?retryWrites=true&w=majority
JWT_SECRET=staging-jwt-secret-different-from-production
FRONTEND_URL=https://staging.your-domain.com

# AWS S3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-staging-key
AWS_SECRET_ACCESS_KEY=your-staging-secret
AWS_S3_BUCKET_NAME=gotyaback-uploads-staging

# Mailgun
MAILGUN_API_KEY=your-mailgun-key
MAILGUN_DOMAIN=mg.your-domain.com
MAILGUN_FROM_EMAIL=staging@your-domain.com

# Stripe (test mode for staging)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLIC_KEY=pk_test_...

# Frontend
VITE_API_URL=https://api-staging.your-domain.com/api
SESSION_SECRET=staging-session-secret-different-from-production
VITE_STRIPE_PUBLIC_KEY=pk_test_...
```

---

## Security Best Practices

### Secret Management

1. **Never commit secrets to version control**
   ```bash
   # Add to .gitignore
   .env
   .env.local
   .env.production
   .env.staging
   ```

2. **Use different secrets for each environment**
   - Development, staging, and production should have unique secrets
   - Prevents cross-environment security issues

3. **Rotate secrets regularly**
   - JWT_SECRET: Quarterly (forces all users to re-login)
   - API keys: Annually or when team members leave
   - Database passwords: Annually

4. **Use secret management services**
   - AWS Secrets Manager
   - HashiCorp Vault
   - Environment variables in hosting platform (Heroku Config Vars, Vercel Environment Variables)

### Environment Variable Validation

The backend automatically validates environment variables on startup using `backend/src/utils/validateEnv.ts`.

**Validation Levels:**
- **Critical** (all environments): `MONGODB_URI`, `JWT_SECRET`
- **Production Required**: All AWS, Mailgun, and FRONTEND_URL variables
- **Optional**: Stripe variables (only if payments enabled)

**Startup Behavior:**
- Missing critical variables: Server exits with error
- Missing production variables in dev: Warning logged, server continues
- Missing optional variables: Info logged, features disabled

---

## Troubleshooting

### Common Issues

#### "Environment variable validation failed"

**Cause:** Required environment variable is missing or invalid

**Solution:**
1. Check error message for specific variable
2. Verify variable is set in `.env` file
3. Ensure no typos in variable name
4. Restart server after adding variables

#### "MongoServerError: Authentication failed"

**Cause:** Invalid MongoDB credentials or connection string

**Solution:**
1. Verify username and password in MONGODB_URI
2. URL-encode special characters in password
3. Check database user has correct permissions
4. Verify IP whitelist in MongoDB Atlas

#### "JWT malformed" or "Invalid token"

**Cause:** JWT_SECRET mismatch or too short

**Solution:**
1. Ensure JWT_SECRET is at least 32 characters
2. Verify same JWT_SECRET across all instances
3. Clear browser localStorage and cookies
4. Generate new JWT_SECRET if needed

#### "CORS policy: No 'Access-Control-Allow-Origin' header"

**Cause:** FRONTEND_URL doesn't match actual frontend domain

**Solution:**
1. Verify FRONTEND_URL exactly matches frontend domain
2. Remove trailing slash from FRONTEND_URL
3. Check for http vs https mismatch
4. Clear browser cache

#### "Mailgun: Forbidden"

**Cause:** Invalid Mailgun API key or unauthorized domain

**Solution:**
1. Verify MAILGUN_API_KEY is correct
2. Check domain is verified in Mailgun dashboard
3. Ensure sender email is authorized
4. Verify DNS records (SPF, DKIM) are configured

---

## Quick Reference

### Generate Secure Secrets

```bash
# JWT_SECRET (64 characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# SESSION_SECRET (64 characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Random password (32 characters)
node -e "console.log(require('crypto').randomBytes(16).toString('base64'))"
```

### Check Environment Variables

```bash
# Backend - List all environment variables
cd backend
node -e "require('dotenv').config(); console.log(process.env)"

# Frontend - List all VITE_ variables
cd frontend
npm run dev -- --debug
```

### Validate Configuration

```bash
# Backend - Test environment validation
cd backend
npm run dev

# Should see:
# ✅ Environment variables validated successfully
# ✅ MongoDB Connected: cluster.mongodb.net
# ✅ Server running on port 8080
```

---

## Additional Resources

- [MongoDB Connection Strings](https://docs.mongodb.com/manual/reference/connection-string/)
- [AWS IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
- [Mailgun Documentation](https://documentation.mailgun.com/)
- [Stripe API Keys](https://stripe.com/docs/keys)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)

**Last Updated:** 2024-01-15


---

## Environment-Specific Configurations

### Development (.env.development)

```bash
# Backend
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/gotyaback-dev
JWT_SECRET=dev-jwt-secret-minimum-32-characters-long
FRONTEND_URL=http://localhost:5173

# AWS S3 (optional in dev)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-dev-key
AWS_SECRET_ACCESS_KEY=your-dev-secret
AWS_S3_BUCKET_NAME=gotyaback-dev

# Mailgun (optional in dev - will log to console if not set)
# MAILGUN_API_KEY=
# MAILGUN_DOMAIN=
# MAILGUN_FROM_EMAIL=

# Stripe (test mode)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLIC_KEY=pk_test_...

# Frontend
VITE_API_URL=http://localhost:5000/api
SESSION_SECRET=dev-session-secret-minimum-32-characters
VITE_STRIPE_PUBLIC_KEY=pk_test_...
```


