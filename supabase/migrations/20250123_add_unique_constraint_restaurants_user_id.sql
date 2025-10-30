-- =====================================================
-- Migration: Add Unique Constraint on restaurants.user_id
-- Created: 2025-01-23
-- =====================================================
-- This migration adds a unique constraint to prevent
-- duplicate restaurant records for the same user.
--
-- IMPORTANT: Run cleanup-duplicate-restaurants.sql BEFORE this migration!
-- =====================================================

-- Step 1: Verify no duplicates exist before adding constraint
DO $$
DECLARE
    duplicate_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO duplicate_count
    FROM (
        SELECT user_id
        FROM restaurants
        GROUP BY user_id
        HAVING COUNT(*) > 1
    ) duplicates;
    
    IF duplicate_count > 0 THEN
        RAISE EXCEPTION 'Found % users with duplicate restaurants. Run cleanup script first!', duplicate_count;
    END IF;
    
    RAISE NOTICE 'No duplicates found. Proceeding with unique constraint...';
END $$;

-- Step 2: Add unique constraint
-- This prevents multiple restaurants per user_id
ALTER TABLE restaurants 
ADD CONSTRAINT restaurants_user_id_unique 
UNIQUE (user_id);

-- Step 3: Create index to improve query performance
-- (Note: UNIQUE constraint automatically creates an index, but we're explicit here)
-- If the index already exists from the constraint, this will be skipped
CREATE INDEX IF NOT EXISTS idx_restaurants_user_id 
ON restaurants(user_id);

-- Step 4: Add helpful comments
COMMENT ON CONSTRAINT restaurants_user_id_unique ON restaurants IS 
'Ensures each user can only have one restaurant record';

-- Step 5: Verify constraint was added
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'restaurants_user_id_unique'
        AND conrelid = 'restaurants'::regclass
    ) THEN
        RAISE NOTICE 'SUCCESS: Unique constraint restaurants_user_id_unique added successfully';
    ELSE
        RAISE EXCEPTION 'FAILED: Unique constraint was not added';
    END IF;
END $$;

-- =====================================================
-- Rollback Instructions (if needed)
-- =====================================================
-- To rollback this migration, run:
-- ALTER TABLE restaurants DROP CONSTRAINT IF EXISTS restaurants_user_id_unique;
-- DROP INDEX IF EXISTS idx_restaurants_user_id;
