-- Add currency column to menu_groups table
ALTER TABLE menu_groups
ADD COLUMN currency TEXT NOT NULL DEFAULT 'RWF';

-- Add RLS policy for the new column
-- As the existing policies grant access to the whole table,
-- we just need to ensure the new column is covered.
-- No new policy is strictly needed if the existing ones are broad enough,
-- but let's ensure authenticated users can update it.

-- This assumes a policy already exists allowing owners to update their menu groups.
-- The new column will be implicitly covered by that.

COMMENT ON COLUMN menu_groups.currency IS 'The currency for the prices in this menu group, e.g., RWF, USD.';
