# Cloudflare CDN Deployment Script for Pure App Engine
# PowerShell deployment script with CDN optimization

Write-Host "🚀 Pure App Engine - Cloudflare CDN Deployment" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check if wrangler is authenticated
Write-Host "📋 Checking Cloudflare authentication..." -ForegroundColor Yellow
$authCheck = npx wrangler whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Not authenticated with Cloudflare" -ForegroundColor Red
    Write-Host "🔐 Running authentication..." -ForegroundColor Yellow
    npx wrangler login
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Authentication failed. Exiting." -ForegroundColor Red
        exit 1
    }
}
Write-Host "✅ Authenticated with Cloudflare" -ForegroundColor Green
Write-Host ""

# Build the application
Write-Host "🔨 Building application..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed. Exiting." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Build completed successfully" -ForegroundColor Green
Write-Host ""

# Copy CDN configuration files to dist
Write-Host "📝 Copying CDN configuration files..." -ForegroundColor Yellow
Copy-Item "_headers" -Destination "dist/_headers" -Force
Copy-Item "_redirects" -Destination "dist/_redirects" -Force
Write-Host "✅ Configuration files copied" -ForegroundColor Green
Write-Host ""

# Deploy to Cloudflare Pages
Write-Host "☁️  Deploying to Cloudflare Pages..." -ForegroundColor Yellow
Write-Host ""
npx wrangler pages deploy dist --project-name=pure-app-engine --branch=main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Deployment successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 Next Steps:" -ForegroundColor Cyan
    Write-Host "1. Configure custom domain in Cloudflare dashboard" -ForegroundColor White
    Write-Host "2. Set environment variables in project settings" -ForegroundColor White
    Write-Host "3. Enable CDN optimizations (see CDN_CONFIGURATION.md)" -ForegroundColor White
    Write-Host "4. Test cache performance with: curl -I <your-url>" -ForegroundColor White
    Write-Host ""
    Write-Host "📖 Full documentation: CDN_CONFIGURATION.md" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "❌ Deployment failed" -ForegroundColor Red
    Write-Host "Check the error messages above for details" -ForegroundColor Yellow
    exit 1
}
