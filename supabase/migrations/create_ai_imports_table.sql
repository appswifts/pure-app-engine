-- Create ai_imports table to track AI menu processing
CREATE TABLE IF NOT EXISTS ai_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed', 'cancelled')),
  extracted_data JSONB,
  error_message TEXT,
  items_imported INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create index for faster queries
CREATE INDEX idx_ai_imports_restaurant_id ON ai_imports(restaurant_id);
CREATE INDEX idx_ai_imports_status ON ai_imports(status);
CREATE INDEX idx_ai_imports_created_at ON ai_imports(created_at DESC);

-- Enable RLS
ALTER TABLE ai_imports ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own AI imports" ON ai_imports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM restaurants 
      WHERE restaurants.id = ai_imports.restaurant_id 
      AND restaurants.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own AI imports" ON ai_imports
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM restaurants 
      WHERE restaurants.id = ai_imports.restaurant_id 
      AND restaurants.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own AI imports" ON ai_imports
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM restaurants 
      WHERE restaurants.id = ai_imports.restaurant_id 
      AND restaurants.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own AI imports" ON ai_imports
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM restaurants 
      WHERE restaurants.id = ai_imports.restaurant_id 
      AND restaurants.user_id = auth.uid()
    )
  );

-- Add comment
COMMENT ON TABLE ai_imports IS 'Tracks AI-powered menu import processes with extracted data and status';
