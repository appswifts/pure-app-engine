-- Extended Menu Group Customization Fields
-- Adds comprehensive styling options for every element on the public menu

-- Logo Customization
ALTER TABLE menu_groups ADD COLUMN IF NOT EXISTS logo_border_width VARCHAR(50);
ALTER TABLE menu_groups ADD COLUMN IF NOT EXISTS logo_border_color VARCHAR(50);
ALTER TABLE menu_groups ADD COLUMN IF NOT EXISTS logo_border_radius VARCHAR(50);
ALTER TABLE menu_groups ADD COLUMN IF NOT EXISTS logo_show_border BOOLEAN DEFAULT true;

-- Card Customization
ALTER TABLE menu_groups ADD COLUMN IF NOT EXISTS card_background_color VARCHAR(50);
ALTER TABLE menu_groups ADD COLUMN IF NOT EXISTS card_border_color VARCHAR(50);
ALTER TABLE menu_groups ADD COLUMN IF NOT EXISTS card_border_radius VARCHAR(50);
ALTER TABLE menu_groups ADD COLUMN IF NOT EXISTS card_padding VARCHAR(50);

-- Price Customization
ALTER TABLE menu_groups ADD COLUMN IF NOT EXISTS price_text_color VARCHAR(50);
ALTER TABLE menu_groups ADD COLUMN IF NOT EXISTS price_font_size VARCHAR(50);
ALTER TABLE menu_groups ADD COLUMN IF NOT EXISTS price_font_weight VARCHAR(50);

-- Add Button Customization
ALTER TABLE menu_groups ADD COLUMN IF NOT EXISTS add_button_bg_color VARCHAR(50);
ALTER TABLE menu_groups ADD COLUMN IF NOT EXISTS add_button_text_color VARCHAR(50);
ALTER TABLE menu_groups ADD COLUMN IF NOT EXISTS add_button_border_radius VARCHAR(50);
ALTER TABLE menu_groups ADD COLUMN IF NOT EXISTS add_button_hover_bg_color VARCHAR(50);

-- Quantity Control Customization
ALTER TABLE menu_groups ADD COLUMN IF NOT EXISTS quantity_button_bg_color VARCHAR(50);
ALTER TABLE menu_groups ADD COLUMN IF NOT EXISTS quantity_button_text_color VARCHAR(50);
ALTER TABLE menu_groups ADD COLUMN IF NOT EXISTS quantity_text_color VARCHAR(50);

-- Image Customization
ALTER TABLE menu_groups ADD COLUMN IF NOT EXISTS image_border_radius VARCHAR(50);
ALTER TABLE menu_groups ADD COLUMN IF NOT EXISTS image_aspect_ratio VARCHAR(50);

-- Cart Button Customization
ALTER TABLE menu_groups ADD COLUMN IF NOT EXISTS cart_button_bg_color VARCHAR(50);
ALTER TABLE menu_groups ADD COLUMN IF NOT EXISTS cart_button_text_color VARCHAR(50);
ALTER TABLE menu_groups ADD COLUMN IF NOT EXISTS cart_button_border_radius VARCHAR(50);

-- Cart Dialog Customization
ALTER TABLE menu_groups ADD COLUMN IF NOT EXISTS cart_dialog_bg_color VARCHAR(50);
ALTER TABLE menu_groups ADD COLUMN IF NOT EXISTS cart_dialog_header_bg_color VARCHAR(50);
ALTER TABLE menu_groups ADD COLUMN IF NOT EXISTS cart_dialog_border_radius VARCHAR(50);

-- WhatsApp Button Customization
ALTER TABLE menu_groups ADD COLUMN IF NOT EXISTS whatsapp_button_bg_color VARCHAR(50);
ALTER TABLE menu_groups ADD COLUMN IF NOT EXISTS whatsapp_button_text_color VARCHAR(50);
ALTER TABLE menu_groups ADD COLUMN IF NOT EXISTS whatsapp_button_border_radius VARCHAR(50);

-- Category Button Customization
ALTER TABLE menu_groups ADD COLUMN IF NOT EXISTS category_button_bg_color VARCHAR(50);
ALTER TABLE menu_groups ADD COLUMN IF NOT EXISTS category_button_text_color VARCHAR(50);
ALTER TABLE menu_groups ADD COLUMN IF NOT EXISTS category_button_active_bg_color VARCHAR(50);
ALTER TABLE menu_groups ADD COLUMN IF NOT EXISTS category_button_active_text_color VARCHAR(50);
ALTER TABLE menu_groups ADD COLUMN IF NOT EXISTS category_button_border_radius VARCHAR(50);

-- Global Typography
ALTER TABLE menu_groups ADD COLUMN IF NOT EXISTS heading_font_family VARCHAR(100);
ALTER TABLE menu_groups ADD COLUMN IF NOT EXISTS heading_font_size VARCHAR(50);
ALTER TABLE menu_groups ADD COLUMN IF NOT EXISTS body_font_size VARCHAR(50);
ALTER TABLE menu_groups ADD COLUMN IF NOT EXISTS body_line_height VARCHAR(50);

-- Global Spacing
ALTER TABLE menu_groups ADD COLUMN IF NOT EXISTS global_border_radius VARCHAR(50);
ALTER TABLE menu_groups ADD COLUMN IF NOT EXISTS global_spacing VARCHAR(50);

-- Header Customization
ALTER TABLE menu_groups ADD COLUMN IF NOT EXISTS header_background_overlay VARCHAR(50);
ALTER TABLE menu_groups ADD COLUMN IF NOT EXISTS header_text_shadow BOOLEAN DEFAULT false;

-- Search Bar Customization
ALTER TABLE menu_groups ADD COLUMN IF NOT EXISTS search_bg_color VARCHAR(50);
ALTER TABLE menu_groups ADD COLUMN IF NOT EXISTS search_text_color VARCHAR(50);
ALTER TABLE menu_groups ADD COLUMN IF NOT EXISTS search_border_radius VARCHAR(50);

COMMENT ON COLUMN menu_groups.logo_border_width IS 'Logo border width (e.g., "4px", "2px")';
COMMENT ON COLUMN menu_groups.logo_border_radius IS 'Logo roundness (e.g., "rounded-full", "rounded-lg")';
COMMENT ON COLUMN menu_groups.card_background_color IS 'Menu item card background color';
COMMENT ON COLUMN menu_groups.price_text_color IS 'Price text color on menu items';
COMMENT ON COLUMN menu_groups.add_button_bg_color IS 'Add button background color';
COMMENT ON COLUMN menu_groups.quantity_button_bg_color IS 'Plus/minus button background color';
COMMENT ON COLUMN menu_groups.cart_button_bg_color IS 'View cart button background color';
COMMENT ON COLUMN menu_groups.whatsapp_button_bg_color IS 'WhatsApp order button background color';
COMMENT ON COLUMN menu_groups.global_border_radius IS 'Global border radius level (none, sm, md, lg, xl, full)';
