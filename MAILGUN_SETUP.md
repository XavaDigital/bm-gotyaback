# Mailgun Email Integration Setup Guide

## Overview

The application now uses **Mailgun** to send transactional emails, including password reset emails. This guide will help you set up Mailgun and configure the application.

---

## 🎯 What's Integrated

✅ **Mailgun SDK** installed (`mailgun.js` + `form-data`)  
✅ **Email service** updated to use Mailgun API  
✅ **Fallback mode** - logs to console if Mailgun not configured  
✅ **Error handling** - graceful fallback in development  
✅ **Environment variables** - easy configuration  

---

## 📋 Prerequisites

- Mailgun account (free tier available)
- Domain for sending emails (or use Mailgun sandbox)
- 10 minutes of setup time

---

## 🚀 Step 1: Create Mailgun Account

### 1.1 Sign Up

1. Go to [https://www.mailgun.com/](https://www.mailgun.com/)
2. Click **"Sign Up"** or **"Start Free Trial"**
3. Fill in your details:
   - Email address
   - Password
   - Company name (can be your project name)
4. Verify your email address

### 1.2 Free Tier Details

- **5,000 emails/month** for first 3 months
- **100 emails/day** after trial
- Perfect for development and small-scale production

---

## 🔑 Step 2: Get Your API Credentials

### 2.1 Get API Key

1. Log in to [Mailgun Dashboard](https://app.mailgun.com/)
2. Click **"Sending"** → **"Domain settings"** → **"API keys"**
3. Copy your **Private API key**
   - Format: `key-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - Keep this secret! Never commit to git

### 2.2 Get Your Domain

**Option A: Use Sandbox Domain (Quick Start - Development)**

1. In Mailgun dashboard, go to **"Sending"** → **"Domains"**
2. You'll see a sandbox domain like: `sandboxXXXXXXXX.mailgun.org`
3. Click on it to see details
4. **Important**: Sandbox domains can only send to **authorized recipients**
5. Add authorized recipients:
   - Click **"Authorized Recipients"**
   - Add your email address
   - Verify the confirmation email

**Option B: Add Your Own Domain (Production)**

1. Go to **"Sending"** → **"Domains"** → **"Add New Domain"**
2. Enter your domain (e.g., `mail.yourdomain.com`)
3. Follow DNS setup instructions:
   - Add TXT records for verification
   - Add MX records for receiving
   - Add CNAME records for tracking
4. Wait for DNS propagation (can take up to 48 hours)
5. Verify domain in Mailgun dashboard

---

## ⚙️ Step 3: Configure Your Application

### 3.1 Development Environment

Create or update `backend/.env`:

```bash
# Existing variables...
PORT=5000
MONGO_URI=mongodb://localhost:27017/bm-gotyaback
JWT_SECRET=your-dev-secret
FRONTEND_URL=http://localhost:5173

# Add Mailgun configuration
MAILGUN_API_KEY=key-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
MAILGUN_DOMAIN=sandboxXXXXXXXX.mailgun.org
EMAIL_FROM=noreply@sandboxXXXXXXXX.mailgun.org
```

### 3.2 Production Environment

Update `backend/.env.production` (keep this file local, don't commit):

```bash
# Production configuration
PORT=8080
NODE_ENV=production
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<dbname>
JWT_SECRET=your-production-secret
FRONTEND_URL=https://your-frontend-url.awsapprunner.com

# Mailgun configuration
MAILGUN_API_KEY=key-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
MAILGUN_DOMAIN=mail.yourdomain.com
EMAIL_FROM=noreply@yourdomain.com
```

### 3.3 AWS App Runner (Production Deployment)

When deploying to AWS App Runner, add these environment variables:

1. Go to AWS App Runner console
2. Select your backend service
3. Go to **Configuration** → **Environment variables**
4. Add:
   - `MAILGUN_API_KEY` = `key-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - `MAILGUN_DOMAIN` = `mail.yourdomain.com`
   - `EMAIL_FROM` = `noreply@yourdomain.com`

---

## 🧪 Step 4: Test the Integration

### 4.1 Start Your Backend

```bash
cd backend
npm run dev
```

### 4.2 Test Password Reset Flow

1. Go to `http://localhost:5173/login`
2. Click **"Forgot Password?"**
3. Enter an email address:
   - **If using sandbox**: Must be an authorized recipient
   - **If using verified domain**: Any email address
4. Click **"Send Reset Link"**

### 4.3 Check Results

**If Mailgun is configured correctly:**
```
✅ Email sent successfully to user@example.com
   Message ID: <20231231120000.1.XXXXX@sandboxXXXX.mailgun.org>
```

**If Mailgun is not configured:**
```
========== EMAIL (Console Mode - Mailgun Not Configured) ==========
To: user@example.com
Subject: Password Reset Request - Got Your Back
...
💡 To send real emails, configure MAILGUN_API_KEY and MAILGUN_DOMAIN in .env
```

### 4.4 Check Your Inbox

- Check the recipient's email inbox
- Look for email from your configured `EMAIL_FROM` address
- Subject: "Password Reset Request - Got Your Back"
- Click the reset link to test the full flow

---

## 🔍 Troubleshooting

### Issue: "Mailgun Not Configured" message

**Cause**: Environment variables not set

**Solution**:
1. Check `backend/.env` file exists
2. Verify `MAILGUN_API_KEY` and `MAILGUN_DOMAIN` are set
3. Restart your backend server

### Issue: "Failed to send email via Mailgun"

**Cause**: Invalid API key or domain

**Solution**:
1. Verify API key is correct (starts with `key-`)
2. Verify domain matches exactly (including sandbox prefix)
3. Check Mailgun dashboard for error logs

### Issue: Email not received (sandbox domain)

**Cause**: Recipient not authorized

**Solution**:
1. Go to Mailgun dashboard
2. Click your sandbox domain
3. Add recipient to "Authorized Recipients"
4. Verify the confirmation email sent to recipient

### Issue: Email goes to spam

**Cause**: Domain not verified or missing SPF/DKIM records

**Solution**:
1. Verify your domain in Mailgun
2. Add all required DNS records (SPF, DKIM, CNAME)
3. Wait for DNS propagation
4. Use a verified domain instead of sandbox

---

## 📊 Monitoring & Logs

### Mailgun Dashboard

1. Go to [Mailgun Dashboard](https://app.mailgun.com/)
2. Click **"Sending"** → **"Logs"**
3. View all sent emails, delivery status, and errors

### Application Logs

The email service logs all activity:

**Success:**
```
✅ Email sent successfully to user@example.com
   Message ID: <message-id>
```

**Failure:**
```
❌ Failed to send email via Mailgun: [error message]
```

---

## 💰 Pricing & Limits

### Free Tier (Trial)
- **5,000 emails/month** for first 3 months
- All features included
- Credit card required

### Pay-as-you-go (After Trial)
- **$0.80 per 1,000 emails**
- **100 emails/day** free
- No monthly fee

### Foundation Plan
- **$35/month**
- **50,000 emails/month** included
- $0.80 per 1,000 additional emails

---

## 🔒 Security Best Practices

✅ **Never commit API keys** - Keep `.env` files in `.gitignore`  
✅ **Use environment variables** - Don't hardcode credentials  
✅ **Rotate keys regularly** - Generate new API keys periodically  
✅ **Use verified domains** - Better deliverability and trust  
✅ **Monitor usage** - Watch for unusual activity  
✅ **Restrict API keys** - Use separate keys for dev/prod  

---

## 📚 Additional Resources

- [Mailgun Documentation](https://documentation.mailgun.com/)
- [Mailgun API Reference](https://documentation.mailgun.com/en/latest/api_reference.html)
- [Domain Verification Guide](https://documentation.mailgun.com/en/latest/user_manual.html#verifying-your-domain)
- [Mailgun Node.js SDK](https://github.com/mailgun/mailgun.js)

---

## ✅ Checklist

Before going to production:

- [ ] Mailgun account created
- [ ] API key obtained and secured
- [ ] Domain verified (or sandbox authorized recipients added)
- [ ] Environment variables configured
- [ ] Test email sent successfully
- [ ] Password reset flow tested end-to-end
- [ ] DNS records configured (for custom domain)
- [ ] Monitoring set up in Mailgun dashboard
- [ ] API keys added to AWS App Runner (production)

---

**Created**: 2025-12-31  
**Status**: Ready for use

