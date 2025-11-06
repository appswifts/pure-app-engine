# Database Migrations

This folder contains SQL migration files for the restaurant menu management system.

## Apply Migrations

You need to apply these migrations in order to your Supabase database:

### Option 1: Using Supabase Dashboard
1. Go to your Supabase project: https://supabase.com/dashboard
2. Navigate to **SQL Editor**
3. Copy and paste each migration file content
4. Execute them in order:
   - `001_add_is_accompaniment_column.sql`
   - `002_create_item_variations_table.sql`
   - `003_create_accompaniments_table.sql`

### Option 2: Using Supabase CLI
```bash
# If you have Supabase CLI installed
supabase db reset
# Or apply migrations manually
psql $DATABASE_URL < migrations/001_add_is_accompaniment_column.sql
psql $DATABASE_URL < migrations/002_create_item_variations_table.sql
psql $DATABASE_URL < migrations/003_create_accompaniments_table.sql
```

## Migration Details

### 001_add_is_accompaniment_column.sql
- Adds `is_accompaniment` column to `menu_items` table
- Allows items to be flagged as available for use as accompaniments
- Creates index for performance

### 002_create_item_variations_table.sql
- Creates `item_variations` table
- Stores variations like Small, Medium, Large
- Includes price modifiers (positive or negative)
- Adds RLS policies
- Creates indexes for performance

### 003_create_accompaniments_table.sql
- Creates `accompaniments` table
- Stores extras/sides that can be added to items
- Links to both restaurant and menu items
- Adds RLS policies
- Creates indexes for performance

## After Applying Migrations

Your database will support:
- ✅ Menu items flagged as accompaniments
- ✅ Item variations with price modifiers
- ✅ Accompaniments/extras linked to menu items
- ✅ Proper indexing for fast queries
- ✅ Row Level Security (RLS) for data protection

## Verification

After applying migrations, verify with:

```sql
-- Check is_accompaniment column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'menu_items' AND column_name = 'is_accompaniment';

-- Check item_variations table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'item_variations';

-- Check accompaniments table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'accompaniments';
```
