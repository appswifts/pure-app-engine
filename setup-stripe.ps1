# Stripe CLI Setup and Configuration Script
# Run this script to install Stripe CLI and create products/prices

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Stripe CLI Setup for Pure App Engine" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check if Scoop is installed
Write-Host "Step 1: Checking for Scoop package manager..." -ForegroundColor Yellow
$scoopInstalled = Get-Command scoop -ErrorAction SilentlyContinue

if (-not $scoopInstalled) {
    Write-Host "Scoop not found. Installing Scoop..." -ForegroundColor Yellow
    
    # Set execution policy for current user
    Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
    
    # Install Scoop
    Invoke-RestMethod -Uri https://get.scoop.sh | Invoke-Expression
    
    Write-Host "[OK] Scoop installed successfully!" -ForegroundColor Green
} else {
    Write-Host "[OK] Scoop already installed" -ForegroundColor Green
}

# Step 2: Install Stripe CLI
Write-Host ""
Write-Host "Step 2: Installing Stripe CLI..." -ForegroundColor Yellow

# Add Stripe bucket
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git 2>$null

# Install Stripe CLI
scoop install stripe

Write-Host "[OK] Stripe CLI installed successfully!" -ForegroundColor Green

# Step 3: Verify installation
Write-Host ""
Write-Host "Step 3: Verifying Stripe CLI installation..." -ForegroundColor Yellow
$version = stripe --version
Write-Host "[OK] Stripe CLI version: $version" -ForegroundColor Green

# Step 4: Login to Stripe
Write-Host ""
Write-Host "Step 4: Login to Stripe..." -ForegroundColor Yellow
Write-Host "This will open your browser for authentication." -ForegroundColor Cyan
Write-Host ""
Read-Host "Press Enter to continue"

stripe login

Write-Host "[OK] Logged in to Stripe!" -ForegroundColor Green

# Step 5: Create Products and Prices
Write-Host ""
Write-Host "Step 5: Creating Stripe Products and Prices..." -ForegroundColor Yellow
Write-Host ""

# Create Starter Plan
Write-Host "Creating Starter Plan..." -ForegroundColor Cyan
$starterProduct = stripe products create `
    --name `"Starter Plan`" `
    --description `"Restaurant subscription - Starter tier`" `
    --format json | ConvertFrom-Json

$starterProductId = $starterProduct.id
Write-Host "[OK] Starter Product ID: $starterProductId" -ForegroundColor Green

$starterPrice = stripe prices create `
    --product $starterProductId `
    --unit-amount 1500 `
    --currency usd `
    --recurring `"interval=month`" `
    --format json | ConvertFrom-Json

$starterPriceId = $starterPrice.id
Write-Host "[OK] Starter Price ID: $starterPriceId - 15 USD per month" -ForegroundColor Green

# Create Professional Plan
Write-Host ""
Write-Host "Creating Professional Plan..." -ForegroundColor Cyan
$professionalProduct = stripe products create `
    --name `"Professional Plan`" `
    --description `"Restaurant subscription - Professional tier`" `
    --format json | ConvertFrom-Json

$professionalProductId = $professionalProduct.id
Write-Host "[OK] Professional Product ID: $professionalProductId" -ForegroundColor Green

$professionalPrice = stripe prices create `
    --product $professionalProductId `
    --unit-amount 3500 `
    --currency usd `
    --recurring `"interval=month`" `
    --format json | ConvertFrom-Json

$professionalPriceId = $professionalPrice.id
Write-Host "[OK] Professional Price ID: $professionalPriceId - 35 USD per month" -ForegroundColor Green

# Create Enterprise Plan
Write-Host ""
Write-Host "Creating Enterprise Plan..." -ForegroundColor Cyan
$enterpriseProduct = stripe products create `
    --name `"Enterprise Plan`" `
    --description `"Restaurant subscription - Enterprise tier`" `
    --format json | ConvertFrom-Json

$enterpriseProductId = $enterpriseProduct.id
Write-Host "[OK] Enterprise Product ID: $enterpriseProductId" -ForegroundColor Green

$enterprisePrice = stripe prices create `
    --product $enterpriseProductId `
    --unit-amount 7500 `
    --currency usd `
    --recurring `"interval=month`" `
    --format json | ConvertFrom-Json

$enterprisePriceId = $enterprisePrice.id
Write-Host "[OK] Enterprise Price ID: $enterprisePriceId - 75 USD per month" -ForegroundColor Green

# Step 6: Save IDs to file
Write-Host ""
Write-Host "Step 6: Saving Stripe IDs..." -ForegroundColor Yellow

$stripeIds = @"
# Stripe Product and Price IDs
# Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

## Starter Plan
Product ID: $starterProductId
Price ID: $starterPriceId
Amount: `$15/month

## Professional Plan
Product ID: $professionalProductId
Price ID: $professionalPriceId
Amount: `$35/month

## Enterprise Plan
Product ID: $enterpriseProductId
Price ID: $enterprisePriceId
Amount: `$75/month

## Next Steps:
1. Update your database subscription_plans table with these price IDs
2. Create a webhook endpoint at /api/webhooks/stripe
3. Run: stripe listen --forward-to localhost:5173/api/webhooks/stripe
4. Save the webhook secret (whsec_xxx) to your .env file

## SQL to Update Database:
UPDATE subscription_plans SET stripe_price_id = '$starterPriceId' WHERE name = 'Starter';
UPDATE subscription_plans SET stripe_price_id = '$professionalPriceId' WHERE name = 'Professional';
UPDATE subscription_plans SET stripe_price_id = '$enterprisePriceId' WHERE name = 'Enterprise';
"@

$stripeIds | Out-File -FilePath "STRIPE_IDS.txt" -Encoding UTF8

Write-Host "[OK] Stripe IDs saved to STRIPE_IDS.txt" -ForegroundColor Green

# Step 7: Display Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Stripe Products Created:" -ForegroundColor Yellow
Write-Host "  - Starter Plan: $starterPriceId (15 USD per month)" -ForegroundColor White
Write-Host "  - Professional Plan: $professionalPriceId (35 USD per month)" -ForegroundColor White
Write-Host "  - Enterprise Plan: $enterprisePriceId (75 USD per month)" -ForegroundColor White
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Check STRIPE_IDS.txt for all IDs" -ForegroundColor White
Write-Host "  2. Update your database with these price IDs" -ForegroundColor White
Write-Host "  3. Test webhooks with: stripe listen --forward-to localhost:5173/api/webhooks/stripe" -ForegroundColor White
Write-Host ""
Write-Host "Test Stripe CLI:" -ForegroundColor Yellow
Write-Host "  stripe products list" -ForegroundColor White
Write-Host "  stripe prices list" -ForegroundColor White
Write-Host ""

Read-Host "Press Enter to exit"
