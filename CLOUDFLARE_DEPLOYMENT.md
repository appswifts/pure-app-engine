# 🚀 CLOUDFLARE PAGES DEPLOYMENT GUIDE

**Status:** ✅ Ready to Deploy  
**Project:** pure-app-engine  
**Method:** Wrangler CLI (Cloudflare)

---

## ⚡ **QUICK DEPLOY**

### **Production Deployment:**
```bash
npm run deploy:cf
```

### **Staging Deployment:**
```bash
npm run deploy:cf-staging
```

**That's it!** 🎉

---

## 📋 **WHAT HAPPENS**

### **When you run `npm run deploy:cf`:**
```
1. Builds your app (vite build)
   └─ Creates optimized production build
   └─ Output: dist/ folder

2. Deploys to Cloudflare Pages
   └─ Uploads dist/ folder
   └─ Project: pure-app-engine
   └─ Branch: production (main)

3. Returns deployment URL
   └─ Live URL
   └─ Preview URL
```

---

## 🎯 **STEP-BY-STEP DEPLOYMENT**

### **First Time Setup:**

**1. Login to Cloudflare (if not already):**
```bash
wrangler login
```

**2. Deploy:**
```bash
npm run deploy:cf
```

**3. Wait for build & upload:**
```
✓ Building application...
✓ Uploading files...
✓ Deployment complete!

URL: https://pure-app-engine.pages.dev
```

**4. Visit your live site!** 🎉

---

## 🔧 **ENVIRONMENT VARIABLES**

### **Set Cloudflare Environment Variables:**

**Via Dashboard:**
```
1. Go to: https://dash.cloudflare.com/
2. Pages → pure-app-engine
3. Settings → Environment variables
4. Add:
   - VITE_SUPABASE_URL = your-supabase-url
   - VITE_SUPABASE_ANON_KEY = your-anon-key
5. Save & redeploy
```

**Via CLI:**
```bash
wrangler pages secret put VITE_SUPABASE_URL
# Enter value when prompted

wrangler pages secret put VITE_SUPABASE_ANON_KEY
# Enter value when prompted
```

---

## 📊 **DEPLOYMENT OPTIONS**

### **Option 1: Production Deploy (default)**
```bash
npm run deploy:cf
```
- Deploys to: production
- URL: https://pure-app-engine.pages.dev
- Branch: main

### **Option 2: Staging Deploy**
```bash
npm run deploy:cf-staging
```
- Deploys to: staging
- URL: https://staging.pure-app-engine.pages.dev
- Branch: staging

### **Option 3: Custom Deploy**
```bash
npm run build
wrangler pages deploy dist --project-name=pure-app-engine --branch=my-feature
```
- Custom branch
- Custom preview URL

---

## 🌐 **YOUR LIVE URLs**

### **After Deployment:**
```
Production:
https://pure-app-engine.pages.dev

Staging:
https://staging.pure-app-engine.pages.dev

Preview (per commit):
https://[commit-hash].pure-app-engine.pages.dev
```

---

## ✅ **PRE-DEPLOYMENT CHECKLIST**

**Before deploying:**
- [ ] ✅ Build works locally (`npm run build`)
- [ ] ✅ App runs in preview (`npm run preview`)
- [ ] ✅ Environment variables set in Cloudflare
- [ ] ✅ Supabase URL configured
- [ ] ✅ All features tested locally
- [ ] ✅ Database migrations applied
- [ ] ✅ Wrangler CLI logged in

---

## 🔍 **VERIFY DEPLOYMENT**

### **After Deploy:**

**1. Check build output:**
```bash
npm run build
# Should complete without errors
```

**2. Test locally first:**
```bash
npm run preview
# Open http://localhost:4173
# Test all features
```

**3. Deploy:**
```bash
npm run deploy:cf
```

**4. Visit live site:**
```
Open: https://pure-app-engine.pages.dev
Test:
- [ ] Homepage loads
- [ ] Login works
- [ ] Dashboard accessible
- [ ] Public menus work
- [ ] Subscription system works
```

---

## 🚨 **TROUBLESHOOTING**

### **Issue 1: Build Fails**
```bash
Error: Build failed

Solution:
1. Check for TypeScript errors
2. Run: npm run build
3. Fix any errors
4. Try deploy again
```

### **Issue 2: Wrangler Not Found**
```bash
Error: wrangler: command not found

Solution:
npm install -g wrangler
# Or use npx:
npx wrangler login
```

### **Issue 3: Not Logged In**
```bash
Error: Not authenticated

Solution:
wrangler login
# Follow browser authentication
```

### **Issue 4: Environment Variables Missing**
```bash
Error: VITE_SUPABASE_URL not defined

Solution:
1. Go to Cloudflare Dashboard
2. Pages → pure-app-engine → Settings
3. Environment variables → Add
4. Redeploy
```

### **Issue 5: 404 Errors on Routes**
```bash
Routes don't work (404 on /admin, etc.)

Solution: Add _redirects file
See section below ↓
```

---

## 📄 **HANDLE SPA ROUTING**

### **Create `_redirects` file:**

**File:** `public/_redirects`
```
/*    /index.html   200
```

**This ensures all routes work properly!**

Let me create this file for you:

---

## 🎯 **DEPLOYMENT WORKFLOW**

### **Recommended Workflow:**

**1. Develop Locally:**
```bash
npm run dev
# Test features
```

**2. Build & Preview:**
```bash
npm run build
npm run preview
# Test production build locally
```

**3. Deploy to Staging:**
```bash
npm run deploy:cf-staging
# Test on staging URL
```

**4. Deploy to Production:**
```bash
npm run deploy:cf
# Live deployment
```

---

## 📊 **CLOUDFLARE DASHBOARD**

### **View Your Deployment:**
```
1. Go to: https://dash.cloudflare.com/
2. Account → Pages
3. Click: pure-app-engine
4. See:
   - Live deployment
   - Build logs
   - Analytics
   - Environment variables
   - Custom domains
```

---

## 🌍 **CUSTOM DOMAIN (Optional)**

### **Add Custom Domain:**

**1. In Cloudflare Dashboard:**
```
Pages → pure-app-engine → Custom domains
Add domain: yourdomain.com
```

**2. Configure DNS:**
```
Cloudflare will provide CNAME record:
CNAME: yourdomain.com → pure-app-engine.pages.dev
```

**3. SSL Certificate:**
```
Automatic! Cloudflare handles SSL
Your site will be https://yourdomain.com
```

---

## 🔄 **CONTINUOUS DEPLOYMENT**

### **Auto-Deploy on Git Push (Optional):**

**1. Connect Git Repo:**
```
Cloudflare Dashboard → Pages → pure-app-engine
Connect GitHub/GitLab repo
```

**2. Configure:**
```
Build command: npm run build
Output directory: dist
```

**3. Auto-Deploy:**
```
Every push to main → auto-deploy!
Every PR → preview deployment!
```

---

## 📋 **QUICK COMMANDS**

### **Essential Commands:**
```bash
# Login
wrangler login

# Deploy production
npm run deploy:cf

# Deploy staging
npm run deploy:cf-staging

# Check deployment status
wrangler pages deployment list --project-name=pure-app-engine

# View logs
wrangler pages deployment tail --project-name=pure-app-engine

# Rollback (if needed)
wrangler pages deployment rollback --project-name=pure-app-engine
```

---

## ✅ **POST-DEPLOYMENT**

### **After Successful Deploy:**

**1. Test Live Site:**
- [ ] Homepage loads
- [ ] All routes work
- [ ] Images load
- [ ] API calls work
- [ ] Database connected
- [ ] Login/signup works
- [ ] Admin dashboard works
- [ ] Public menus work
- [ ] Subscriptions work

**2. Monitor:**
- [ ] Check Cloudflare Analytics
- [ ] Watch error logs
- [ ] Test on mobile devices
- [ ] Check load times

**3. Share:**
- [ ] Share URL with team
- [ ] Update documentation
- [ ] Notify users

---

## 🎉 **SUCCESS!**

**Your app is now live on Cloudflare Pages!**

**Benefits:**
- ✅ Global CDN (fast worldwide)
- ✅ Automatic SSL
- ✅ DDoS protection
- ✅ Free tier (generous limits)
- ✅ Unlimited bandwidth
- ✅ Automatic builds
- ✅ Preview deployments
- ✅ Instant rollbacks

---

## 📖 **SUMMARY**

**To Deploy:**
```bash
npm run deploy:cf
```

**Your URL:**
```
https://pure-app-engine.pages.dev
```

**Dashboard:**
```
https://dash.cloudflare.com/
```

**Status:** ✅ **READY TO DEPLOY!**

---

**Deploy now with one command!** 🚀
