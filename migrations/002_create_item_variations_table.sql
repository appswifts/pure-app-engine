-- Create item_variations table for menu item variations (sizes, flavors, etc.)

CREATE TABLE IF NOT EXISTS item_variations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price_modifier DECIMAL(10, 2) DEFAULT 0,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comments
COMMENT ON TABLE item_variations IS 'Stores variations for menu items (e.g., Small, Medium, Large)';
COMMENT ON COLUMN item_variations.price_modifier IS 'Amount to add/subtract from base price. Positive for premium, negative for discount';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_item_variations_menu_item_id 
ON item_variations(menu_item_id);

CREATE INDEX IF NOT EXISTS idx_item_variations_display_order 
ON item_variations(menu_item_id, display_order);

-- Enable RLS (Row Level Security)
ALTER TABLE item_variations ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
CREATE POLICY "Enable read access for all users" ON item_variations
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON item_variations
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON item_variations
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON item_variations
  FOR DELETE USING (auth.role() = 'authenticated');

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_item_variations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER item_variations_updated_at
  BEFORE UPDATE ON item_variations
  FOR EACH ROW
  EXECUTE FUNCTION update_item_variations_updated_at();
