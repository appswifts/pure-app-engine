# CDN Configuration Guide - Pure App Engine

## Optimized Settings for Restaurant Menu Application

### Overview

This configuration is specifically optimized for:
- Fast menu item loading
- Efficient image delivery
- Low latency for Supabase API calls
- Global CDN distribution

## Files Created

### 1. `_headers` - HTTP Headers Configuration
**Location:** Root directory  
**Purpose:** Sets caching and security headers for all resources

**Key Settings:**
- **Static Assets (JS/CSS):** 1 year cache, immutable
- **Images:** 30 days cache
- **HTML:** 1 hour cache with revalidation
- **API Routes:** No cache
- **Security:** CSP, XSS protection, frame denial

### 2. `_redirects` - Routing Configuration
**Location:** Root directory  
**Purpose:** SPA routing and URL redirects

**Configuration:**
- All routes serve `index.html` for React Router
- Maintains browser history API support

### 3. `functions/_middleware.ts` - Advanced Caching Logic
**Location:** `/functions` directory  
**Purpose:** Dynamic caching and optimization middleware

**Features:**
- Intelligent cache control based on content type
- Security header injection
- CORS configuration for assets
- Early hints for faster page loads
- Special handling for API calls

## Caching Strategy

### Performance Tiers

#### Tier 1: Immutable Assets (1 year)
```
/assets/*.js
/assets/*.css
*.woff2, *.woff, *.ttf
```
- Hashed filenames ensure cache safety
- Maximum CDN efficiency
- Zero origin requests after first load

#### Tier 2: Images (30 days)
```
*.jpg, *.jpeg, *.png, *.webp, *.svg
```
- Menu item images
- Restaurant logos
- UI graphics
- Reduced origin bandwidth

#### Tier 3: HTML/Routes (1 hour)
```
/, *.html, /dashboard/*, /menu/*
```
- Frequent updates possible
- Quick cache invalidation
- Balance between speed and freshness

#### Tier 4: No Cache
```
/api/*, Supabase endpoints
```
- Real-time data
- Authentication
- Dynamic content

## Cloudflare Dashboard Settings

### Recommended Configuration

#### 1. Speed → Optimization
```yaml
Auto Minify:
  - JavaScript: ✅ Enabled
  - CSS: ✅ Enabled
  - HTML: ✅ Enabled

Brotli: ✅ Enabled
Early Hints: ✅ Enabled
HTTP/3 (QUIC): ✅ Enabled
0-RTT Connection Resumption: ✅ Enabled
Rocket Loader: ❌ Disabled (SPA compatibility)
```

#### 2. Caching → Configuration
```yaml
Caching Level: Standard
Browser Cache TTL: Respect Existing Headers
Crawler Hints: ✅ Enabled
Always Online: ✅ Enabled
```

#### 3. Caching → Tiered Cache
```yaml
Tiered Cache: ✅ Enabled (Pro plan)
Smart Tiered Cache: ✅ Enabled (Pro plan)
```

#### 4. SSL/TLS → Overview
```yaml
Encryption Mode: Full (strict)
TLS Version: 1.2 minimum
Automatic HTTPS Rewrites: ✅ Enabled
Always Use HTTPS: ✅ Enabled
```

#### 5. SSL/TLS → Edge Certificates
```yaml
HTTP Strict Transport Security (HSTS):
  - Enable HSTS: ✅ Yes
  - Max Age: 12 months
  - Include subdomains: ✅ Yes
  - Preload: ✅ Yes
  - No-Sniff Header: ✅ Yes

Minimum TLS Version: TLS 1.2
Opportunistic Encryption: ✅ Enabled
TLS 1.3: ✅ Enabled
```

#### 6. Security → Settings
```yaml
Security Level: Medium
Challenge Passage: 30 minutes
Browser Integrity Check: ✅ Enabled
Privacy Pass Support: ✅ Enabled
```

#### 7. Security → Bots
```yaml
Bot Fight Mode: ✅ Enabled (Free)
Super Bot Fight Mode: ✅ Enabled (Pro plan)
```

#### 8. Network
```yaml
HTTP/2: ✅ Enabled
HTTP/3 (with QUIC): ✅ Enabled
IPv6 Compatibility: ✅ Enabled
WebSockets: ✅ Enabled
gRPC: ✅ Enabled
Pseudo IPv4: Add header
```

## Page Rules (Optional - 3 free rules)

### Rule 1: Cache Everything for Assets
```
URL Pattern: *yourdomain.com/assets/*

Settings:
- Cache Level: Cache Everything
- Edge Cache TTL: 1 month
- Browser Cache TTL: 1 month
```

### Rule 2: Bypass Cache for API
```
URL Pattern: *yourdomain.com/api/*

Settings:
- Cache Level: Bypass
```

### Rule 3: Cache HTML with Edge Cache
```
URL Pattern: *yourdomain.com/*

Settings:
- Cache Level: Cache Everything
- Edge Cache TTL: 2 hours
- Browser Cache TTL: 2 hours
```

## Image Optimization

### Cloudflare Polish (Pro Plan)

```yaml
Polish: Lossless
WebP: ✅ Enabled
```

### Free Alternative - Optimization at Upload
Use the existing AI image generation which already creates optimized images.

## Deploy Commands

### Option 1: Build and Deploy to Cloudflare Pages

```bash
# Build the application
npm run build

# Deploy to Cloudflare Pages
npx wrangler pages deploy dist --project-name=pure-app-engine

# Deploy with production environment
npx wrangler pages deploy dist --project-name=pure-app-engine --branch=main
```

### Option 2: Continuous Deployment

**Connect GitHub Repository:**
1. Go to Cloudflare Pages dashboard
2. Click "Create a project"
3. Connect your GitHub repository
4. Configure build settings:
   ```yaml
   Build command: npm run build
   Build output directory: dist
   Root directory: /
   Environment variables: Add all VITE_* variables
   ```

## Environment Variables

Set these in Cloudflare Pages dashboard:

```bash
VITE_SUPABASE_URL=https://isduljdnrbspiqsgvkiv.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_BANK_NAME=Bank of Kigali
VITE_BANK_ACCOUNT=1234567890
VITE_BANK_ACCOUNT_NAME=MenuForest Ltd
VITE_MTN_NUMBER=+250788123456
VITE_AIRTEL_NUMBER=+250732123456
VITE_APP_URL=/
```

## Performance Monitoring

### Cloudflare Analytics

Monitor these metrics:
- **Cache Hit Ratio:** Target >90%
- **Bandwidth Saved:** Track CDN efficiency
- **Response Time:** Target <200ms (CDN edge)
- **Data Transfer:** Monitor bandwidth usage

### Custom Monitoring

Your app already includes `PerformanceMonitor` utility. Access via console:

```javascript
// Check CDN performance
PerformanceMonitor.getStats('menu-items');
PerformanceMonitor.printReport();
```

## Cache Purging

### Purge All Cache
```bash
npx wrangler pages deployment purge-cache <deployment-id>
```

### Purge via Dashboard
1. Go to Cloudflare dashboard
2. Caching → Configuration
3. Click "Purge Cache"
4. Choose: Purge Everything or Custom Purge

## Testing CDN Configuration

### 1. Check Cache Headers
```bash
curl -I https://yourdomain.com/assets/index.js
```

Look for:
- `cf-cache-status: HIT` (cached at edge)
- `cache-control: public, max-age=31536000, immutable`

### 2. Test Global Performance
```bash
# Use webpagetest.org from multiple locations
# Target metrics:
# - First Contentful Paint: <1.5s
# - Time to Interactive: <3.5s
# - Largest Contentful Paint: <2.5s
```

### 3. Check Security Headers
```bash
curl -I https://yourdomain.com
```

Verify:
- `x-frame-options: DENY`
- `x-content-type-options: nosniff`
- `strict-transport-security: max-age=31536000`

## Optimization Results

### Expected Improvements

**Before CDN:**
- Global load time: 3-8 seconds
- Bandwidth: 100% from origin
- SSL handshake: 500-1000ms

**After CDN:**
- Global load time: 0.5-2 seconds (80% improvement)
- Bandwidth: 20% from origin (80% from cache)
- SSL handshake: 50-100ms (CDN edge)
- DDoS protection: Included
- Bot mitigation: Included

### Performance Targets

| Metric | Target | How to Achieve |
|--------|--------|----------------|
| Cache Hit Ratio | >90% | Proper cache headers |
| First Contentful Paint | <1.5s | CDN edge serving |
| Time to Interactive | <3.5s | Asset optimization |
| LCP | <2.5s | Image optimization |
| Global TTFB | <200ms | CDN proximity |

## Troubleshooting

### Issue: Low Cache Hit Ratio

**Causes:**
- Dynamic content being cached
- Cache headers not set correctly
- Frequent cache purges

**Solutions:**
- Check `_headers` file is deployed
- Verify middleware is active
- Review Page Rules

### Issue: Stale Content

**Causes:**
- Cache TTL too long
- Not purging after updates

**Solutions:**
- Purge cache after deployments
- Reduce HTML cache TTL
- Use versioned asset URLs

### Issue: CORS Errors

**Causes:**
- Missing CORS headers for assets
- Incorrect origin configuration

**Solutions:**
- Check middleware CORS settings
- Verify Supabase CORS configuration
- Add domains to allowed origins

## Maintenance

### Regular Tasks

**Weekly:**
- Check cache hit ratio
- Monitor bandwidth usage
- Review security logs

**Monthly:**
- Update SSL certificates (auto)
- Review analytics trends
- Optimize based on metrics

**After Each Deploy:**
- Purge HTML cache
- Test critical paths
- Verify environment variables

## Support & Resources

- **Cloudflare Docs:** https://developers.cloudflare.com/pages/
- **Wrangler Docs:** https://developers.cloudflare.com/workers/wrangler/
- **Community:** https://community.cloudflare.com/
- **Status:** https://www.cloudflarestatus.com/

---

**Configuration Version:** 1.0  
**Last Updated:** November 8, 2025  
**Optimized for:** Restaurant Menu Management Platform
