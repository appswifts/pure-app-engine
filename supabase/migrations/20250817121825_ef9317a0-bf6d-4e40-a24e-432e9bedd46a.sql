-- Insert demo restaurant with proper WhatsApp format
INSERT INTO public.restaurants (
  id, name, email, phone, whatsapp_number, slug, brand_color, secondary_color,
  text_color, card_background, font_family, background_style, background_color,
  menu_layout, card_style, button_style, card_shadow, show_logo_border, show_animations
) VALUES (
  gen_random_uuid(),
  'Demo Restaurant',
  'demo@menuforest.com',
  '+250788123456',
  '+250788123456',
  'demo',
  '#3B82F6',
  '#EF4444',
  '#FFFFFF',
  '#FFFFFF',
  'Inter',
  'gradient',
  '#FFFFFF',
  'cards',
  'rounded',
  'rounded',
  'medium',
  true,
  true
) ON CONFLICT (slug) DO NOTHING;