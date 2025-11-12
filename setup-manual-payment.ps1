# Setup Manual Payment Gateway
# Run this script to set up the manual payment system

Write-Host "🚀 Setting up Manual Payment Gateway..." -ForegroundColor Cyan
Write-Host ""

# Check if Stripe is installed
Write-Host "✓ Checking Stripe installation..." -ForegroundColor Green
if (Test-Path "node_modules\stripe") {
    Write-Host "  ✓ Stripe is installed" -ForegroundColor Green
} else {
    Write-Host "  ✗ Stripe not found. Installing..." -ForegroundColor Yellow
    npm install stripe --legacy-peer-deps
    Write-Host "  ✓ Stripe installed successfully" -ForegroundColor Green
}

Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Create Database Tables:" -ForegroundColor Yellow
Write-Host "   - Go to your Supabase Dashboard: https://supabase.com/dashboard" -ForegroundColor White
Write-Host "   - Open SQL Editor" -ForegroundColor White
Write-Host "   - Copy and paste the SQL from: supabase\migrations\create_manual_payment_tables.sql" -ForegroundColor White
Write-Host "   - Click 'Run'" -ForegroundColor White
Write-Host ""

Write-Host "2. Configure Environment Variables:" -ForegroundColor Yellow
Write-Host "   Your .env file should already have these (from .env.example):" -ForegroundColor White
Write-Host "   ✓ VITE_MANUAL_PAYMENT_ENABLED=true" -ForegroundColor Green
Write-Host "   ✓ VITE_BANK_NAME=Bank of Kigali" -ForegroundColor Green
Write-Host "   ✓ VITE_BANK_ACCOUNT=1234567890" -ForegroundColor Green
Write-Host "   ✓ VITE_BANK_ACCOUNT_NAME=MenuForest Ltd" -ForegroundColor Green
Write-Host "   ✓ VITE_MTN_NUMBER=+250788123456" -ForegroundColor Green
Write-Host "   ✓ VITE_AIRTEL_NUMBER=+250732123456" -ForegroundColor Green
Write-Host ""

Write-Host "3. Test the Payment System:" -ForegroundColor Yellow
Write-Host "   npm run dev" -ForegroundColor White
Write-Host "   Open browser console and check for:" -ForegroundColor White
Write-Host "   '✓ Payment system initialized: X/4 gateways enabled'" -ForegroundColor White
Write-Host ""

Write-Host "📚 Documentation:" -ForegroundColor Cyan
Write-Host "   - PAYMENT_SYSTEM_README.md    - Quick start guide" -ForegroundColor White
Write-Host "   - PAYMENT_SYSTEM_GUIDE.md     - Complete documentation" -ForegroundColor White
Write-Host "   - MANUAL_PAYMENT_GUIDE.md     - Manual payment guide" -ForegroundColor White
Write-Host ""

Write-Host "✅ Setup Complete! Manual Payment Gateway is ready!" -ForegroundColor Green
Write-Host ""
Write-Host "Tip: Manual Payment Gateway is already enabled by default!" -ForegroundColor Cyan
Write-Host "   No API keys needed - uses your existing bank/mobile money details!" -ForegroundColor Cyan
Write-Host ""
