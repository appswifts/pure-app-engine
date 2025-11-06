# Work Sans - Global Font Configuration

## ✅ Work Sans is Now the Global Default Font!

### Changes Made:

#### 1. **Tailwind Config** ✅
```typescript
// tailwind.config.ts
fontFamily: {
  sans: ['Work Sans', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Arial', 'sans-serif'],
  display: ['Work Sans', 'sans-serif'],
}
```

**Result:** All components using Tailwind's `font-sans` class now use Work Sans

---

#### 2. **PublicMenu Default** ✅
```typescript
// PublicMenu.tsx
fontFamily: restaurant?.font_family || 'Work Sans, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Arial, sans-serif'
```

**Result:** Public menus use Work Sans unless restaurant has custom font

---

#### 3. **Google Fonts Loading** ✅
```html
<!-- index.html -->
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Work+Sans:wght@400;500;700;900&family=Noto+Sans:wght@400;500;700;900&display=swap" />
```

**Result:** Work Sans loads globally with all needed weights

---

#### 4. **CSS Documentation** ✅
```css
/* index.css */
/* Global Font: Work Sans - Loaded from Google Fonts in index.html */
```

**Result:** Clear documentation for future developers

---

## Font Hierarchy

### 1. **Public Menus:**
```
Restaurant Custom Font (if set)
    ↓
Work Sans (default)
    ↓
System Fonts (fallback)
```

### 2. **Dashboard/Admin:**
```
Work Sans (always)
    ↓
System Fonts (fallback)
```

---

## Font Weights Available

Work Sans is loaded with these weights:
- ✅ **400** (Regular) - Body text
- ✅ **500** (Medium) - Subheadings
- ✅ **700** (Bold) - Headings
- ✅ **900** (Black) - Display text

---

## Where Work Sans Appears

### ✅ Dashboard
- All navigation menus
- All forms and inputs
- All buttons and cards
- All tables and lists
- All headings and body text

### ✅ Public Menu (Default)
- Restaurant name
- Menu categories
- Menu item names
- Menu item descriptions
- Prices
- Buttons
- Cart
- All UI elements

**Exception:** If restaurant sets a custom font in settings, that overrides Work Sans

---

## Usage in Code

### Tailwind Classes:
```tsx
// Uses Work Sans automatically
<div className="font-sans">Content</div>

// Uses Work Sans explicitly
<div className="font-display">Display Text</div>
```

### Inline Styles:
```tsx
// Dashboard/Admin (always Work Sans)
<div style={{ fontFamily: 'Work Sans, sans-serif' }}>Content</div>

// Public Menu (Work Sans as fallback)
<div style={{ 
  fontFamily: restaurant?.font_family || 'Work Sans, sans-serif' 
}}>Content</div>
```

---

## Custom Restaurant Fonts

Restaurants can still set custom fonts in their settings:
- Playfair Display
- Roboto
- Poppins
- Montserrat
- Any Google Font

**Work Sans is used when:**
- No custom font is set
- Custom font fails to load
- Admin/dashboard views

---

## Performance

✅ **Pre-loaded:** Work Sans loads in `<head>` for optimal performance
✅ **Preconnect:** DNS prefetch and preconnect to Google Fonts
✅ **Display swap:** Font displays immediately with swap strategy
✅ **Weights optimized:** Only loading 4 weights (not all 9)

---

## Browser Support

Work Sans works on:
- ✅ Chrome/Edge (all versions)
- ✅ Firefox (all versions)
- ✅ Safari/iOS (all versions)
- ✅ Android (all versions)

Fallback to system fonts on:
- ❌ Very old browsers
- ❌ Users blocking Google Fonts

---

## Summary

**Work Sans is now your global brand font!**

- Used throughout entire dashboard
- Default for all public menus
- Clean, modern, professional
- Excellent readability
- Great for food/restaurant apps

---

Last Updated: Nov 6, 2025
