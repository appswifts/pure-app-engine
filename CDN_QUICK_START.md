# CDN Quick Start Guide

## 🚀 Quick Deploy Commands

### Deploy to Cloudflare Pages (Recommended)
```bash
npm run deploy:cf
```

### Deploy to Cloudflare Staging
```bash
npm run deploy:cf-staging
```

### Deploy to Vercel
```bash
npm run deploy:vercel
```

### Using PowerShell Script (Automated)
```powershell
.\deploy-cdn.ps1
```

## ⚡ One-Time Setup

### 1. Authenticate with Cloudflare
```bash
npx wrangler login
```

### 2. Verify Authentication
```bash
npx wrangler whoami
```

## 📁 CDN Files Created

| File | Purpose | Auto-deployed |
|------|---------|---------------|
| `_headers` | Cache & security headers | ✅ Yes |
| `_redirects` | SPA routing | ✅ Yes |
| `wrangler.toml` | Cloudflare config | ✅ Yes |
| `functions/_middleware.ts` | Advanced caching | ✅ Yes |

## 🎯 Optimized Cache Strategy

| Asset Type | Cache Duration | Why |
|------------|----------------|-----|
| **JS/CSS** | 1 year (immutable) | Hashed filenames |
| **Images** | 30 days | Menu photos |
| **HTML** | 1 hour | Quick updates |
| **API** | No cache | Real-time data |

## ⚙️ Cloudflare Dashboard Settings

### Essential Settings (5 minutes)

1. **SSL/TLS** → Overview
   - Set to: **Full (strict)**

2. **Speed** → Optimization
   - ✅ Enable all minification
   - ✅ Enable Brotli
   - ✅ Enable HTTP/3

3. **Caching** → Configuration
   - Caching Level: **Standard**
   - Browser Cache TTL: **Respect Existing Headers**

4. **Security** → Settings
   - Security Level: **Medium**
   - ✅ Enable Bot Fight Mode

## 📊 Performance Expectations

| Metric | Before CDN | After CDN | Improvement |
|--------|-----------|-----------|-------------|
| Global Load Time | 3-8s | 0.5-2s | **80%** ⬇️ |
| Cache Hit Ratio | 0% | 90%+ | **90%** ⬆️ |
| Bandwidth Cost | 100% | 20% | **80%** ⬇️ |
| SSL Handshake | 500ms | 50ms | **90%** ⬇️ |

## 🔍 Test CDN Performance

### Check if CDN is working
```bash
curl -I https://your-domain.com
```

Look for: `cf-cache-status: HIT`

### Test cache for assets
```bash
curl -I https://your-domain.com/assets/index.js
```

Should show: `cache-control: public, max-age=31536000, immutable`

## 🛠️ Common Commands

### Purge Cache
```bash
# Via Cloudflare dashboard: Caching → Configuration → Purge Everything
```

### Check Deployment Status
```bash
npx wrangler pages deployment list --project-name=pure-app-engine
```

### View Logs
```bash
npx wrangler pages deployment tail --project-name=pure-app-engine
```

## 🌍 Set Environment Variables

### Via Dashboard
1. Go to Cloudflare Pages
2. Select project → Settings → Environment Variables
3. Add all `VITE_*` variables

### Via CLI (for secrets)
```bash
npx wrangler pages secret put VITE_SUPABASE_ANON_KEY
```

## 📱 Mobile Optimization

Already configured:
- ✅ Responsive images
- ✅ Brotli compression
- ✅ HTTP/3 enabled
- ✅ Early hints
- ✅ 0-RTT resumption

## 🔐 Security Features Enabled

- ✅ DDoS protection
- ✅ Bot mitigation
- ✅ SSL/TLS encryption
- ✅ HSTS headers
- ✅ CSP headers
- ✅ XSS protection
- ✅ Clickjacking protection

## 💰 Cost Comparison

### Cloudflare Pages (Free Tier)
- ✅ Unlimited bandwidth
- ✅ Unlimited requests
- ✅ 500 builds/month
- ✅ DDoS protection
- **Cost: $0/month**

### Vercel (Free Tier)
- 100GB bandwidth
- Serverless function limits
- **Cost: $0/month** (limited)

## 🚨 Troubleshooting

### CDN not caching?
```bash
# Check headers file
cat _headers

# Verify deployment
npx wrangler pages deployment list
```

### Stale content showing?
```bash
# Purge cache via dashboard
# Or wait for cache TTL to expire
```

### Build failing?
```bash
# Check build locally
npm run build

# Check environment variables
npx wrangler pages secret list
```

## 📚 Full Documentation

- **Detailed Config:** `CDN_CONFIGURATION.md`
- **Cloudflare Setup:** `CLOUDFLARE_CDN_SETUP.md`
- **Wrangler Config:** `wrangler.toml`

## 🎉 You're Ready!

Run: `npm run deploy:cf` to get started!

---

**Questions?** Check the full documentation or Cloudflare community forums.
