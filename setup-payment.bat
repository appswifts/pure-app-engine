@echo off
echo.
echo ========================================
echo  Setting up Payment System
echo ========================================
echo.

echo Step 1: Installing Stripe SDK...
call npm install stripe --legacy-peer-deps
if %errorlevel% neq 0 (
    echo Error installing Stripe!
    pause
    exit /b 1
)
echo   ✓ Stripe installed successfully
echo.

echo Step 2: Payment Gateway Status
echo   ✓ Stripe Gateway - Ready (need API keys)
echo   ✓ PayPal Gateway - Ready (need API keys)
echo   ✓ Flutterwave Gateway - Ready (need API keys)
echo   ✓ Manual Payment Gateway - ENABLED BY DEFAULT!
echo.

echo ========================================
echo  Next Steps
echo ========================================
echo.
echo 1. Create Database Tables:
echo    - Open Supabase Dashboard SQL Editor
echo    - Run: supabase\migrations\create_manual_payment_tables.sql
echo    - See apply-manual-payment-migration.md for details
echo.
echo 2. Configure .env file:
echo    - VITE_BANK_NAME=Your Bank Name
echo    - VITE_BANK_ACCOUNT=Your Account Number
echo    - VITE_MTN_NUMBER=Your MTN Number
echo    - VITE_AIRTEL_NUMBER=Your Airtel Number
echo.
echo 3. Start dev server:
echo    npm run dev
echo.
echo 4. Check browser console for:
echo    "Payment system initialized: 4/4 gateways enabled"
echo.
echo ========================================
echo  Documentation
echo ========================================
echo.
echo   - PAYMENT_SYSTEM_README.md
echo   - PAYMENT_SYSTEM_GUIDE.md
echo   - MANUAL_PAYMENT_GUIDE.md
echo   - apply-manual-payment-migration.md
echo.
echo ========================================
echo  Setup Complete!
echo ========================================
echo.
echo Manual Payment Gateway is ready to use!
echo No API keys needed - 0%% transaction fees!
echo.
pause
