# HTTPS Deployment Guide

This guide explains how to configure HTTPS for your fundraising platform in production.

## ✅ Application-Level HTTPS Readiness (Already Implemented)

The following HTTPS-ready features have been implemented in the application code:

1. **Trust Proxy Configuration** ✅
   - App is configured to trust reverse proxy headers (`X-Forwarded-*`)
   - Allows correct client IP detection behind load balancers/proxies

2. **HSTS (HTTP Strict Transport Security)** ✅
   - Configured in helmet.js with 1-year max-age
   - Includes subdomains
   - Preload-ready

3. **Secure CORS Configuration** ✅
   - Production mode blocks requests with no origin
   - Only allows whitelisted origins
   - Credentials enabled for secure cookie transmission

4. **Security Headers** ✅
   - All security headers configured via helmet.js
   - CSP, X-Frame-Options, X-Content-Type-Options, etc.

## 🚀 Deployment Options

### Option 1: Using nginx as Reverse Proxy (Recommended)

#### Step 1: Install nginx and Certbot

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx

# CentOS/RHEL
sudo yum install nginx certbot python3-certbot-nginx
```

#### Step 2: Configure nginx

Create `/etc/nginx/sites-available/your-app`:

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL certificate paths (will be configured by certbot)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Proxy to Node.js backend
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Serve frontend (if serving from same domain)
    location / {
        root /var/www/your-app/frontend/dist;
        try_files $uri $uri/ /index.html;
    }
}
```

#### Step 3: Enable the site

```bash
sudo ln -s /etc/nginx/sites-available/your-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### Step 4: Obtain SSL Certificate

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Certbot will:
- Obtain a free SSL certificate from Let's Encrypt
- Automatically configure nginx
- Set up auto-renewal

#### Step 5: Test Auto-Renewal

```bash
sudo certbot renew --dry-run
```

### Option 2: AWS with Application Load Balancer (ALB)

1. **Create an ALB** in AWS Console
2. **Add HTTPS listener** (port 443)
3. **Upload or request SSL certificate** via AWS Certificate Manager (ACM)
4. **Configure target group** pointing to your EC2 instances (port 5000)
5. **Add HTTP listener** (port 80) with redirect to HTTPS
6. **Update security groups** to allow HTTPS (443) traffic

### Option 3: Heroku

Heroku automatically provides HTTPS for all apps:

```bash
# No additional configuration needed
# Heroku handles SSL/TLS automatically
```

### Option 4: Docker with Traefik

```yaml
# docker-compose.yml
version: '3.8'

services:
  traefik:
    image: traefik:v2.10
    command:
      - "--providers.docker=true"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      - "--certificatesresolvers.myresolver.acme.tlschallenge=true"
      - "--certificatesresolvers.myresolver.acme.email=your-email@example.com"
      - "--certificatesresolvers.myresolver.acme.storage=/letsencrypt/acme.json"
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - "/var/run/docker.sock:/var/run/docker.sock:ro"
      - "./letsencrypt:/letsencrypt"

  backend:
    build: ./backend
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.backend.rule=Host(`api.yourdomain.com`)"
      - "traefik.http.routers.backend.entrypoints=websecure"
      - "traefik.http.routers.backend.tls.certresolver=myresolver"
```

## 🔧 Environment Variables for Production

Update your `.env` file for production:

```bash
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com
# Remove all http://localhost origins from CORS configuration
```

## ✅ Post-Deployment Checklist

After setting up HTTPS, verify:

- [ ] HTTP automatically redirects to HTTPS
- [ ] SSL certificate is valid (check with https://www.ssllabs.com/ssltest/)
- [ ] HSTS header is present in responses
- [ ] All API calls use HTTPS
- [ ] Cookies have `secure` flag set
- [ ] No mixed content warnings in browser console
- [ ] CORS works correctly with HTTPS origins

## 🔍 Testing HTTPS Configuration

```bash
# Test HTTP to HTTPS redirect
curl -I http://yourdomain.com

# Test HTTPS response headers
curl -I https://yourdomain.com

# Check for HSTS header
curl -I https://yourdomain.com | grep -i strict-transport-security
```

## 📝 Notes

- **Let's Encrypt certificates** are free and auto-renew every 90 days
- **AWS Certificate Manager** provides free certificates for AWS resources
- **Cloudflare** can provide free SSL/TLS if you use their DNS
- Always test in a staging environment first

