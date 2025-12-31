# Mailgun Quick Start Guide

## 🚀 5-Minute Setup

### Step 1: Sign Up (2 minutes)
1. Go to https://www.mailgun.com/
2. Click "Sign Up"
3. Verify your email

### Step 2: Get Credentials (1 minute)
1. Login to [Mailgun Dashboard](https://app.mailgun.com/)
2. Go to **Sending** → **Domain settings** → **API keys**
3. Copy your **Private API key** (starts with `key-`)
4. Go to **Sending** → **Domains**
5. Copy your **sandbox domain** (e.g., `sandboxXXXX.mailgun.org`)

### Step 3: Authorize Your Email (1 minute)
1. Click on your sandbox domain
2. Click **"Authorized Recipients"**
3. Add your email address
4. Check your inbox and verify

### Step 4: Configure App (1 minute)
Create `backend/.env` file:

```bash
PORT=5000
MONGO_URI=mongodb://localhost:27017/bm-gotyaback
JWT_SECRET=your-dev-secret
FRONTEND_URL=http://localhost:5173

# Mailgun Configuration
MAILGUN_API_KEY=key-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
MAILGUN_DOMAIN=sandboxXXXXXXXX.mailgun.org
EMAIL_FROM=noreply@sandboxXXXXXXXX.mailgun.org
```

### Step 5: Test (1 minute)
```bash
cd backend
npm run dev
```

Then:
1. Go to http://localhost:5173/login
2. Click "Forgot Password?"
3. Enter your authorized email
4. Check your inbox!

---

## 📋 Environment Variables

### Required Variables

| Variable | Example | Where to Get |
|----------|---------|--------------|
| `MAILGUN_API_KEY` | `key-abc123...` | Mailgun Dashboard → API keys |
| `MAILGUN_DOMAIN` | `sandboxXXXX.mailgun.org` | Mailgun Dashboard → Domains |
| `EMAIL_FROM` | `noreply@sandboxXXXX.mailgun.org` | Same as MAILGUN_DOMAIN |

---

## ✅ Success Indicators

**Console shows:**
```
✅ Email sent successfully to user@example.com
   Message ID: <20231231120000.1.XXXXX@sandboxXXXX.mailgun.org>
```

**Email received:**
- Subject: "Password Reset Request - Got Your Back"
- From: Your configured EMAIL_FROM
- Contains reset link button

---

## ❌ Common Issues

### "Mailgun Not Configured"
- **Fix**: Add MAILGUN_API_KEY and MAILGUN_DOMAIN to `.env`
- **Fix**: Restart backend server

### "Email not received"
- **Fix**: Add recipient to "Authorized Recipients" in Mailgun
- **Fix**: Check spam folder
- **Fix**: Verify email address in Mailgun

### "Failed to send email"
- **Fix**: Check API key is correct
- **Fix**: Check domain matches exactly
- **Fix**: Check Mailgun dashboard logs

---

## 🔗 Quick Links

- [Mailgun Dashboard](https://app.mailgun.com/)
- [Full Setup Guide](./MAILGUN_SETUP.md)
- [Mailgun Documentation](https://documentation.mailgun.com/)

---

## 💡 Tips

- **Sandbox domain**: Only sends to authorized recipients (good for testing)
- **Custom domain**: Can send to anyone (requires DNS setup)
- **Free tier**: 5,000 emails/month for 3 months
- **Logs**: Check Mailgun dashboard for delivery status

---

## 🎯 Next Steps

1. ✅ Test password reset with sandbox domain
2. ⏭️ Add your custom domain for production
3. ⏭️ Configure DNS records (SPF, DKIM)
4. ⏭️ Add Mailgun env vars to AWS App Runner
5. ⏭️ Monitor email delivery in Mailgun dashboard

---

**Need help?** See [MAILGUN_SETUP.md](./MAILGUN_SETUP.md) for detailed instructions.

