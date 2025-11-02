# Dashboard UI Update Guide

## Overview
Update all dashboard layouts to match the new green-themed design with Work Sans font and Material Symbols icons.

## ✅ Completed Changes

### 1. Tailwind Config (`tailwind.config.ts`)
Added custom colors and Work Sans font:
```typescript
fontFamily: {
  display: ['Work Sans', 'sans-serif'],
},
colors: {
  'primary-green': '#38e07b',
  'background-light': '#f6f8f7',
  'background-dark': '#122017',
}
```

### 2. Index.html
Added fonts:
```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Work+Sans:wght@400;500;700;900&family=Noto+Sans:wght@400;500;700;900&display=swap" />
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" />
```

## 📋 Required Dashboard.tsx Updates

### Background & Layout
**Current:**
```tsx
<div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-primary/5">
```

**New:**
```tsx
<div className="min-h-screen bg-background-light dark:bg-background-dark font-display">
```

### Sidebar Styling
**Current:**
```tsx
<aside className="...w-64 bg-card/80 backdrop-blur-sm border-r...">
```

**New:**
```tsx
<aside className="w-64 flex-shrink-0 bg-background-light dark:bg-background-dark p-4 flex flex-col justify-between border-r border-primary-green/20 dark:border-primary-green/30">
```

### Sidebar Header/Profile
**Add this section at the top of sidebar:**
```tsx
<div className="flex items-center gap-3 mb-8">
  <div 
    className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-12"
    style={{backgroundImage: `url(${user?.user_metadata?.avatar_url || '/default-avatar.png'})`}}
  />
  <div>
    <h1 className="text-lg font-bold text-gray-900 dark:text-white">
      {restaurant?.name || 'Restaurant Owner'}
    </h1>
    <p className="text-sm text-gray-600 dark:text-gray-400">Owner</p>
  </div>
</div>
```

### Navigation Items
**Current:**
```tsx
<button className="...bg-primary text-primary-foreground...">
  <Icon className="h-5 w-5" />
  <div>{item.label}</div>
</button>
```

**New:** 
```tsx
<a className="flex items-center gap-3 px-4 py-2 rounded-lg bg-primary-green/20 dark:bg-primary-green/30 text-gray-900 dark:text-white font-medium">
  <span className="material-symbols-outlined">{item.iconName}</span>
  <span>{item.label}</span>
</a>
```

### Icon Mapping
Replace Lucide icons with Material Symbols:
```typescript
const sidebarItems = [
  { id: 'overview', label: 'Dashboard', iconName: 'dashboard' },
  { id: 'menu', label: 'Menu Management', iconName: 'restaurant_menu' },
  { id: 'qr', label: 'QR Code Generator', iconName: 'qr_code_2' },
  { id: 'tables', label: 'Tables', iconName: 'table_restaurant' },
  { id: 'ai-import', label: 'AI Import', iconName: 'smart_toy' },
  { id: 'embed', label: 'Embed Code', iconName: 'code' },
  { id: 'subscription', label: 'Subscription', iconName: 'credit_card' },
  { id: 'settings', label: 'Settings', iconName: 'settings' },
];
```

### Main Content Header
**Current:**
```tsx
<div className="p-6">
  <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
</div>
```

**New:**
```tsx
<header className="mb-8">
  <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
  <p className="text-lg text-gray-600 dark:text-gray-400">Welcome back, {restaurant?.name}</p>
</header>
```

### Quick Actions Section
```tsx
<section className="mb-8">
  <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Quick Actions</h2>
  <div className="flex gap-4">
    <button className="flex-1 text-center py-3 rounded-lg bg-primary-green text-black font-bold shadow-sm hover:bg-primary-green/80 transition-colors">
      Manage Menu
    </button>
    <button className="flex-1 text-center py-3 rounded-lg bg-primary-green/20 dark:bg-primary-green/30 text-gray-800 dark:text-white font-bold hover:bg-primary-green/30 dark:hover:bg-primary-green/40 transition-colors">
      View Order History
    </button>
  </div>
</section>
```

### Stats Cards
**Current:**
```tsx
<Card>
  <CardHeader>
    <CardTitle>Total Items</CardTitle>
  </CardHeader>
  <CardContent>
    <p className="text-2xl font-bold">124</p>
  </CardContent>
</Card>
```

**New:**
```tsx
<div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
  <p className="text-gray-600 dark:text-gray-400 mb-2">Total Orders</p>
  <p className="text-4xl font-bold text-gray-900 dark:text-white">245</p>
</div>
```

### Tables Styling
**Current:**
```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
    </TableRow>
  </TableHeader>
</Table>
```

**New:**
```tsx
<div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
  <table className="w-full text-left">
    <thead className="bg-gray-50 dark:bg-gray-700">
      <tr>
        <th className="p-4 font-semibold text-gray-700 dark:text-gray-300">Order ID</th>
        <th className="p-4 font-semibold text-gray-700 dark:text-gray-300">Table</th>
        <th className="p-4 font-semibold text-gray-700 dark:text-gray-300">Total</th>
        <th className="p-4 font-semibold text-gray-700 dark:text-gray-300">Status</th>
      </tr>
    </thead>
    <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
      <tr>
        <td className="p-4 text-gray-800 dark:text-gray-200">#12345</td>
        <td className="p-4 text-gray-600 dark:text-gray-400">Table 7</td>
        <td className="p-4 text-gray-600 dark:text-gray-400">$45.00</td>
        <td className="p-4">
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
            Completed
          </span>
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

### Status Badge Colors
```tsx
// Status badges
const statusColors = {
  completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};
```

### Buttons
**Primary Button:**
```tsx
<button className="py-3 px-6 rounded-lg bg-primary-green text-black font-bold shadow-sm hover:bg-primary-green/80 transition-colors">
  Button Text
</button>
```

**Secondary Button:**
```tsx
<button className="py-3 px-6 rounded-lg bg-primary-green/20 dark:bg-primary-green/30 text-gray-800 dark:text-white font-bold hover:bg-primary-green/30 dark:hover:bg-primary-green/40 transition-colors">
  Button Text
</button>
```

## Key Design Principles

1. **Colors:**
   - Primary: `#38e07b` (green) - Use for primary actions and active states
   - Background Light: `#f6f8f7` 
   - Background Dark: `#122017`
   - Use `bg-primary-green/20` for hover states
   - Use `bg-primary-green/30` for active states in dark mode

2. **Typography:**
   - Use `font-display` (Work Sans) for all text
   - Headers: `text-gray-900 dark:text-white`
   - Body: `text-gray-800 dark:text-gray-200`
   - Muted: `text-gray-600 dark:text-gray-400`

3. **Spacing:**
   - Section margins: `mb-8`
   - Card padding: `p-6`
   - Gap between items: `gap-4` or `gap-6`

4. **Borders:**
   - Cards: `border border-gray-200 dark:border-gray-700`
   - Sidebar: `border-r border-primary-green/20 dark:border-primary-green/30`

5. **Shadows:**
   - Cards: `shadow-md`
   - Buttons: `shadow-sm`

6. **Rounded Corners:**
   - Cards: `rounded-xl`
   - Buttons: `rounded-lg`
   - Avatar: `rounded-full`

## Implementation Checklist

- [ ] Update Dashboard.tsx layout classes
- [ ] Replace Lucide icons with Material Symbols
- [ ] Update sidebar navigation styling
- [ ] Add profile section to sidebar
- [ ] Update main content header
- [ ] Add Quick Actions section
- [ ] Update stats cards styling
- [ ] Update tables styling
- [ ] Update button styles throughout
- [ ] Update status badges
- [ ] Test dark mode
- [ ] Test mobile responsiveness

## Testing
1. Check all dashboard pages (overview, menu, QR, tables, etc.)
2. Verify dark mode toggle works correctly
3. Test mobile sidebar open/close
4. Verify all icons display correctly
5. Check hover states and transitions
6. Ensure restaurant switcher still works

## Notes
- Keep all existing functionality intact
- Only change visual styling, not logic
- Maintain accessibility (ARIA labels, keyboard navigation)
- Test with real restaurant data
