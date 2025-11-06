# Menu Group Customization - Implementation Plan

## ✅ Completed Changes

### 1. Removed Accompaniments Tab
**File:** `src/pages/MenuGroupSettings.tsx`

**Before:**
```tsx
<TabsList className="grid w-full grid-cols-3">
  <TabsTrigger value="group">Group Settings</TabsTrigger>
  <TabsTrigger value="categories">Categories</TabsTrigger>
  <TabsTrigger value="accompaniments">Accompaniments</TabsTrigger>
</TabsList>
```

**After:**
```tsx
<TabsList className="grid w-full grid-cols-3">
  <TabsTrigger value="group">Group Settings</TabsTrigger>
  <TabsTrigger value="categories">Categories</TabsTrigger>
  <TabsTrigger value="customization">Customization</TabsTrigger>
</TabsList>
```

**Reason:** Accompaniments are managed per-item in the extras dialog, not at group level.

---

### 2. Added Customization Tab (Coming Soon)
**File:** `src/pages/MenuGroupSettings.tsx`

**Features:**
- Shows "Coming Soon" placeholder
- Lists all planned customization options
- Explains current behavior (inherits restaurant settings)

---

## 🎨 Planned Customization Features

### Per-Group Customization Options:

#### **1. Branding & Colors**
- ✨ Brand Color (primary)
- ✨ Secondary Color
- ✨ Text Color
- ✨ Card Background Color

#### **2. Background Styling**
- ✨ Background Style (solid/gradient/image/video/youtube)
- ✨ Background Color
- ✨ Background Image Upload
- ✨ Background Video Upload
- ✨ YouTube Video URL

#### **3. Typography**
- ✨ Font Family (Google Fonts)
- ✨ Font Size Options
- ✨ Font Weight Variations

#### **4. Layout & Appearance**
- ✨ Menu Layout (list/grid/masonry)
- ✨ Card Style (rounded/extra-rounded/sharp)
- ✨ Button Style (rounded/pill/sharp)
- ✨ Card Shadow (none/sm/md/lg/xl)

#### **5. Logo & Branding**
- ✨ Custom Logo Upload
- ✨ Logo Border Toggle
- ✨ Logo Size Options
- ✨ Logo Position

#### **6. Interactive Features**
- ✨ Show/Hide Animations
- ✨ Transition Effects
- ✨ Hover States
- ✨ Animation Speed

#### **7. WhatsApp Button**
- ✨ Button Color
- ✨ Button Text Color
- ✨ Custom Button Text
- ✨ Button Style
- ✨ Price Badge Colors

---

## 📋 Implementation Steps

### Phase 1: Database Schema ✅ (To Do)
```sql
-- Add customization columns to menu_groups table
ALTER TABLE menu_groups ADD COLUMN IF NOT EXISTS brand_color VARCHAR(7);
ALTER TABLE menu_groups ADD COLUMN IF NOT EXISTS secondary_color VARCHAR(7);
ALTER TABLE menu_groups ADD COLUMN IF NOT EXISTS text_color VARCHAR(7);
ALTER TABLE menu_groups ADD COLUMN IF NOT EXISTS card_background VARCHAR(7);
ALTER TABLE menu_groups ADD COLUMN IF NOT EXISTS font_family VARCHAR(100);
ALTER TABLE menu_groups ADD COLUMN IF NOT EXISTS background_style VARCHAR(20);
ALTER TABLE menu_groups ADD COLUMN IF NOT EXISTS background_color VARCHAR(7);
ALTER TABLE menu_groups ADD COLUMN IF NOT EXISTS background_image TEXT;
ALTER TABLE menu_groups ADD COLUMN IF NOT EXISTS background_video TEXT;
ALTER TABLE menu_groups ADD COLUMN IF NOT EXISTS background_youtube_url TEXT;
ALTER TABLE menu_groups ADD COLUMN IF NOT EXISTS menu_layout VARCHAR(20);
ALTER TABLE menu_groups ADD COLUMN IF NOT EXISTS card_style VARCHAR(20);
ALTER TABLE menu_groups ADD COLUMN IF NOT EXISTS button_style VARCHAR(20);
ALTER TABLE menu_groups ADD COLUMN IF NOT EXISTS card_shadow VARCHAR(20);
ALTER TABLE menu_groups ADD COLUMN IF NOT EXISTS show_logo_border BOOLEAN DEFAULT FALSE;
ALTER TABLE menu_groups ADD COLUMN IF NOT EXISTS show_animations BOOLEAN DEFAULT TRUE;
ALTER TABLE menu_groups ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE menu_groups ADD COLUMN IF NOT EXISTS whatsapp_button_color VARCHAR(7);
ALTER TABLE menu_groups ADD COLUMN IF NOT EXISTS whatsapp_button_text_color VARCHAR(7);
ALTER TABLE menu_groups ADD COLUMN IF NOT EXISTS whatsapp_button_text VARCHAR(50);
ALTER TABLE menu_groups ADD COLUMN IF NOT EXISTS whatsapp_button_style VARCHAR(20);
ALTER TABLE menu_groups ADD COLUMN IF NOT EXISTS whatsapp_button_price_bg VARCHAR(20);
ALTER TABLE menu_groups ADD COLUMN IF NOT EXISTS whatsapp_button_price_color VARCHAR(7);
```

### Phase 2: UI Components (To Do)
1. **Create CustomizationForm Component**
   - Color pickers
   - Font selector
   - Background options
   - Upload interfaces
   - Preview panel

2. **Update MenuGroupSettings.tsx**
   - Replace "Coming Soon" with actual form
   - Add state management
   - Add save functionality
   - Add real-time preview

### Phase 3: PublicMenu Integration (To Do)
1. **Update PublicMenu.tsx**
   - Check for group-specific settings
   - Fallback to restaurant settings if not set
   - Priority: Group Settings > Restaurant Settings > Defaults

2. **Logic:**
   ```typescript
   const brandColor = menuGroup?.brand_color || restaurant?.brand_color || '#F97316';
   const fontFamily = menuGroup?.font_family || restaurant?.font_family || 'Work Sans';
   const backgroundStyle = menuGroup?.background_style || restaurant?.background_style || 'solid';
   // ... etc
   ```

### Phase 4: Settings Inheritance (To Do)
1. **Inheritance Options**
   - Option 1: "Use Restaurant Settings" (default)
   - Option 2: "Custom Group Settings"
   - Toggle to switch between modes

2. **Reset Functionality**
   - Button to clear group settings
   - Revert to restaurant defaults

---

## 🎯 User Experience

### Current Behavior:
- Menu groups inherit ALL styling from restaurant settings
- No per-group customization available
- Users see "Coming Soon" in Customization tab

### Future Behavior:
- Each menu group can have unique branding
- Full control over appearance
- Live preview of changes
- Easy reset to restaurant defaults

---

## 📝 Use Cases

### Example 1: Multi-Cuisine Restaurant
**Restaurant:** "Fusion Bistro"
- **Rwandan Cuisine Group:** Warm earth tones, traditional patterns
- **Italian Menu Group:** Red, white, green colors, elegant fonts
- **Asian Fusion Group:** Bold colors, modern minimalist design

### Example 2: Day/Night Menus
**Restaurant:** "City Café"
- **Breakfast Menu:** Bright yellows, cheerful fonts, sunny background
- **Dinner Menu:** Deep blues, sophisticated fonts, elegant styling

### Example 3: Seasonal Menus
**Restaurant:** "The Garden"
- **Spring Menu:** Pastels, floral backgrounds, light fonts
- **Winter Menu:** Deep colors, warm tones, cozy styling

---

## 🔧 Technical Notes

### Settings Priority:
```
1. Menu Group Custom Settings (highest priority)
2. Restaurant Global Settings
3. System Defaults (fallback)
```

### Database Storage:
- All settings stored in `menu_groups` table
- NULL values = inherit from restaurant
- Non-NULL = override with custom value

### Performance:
- Settings cached on page load
- No additional queries needed
- Efficient fallback logic

---

## 📊 Benefits

✅ **Better Branding**
- Match menu appearance to menu content
- Create unique experiences per menu

✅ **Flexibility**
- Different styles for different times/occasions
- Easy to experiment and change

✅ **Professional**
- Each menu feels intentional and designed
- Better customer experience

✅ **No Complexity**
- Still uses same system
- Just more options
- Easy to understand

---

## 🚀 Rollout Plan

### Stage 1: Prepare (Now)
- ✅ Remove Accompaniments tab
- ✅ Add Customization tab placeholder
- ✅ Document plan

### Stage 2: Build
- Create database migration
- Build customization UI
- Implement form logic
- Add preview functionality

### Stage 3: Integrate
- Update PublicMenu to check group settings
- Add fallback logic
- Test inheritance

### Stage 4: Polish
- Add validation
- Add copy/paste settings between groups
- Add templates
- Add export/import

### Stage 5: Launch
- User testing
- Documentation
- Tutorial videos
- Rollout to production

---

Last Updated: Nov 6, 2025
Status: Phase 1 Planning Complete ✅
