# QR Code System - Quick Reference Guide

## 🎯 Three QR Code Types

### 1️⃣ Single Menu Group QR
```
URL: /menu/{slug}?group={groupId}
Display: Direct to specific group
Selector: Hidden
Use: Breakfast menu, Bar menu, Lunch specials
```

### 2️⃣ Multiple Menu Groups QR
```
URL: /menu/{slug}?groups={id1},{id2}&mode=select
Display: Pre-selection page → Selected group
Selector: Pre-selection cards
Use: Events, Catering, Multiple cuisines
```

### 3️⃣ Full Restaurant Menu QR
```
URL: /menu/{slug}?mode=full
Display: All groups together
Selector: Hidden
Use: Main entrance, General tables
```

---

## 📱 Customer Experience Flow

```
Single QR
  └─ Scan → Direct to group items ✓

Multi QR
  └─ Scan → Choose group → View items ✓

Full QR
  └─ Scan → View all items ✓

Table QR (legacy)
  └─ Scan → Choose group (if multiple) → View items ✓
```

---

## 🔧 Component Usage

### Admin: Generate QR Codes
```tsx
import MenuQRGenerator from '@/components/dashboard/MenuQRGenerator';

// Use in dashboard
<MenuQRGenerator />
```

### Public: Pre-Selection Page
```tsx
// Route: /menu/:restaurantSlug
// Auto-renders when URL has groups parameter
<MenuGroupSelect />
```

### Public: Menu Display
```tsx
// Route: /menu/:restaurantSlug with parameters
// Handles all display modes automatically
<PublicMenu />
```

---

## 🎨 URL Parameters

| Parameter | Value | Effect |
|-----------|-------|--------|
| `group` | UUID | Single group mode |
| `groups` | UUID,UUID,... | Multiple groups for selection |
| `mode` | `select` | Shows pre-selection |
| `mode` | `full` | Shows all groups |
| (none) | - | Default mode |

---

## 💻 Code Examples

### Generate Single Group QR
```typescript
const url = `${window.location.origin}/menu/${slug}?group=${groupId}`;
const qrCode = await QRCode.toDataURL(url, {
  width: 400,
  margin: 2
});
```

### Generate Multi-Group QR
```typescript
const groupIds = ['uuid1', 'uuid2', 'uuid3'];
const url = `${window.location.origin}/menu/${slug}?groups=${groupIds.join(',')}&mode=select`;
const qrCode = await QRCode.toDataURL(url, {
  width: 400,
  margin: 2
});
```

### Generate Full Menu QR
```typescript
const url = `${window.location.origin}/menu/${slug}?mode=full`;
const qrCode = await QRCode.toDataURL(url, {
  width: 400,
  margin: 2
});
```

---

## 🔍 Display Logic

### PublicMenu Component
```typescript
// Determine display mode from URL
const mode = searchParams.get('mode');
const group = searchParams.get('group');

if (mode === 'full') {
  displayMode = 'full';      // Show all groups
  showSelector = false;
} else if (group) {
  displayMode = 'single';    // Show one group
  showSelector = false;
} else {
  displayMode = 'default';   // Standard mode
  showSelector = menuGroups.length > 1;
}

// Filter items accordingly
const filteredItems = items.filter(item => {
  if (displayMode === 'single') {
    return item.group_id === selectedGroup;
  } else if (displayMode === 'full') {
    return true; // Show all
  } else {
    return item.group_id === selectedGroup;
  }
});
```

---

## 📋 Testing Checklist

### Single Group QR
- [ ] Generates correct URL with group parameter
- [ ] Menu displays only selected group items
- [ ] Group selector is hidden
- [ ] Can add items to cart
- [ ] WhatsApp order works

### Multi-Group QR
- [ ] Generates correct URL with groups parameter
- [ ] Pre-selection page shows correct groups
- [ ] Clicking group navigates to menu
- [ ] Menu shows selected group only
- [ ] Group selector is hidden

### Full Menu QR
- [ ] Generates correct URL with mode=full
- [ ] All groups display together
- [ ] Group selector is hidden
- [ ] Can browse all items
- [ ] Cart works across all groups

### Backward Compatibility
- [ ] Table QRs still work
- [ ] Default mode shows selector (if >1 group)
- [ ] Legacy URLs redirect correctly

---

## 🐛 Common Issues & Fixes

### Issue: Selector still showing
```typescript
// Check display mode is set correctly
console.log('Display mode:', displayMode);
console.log('Menu groups:', menuGroups.length);

// Verify conditional rendering
{displayMode === 'default' && menuGroups.length > 1 && (
  <GroupSelector />
)}
```

### Issue: Items not filtering
```typescript
// Verify category has menu_group_id
console.log('Category:', category);
console.log('Menu Group ID:', category.menu_group_id);

// Check filter logic
const itemCategory = categories.find(c => c.id === item.category_id);
const groupMatch = itemCategory?.menu_group_id === selectedGroup;
```

### Issue: Pre-selection not loading
```typescript
// Verify groups parameter in URL
const groupsParam = searchParams.get('groups');
console.log('Groups param:', groupsParam);

// Check route configuration
// Should route to MenuGroupSelect when:
// - URL is /menu/:slug (no tableSlug)
// - Has groups parameter
```

---

## 🎯 Key Files

```
MenuQRGenerator.tsx
├── Single Group Generation
├── Multi Group Generation
└── Full Menu Generation

MenuGroupSelect.tsx
├── Pre-selection UI
├── Group Cards
└── Navigation to PublicMenu

PublicMenu.tsx
├── URL Parameter Parsing
├── Display Mode Logic
├── Conditional Group Selector
└── Item Filtering

App.tsx
├── /menu/:slug → MenuGroupSelect
└── /menu/:slug?params → PublicMenu
```

---

## 📊 State Management

### MenuQRGenerator State
```typescript
selectedGroupId: string        // For single QR
selectedGroupIds: string[]     // For multi QR
qrCodes: {
  single: QRCodeData | null
  multi: QRCodeData | null
  full: QRCodeData | null
}
```

### PublicMenu State
```typescript
displayMode: 'single' | 'full' | 'default'
selectedMenuGroup: string | null
menuGroups: MenuGroup[]
```

### MenuGroupSelect State
```typescript
restaurant: Restaurant
menuGroups: MenuGroup[]  // Filtered by URL param
```

---

## 🚀 Performance Tips

1. **QR Generation:** Cache generated QR codes
2. **Image Loading:** Use lazy loading for menu items
3. **State Updates:** Minimize re-renders with useMemo
4. **Navigation:** Use React Router's state for faster transitions

---

## 📱 Mobile Optimization

- **Touch Targets:** All buttons ≥ 44px
- **Scrolling:** Smooth scroll behavior enabled
- **Viewport:** Meta tag configured correctly
- **Images:** Responsive with SafeImage component
- **Loading:** Skeleton screens for better UX

---

## 🎓 Best Practices

### For Admins
1. Use descriptive QR names when downloading
2. Test QR codes before printing
3. Print at appropriate size (min 2cm x 2cm)
4. Place QRs in well-lit areas
5. Update digital displays regularly

### For Developers
1. Always validate URL parameters
2. Handle missing menu groups gracefully
3. Provide fallback for errors
4. Log navigation for debugging
5. Test on real devices

---

## 📈 Analytics (Future)

Track these metrics:
- QR scans by type
- Most popular groups
- Conversion rates
- Average session time
- Cart abandonment

---

## 🔐 Security Notes

- All routes are public (as intended)
- No sensitive data in QR URLs
- Group IDs are UUIDs (secure)
- Rate limiting on QR generation (future)
- Input validation on all parameters

---

**Quick Start:** Import MenuQRGenerator into your dashboard, select type, generate, download, print! ✅
