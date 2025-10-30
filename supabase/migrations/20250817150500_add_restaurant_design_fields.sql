-- Add missing design & customization columns used by the app so saved settings reflect on the public menu
-- Safe to re-run: uses IF NOT EXISTS on each column

BEGIN;

ALTER TABLE public.restaurants 
  ADD COLUMN IF NOT EXISTS secondary_color TEXT,
  ADD COLUMN IF NOT EXISTS text_color TEXT,
  ADD COLUMN IF NOT EXISTS card_background TEXT,
  ADD COLUMN IF NOT EXISTS background_image TEXT,
  ADD COLUMN IF NOT EXISTS background_video TEXT,
  ADD COLUMN IF NOT EXISTS background_youtube_url TEXT,
  ADD COLUMN IF NOT EXISTS menu_layout TEXT,
  ADD COLUMN IF NOT EXISTS card_style TEXT,
  ADD COLUMN IF NOT EXISTS button_style TEXT,
  ADD COLUMN IF NOT EXISTS card_shadow TEXT,
  ADD COLUMN IF NOT EXISTS show_logo_border BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_animations BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  -- Contact fields (guarded; some may already exist in some environments)
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_number TEXT,
  -- WhatsApp CTA button customization
  ADD COLUMN IF NOT EXISTS whatsapp_button_color TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_button_text_color TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_button_text TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_button_style TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_button_price_bg TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_button_price_color TEXT;

COMMIT;
