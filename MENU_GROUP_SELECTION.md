# Menu Group Selection in Embed - User Guide

## ✅ Changes Made

Updated PublicMenu component to properly handle multiple menu groups in embed view.

### 1. Auto-Select Group on Load
When multiple menu groups exist in the embed view, the system now:
- **Auto-selects** the default group (if marked as default)
- **Falls back** to the first group if no default is set
- **Prevents** empty menu displays

### 2. Added Group Selector UI
When a restaurant has **multiple menu groups**, users now see a **group selector** at the top of the menu:

```
┌─────────────────────────────────────────┐
│         Restaurant Name                 │
├─────────────────────────────────────────┤
│  [Breakfast] [Lunch] [Dinner] [Drinks] │  ← Group Selector
├─────────────────────────────────────────┤
│  [All] [Appetizers] [Mains] [Desserts] │  ← Category Filter
├─────────────────────────────────────────┤
│         Menu Items...                   │
└─────────────────────────────────────────┘
```

### 3. Automatic Category Reset
When switching between menu groups:
- Selected category resets to "All"
- Shows all items in the new group
- Clean, intuitive experience

## 🎯 How It Works

### Single Menu Group
- Group selector **hidden**
- Menu shows that group's items
- Simple, clean interface

### Multiple Menu Groups
- Group selector **visible** at top
- Active group highlighted in brand color
- Click to switch between groups
- Categories update automatically

## 🎨 Group Selector Design

**Visual Style:**
- Horizontal scrollable tabs
- Active group: Filled with brand color, white text
- Inactive groups: White background, brand color text & border
- Smooth transitions on click
- Mobile-friendly (horizontal scroll)

**Colors:**
- Uses restaurant's brand color
- Consistent with overall design
- High contrast for accessibility

## 📱 Responsive Design

**Desktop:**
- All groups visible if space allows
- Horizontal layout

**Mobile:**
- Horizontal scroll for many groups
- Touch-friendly buttons
- Smooth scrolling

## 🌐 URL Support

Users can link directly to a specific group:
```
/embed/restaurant-slug?group=lunch
/menu/restaurant-slug/table1?group=dinner
```

The `group` parameter works with:
- Group name (case-insensitive)
- Group ID

## 🔄 User Experience Flow

### Step 1: Page Loads
- System checks available menu groups
- Auto-selects default or first group
- Displays that group's menu

### Step 2: User Switches Groups
- Clicks on different group tab
- Menu instantly updates
- Category resets to "All"
- New group's items displayed

### Step 3: User Browses
- Can filter by category within group
- Can search across group
- Can add items to cart

## ✨ Benefits

### For Restaurant Owners
- ✅ **All groups accessible** - No menu items hidden
- ✅ **Professional look** - Clean group selector
- ✅ **Easy to use** - Intuitive navigation
- ✅ **Works everywhere** - Embed, QR codes, direct links

### For Customers
- ✅ **Easy navigation** - Clear group tabs
- ✅ **Quick switching** - One-click group change
- ✅ **No confusion** - Always see which group is active
- ✅ **Mobile-friendly** - Works great on phones

## 📊 Examples

### Restaurant with 3 Groups
```
Breakfast | Lunch | Dinner
[Active]    [Tab]   [Tab]
```
Shows breakfast items. Click "Lunch" to see lunch items.

### Restaurant with Many Groups
```
Breakfast | Lunch | Dinner | Drinks | Desserts | ... →
[Active]    [Tab]   [Tab]     [Tab]     [Tab]
```
Scroll horizontally to see all groups.

### Restaurant with 1 Group
```
(No group selector shown - just menu items)
```
Cleaner interface when only one group exists.

## 🧪 Testing

### Test Case 1: Single Group
1. Go to restaurant with 1 menu group
2. **Expected:** No group selector visible
3. **Expected:** Menu shows that group's items

### Test Case 2: Multiple Groups
1. Go to restaurant with 2+ menu groups
2. **Expected:** Group selector visible
3. **Expected:** Default/first group pre-selected
4. Click different group
5. **Expected:** Menu updates instantly
6. **Expected:** Category resets to "All"

### Test Case 3: Embed View
1. Open `/embed/restaurant-slug`
2. **Expected:** Same behavior as public menu
3. **Expected:** Group selector works
4. **Expected:** Can switch between groups

## 💡 Pro Tips

### For Restaurant Owners
1. **Mark a default group** - This loads first
2. **Order groups logically** - Breakfast, Lunch, Dinner
3. **Keep names short** - Easier to read on mobile
4. **Test on mobile** - Ensure smooth scrolling

### For Developers
- Group selector uses `brandColor` from restaurant
- Selector only shows if `menuGroups.length > 1`
- Category resets on group change via `useEffect`
- Horizontal scroll for overflow groups

## 🚀 Live Now

This feature is **active everywhere**:
- ✅ Public menu pages (`/menu/...`)
- ✅ Embed pages (`/embed/...`)
- ✅ QR code scans
- ✅ Direct links
- ✅ All restaurants automatically

**No configuration needed** - It just works!

---

**Now your customers can easily explore all your menu groups!** 🎉
