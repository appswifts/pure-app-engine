# 🏢 Restaurant Menu Hierarchy - Complete Structure

**Date:** November 5, 2025  
**Status:** ✅ Fully Implemented & Documented  

---

## 📊 Complete Menu Hierarchy

This document explains the complete organizational structure of restaurant menus in our system, from the top-level restaurant down to individual variations and extras.

---

## 🎯 Hierarchy Overview

```
Restaurant (Top Level)
    └── Groups (Menu Groups/Cuisines)
        └── Categories (Menu Sections)
            └── Items (Menu Items/Dishes)
                ├── Variations (Size, Flavor, Preparation)
                └── Extras/Accompaniments (Sides, Toppings, Sauces)
```

### Flow Diagram
```
┌─────────────────────────────────────────────────────────────┐
│                        RESTAURANT                            │
│  (e.g., "Joe's Diner", "Pizza Palace")                      │
└───────────────────────────┬─────────────────────────────────┘
                            │
          ┌─────────────────┼─────────────────┐
          ▼                 ▼                 ▼
    ┌──────────┐      ┌──────────┐     ┌──────────┐
    │  Group 1 │      │  Group 2 │     │  Group 3 │
    │ Italian  │      │ American │     │ Japanese │
    └────┬─────┘      └────┬─────┘     └────┬─────┘
         │                 │                 │
    ┌────┼────┐       ┌────┼────┐      ┌────┼────┐
    ▼    ▼    ▼       ▼    ▼    ▼      ▼    ▼    ▼
  Cat  Cat  Cat     Cat  Cat  Cat    Cat  Cat  Cat
  App  Main Dess   App  Main Dess   App  Main Dess
    │    │    │      │    │    │     │    │    │
    ▼    ▼    ▼      ▼    ▼    ▼     ▼    ▼    ▼
 Items Items Items Items Items Items Items Items Items
    │    │    │      │    │    │     │    │    │
    ▼    ▼    ▼      ▼    ▼    ▼     ▼    ▼    ▼
Var+Ext Var+Ext    Var+Ext Var+Ext  Var+Ext Var+Ext
```

---

## 🏗️ Level-by-Level Breakdown

### Level 1: Restaurant 🏢
**Definition:** The top-level establishment that offers food and dining services.

**Properties:**
- Restaurant name
- Location/address
- Branding/logo
- Operating hours
- Contact information

**Database Table:** `restaurants`

**Example:**
```
Restaurant: "Joe's Italian Bistro"
├── Location: "123 Main St"
├── Cuisine Type: "Italian"
└── Owner: User ID
```

**In System:**
- One restaurant per management session
- Selected via `/dashboard/restaurant/:id/manage`
- All menu data is restaurant-specific

---

### Level 2: Groups (Menu Groups) 🍽️
**Definition:** Major divisions or sections representing different cuisine types or meal categories.

**Purpose:**
- Organize menu by cuisine style
- Separate different food traditions
- Enable multi-cuisine restaurants
- Support menu variations (lunch/dinner/brunch)

**Properties:**
- Group name (e.g., "Italian", "American", "Asian Fusion")
- Description
- Display order
- Active status

**Database Table:** `menu_groups`

**Examples:**
```
Group 1: "Italian Classics"
Group 2: "American Comfort Food"
Group 3: "Japanese Specialties"
Group 4: "Breakfast Menu"
Group 5: "Dinner Menu"
```

**Use Cases:**
1. **Multi-Cuisine Restaurant:**
   ```
   Restaurant: "World Fusion"
   ├── Italian Menu Group
   ├── Mexican Menu Group
   └── Asian Menu Group
   ```

2. **Time-Based Menus:**
   ```
   Restaurant: "All Day Cafe"
   ├── Breakfast Menu (6am-11am)
   ├── Lunch Menu (11am-4pm)
   └── Dinner Menu (4pm-10pm)
   ```

**Relationship:**
- Parent: Restaurant
- Child: Categories

---

### Level 3: Categories (Menu Sections) 📋
**Definition:** Logical segments that classify items within a group (appetizers, mains, desserts, beverages).

**Purpose:**
- Organize items by meal course
- Help customers navigate menu
- Aid kitchen organization
- Group similar dishes

**Properties:**
- Category name
- Description
- Display order
- Active status
- Belongs to menu_group_id

**Database Table:** `categories`

**Examples:**
```
Within "Italian Classics" Group:
├── Appetizers (Antipasti)
├── Pasta & Risotto
├── Main Courses (Secondi)
├── Pizza
└── Desserts (Dolci)

Within "Breakfast Menu" Group:
├── Egg Dishes
├── Pancakes & Waffles
├── Breakfast Sides
└── Beverages
```

**Visual Structure:**
```
Italian Menu Group
    ├── Appetizers
    │   ├── Bruschetta
    │   ├── Caprese Salad
    │   └── Calamari
    ├── Main Courses
    │   ├── Chicken Parmesan
    │   ├── Veal Marsala
    │   └── Eggplant Parmesan
    └── Desserts
        ├── Tiramisu
        ├── Panna Cotta
        └── Gelato
```

**Relationship:**
- Parent: Group (menu_group_id)
- Child: Items

---

### Level 4: Items (Menu Items/Dishes) 🍕
**Definition:** The actual food or drink offerings - specific dishes or beverages.

**Purpose:**
- Represent individual dishes
- Display to customers
- Set base pricing
- Can be marked as accompaniment

**Properties:**
- Item name
- Description
- Base price
- Image URL
- Category ID
- Menu Group ID
- Restaurant ID
- Is available
- **Is accompaniment** (Important!)
- Display order

**Database Table:** `menu_items`

**Examples:**
```
Item: "Margherita Pizza"
├── Description: "Fresh mozzarella, tomato sauce, basil"
├── Base Price: 12,000 RWF
├── Category: "Pizza"
├── Group: "Italian Classics"
├── Is Available: true
└── Is Accompaniment: false

Item: "French Fries"
├── Description: "Crispy golden fries"
├── Base Price: 3,000 RWF
├── Category: "Sides"
├── Group: "American Comfort Food"
├── Is Available: true
└── Is Accompaniment: true ⭐ (Can be added to other items)
```

**Important Nuance - Items as Accompaniments:**
Some items can themselves BE accompaniments. This means:
- An item exists as a standalone menu item
- The same item can be added as an extra to other items
- Marked with `is_accompaniment = true`
- Appears in accompaniment selection dialog

**Example Scenario:**
```
Scenario: French Fries

As Standalone Item:
- Customer can order "French Fries" directly
- Shows in "Sides" category
- Price: 3,000 RWF

As Accompaniment:
- Can be added to burgers
- Can be added to sandwiches
- Can be added to main courses
- Same price: 3,000 RWF
- Badge shows "Accompaniment"
```

**Relationship:**
- Parent: Category (category_id) & Group (menu_group_id)
- Children: Variations & Accompaniments

---

### Level 5a: Variations 🔄
**Definition:** Different options for the same item (sizes, flavors, preparations).

**Purpose:**
- Offer size options (Small, Medium, Large)
- Provide flavor variants (Chocolate, Vanilla, Strawberry)
- Different preparation methods (Grilled, Fried, Baked)
- Price adjustments for options

**Properties:**
- Variation name
- Description
- Price modifier (+ or - from base price)
- Menu Item ID
- Display order

**Database Table:** `item_variations`

**Examples:**

**Size Variations:**
```
Item: "Coffee"
Base Price: 2,000 RWF
├── Variation: "Small"
│   └── Price Modifier: -500 RWF (Total: 1,500 RWF)
├── Variation: "Medium" (Default)
│   └── Price Modifier: 0 RWF (Total: 2,000 RWF)
└── Variation: "Large"
    └── Price Modifier: +500 RWF (Total: 2,500 RWF)
```

**Flavor Variations:**
```
Item: "Ice Cream"
Base Price: 4,000 RWF
├── Variation: "Chocolate"
│   └── Price Modifier: 0 RWF
├── Variation: "Vanilla"
│   └── Price Modifier: 0 RWF
└── Variation: "Strawberry"
    └── Price Modifier: +500 RWF (Premium)
```

**Preparation Variations:**
```
Item: "Chicken Breast"
Base Price: 15,000 RWF
├── Variation: "Grilled"
│   └── Price Modifier: 0 RWF
├── Variation: "Fried"
│   └── Price Modifier: 0 RWF
└── Variation: "Blackened"
    └── Price Modifier: +1,000 RWF (Special seasoning)
```

**Relationship:**
- Parent: Item (menu_item_id)
- Belongs to one specific item

---

### Level 5b: Extras/Accompaniments 🍟
**Definition:** Additional components that complement or enhance an item (sauces, toppings, side dishes).

**Purpose:**
- Offer customization options
- Add complementary items
- Increase order value
- Customer personalization

**Properties:**
- Accompaniment name
- Price
- Image URL (optional)
- Restaurant ID
- Menu Item ID (when linked to specific item)
- Is required

**Database Table:** `accompaniments`

**Examples:**

**Sauces:**
```
Accompaniments for "Chicken Wings":
├── Ranch Dressing (+500 RWF)
├── Blue Cheese (+500 RWF)
├── BBQ Sauce (+500 RWF)
└── Hot Sauce (Free)
```

**Toppings:**
```
Accompaniments for "Pizza":
├── Extra Cheese (+2,000 RWF)
├── Pepperoni (+3,000 RWF)
├── Mushrooms (+1,500 RWF)
├── Olives (+1,500 RWF)
└── Jalapeños (+1,000 RWF)
```

**Side Dishes:**
```
Accompaniments for "Burger":
├── French Fries (+3,000 RWF) ⭐ (Also a menu item)
├── Onion Rings (+2,500 RWF) ⭐ (Also a menu item)
├── Side Salad (+2,000 RWF) ⭐ (Also a menu item)
└── Coleslaw (+1,500 RWF)
```

**Important: Items as Accompaniments**
Notice how some accompaniments (French Fries, Onion Rings, Side Salad) are also standalone menu items. These items:
- Have `is_accompaniment = true` flag
- Appear in menu as regular items
- Can be ordered standalone
- Can be selected as extras for other items
- Maintain consistent pricing

**Relationship:**
- Parent: Item (menu_item_id) when linked
- Can reference menu items marked as accompaniments

---

## 🔗 Complete Relationship Map

### Database Schema
```
restaurants
    ↓ (has many)
menu_groups
    ├── restaurant_id → restaurants.id
    ↓ (has many)
categories
    ├── restaurant_id → restaurants.id
    ├── menu_group_id → menu_groups.id
    ↓ (has many)
menu_items
    ├── restaurant_id → restaurants.id
    ├── menu_group_id → menu_groups.id
    ├── category_id → categories.id
    ├── is_accompaniment (boolean)
    ↓ (has many)
    ├─→ item_variations
    │   └── menu_item_id → menu_items.id
    └─→ accompaniments
        └── menu_item_id → menu_items.id
```

---

## 💡 Practical Examples

### Example 1: Classic Burger Restaurant

```
Restaurant: "Burger Heaven"
│
├── Group: "American Classics"
│   │
│   ├── Category: "Burgers"
│   │   │
│   │   ├── Item: "Classic Burger" (Base: 10,000 RWF)
│   │   │   ├── Variations:
│   │   │   │   ├── "Regular" (+0)
│   │   │   │   ├── "Double Patty" (+3,000)
│   │   │   │   └── "Triple Threat" (+5,000)
│   │   │   └── Accompaniments:
│   │   │       ├── French Fries (+3,000) ⭐
│   │   │       ├── Onion Rings (+2,500) ⭐
│   │   │       ├── Extra Cheese (+1,000)
│   │   │       └── Bacon (+2,000)
│   │   │
│   │   └── Item: "Veggie Burger" (Base: 9,000 RWF)
│   │       └── (Similar structure...)
│   │
│   ├── Category: "Sides" ⭐ (Items here can be accompaniments)
│   │   │
│   │   ├── Item: "French Fries" (Base: 3,000 RWF)
│   │   │   ├── is_accompaniment: TRUE
│   │   │   └── Variations:
│   │   │       ├── "Regular"
│   │   │       ├── "Large" (+1,000)
│   │   │       └── "Loaded" (+2,000)
│   │   │
│   │   └── Item: "Onion Rings" (Base: 2,500 RWF)
│   │       ├── is_accompaniment: TRUE
│   │       └── (Can order standalone OR add to burger)
│   │
│   └── Category: "Beverages"
│       └── Item: "Soft Drink" (Base: 2,000 RWF)
│           └── Variations:
│               ├── "Small" (-500)
│               ├── "Medium" (0)
│               └── "Large" (+500)
│
└── Group: "Breakfast Menu"
    └── (Similar structure...)
```

### Example 2: Italian Restaurant

```
Restaurant: "La Trattoria"
│
├── Group: "Italian Classics"
│   │
│   ├── Category: "Pasta"
│   │   │
│   │   └── Item: "Spaghetti Carbonara" (Base: 15,000 RWF)
│   │       ├── Variations:
│   │       │   ├── "Regular Portion"
│   │       │   └── "Large Portion" (+3,000)
│   │       └── Accompaniments:
│   │           ├── Garlic Bread (+2,000) ⭐
│   │           ├── Side Salad (+3,000) ⭐
│   │           ├── Extra Parmesan (+500)
│   │           └── Red Pepper Flakes (Free)
│   │
│   ├── Category: "Pizza"
│   │   │
│   │   └── Item: "Margherita Pizza" (Base: 12,000 RWF)
│   │       ├── Variations:
│   │       │   ├── "Small 10\"" (-2,000)
│   │       │   ├── "Medium 12\"" (0)
│   │       │   └── "Large 16\"" (+4,000)
│   │       └── Accompaniments:
│   │           ├── Extra Cheese (+2,000)
│   │           ├── Pepperoni (+3,000)
│   │           └── Mushrooms (+1,500)
│   │
│   └── Category: "Sides" ⭐
│       │
│       ├── Item: "Garlic Bread" (Base: 2,000 RWF)
│       │   ├── is_accompaniment: TRUE
│       │   └── (Standalone OR accompaniment)
│       │
│       └── Item: "Side Salad" (Base: 3,000 RWF)
│           └── is_accompaniment: TRUE
│
└── Group: "Wine Selection"
    └── (Wines and beverages...)
```

---

## 🎯 Key Features of This Structure

### 1. Hierarchical Organization
- Clear parent-child relationships
- Logical grouping at each level
- Easy to navigate and understand

### 2. Flexibility
- Multi-cuisine support via Groups
- Customization via Variations
- Add-ons via Accompaniments
- Items can serve dual purposes

### 3. Dual-Purpose Items ⭐
**Most Important Feature:**
- Items can be both standalone AND accompaniments
- Marked with `is_accompaniment = true`
- Same pricing whether ordered alone or as extra
- Consistent across menu

**Example Flow:**
```
Customer Orders Burger:
1. Selects "Classic Burger"
2. Chooses variation: "Double Patty" (+3,000)
3. Adds accompaniment: "French Fries" (+3,000)
4. Total: 10,000 + 3,000 + 3,000 = 16,000 RWF

Later, Customer Orders Fries Alone:
1. Navigates to "Sides" category
2. Selects "French Fries" directly
3. Total: 3,000 RWF
```

### 4. Price Calculation
```
Final Price = Base Price + Variation Modifier + Sum(Accompaniments)

Example:
Pizza Base: 12,000 RWF
+ Large size: +4,000 RWF
+ Extra Cheese: +2,000 RWF
+ Pepperoni: +3,000 RWF
= Total: 21,000 RWF
```

---

## 🛠️ Implementation in System

### URL Structure
```
/dashboard/restaurant/:restaurantId/manage
```
Shows all groups, categories, items for that restaurant.

### Data Flow
```
1. Select Restaurant
2. Load Menu Groups (with selector)
3. Load Categories (filtered by selected group)
4. Load Items (filtered by selected category)
5. Display with Variations & Accompaniments
```

### UI Components

**Group Selector:**
```tsx
<Select value={selectedMenuGroupId}>
  {menuGroups.map(group => (
    <SelectItem value={group.id}>{group.name}</SelectItem>
  ))}
</Select>
```

**Category Filter:**
```tsx
<Tabs value={selectedCategory}>
  <TabsTrigger value="all">All Items</TabsTrigger>
  {categories.map(cat => (
    <TabsTrigger value={cat.id}>{cat.name}</TabsTrigger>
  ))}
</Tabs>
```

**Item Cards with Badges:**
```tsx
<MenuItemCard
  {...item}
  variations={item.item_variations}
  accompaniments={item.accompaniments}
  is_accompaniment={item.is_accompaniment}
/>
```

---

## 📊 Benefits of This Structure

### For Restaurant Owners
1. **Clear Organization** - Easy to manage large menus
2. **Multi-Cuisine Support** - Separate different food styles
3. **Flexible Pricing** - Variations and extras
4. **Reusable Items** - Items as accompaniments
5. **Scalability** - Add groups, categories easily

### For Customers
1. **Easy Navigation** - Clear menu structure
2. **Customization** - Choose variations and extras
3. **Clear Pricing** - See all costs upfront
4. **Consistency** - Same item, same price everywhere

### For System
1. **Data Integrity** - Proper relationships
2. **Single Source of Truth** - One item definition
3. **Efficient Queries** - Filter by hierarchy
4. **Maintainable** - Clear structure

---

## ✅ Summary

The complete hierarchy is:

```
🏢 Restaurant
   └── 🍽️ Groups (Cuisines/Meal Times)
       └── 📋 Categories (Menu Sections)
           └── 🍕 Items (Dishes)
               ├── 🔄 Variations (Options)
               └── 🍟 Extras/Accompaniments (Add-ons)
```

**Key Point:** Some items can be flagged as accompaniments (`is_accompaniment = true`), allowing them to serve as both standalone menu items AND extras for other items. This provides maximum flexibility while maintaining consistency.

---

**This structure reflects common industry practices in menu design and categorization, ensuring clarity and flexibility in presenting choices and combinations.** ✨

