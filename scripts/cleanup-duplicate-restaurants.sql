-- =====================================================
-- Cleanup Duplicate Restaurants Script
-- =====================================================
-- This script identifies and removes duplicate restaurant records,
-- keeping only the oldest restaurant for each user.
--
-- IMPORTANT: Review the results before running the DELETE statement!
-- =====================================================

-- Step 1: Identify duplicate restaurants
-- Run this first to see what will be affected
SELECT 
    user_id,
    COUNT(*) as restaurant_count,
    ARRAY_AGG(id ORDER BY created_at) as restaurant_ids,
    MIN(created_at) as oldest_created_at,
    MAX(created_at) as newest_created_at
FROM restaurants
GROUP BY user_id
HAVING COUNT(*) > 1;

-- Step 2: Preview restaurants that will be KEPT (oldest for each user)
-- These are the restaurants that will remain after cleanup
SELECT 
    r.*
FROM restaurants r
INNER JOIN (
    SELECT 
        user_id,
        MIN(created_at) as oldest_created_at
    FROM restaurants
    GROUP BY user_id
    HAVING COUNT(*) > 1
) duplicates ON r.user_id = duplicates.user_id 
    AND r.created_at = duplicates.oldest_created_at;

-- Step 3: Preview restaurants that will be DELETED
-- These are the duplicate restaurants that will be removed
SELECT 
    r.*
FROM restaurants r
INNER JOIN (
    SELECT 
        user_id,
        MIN(created_at) as oldest_created_at
    FROM restaurants
    GROUP BY user_id
    HAVING COUNT(*) > 1
) duplicates ON r.user_id = duplicates.user_id 
    AND r.created_at > duplicates.oldest_created_at;

-- =====================================================
-- DANGER ZONE: Only run this after reviewing the above!
-- =====================================================

-- Step 4: DELETE duplicate restaurants (keeps oldest for each user)
-- UNCOMMENT THE LINES BELOW TO EXECUTE THE CLEANUP
-- 
-- BEGIN;
-- 
-- WITH duplicates_to_delete AS (
--     SELECT r.id
--     FROM restaurants r
--     INNER JOIN (
--         SELECT 
--             user_id,
--             MIN(created_at) as oldest_created_at
--         FROM restaurants
--         GROUP BY user_id
--         HAVING COUNT(*) > 1
--     ) dup ON r.user_id = dup.user_id 
--         AND r.created_at > dup.oldest_created_at
-- )
-- DELETE FROM restaurants
-- WHERE id IN (SELECT id FROM duplicates_to_delete);
-- 
-- -- Verify the cleanup worked
-- SELECT 
--     user_id,
--     COUNT(*) as restaurant_count
-- FROM restaurants
-- GROUP BY user_id
-- HAVING COUNT(*) > 1;
-- 
-- -- If everything looks good, commit the transaction
-- COMMIT;
-- 
-- -- If something went wrong, rollback instead:
-- -- ROLLBACK;

-- =====================================================
-- Post-Cleanup Verification
-- =====================================================

-- Step 5: Verify no duplicates remain
-- Run this after cleanup to confirm success
SELECT 
    user_id,
    COUNT(*) as restaurant_count
FROM restaurants
GROUP BY user_id
HAVING COUNT(*) > 1;

-- Should return no rows if cleanup was successful

-- Step 6: Check total restaurant count
SELECT COUNT(*) as total_restaurants FROM restaurants;

-- Step 7: Verify all users have exactly one restaurant
SELECT 
    COUNT(DISTINCT user_id) as users_with_restaurants,
    COUNT(*) as total_restaurants,
    COUNT(*) = COUNT(DISTINCT user_id) as all_users_have_one_restaurant
FROM restaurants;
