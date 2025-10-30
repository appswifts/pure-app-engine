-- Remove Stripe references from restaurants table
ALTER TABLE public.restaurants DROP COLUMN IF EXISTS stripe_customer_id;