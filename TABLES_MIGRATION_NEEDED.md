# Tables Database Issue - Migration Needed

## Problem

The application is trying to use a `restaurant_tables` table that **doesn't exist** in your Supabase database yet, resulting in:
- **400 Bad Request** - trying to access `/tables` (wrong table)
- **404 Not Found** - trying to access `/restaurant_tables` (doesn't exist)

## Solution Options

### Option 1: Create the restaurant_tables table (Recommended)

Run this SQL in your Supabase SQL Editor:

```sql
-- Create restaurant_tables table
CREATE TABLE IF NOT EXISTS public.restaurant_tables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  table_number TEXT NOT NULL,
  table_name TEXT,
  qr_code_data TEXT NOT NULL,
  qr_code_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_restaurant_table UNIQUE (restaurant_id, table_number)
);

-- Enable RLS
ALTER TABLE public.restaurant_tables ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Public can view active tables" 
ON public.restaurant_tables 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Restaurant owners can manage their tables" 
ON public.restaurant_tables 
FOR ALL 
USING (restaurant_id IN (
  SELECT id FROM restaurants WHERE user_id = auth.uid()
));

-- Create index for better performance
CREATE INDEX idx_restaurant_tables_restaurant_id ON public.restaurant_tables(restaurant_id);
CREATE INDEX idx_restaurant_tables_table_number ON public.restaurant_tables(table_number);
```

### Option 2: Use a simpler "tables" table

If you prefer to use the simpler approach, run this instead:

```sql
-- Create tables table
CREATE TABLE IF NOT EXISTS public.tables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  seats INTEGER,
  location TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_restaurant_table_slug UNIQUE (restaurant_id, slug)
);

-- Enable RLS
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Public can view active tables" 
ON public.tables 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Restaurant owners can manage their tables" 
ON public.tables 
FOR ALL 
USING (restaurant_id IN (
  SELECT id FROM restaurants WHERE user_id = auth.uid()
));
```

## Files That Need Updating

If you chose **Option 1** (restaurant_tables), these files need updates:

### Files still using "tables" instead of "restaurant_tables":

1. ✅ `src/components/dashboard/TableManager.tsx` - Already fixed
2. ⏳ `src/pages/TableManagement.tsx` - Needs fix
3. ⏳ `src/pages/RestaurantSettings.tsx` - Needs fix  
4. ⏳ `src/pages/PublicMenu.tsx` - Needs fix
5. ⏳ `src/components/dashboard/MenuQRGenerator.tsx` - Needs fix

## Quick Fix Instructions

### Step 1: Create the Database Table
1. Go to your Supabase Dashboard
2. Click "SQL Editor"
3. Paste one of the SQL scripts above (Option 1 recommended)
4. Click "Run"

### Step 2: Verify Table Exists
Run this query to check:
```sql
SELECT * FROM restaurant_tables LIMIT 1;
```

### Step 3: Test the Application
1. Go to `http://localhost:8080/dashboard/tables`
2. Try creating a new table
3. Should work without 404/400 errors

## Current Status

- ✅ Route added
- ✅ TableManager component fixed
- ⏳ Database table needs to be created
- ⏳ Other components need updating

## Recommendation

**Use Option 1** - It's the better schema and matches what we've already implemented in TableManager. Just run the SQL script in Supabase and you're done!
