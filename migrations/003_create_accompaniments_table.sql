-- Create accompaniments table for menu item extras/sides

CREATE TABLE IF NOT EXISTS accompaniments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price INTEGER NOT NULL DEFAULT 0,
  is_required BOOLEAN DEFAULT FALSE,
  image_url TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comments
COMMENT ON TABLE accompaniments IS 'Stores accompaniments/extras that can be added to menu items';
COMMENT ON COLUMN accompaniments.menu_item_id IS 'Links accompaniment to a specific menu item. NULL means it is a standalone accompaniment';
COMMENT ON COLUMN accompaniments.price IS 'Price in smallest currency unit (e.g., cents, rwf)';
COMMENT ON COLUMN accompaniments.is_required IS 'Whether this accompaniment must be selected';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_accompaniments_restaurant_id 
ON accompaniments(restaurant_id);

CREATE INDEX IF NOT EXISTS idx_accompaniments_menu_item_id 
ON accompaniments(menu_item_id);

CREATE INDEX IF NOT EXISTS idx_accompaniments_display_order 
ON accompaniments(restaurant_id, display_order);

-- Enable RLS (Row Level Security)
ALTER TABLE accompaniments ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
CREATE POLICY "Enable read access for all users" ON accompaniments
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON accompaniments
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON accompaniments
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON accompaniments
  FOR DELETE USING (auth.role() = 'authenticated');

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_accompaniments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER accompaniments_updated_at
  BEFORE UPDATE ON accompaniments
  FOR EACH ROW
  EXECUTE FUNCTION update_accompaniments_updated_at();
