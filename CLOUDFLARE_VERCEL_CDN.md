# Cloudflare CDN with Vercel Setup

## Overview

This guide shows you how to use **Cloudflare as a CDN proxy** in front of your **Vercel deployment**, giving you the best of both platforms:

- ✅ **Vercel:** Easy deployments, preview URLs, Git integration
- ✅ **Cloudflare:** Global CDN, unlimited bandwidth, DDoS protection, caching

## Prerequisites

- ✅ Vercel deployment (already done)
- ✅ A custom domain (required for Cloudflare)
- Cloudflare account (free)

## Your Current Vercel Deployment

```
https://pure-app-engine-7vlhiul6e-iradukunda-yves-projects.vercel.app
```

## Step-by-Step Setup

### Step 1: Get a Domain Name

You need a domain to use Cloudflare. Options:

**Free/Cheap Domains:**
- Freenom: `.tk`, `.ml`, `.ga` (free)
- Namecheap: `.xyz`, `.site` ($0.99-$2/year)
- Porkbun: Various TLDs (affordable)
- Cloudflare Registrar: At-cost pricing

**Or use existing domain if you have one.**

### Step 2: Add Domain to Cloudflare

1. **Sign up/Login:** https://dash.cloudflare.com/

2. **Add Site:**
   - Click "Add a Site"
   - Enter your domain name
   - Select **Free plan**
   - Click "Add site"

3. **Review DNS records:**
   - Cloudflare will scan existing DNS records
   - Click "Continue"

4. **Update Nameservers:**
   - Cloudflare provides 2 nameservers (e.g., `alexa.ns.cloudflare.com`)
   - Go to your domain registrar
   - Replace nameservers with Cloudflare's
   - Save changes
   - Wait 5-60 minutes for propagation

### Step 3: Configure DNS to Point to Vercel

In Cloudflare DNS settings:

#### For Root Domain (yourdomain.com)

1. **Add CNAME record:**
   ```
   Type: CNAME
   Name: @ (or leave blank for root)
   Target: cname.vercel-dns.com
   Proxy status: Proxied (orange cloud icon) ← IMPORTANT!
   TTL: Auto
   ```

#### For www Subdomain

2. **Add CNAME record:**
   ```
   Type: CNAME
   Name: www
   Target: cname.vercel-dns.com
   Proxy status: Proxied (orange cloud)
   TTL: Auto
   ```

**Note:** The orange cloud means traffic goes through Cloudflare CDN first!

### Step 4: Add Custom Domain to Vercel

1. **Go to Vercel dashboard:**
   ```
   https://vercel.com/iradukunda-yves-projects/pure-app-engine/settings/domains
   ```

2. **Add your domain:**
   - Click "Add"
   - Enter your domain (e.g., `yourdomain.com`)
   - Also add `www.yourdomain.com`
   - Click "Add"

3. **Verification:**
   - Vercel will detect you're using Cloudflare
   - Follow any additional verification steps
   - Wait for SSL certificate to provision (5-10 minutes)

### Step 5: Configure Cloudflare SSL/TLS

**Critical for Vercel compatibility!**

1. Go to **SSL/TLS → Overview**
2. Set encryption mode to: **Full (strict)**
   - This is required for Vercel

### Step 6: Configure Cloudflare Caching

#### Go to: Caching → Configuration

**Caching Level:** Standard

**Browser Cache TTL:** Respect Existing Headers

**Always Online:** ✅ Enabled

#### Create Page Rules (Free: 3 rules)

**Rule 1: Cache Static Assets**
```
URL Pattern: *yourdomain.com/assets/*

Settings:
- Cache Level: Cache Everything
- Edge Cache TTL: 1 month
- Browser Cache TTL: 1 month
```

**Rule 2: Cache Images**
```
URL Pattern: *yourdomain.com/*.{jpg,jpeg,png,gif,svg,webp}

Settings:
- Cache Level: Cache Everything
- Edge Cache TTL: 1 month
- Browser Cache TTL: 1 month
```

**Rule 3: Bypass Cache for API Routes**
```
URL Pattern: *yourdomain.com/api/*

Settings:
- Cache Level: Bypass
```

### Step 7: Enable Speed Optimizations

**Go to: Speed → Optimization**

Enable these:
- ✅ **Auto Minify** (HTML, CSS, JavaScript)
- ✅ **Brotli** compression
- ✅ **HTTP/3 (with QUIC)**
- ✅ **0-RTT Connection Resumption**
- ✅ **Early Hints**
- ❌ **Rocket Loader** (disable for SPA)

### Step 8: Configure Security

**Go to: Security → Settings**

- **Security Level:** Medium
- ✅ **Browser Integrity Check**
- ✅ **Privacy Pass Support**

**Go to: Security → Bots**
- ✅ **Bot Fight Mode** (Free plan)

### Step 9: Enable Always Use HTTPS

**Go to: SSL/TLS → Edge Certificates**

- ✅ **Always Use HTTPS**
- ✅ **Automatic HTTPS Rewrites**
- ✅ **Minimum TLS Version:** 1.2

**Configure HSTS:**
- ✅ **Enable HSTS**
- Max Age: 12 months
- ✅ Include subdomains
- ✅ Preload

### Step 10: Update Vercel Headers (Optional)

Update `vercel.json` to work with Cloudflare:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    },
    {
      "source": "/:path(.*\\.(?:jpg|jpeg|png|gif|svg|webp|ico))",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=2592000"
        }
      ]
    },
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

## Testing the Setup

### 1. Check DNS Propagation
```
https://www.whatsmydns.net/
```
Enter your domain and check if it resolves globally.

### 2. Verify Cloudflare is Active
```bash
curl -I https://yourdomain.com
```

Look for these headers:
```
cf-cache-status: HIT (or MISS on first request)
cf-ray: [ray-id]
server: cloudflare
```

### 3. Test Cache Performance
```bash
# First request (MISS - not cached yet)
curl -I https://yourdomain.com/assets/index.js

# Second request (should be HIT - cached)
curl -I https://yourdomain.com/assets/index.js
```

### 4. Test Global Performance
Use: https://www.webpagetest.org/
- Test from multiple locations
- Should see <2s load times globally

## Deployment Workflow

### Deploy to Vercel (as usual)
```bash
npm run deploy:vercel
# or
vercel --prod
# or
git push (if using Git integration)
```

### Purge Cloudflare Cache (after deploy)
1. Go to Cloudflare dashboard
2. Caching → Configuration
3. Click "Purge Everything"
4. Or purge specific URLs

## Architecture

```
User Request
    ↓
Cloudflare Edge (250+ locations)
    ↓ (cache miss)
Vercel (your app)
    ↓
Response cached at Cloudflare
    ↓
Next requests served from Cloudflare edge
```

## Benefits of This Setup

### Performance
- ⚡ **50-70% faster** global load times
- 📉 **80% reduction** in Vercel bandwidth usage
- 🌍 **250+ edge locations** worldwide

### Cost Savings
- 💰 **Unlimited bandwidth** on Cloudflare (free)
- 💰 Stay within Vercel free tier longer
- 💰 Reduce Vercel bandwidth costs

### Security
- 🛡️ **DDoS protection** (Cloudflare)
- 🛡️ **Bot mitigation**
- 🛡️ **WAF** (Web Application Firewall)
- 🔒 **SSL/TLS** optimization

### Developer Experience
- ✅ Keep Vercel deployments
- ✅ Keep preview URLs
- ✅ Keep Git integration
- ✅ Add CDN on top

## Monitoring

### Cloudflare Analytics

Track:
- **Cache hit ratio** (aim for 90%+)
- **Bandwidth saved**
- **Requests served from cache**
- **Security threats blocked**
- **Global performance**

### Vercel Analytics

Track:
- Deployment status
- Build times
- Origin requests (should decrease)
- Function executions

## Troubleshooting

### Domain not resolving
- **Cause:** Nameservers not updated or propagation delay
- **Fix:** Wait up to 24 hours, verify nameservers

### SSL errors
- **Cause:** Wrong SSL/TLS mode
- **Fix:** Set to "Full (strict)" in Cloudflare

### Vercel not recognizing domain
- **Cause:** DNS not configured correctly
- **Fix:** Use `cname.vercel-dns.com` as CNAME target

### Cache not working
- **Cause:** Proxy not enabled or Page Rules incorrect
- **Fix:** Enable orange cloud, verify Page Rules

### Content not updating
- **Cause:** Cloudflare cache not purged
- **Fix:** Purge cache after each deployment

## Best Practices

### 1. Cache Strategy
- **Static assets:** Cache aggressively (1 year)
- **Images:** Cache moderately (30 days)
- **HTML:** Cache briefly (1 hour) or bypass
- **API routes:** Bypass cache

### 2. Deployment Workflow
```bash
# 1. Deploy to Vercel
vercel --prod

# 2. Purge Cloudflare cache
# (via dashboard or API)

# 3. Test the site
curl -I https://yourdomain.com
```

### 3. Monitor Performance
- Check Cloudflare Analytics weekly
- Adjust cache settings based on metrics
- Monitor Vercel bandwidth usage

## Cost Breakdown

### Cloudflare Free Tier
- ✅ Unlimited bandwidth
- ✅ Unlimited requests
- ✅ DDoS protection
- ✅ SSL certificates
- ✅ 3 Page Rules
- **Cost: $0/month**

### Vercel Free Tier
- 100GB bandwidth/month (goes much further with CDN)
- Unlimited deployments
- Preview deployments
- **Cost: $0/month**

### Domain Cost
- **$0-15/year** depending on TLD

## Need Help?

- Cloudflare Docs: https://developers.cloudflare.com/
- Vercel Docs: https://vercel.com/docs/custom-domains
- Community: https://community.cloudflare.com/

---

**Summary:** This setup gives you Vercel's developer experience with Cloudflare's global CDN performance and unlimited bandwidth - the best of both worlds! 🚀
