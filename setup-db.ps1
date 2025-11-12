# Quick Database Setup Script
# Run this in PowerShell to set up the database

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Database Setup for Manual Payments" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

$sql = @"
-- Add payment_proof_url column
ALTER TABLE subscription_orders 
ADD COLUMN IF NOT EXISTS payment_proof_url TEXT;

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_subscription_orders_payment_status 
ON subscription_orders(payment_status);

CREATE INDEX IF NOT EXISTS idx_subscription_orders_order_status 
ON subscription_orders(order_status);

CREATE INDEX IF NOT EXISTS idx_subscription_orders_pending 
ON subscription_orders(payment_status, created_at DESC) 
WHERE payment_status = 'pending';

-- Storage RLS Policies
CREATE POLICY IF NOT EXISTS "Users can upload own proofs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'payment-proofs' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY IF NOT EXISTS "Users can read own proofs"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'payment-proofs' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY IF NOT EXISTS "Admins can view all proofs"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'payment-proofs' AND
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);
"@

Write-Host "SQL Script ready to execute..." -ForegroundColor Yellow
Write-Host "`nCopy the SQL below and paste it into Supabase SQL Editor:`n" -ForegroundColor Green
Write-Host $sql -ForegroundColor White

Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "OR - Open Supabase Dashboard:" -ForegroundColor Cyan
Write-Host "https://supabase.com/dashboard/project/isduljdnrbspiqsgvkiv/sql/new" -ForegroundColor Blue
Write-Host "================================`n" -ForegroundColor Cyan

# Copy to clipboard
$sql | Set-Clipboard
Write-Host "✓ SQL copied to clipboard!" -ForegroundColor Green
Write-Host "✓ Now paste it in Supabase SQL Editor and click 'Run'" -ForegroundColor Green
