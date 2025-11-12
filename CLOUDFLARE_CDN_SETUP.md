# Cloudflare CDN Setup Guide

## Overview

This guide will help you set up Cloudflare as a CDN in front of your Vercel deployment for improved performance, security, and caching.

## Prerequisites

- ✅ Cloudflare Wrangler CLI installed
- Domain name (required for Cloudflare)
- Cloudflare account (free tier available)
- Vercel deployment running

## Current Deployment

**Vercel URL:** `https://pure-app-engine-7vlhiul6e-iradukunda-yves-projects.vercel.app`

## Setup Options

### Option 1: Cloudflare Proxy (Recommended)

This setup uses Cloudflare as a CDN/proxy in front of your Vercel deployment.

#### Step 1: Get a Domain Name

You need a domain to use Cloudflare. Free/cheap options:
- Freenom (free domains)
- Namecheap ($8-15/year)
- Google Domains
- Cloudflare Registrar (at-cost pricing)

#### Step 2: Add Domain to Cloudflare

1. **Sign up/Login to Cloudflare:**
   ```
   https://dash.cloudflare.com/
   ```

2. **Add your domain:**
   - Click "Add a Site"
   - Enter your domain name
   - Select Free plan (or higher)

3. **Update nameservers:**
   - Cloudflare will provide nameservers (e.g., `alexa.ns.cloudflare.com`)
   - Update these at your domain registrar
   - Wait 5-60 minutes for propagation

#### Step 3: Configure DNS Records

1. **Go to DNS settings** in Cloudflare dashboard

2. **Add CNAME record:**
   ```
   Type: CNAME
   Name: @ (or www)
   Target: pure-app-engine-7vlhiul6e-iradukunda-yves-projects.vercel.app
   Proxy status: Proxied (orange cloud)
   TTL: Auto
   ```

3. **Add www redirect (optional):**
   ```
   Type: CNAME
   Name: www
   Target: pure-app-engine-7vlhiul6e-iradukunda-yves-projects.vercel.app
   Proxy status: Proxied
   ```

#### Step 4: Configure Vercel Custom Domain

1. **Go to Vercel dashboard:**
   ```
   https://vercel.com/iradukunda-yves-projects/pure-app-engine/settings/domains
   ```

2. **Add your custom domain:**
   - Enter your domain (e.g., `yourdomain.com`)
   - Vercel will detect Cloudflare
   - Follow verification steps

#### Step 5: Enable Cloudflare Features

1. **SSL/TLS Settings:**
   - Go to SSL/TLS → Overview
   - Set encryption mode to "Full (strict)"

2. **Caching:**
   - Go to Caching → Configuration
   - Enable "Cache Everything"
   - Set Browser Cache TTL: 4 hours (or higher)

3. **Speed Optimizations:**
   - Go to Speed → Optimization
   - Enable "Auto Minify" (HTML, CSS, JS)
   - Enable "Brotli" compression
   - Enable "Rocket Loader" (optional)

4. **Security:**
   - Go to Security → WAF
   - Enable "Browser Integrity Check"
   - Enable "Bot Fight Mode" (Free plan)

#### Step 6: Configure Page Rules (Optional)

Go to Rules → Page Rules and add:

**Cache Static Assets:**
```
URL: *yourdomain.com/*.{jpg,jpeg,png,gif,svg,css,js,woff,woff2}
Settings:
  - Cache Level: Cache Everything
  - Edge Cache TTL: 1 month
  - Browser Cache TTL: 1 month
```

**Cache HTML (aggressive):**
```
URL: *yourdomain.com/*
Settings:
  - Cache Level: Cache Everything
  - Edge Cache TTL: 2 hours
  - Browser Cache TTL: 2 hours
```

### Option 2: Cloudflare Pages (Alternative to Vercel)

If you want to use Cloudflare Pages instead of Vercel:

#### Step 1: Install Cloudflare Pages CLI

Already installed via Wrangler!

#### Step 2: Deploy to Cloudflare Pages

```bash
npx wrangler pages deploy dist --project-name=pure-app-engine
```

#### Step 3: Configure Build Settings

Create `wrangler.toml`:

```toml
name = "pure-app-engine"
compatibility_date = "2024-01-01"

[site]
bucket = "./dist"

[build]
command = "npm run build"
cwd = "."
watch_dirs = ["src"]

[[build.upload.rules]]
type = "Text"
globs = ["**/*.html", "**/*.txt", "**/*.js", "**/*.css"]

[[build.upload.rules]]
type = "CompiledWasm"
globs = ["**/*.wasm"]
```

## CDN Configuration Best Practices

### 1. Cache Rules

**Static Assets (images, fonts, CSS, JS):**
- Cache TTL: 1 month - 1 year
- Always cached at edge

**HTML Pages:**
- Cache TTL: 2-24 hours
- Purge on deployment

**API Endpoints:**
- No caching or very short (1-5 minutes)

### 2. Performance Settings

- **Enable HTTP/3:** Speed → Optimization → HTTP/3
- **Enable 0-RTT:** Speed → Optimization → 0-RTT Connection Resumption
- **Enable Early Hints:** Speed → Optimization → Early Hints
- **Compress images:** Use Cloudflare Polish (Pro plan) or optimize before upload

### 3. Security Settings

- **Enable DNSSEC:** DNS → Settings → DNSSEC
- **Enable Always Use HTTPS:** SSL/TLS → Edge Certificates → Always Use HTTPS
- **Enable HSTS:** SSL/TLS → Edge Certificates → HSTS
- **Enable Automatic HTTPS Rewrites**

### 4. Monitoring

- Check Analytics dashboard for:
  - Cache hit ratio (aim for >90%)
  - Bandwidth saved
  - Response times
  - Security threats blocked

## CLI Commands

### Wrangler Authentication

```bash
npx wrangler login
```

### Deploy to Cloudflare Pages

```bash
# Build first
npm run build

# Deploy
npx wrangler pages deploy dist --project-name=pure-app-engine
```

### Manage Cloudflare Cache

```bash
# Purge entire cache
npx wrangler pages deployment purge-cache <deployment-id>
```

## Update Environment Variables

If using Cloudflare Pages, set environment variables:

```bash
npx wrangler pages secret put VITE_SUPABASE_URL
npx wrangler pages secret put VITE_SUPABASE_ANON_KEY
# ... add all other env vars
```

## Cost Comparison

### Cloudflare Free Plan
- **Bandwidth:** Unlimited
- **Requests:** Unlimited
- **DDoS Protection:** Included
- **SSL:** Free
- **CDN:** Global network
- **DNS:** Unlimited queries
- **Cost:** $0/month

### Cloudflare Pro Plan ($20/month)
- Everything in Free
- **Image optimization** (Polish)
- **Mobile optimization**
- **WAF custom rules**
- **Priority support**

## Performance Benefits

With Cloudflare CDN enabled:
- ⚡ **50-70% faster** load times globally
- 📉 **60-80% bandwidth reduction** on Vercel
- 🛡️ **DDoS protection** included
- 🌍 **250+ edge locations** worldwide
- 💰 **Reduced Vercel bandwidth costs**

## Testing CDN Setup

1. **Check DNS propagation:**
   ```
   https://www.whatsmydns.net/
   ```

2. **Test CDN cache:**
   ```bash
   curl -I https://yourdomain.com
   ```
   Look for header: `cf-cache-status: HIT`

3. **Check SSL:**
   ```
   https://www.ssllabs.com/ssltest/
   ```

4. **Test global performance:**
   ```
   https://www.webpagetest.org/
   ```

## Next Steps

1. Purchase/get a domain name
2. Add domain to Cloudflare
3. Update nameservers
4. Configure DNS records
5. Add custom domain to Vercel
6. Enable Cloudflare features
7. Test and monitor performance

## Troubleshooting

### Issue: Site not loading
- Check DNS propagation (can take up to 24 hours)
- Verify CNAME record is correct
- Ensure proxy is enabled (orange cloud)

### Issue: SSL errors
- Set SSL/TLS mode to "Full (strict)"
- Wait for SSL certificate to provision (can take 15 minutes)

### Issue: Cache not working
- Check Page Rules are correctly configured
- Verify "Cache Everything" is enabled
- Check cache status headers in browser DevTools

### Issue: Assets not loading
- Check CORS settings in Vercel
- Verify proxy status on DNS records
- Check browser console for errors

## Support Resources

- Cloudflare Docs: https://developers.cloudflare.com/
- Wrangler Docs: https://developers.cloudflare.com/workers/wrangler/
- Community Forum: https://community.cloudflare.com/
- Status Page: https://www.cloudflarestatus.com/

---

**Note:** This guide assumes you're using Cloudflare with Vercel. For best results, use a custom domain with Cloudflare as the CDN layer.
