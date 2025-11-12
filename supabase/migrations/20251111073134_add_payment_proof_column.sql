-- Add payment_proof_url column to subscription_orders
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

-- Storage RLS Policies for payment-proofs bucket
-- Policy 1: Users can upload their own payment proofs
CREATE POLICY IF NOT EXISTS "Users can upload own proofs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'payment-proofs' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 2: Users can read their own payment proofs  
CREATE POLICY IF NOT EXISTS "Users can read own proofs"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'payment-proofs' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 3: Admins can view all payment proofs
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
