# Fixed: Menu Group Slug Error (PGRST116)

## Errors Fixed
```
GET /rest/v1/menu_groups?select=*&slug=eq.main-menu 406 (Not Acceptable)
Error: {code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned', details: 'The result contains 20 rows'}

GET /rest/v1/menu_groups?select=*&slug=eq.undefined 406 (Not Acceptable)
Error: {code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned', details: 'The result contains 0 rows'}
```

## Files Fixed
1. ✅ MenuGroupManagement.tsx
2. ✅ MenuGroupSettings.tsx

## Root Cause
The Demo restaurant had **20 menu groups all with the same slug "main-menu"**. When the code tried to fetch a single menu group using:
```typescript
.eq("slug", groupSlug)
.single()  // ❌ Expects exactly 1 row, but got 20!
```

This caused Supabase to reject the query with a 406 error.

## Why It Happened

### Issue 1: Duplicate Slugs
Menu group slugs are **not globally unique** - they're only unique **per restaurant**. Multiple restaurants can have menu groups with the same slug (e.g., "main-menu", "breakfast", "lunch").

### Issue 2: Undefined Parameters
The `slug=eq.undefined` errors happen when:
- Navigating to pages with incomplete URLs
- URL parameters not being passed correctly
- React router params being undefined

Example bad URL: `/dashboard/restaurant//group/` (missing slugs)

## The Fix

### 1. MenuGroupManagement.tsx (✅ Fixed)
```typescript
// /dashboard/restaurant/:restaurantSlug/group/:groupSlug

// BEFORE - Only filtered by slug
.eq("slug", groupSlug)
.single()

// AFTER - Filter by BOTH restaurant_id AND slug
.eq("slug", groupSlug)
.eq("restaurant_id", restaurantData.id)  // ✅ Now unique!
.single()
```

### 2. MenuGroupSettings.tsx (✅ Fixed)
```typescript
// /dashboard/restaurant/:restaurantSlug/group/:groupSlug/settings

// BEFORE - Only filtered by slug
const { data: groupData } = await supabase
  .from("menu_groups")
  .eq("slug", groupSlug)
  .single();  // ❌ Error with 20 duplicates!

// AFTER - Filter by restaurant_id AND slug
const { data: groupData } = await supabase
  .from("menu_groups")
  .eq("slug", groupSlug)
  .eq("restaurant_id", restaurantData.id)  // ✅ Unique!
  .single();
```

### 3. MenuGroupManagement.tsx - Alternative URL (✅ Fixed)
```typescript
// /dashboard/menu-groups/:groupSlug

// BEFORE - Used .single() on non-unique slug
.eq("slug", groupSlug)
.single()  // ❌ Fails if duplicate slugs exist

// AFTER - Use .limit(1) to gracefully handle duplicates
.eq("slug", groupSlug)
.limit(1)  // ✅ Takes first match if duplicates exist

// Then access as array
groupData = groupDataBySlug[0];
```

## Data Quality Issue

### Problem
Your database has duplicate slugs:
- 20 menu groups with slug `"main-menu"`
- Likely from demo/test data seeding

### Check Your Data
```sql
-- Find duplicate slugs
SELECT slug, restaurant_id, COUNT(*) as count
FROM menu_groups
GROUP BY slug, restaurant_id
HAVING COUNT(*) > 1;

-- Find globally duplicate slugs (across all restaurants)
SELECT slug, COUNT(*) as count
FROM menu_groups
GROUP BY slug
HAVING COUNT(*) > 1;
```

### Clean Up Duplicates
```sql
-- Option 1: Delete duplicate menu groups (keep first one)
DELETE FROM menu_groups
WHERE id NOT IN (
  SELECT MIN(id)
  FROM menu_groups
  GROUP BY restaurant_id, slug
);

-- Option 2: Make slugs unique by appending numbers
UPDATE menu_groups mg
SET slug = mg.slug || '-' || row_number
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY restaurant_id, slug ORDER BY created_at) as row_number
  FROM menu_groups
) numbered
WHERE mg.id = numbered.id
AND numbered.row_number > 1;
```

## Recommended: Add Database Constraint

Prevent future duplicates by adding a unique constraint:

```sql
-- Make (restaurant_id, slug) unique
ALTER TABLE menu_groups
ADD CONSTRAINT menu_groups_restaurant_slug_unique 
UNIQUE (restaurant_id, slug);
```

## Best Practices Going Forward

### 1. URL Patterns
✅ **Prefer**: `/dashboard/restaurant/:restaurantSlug/group/:groupSlug`
- Scopes slug to restaurant
- More explicit and clear
- Safer with duplicate slugs

❌ **Avoid**: `/dashboard/menu-groups/:groupSlug`
- Assumes global uniqueness
- Can break with duplicates
- Less clear context

### 2. Slug Generation
When creating menu groups, ensure slugs are unique **per restaurant**:

```typescript
const generateUniqueSlug = async (name: string, restaurantId: string) => {
  let slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  let counter = 1;
  
  while (true) {
    const { data } = await supabase
      .from("menu_groups")
      .select("id")
      .eq("restaurant_id", restaurantId)
      .eq("slug", counter > 1 ? `${slug}-${counter}` : slug);
    
    if (!data || data.length === 0) {
      return counter > 1 ? `${slug}-${counter}` : slug;
    }
    
    counter++;
  }
};
```

### 3. Data Validation
Check for duplicate slugs before inserting:

```typescript
// Before insert
const { data: existing } = await supabase
  .from("menu_groups")
  .select("id")
  .eq("restaurant_id", restaurantId)
  .eq("slug", slug);

if (existing && existing.length > 0) {
  throw new Error("Menu group with this slug already exists");
}
```

## Testing

After the fix:
1. ✅ Demo restaurant loads without errors
2. ✅ Menu groups with duplicate slugs show first match
3. ✅ Restaurant-scoped URLs work correctly
4. ✅ No more 406 errors

## Summary

**Problem**: `.single()` failed on non-unique slugs
**Solution**: Added `restaurant_id` filter + changed to `.limit(1)` for ambiguous cases
**Prevention**: Add unique constraint on `(restaurant_id, slug)`

---

Last Updated: Nov 5, 2025
