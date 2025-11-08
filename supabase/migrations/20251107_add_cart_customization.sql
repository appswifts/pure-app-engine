-- Cart Dialog Customization Fields
-- Adds comprehensive styling options for cart dialog elements

-- Cart Item Cards
ALTER TABLE menu_groups ADD COLUMN IF NOT EXISTS cart_item_bg_color VARCHAR(50);
ALTER TABLE menu_groups ADD COLUMN IF NOT EXISTS cart_item_text_color VARCHAR(50);
ALTER TABLE menu_groups ADD COLUMN IF NOT EXISTS cart_remove_button_color VARCHAR(50);

-- Total & Buttons
ALTER TABLE menu_groups ADD COLUMN IF NOT EXISTS cart_total_text_color VARCHAR(50);
ALTER TABLE menu_groups ADD COLUMN IF NOT EXISTS cart_continue_button_bg VARCHAR(50);
ALTER TABLE menu_groups ADD COLUMN IF NOT EXISTS cart_continue_button_text VARCHAR(50);

COMMENT ON COLUMN menu_groups.cart_item_bg_color IS 'Background color for cart item cards';
COMMENT ON COLUMN menu_groups.cart_item_text_color IS 'Text color for cart item cards';
COMMENT ON COLUMN menu_groups.cart_remove_button_color IS 'Color for remove button in cart';
COMMENT ON COLUMN menu_groups.cart_total_text_color IS 'Text color for cart total';
COMMENT ON COLUMN menu_groups.cart_continue_button_bg IS 'Background color for continue shopping button';
COMMENT ON COLUMN menu_groups.cart_continue_button_text IS 'Text color for continue shopping button';
