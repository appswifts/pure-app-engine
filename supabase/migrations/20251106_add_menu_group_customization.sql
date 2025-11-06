-- Add customization columns to menu_groups table for per-group branding
ALTER TABLE menu_groups ADD COLUMN IF NOT EXISTS brand_color VARCHAR(7);
ALTER TABLE menu_groups ADD COLUMN IF NOT EXISTS secondary_color VARCHAR(7);
ALTER TABLE menu_groups ADD COLUMN IF NOT EXISTS text_color VARCHAR(7);
ALTER TABLE menu_groups ADD COLUMN IF NOT EXISTS card_background VARCHAR(7);
ALTER TABLE menu_groups ADD COLUMN IF NOT EXISTS font_family VARCHAR(100);
ALTER TABLE menu_groups ADD COLUMN IF NOT EXISTS background_style VARCHAR(20);
ALTER TABLE menu_groups ADD COLUMN IF NOT EXISTS background_color VARCHAR(7);
ALTER TABLE menu_groups ADD COLUMN IF NOT EXISTS background_image TEXT;
ALTER TABLE menu_groups ADD COLUMN IF NOT EXISTS background_video TEXT;
ALTER TABLE menu_groups ADD COLUMN IF NOT EXISTS background_youtube_url TEXT;
ALTER TABLE menu_groups ADD COLUMN IF NOT EXISTS menu_layout VARCHAR(20);
ALTER TABLE menu_groups ADD COLUMN IF NOT EXISTS card_style VARCHAR(20);
ALTER TABLE menu_groups ADD COLUMN IF NOT EXISTS button_style VARCHAR(20);
ALTER TABLE menu_groups ADD COLUMN IF NOT EXISTS card_shadow VARCHAR(20);
ALTER TABLE menu_groups ADD COLUMN IF NOT EXISTS show_logo_border BOOLEAN DEFAULT FALSE;
ALTER TABLE menu_groups ADD COLUMN IF NOT EXISTS show_animations BOOLEAN DEFAULT TRUE;
ALTER TABLE menu_groups ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE menu_groups ADD COLUMN IF NOT EXISTS whatsapp_button_color VARCHAR(7);
ALTER TABLE menu_groups ADD COLUMN IF NOT EXISTS whatsapp_button_text_color VARCHAR(7);
ALTER TABLE menu_groups ADD COLUMN IF NOT EXISTS whatsapp_button_text VARCHAR(50);
ALTER TABLE menu_groups ADD COLUMN IF NOT EXISTS whatsapp_button_style VARCHAR(20);
ALTER TABLE menu_groups ADD COLUMN IF NOT EXISTS whatsapp_button_price_bg VARCHAR(20);
ALTER TABLE menu_groups ADD COLUMN IF NOT EXISTS whatsapp_button_price_color VARCHAR(7);

-- Add comment
COMMENT ON TABLE menu_groups IS 'Menu groups with optional per-group customization settings';
