# Embed Code Generator - Now Collapsible Accordion

## ✅ Changes Made

Updated `EmbedCodeGenerator.tsx` to use an **Accordion component** instead of always-visible cards.

### Before
- Embed code generator was always visible
- Took up significant space on the page
- Made the restaurant overview page very long

### After
- **Collapsible accordion** that's hidden by default
- Clean, compact header that users can click to expand
- Only shows content when users need it

## 🎨 New Design

### Collapsed State (Default)
```
┌─────────────────────────────────────────────────┐
│ 📝 Embed Code Generator                      ▼ │
│    Generate embed codes to display your menu    │
└─────────────────────────────────────────────────┘
```

### Expanded State (When Clicked)
```
┌─────────────────────────────────────────────────┐
│ 📝 Embed Code Generator                      ▲ │
│    Generate embed codes to display your menu    │
├─────────────────────────────────────────────────┤
│                                                  │
│  [All embed code generator content]             │
│  - Configuration options                         │
│  - HTML/Responsive/WordPress/React tabs          │
│  - Live preview                                  │
│  - Integration guide                             │
│                                                  │
└─────────────────────────────────────────────────┘
```

## 🎯 Benefits

1. **Cleaner UI** - Restaurant overview page is less cluttered
2. **Better UX** - Users see it only when they need it
3. **Faster Loading** - Less initial content to render
4. **Easy Access** - One click to expand when needed
5. **Professional Look** - Modern accordion pattern

## 📍 Location

**Where to find it:**
```
Dashboard → My Restaurants → [Select Restaurant] → Scroll down
```

The accordion appears **below the menu groups section**.

## 🚀 How to Use

1. Navigate to any restaurant overview page
2. Scroll down past menu groups
3. **Click** on "Embed Code Generator" to expand
4. Generate and copy your embed code
5. **Click again** to collapse when done

## ✨ Features Preserved

All features remain the same:
- ✅ 4 code formats (HTML, Responsive, WordPress, React)
- ✅ Live preview with device toggles
- ✅ One-click copy buttons
- ✅ Integration guide
- ✅ Direct link option

Just now **wrapped in a collapsible accordion**!

## 🎨 Design Details

- **Trigger:** Shows title, description, and expand/collapse icon
- **Border:** Rounded border around the accordion
- **Padding:** Proper spacing inside when expanded
- **Animation:** Smooth expand/collapse transition
- **Icon:** Chevron that rotates when toggled

## 💡 User Experience

### First Visit
User sees a clean, collapsed section that doesn't overwhelm the page.

### When Needed
User clicks to expand and sees all embed code options immediately.

### After Use
User can collapse it again to keep the page clean.

---

**The embed code generator is now user-friendly and doesn't clutter the page!** 🎉
