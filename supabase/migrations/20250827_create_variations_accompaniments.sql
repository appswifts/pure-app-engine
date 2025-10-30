-- Create tables for menu item variations and accompaniments
-- This migration creates the database structure for product variations (sizes, portions) and accompaniments (add-ons)

-- Create item_variations table for different sizes/portions of menu items
CREATE TABLE IF NOT EXISTS public.item_variations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    menu_item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- e.g., "Half Bottle", "Full Bottle", "Small", "Large"
    price_modifier DECIMAL(10,2) NOT NULL DEFAULT 0, -- Price difference from base price (can be negative)
    image_url TEXT,
    is_available BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create accompaniments table for add-ons
CREATE TABLE IF NOT EXISTS public.accompaniments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    menu_item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- e.g., "Extra Cheese", "Fries", "Salad"
    price DECIMAL(10,2) NOT NULL DEFAULT 0, -- Additional price for this accompaniment
    image_url TEXT,
    is_required BOOLEAN DEFAULT false, -- Whether customer must select this
    is_available BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_item_variations_menu_item_id ON public.item_variations(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_item_variations_display_order ON public.item_variations(menu_item_id, display_order);
CREATE INDEX IF NOT EXISTS idx_accompaniments_menu_item_id ON public.accompaniments(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_accompaniments_display_order ON public.accompaniments(menu_item_id, display_order);

-- Enable RLS (Row Level Security)
ALTER TABLE public.item_variations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accompaniments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for item_variations
CREATE POLICY "item_variations_select_policy" ON public.item_variations
    FOR SELECT USING (true); -- Public read access for menu viewing

CREATE POLICY "item_variations_insert_policy" ON public.item_variations
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.menu_items mi 
            JOIN public.restaurants r ON mi.restaurant_id = r.id 
            WHERE mi.id = menu_item_id AND r.owner_id = auth.uid()
        )
    );

CREATE POLICY "item_variations_update_policy" ON public.item_variations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.menu_items mi 
            JOIN public.restaurants r ON mi.restaurant_id = r.id 
            WHERE mi.id = menu_item_id AND r.owner_id = auth.uid()
        )
    );

CREATE POLICY "item_variations_delete_policy" ON public.item_variations
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.menu_items mi 
            JOIN public.restaurants r ON mi.restaurant_id = r.id 
            WHERE mi.id = menu_item_id AND r.owner_id = auth.uid()
        )
    );

-- Create RLS policies for accompaniments
CREATE POLICY "accompaniments_select_policy" ON public.accompaniments
    FOR SELECT USING (true); -- Public read access for menu viewing

CREATE POLICY "accompaniments_insert_policy" ON public.accompaniments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.menu_items mi 
            JOIN public.restaurants r ON mi.restaurant_id = r.id 
            WHERE mi.id = menu_item_id AND r.owner_id = auth.uid()
        )
    );

CREATE POLICY "accompaniments_update_policy" ON public.accompaniments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.menu_items mi 
            JOIN public.restaurants r ON mi.restaurant_id = r.id 
            WHERE mi.id = menu_item_id AND r.owner_id = auth.uid()
        )
    );

CREATE POLICY "accompaniments_delete_policy" ON public.accompaniments
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.menu_items mi 
            JOIN public.restaurants r ON mi.restaurant_id = r.id 
            WHERE mi.id = menu_item_id AND r.owner_id = auth.uid()
        )
    );

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_item_variations_updated_at 
    BEFORE UPDATE ON public.item_variations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accompaniments_updated_at 
    BEFORE UPDATE ON public.accompaniments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing
-- Note: This assumes menu_items exist. Adjust menu_item_id values as needed.

-- Sample variations for a drink item (assuming a menu item exists)
-- INSERT INTO public.item_variations (menu_item_id, name, price_modifier, display_order) VALUES
-- ('existing-menu-item-id', 'Half Bottle', -5000, 1),
-- ('existing-menu-item-id', 'Full Bottle', 0, 2),
-- ('existing-menu-item-id', 'Large Bottle', 3000, 3);

-- Sample accompaniments for a main dish (assuming a menu item exists)
-- INSERT INTO public.accompaniments (menu_item_id, name, price, display_order) VALUES
-- ('existing-menu-item-id', 'Extra Cheese', 2000, 1),
-- ('existing-menu-item-id', 'French Fries', 3000, 2),
-- ('existing-menu-item-id', 'Side Salad', 2500, 3);
