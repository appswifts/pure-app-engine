-- ========================================
-- FLUTTERWAVE REMOVAL SCRIPT
-- Removes all Flutterwave integration
-- ========================================

BEGIN;

-- 1) Drop Flutterwave-specific functions
DROP FUNCTION IF EXISTS public.encrypt_flutterwave_data(text);
DROP FUNCTION IF EXISTS public.decrypt_flutterwave_data(text);
DROP FUNCTION IF EXISTS public.store_flutterwave_credentials(varchar, text, text, text, text);
DROP FUNCTION IF EXISTS public.get_flutterwave_credentials(varchar);
DROP FUNCTION IF EXISTS public.rotate_flutterwave_credentials(varchar, text, text, text, text);
DROP FUNCTION IF EXISTS public.is_flutterwave_configured(varchar);

-- 2) Drop indexes referencing Flutterwave columns
DROP INDEX IF EXISTS public.idx_payment_methods_flutterwave_customer_id;
DROP INDEX IF EXISTS public.idx_payments_flutterwave_transaction_id;

-- 3) Remove Flutterwave columns from subscriptions table
ALTER TABLE IF EXISTS public.subscriptions 
DROP COLUMN IF EXISTS flutterwave_customer_id,
DROP COLUMN IF EXISTS flutterwave_subscription_id;

-- 4) Remove Flutterwave columns from payment_methods table
ALTER TABLE IF EXISTS public.payment_methods 
DROP COLUMN IF EXISTS flutterwave_customer_id;

-- 5) Remove Flutterwave columns from payments/payment_records table
ALTER TABLE IF EXISTS public.payments 
DROP COLUMN IF EXISTS flutterwave_transaction_id,
DROP COLUMN IF EXISTS flutterwave_tx_ref,
DROP COLUMN IF EXISTS processor_response;

ALTER TABLE IF EXISTS public.payment_records 
DROP COLUMN IF EXISTS flutterwave_transaction_id,
DROP COLUMN IF EXISTS flutterwave_tx_ref;

-- 6) Update payment processor defaults
ALTER TABLE IF EXISTS public.payments 
ALTER COLUMN payment_processor SET DEFAULT 'manual';

ALTER TABLE IF EXISTS public.payment_records 
ALTER COLUMN payment_method SET DEFAULT 'manual';

-- 7) Update existing records to use 'manual' instead of 'flutterwave'
UPDATE public.payments 
SET payment_processor = 'manual' 
WHERE payment_processor = 'flutterwave';

UPDATE public.payment_records 
SET payment_method = 'manual' 
WHERE payment_method = 'flutterwave';

-- 8) Drop Flutterwave-specific tables
DROP TABLE IF EXISTS public.flutterwave_credentials CASCADE;
DROP TABLE IF EXISTS public.flutterwave_config CASCADE;
DROP TABLE IF EXISTS public.payment_provider_configs CASCADE;
DROP TABLE IF EXISTS public.webhook_events CASCADE;

-- 9) Update payment_gateways table (if it exists)
-- Remove Flutterwave entry
DELETE FROM public.payment_gateways 
WHERE provider = 'flutterwave' OR name ILIKE '%flutterwave%';

-- 10) Clean up any Flutterwave metadata
UPDATE public.subscriptions 
SET metadata = metadata - 'flutterwave_data' 
WHERE metadata ? 'flutterwave_data';

UPDATE public.restaurants 
SET metadata = metadata - 'flutterwave_config' 
WHERE metadata ? 'flutterwave_config';

-- 11) Create or replace functions to remove Flutterwave references
CREATE OR REPLACE FUNCTION public.update_subscription_status(
    subscription_id_param UUID,
    new_status VARCHAR(20),
    flutterwave_subscription_id_param VARCHAR(100) DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Ignore flutterwave_subscription_id_param (kept for backward compatibility)
    UPDATE public.subscriptions
    SET 
        status = new_status,
        updated_at = NOW()
    WHERE id = subscription_id_param;

    RETURN FOUND;
END;
$$;

COMMIT;

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Check remaining Flutterwave references
SELECT 
    'subscriptions' as table_name,
    COUNT(*) as flutterwave_count
FROM public.subscriptions 
WHERE metadata::text ILIKE '%flutterwave%'

UNION ALL

SELECT 
    'payment_records' as table_name,
    COUNT(*) as flutterwave_count
FROM public.payment_records 
WHERE payment_method = 'flutterwave'

UNION ALL

SELECT 
    'payments' as table_name,
    COUNT(*) as flutterwave_count
FROM public.payments 
WHERE payment_processor = 'flutterwave';

-- ========================================
-- SUCCESS MESSAGE
-- ========================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Flutterwave removal completed!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Removed:';
    RAISE NOTICE '  - Flutterwave functions';
    RAISE NOTICE '  - Flutterwave tables';
    RAISE NOTICE '  - Flutterwave columns';
    RAISE NOTICE '  - Flutterwave metadata';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '  1. Delete Flutterwave Edge Functions';
    RAISE NOTICE '  2. Remove FLUTTERWAVE_* environment variables';
    RAISE NOTICE '  3. Test payment flows';
    RAISE NOTICE '';
END $$;
