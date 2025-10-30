-- Migration: Remove Flutterwave integration and switch to manual payments only
-- Safe cleanup of Flutterwave-related objects, columns, and functions

BEGIN;

-- 1) Drop Flutterwave-specific functions (if they exist)
DROP FUNCTION IF EXISTS public.encrypt_flutterwave_data(text);
DROP FUNCTION IF EXISTS public.decrypt_flutterwave_data(text);
DROP FUNCTION IF EXISTS public.store_flutterwave_credentials(varchar, text, text, text, text);
DROP FUNCTION IF EXISTS public.get_flutterwave_credentials(varchar);
DROP FUNCTION IF EXISTS public.rotate_flutterwave_credentials(varchar, text, text, text, text);
DROP FUNCTION IF EXISTS public.is_flutterwave_configured(varchar);

-- 2) Drop indexes referencing Flutterwave columns (if they exist)
DROP INDEX IF EXISTS public.idx_payment_methods_flutterwave_customer_id;
DROP INDEX IF EXISTS public.idx_payments_flutterwave_transaction_id;

-- 3) Remove Flutterwave-specific columns from shared tables (if they exist)
-- Subscriptions
ALTER TABLE IF EXISTS public.subscriptions DROP COLUMN IF EXISTS flutterwave_customer_id;
ALTER TABLE IF EXISTS public.subscriptions DROP COLUMN IF EXISTS flutterwave_subscription_id;

-- Payment methods
ALTER TABLE IF EXISTS public.payment_methods DROP COLUMN IF EXISTS flutterwave_customer_id;

-- Payments
ALTER TABLE IF EXISTS public.payments DROP COLUMN IF EXISTS flutterwave_transaction_id;
ALTER TABLE IF EXISTS public.payments DROP COLUMN IF EXISTS flutterwave_tx_ref;
ALTER TABLE IF EXISTS public.payments DROP COLUMN IF EXISTS processor_response;
-- Ensure payment processor defaults to manual going forward
ALTER TABLE IF EXISTS public.payments ALTER COLUMN payment_processor SET DEFAULT 'manual';
UPDATE public.payments SET payment_processor = 'manual' WHERE payment_processor IS NULL OR payment_processor = 'flutterwave';

-- 4) Drop Flutterwave/provider-specific tables that are no longer used
DROP TABLE IF EXISTS public.flutterwave_credentials CASCADE;
DROP TABLE IF EXISTS public.flutterwave_config CASCADE;
DROP TABLE IF EXISTS public.payment_provider_configs CASCADE;
DROP TABLE IF EXISTS public.payment_records CASCADE;
DROP TABLE IF EXISTS public.webhook_events CASCADE;

-- 5) Replace functions that referenced removed Flutterwave columns with gateway-agnostic versions
-- Keep signature for compatibility but remove column usage
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
    UPDATE public.subscriptions
    SET 
        status = new_status,
        updated_at = NOW()
    WHERE id = subscription_id_param;

    RETURN FOUND;
END;
$$;

COMMIT;
