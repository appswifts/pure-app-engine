# Deploy Stripe Edge Functions to Supabase
# Run this script after configuring STRIPE_SECRET_KEY

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Deploying Stripe Functions to Supabase" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Supabase CLI is installed
$supabaseInstalled = Get-Command supabase -ErrorAction SilentlyContinue

if (-not $supabaseInstalled) {
    Write-Host "ERROR: Supabase CLI not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Install Supabase CLI first:" -ForegroundColor Yellow
    Write-Host "  npm install -g supabase" -ForegroundColor White
    Write-Host "  OR" -ForegroundColor White
    Write-Host "  scoop install supabase" -ForegroundColor White
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "[OK] Supabase CLI found" -ForegroundColor Green
Write-Host ""

# Check if logged in
Write-Host "Checking Supabase login..." -ForegroundColor Yellow
$loginCheck = supabase projects list 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "Not logged in to Supabase. Please login..." -ForegroundColor Yellow
    supabase login
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Login failed. Please try again." -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}

Write-Host "[OK] Logged in to Supabase" -ForegroundColor Green
Write-Host ""

# Link project if needed
Write-Host "Linking to Supabase project..." -ForegroundColor Yellow
$projectId = "isduljdnrbspiqsgvkiv"

# Check if already linked
$linkedProject = supabase status 2>&1 | Select-String "Project ref:"

if (-not $linkedProject) {
    Write-Host "Linking to project: $projectId" -ForegroundColor Cyan
    supabase link --project-ref $projectId
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to link project. Please check project ID." -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}

Write-Host "[OK] Project linked" -ForegroundColor Green
Write-Host ""

# Deploy create-checkout function
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Deploying create-checkout function..." -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

supabase functions deploy create-checkout

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] create-checkout deployed successfully!" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Failed to deploy create-checkout" -ForegroundColor Red
    Write-Host "Check the error above and try again." -ForegroundColor Yellow
    Read-Host "Press Enter to continue anyway"
}

Write-Host ""

# Deploy stripe-webhook function
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Deploying stripe-webhook function..." -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

supabase functions deploy stripe-webhook

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] stripe-webhook deployed successfully!" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Failed to deploy stripe-webhook" -ForegroundColor Red
    Write-Host "Check the error above and try again." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# List all functions
Write-Host "Deployed Functions:" -ForegroundColor Yellow
supabase functions list
Write-Host ""

# Reminder about secrets
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Important: Configure Secrets!" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Make sure these secrets are set:" -ForegroundColor White
Write-Host ""
Write-Host "1. STRIPE_SECRET_KEY" -ForegroundColor Cyan
Write-Host "   Get from: https://dashboard.stripe.com/test/apikeys" -ForegroundColor Gray
Write-Host "   Set with: supabase secrets set STRIPE_SECRET_KEY=sk_test_..." -ForegroundColor Gray
Write-Host ""
Write-Host "2. STRIPE_WEBHOOK_SECRET (optional for local testing)" -ForegroundColor Cyan
Write-Host "   Get from: stripe listen --print-secret" -ForegroundColor Gray
Write-Host "   Set with: supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_..." -ForegroundColor Gray
Write-Host ""

# Check if secrets are set
Write-Host "Checking configured secrets..." -ForegroundColor Yellow
supabase secrets list
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Set STRIPE_SECRET_KEY if not already set:" -ForegroundColor White
Write-Host "   supabase secrets set STRIPE_SECRET_KEY=sk_test_YOUR_KEY" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Test the checkout flow:" -ForegroundColor White
Write-Host "   - Visit: http://localhost:5173/subscriptions" -ForegroundColor Cyan
Write-Host "   - Select a plan and Stripe payment" -ForegroundColor Cyan
Write-Host "   - Complete test payment" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Test webhooks (optional):" -ForegroundColor White
Write-Host "   stripe listen --forward-to https://isduljdnrbspiqsgvkiv.supabase.co/functions/v1/stripe-webhook" -ForegroundColor Cyan
Write-Host ""
Write-Host "Documentation: STRIPE_SETUP_COMPLETE.md" -ForegroundColor Yellow
Write-Host ""

Read-Host "Press Enter to exit"
