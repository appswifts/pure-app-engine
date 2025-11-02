# QR Code System - Visual Diagrams

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    ADMIN DASHBOARD                          │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │         MenuQRGenerator Component                    │   │
│  │                                                      │   │
│  │  ┌──────────────────────────────────────────────┐   │   │
│  │  │  📱 Single Group QR                         │   │   │
│  │  │  Select: "Breakfast Menu"                   │   │   │
│  │  │  → Generate URL: /menu/cafe?group=uuid1     │   │   │
│  │  └──────────────────────────────────────────────┘   │   │
│  │                                                      │   │
│  │  ┌──────────────────────────────────────────────┐   │   │
│  │  │  📱 Multi-Group QR                          │   │   │
│  │  │  Select: ["Appetizers", "Mains", "Drinks"] │   │   │
│  │  │  → /menu/cafe?groups=u1,u2,u3&mode=select  │   │   │
│  │  └──────────────────────────────────────────────┘   │   │
│  │                                                      │   │
│  │  ┌──────────────────────────────────────────────┐   │   │
│  │  │  📱 Full Menu QR                            │   │   │
│  │  │  No config needed                           │   │   │
│  │  │  → Generate URL: /menu/cafe?mode=full       │   │   │
│  │  └──────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ↓ (Admin downloads & prints QR codes)
                              │
┌─────────────────────────────────────────────────────────────┐
│                    CUSTOMER SIDE                            │
│                                                             │
│  Customer scans QR code with smartphone                    │
│                                                             │
│        ┌─────────────┬─────────────┬─────────────┐         │
│        │             │             │             │         │
│        ↓             ↓             ↓             ↓         │
│   Single QR     Multi QR       Full QR      Table QR      │
│   group=uuid    groups=...     mode=full    /:table       │
│        │             │             │             │         │
│        ↓             ↓             ↓             ↓         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │PublicMenu│  │GroupSelect│ │PublicMenu│  │PublicMenu│  │
│  │(direct) │  │(choose)  │  │(all)     │  │(default) │  │
│  └──────────┘  └────┬─────┘  └──────────┘  └──────────┘  │
│                     │                                      │
│                     ↓ (customer selects group)            │
│                ┌──────────┐                               │
│                │PublicMenu│                               │
│                │(selected)│                               │
│                └──────────┘                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                    QR GENERATION FLOW                         │
└──────────────────────────────────────────────────────────────┘

Admin Opens MenuQRGenerator
         │
         ↓
    Load Menu Groups
    from Supabase
         │
         ↓
    Display Accordion
    with 3 QR Types
         │
         ├─→ Single: Select 1 group → Build URL → Generate QR
         │
         ├─→ Multi: Select N groups → Build URL → Generate QR
         │
         └─→ Full: No selection → Build URL → Generate QR
              │
              ↓
         QR Code Image
         (400x400 PNG)
              │
              ↓
         Download Button
              │
              ↓
         Print & Deploy


┌──────────────────────────────────────────────────────────────┐
│                    CUSTOMER FLOW                              │
└──────────────────────────────────────────────────────────────┘

Customer Scans QR
         │
         ↓
    Parse URL Parameters
    (mode, group, groups)
         │
         ├─→ Has "groups" param?
         │   YES → MenuGroupSelect Page
         │          │
         │          ↓
         │      Display Group Cards
         │          │
         │          ↓
         │      Customer Clicks Group
         │          │
         │          └─→ Navigate to PublicMenu
         │               with group param
         │
         └─→ Direct to PublicMenu
             │
             ↓
        Determine Display Mode:
        - mode=full → Show all items
        - group=uuid → Show single group
        - default → Show with selector
             │
             ↓
        Load Restaurant Data
             │
             ↓
        Load Menu Groups
             │
             ↓
        Load Categories
             │
             ↓
        Load Menu Items
             │
             ↓
        Filter Items by Mode
             │
             ↓
        Display Menu
        (Hide/Show selector based on mode)
             │
             ↓
        Customer Browses & Orders
```

---

## 🎨 UI Component Hierarchy

```
MenuQRGenerator (Admin)
│
├─ Accordion
│  │
│  ├─ AccordionItem: "Single Group"
│  │  ├─ Description Card
│  │  ├─ Group Selector Dropdown
│  │  ├─ Generate Button
│  │  └─ QR Display + Download
│  │
│  ├─ AccordionItem: "Multi Group"
│  │  ├─ Description Card
│  │  ├─ Checkbox Grid (Groups)
│  │  ├─ Generate Button
│  │  └─ QR Display + Download
│  │
│  └─ AccordionItem: "Full Menu"
│     ├─ Description Card
│     ├─ Generate Button
│     └─ QR Display + Download
│
└─ Info Card (Print Tips)


MenuGroupSelect (Public Pre-selection)
│
├─ Restaurant Header
│  ├─ Logo
│  └─ Name
│
├─ Title: "Choose Your Menu"
│
└─ Group Cards Grid
   ├─ Card: Group 1
   │  ├─ Name
   │  ├─ Description
   │  └─ → Click navigates
   │
   ├─ Card: Group 2
   └─ Card: Group 3


PublicMenu (Public Display)
│
├─ Restaurant Header
│  ├─ Logo
│  └─ Name
│
├─ Menu Group Selector (Conditional)
│  └─ Only shown if:
│     - displayMode === 'default'
│     - menuGroups.length > 1
│
├─ Category Navigation
│  └─ Horizontal scroll tabs
│
├─ Search Bar (Toggle)
│
├─ Menu Items Grid
│  └─ Filtered by:
│     - Display mode
│     - Selected category
│     - Search query
│
└─ Cart + WhatsApp Button
```

---

## 🗺️ URL Routing Map

```
/menu/:restaurantSlug
│
├─ Has tableSlug? NO
│  │
│  ├─ Has "groups" param?
│  │  YES → MenuGroupSelect
│  │         (Pre-selection page)
│  │
│  └─ NO → Redirect to default
│           (or show error)
│
└─ Has tableSlug? YES
   └─ PublicMenu
      │
      ├─ mode=full → Full display
      ├─ group=uuid → Single group
      └─ (default) → Standard mode


Examples:
─────────────────────────────────────────────────────
/menu/cafe/table-1
→ PublicMenu (default mode, with table)

/menu/cafe/table-1?group=breakfast-uuid
→ PublicMenu (single mode, no selector)

/menu/cafe?groups=uuid1,uuid2&mode=select
→ MenuGroupSelect (pre-selection)

/menu/cafe/table-1?mode=full
→ PublicMenu (full mode, all groups)
```

---

## 📊 State Flow Diagram

```
MenuQRGenerator State
┌─────────────────────────────────────┐
│ selectedGroupId: string             │
│ selectedGroupIds: string[]          │
│ qrCodes: {                          │
│   single: QRCodeData | null        │
│   multi: QRCodeData | null         │
│   full: QRCodeData | null          │
│ }                                   │
│ generating: string | null           │
└─────────────────────────────────────┘
        │
        ↓ (User selects & generates)
        │
┌─────────────────────────────────────┐
│ QRCodeData                          │
│ ├─ type: 'single'|'multi'|'full'   │
│ ├─ url: string                      │
│ ├─ dataUrl: string (base64)        │
│ └─ name: string                     │
└─────────────────────────────────────┘


PublicMenu State
┌─────────────────────────────────────┐
│ displayMode: string                 │
│   'single'  → One group only        │
│   'full'    → All groups            │
│   'default' → Standard with tabs    │
│                                     │
│ selectedMenuGroup: string | null    │
│ menuGroups: MenuGroup[]             │
│ categories: Category[]              │
│ menuItems: MenuItem[]               │
│ filteredItems: MenuItem[]           │
└─────────────────────────────────────┘
        │
        ↓ (Based on URL params)
        │
┌─────────────────────────────────────┐
│ UI Rendering                        │
│ ├─ Show/Hide Group Selector        │
│ ├─ Filter Items                     │
│ └─ Display Menu                     │
└─────────────────────────────────────┘
```

---

## 🔀 Decision Tree

```
Customer Scans QR Code
         │
         ↓
    Parse URL
         │
         ├─ Has "groups" param?
         │  YES → 
         │    │
         │    ↓
         │  MenuGroupSelect
         │    │
         │    ├─ Display N groups
         │    │
         │    └─ User clicks group
         │         │
         │         └─→ Navigate to PublicMenu
         │              with ?group=selected
         │
         └─ NO →
            │
            ↓
         PublicMenu
            │
            ├─ mode=full?
            │  YES → Show all groups, hide selector
            │
            ├─ group=uuid?
            │  YES → Show single group, hide selector
            │
            └─ Neither?
               → Default mode
                 │
                 ├─ Multiple groups?
                 │  YES → Show selector
                 │
                 └─ Single group?
                    → Show that group, no selector
```

---

## 📱 Mobile vs Desktop Layout

```
DESKTOP (≥768px)
┌────────────────────────────────────────┐
│  Restaurant Logo + Name                │
├────────────────────────────────────────┤
│  [Group 1] [Group 2] [Group 3]  [🔍]  │ ← Horizontal tabs
├────────────────────────────────────────┤
│  [All] [Appetizers] [Mains] [Drinks]  │ ← Category tabs
├────────────────────────────────────────┤
│  ┌────────┐  ┌────────┐  ┌────────┐  │
│  │ Item 1 │  │ Item 2 │  │ Item 3 │  │ ← Grid layout
│  └────────┘  └────────┘  └────────┘  │
│  ┌────────┐  ┌────────┐  ┌────────┐  │
│  │ Item 4 │  │ Item 5 │  │ Item 6 │  │
│  └────────┘  └────────┘  └────────┘  │
└────────────────────────────────────────┘


MOBILE (<768px)
┌──────────────────────┐
│ Restaurant Logo      │
│ Name                 │
├──────────────────────┤
│ ← [Group] [Group] → │ ← Scroll
├──────────────────────┤
│ ← [Cat] [Cat] [🔍] →│ ← Scroll
├──────────────────────┤
│ ┌──────────────────┐ │
│ │    Item 1        │ │ ← Stack
│ └──────────────────┘ │
│ ┌──────────────────┐ │
│ │    Item 2        │ │
│ └──────────────────┘ │
│ ┌──────────────────┐ │
│ │    Item 3        │ │
│ └──────────────────┘ │
└──────────────────────┘
```

---

## 🎯 Feature Comparison Matrix

```
┌──────────────────┬─────────┬─────────┬─────────┬──────────┐
│ Feature          │ Single  │ Multi   │ Full    │ Table    │
│                  │ QR      │ QR      │ QR      │ QR       │
├──────────────────┼─────────┼─────────┼─────────┼──────────┤
│ Pre-selection    │   ❌    │   ✅    │   ❌    │   ❌     │
│ Group Selector   │   ❌    │   ❌    │   ❌    │   ✅*    │
│ Show All Items   │   ❌    │   ❌    │   ✅    │   ❌     │
│ Filter by Group  │   ✅    │   ✅    │   ❌    │   ✅     │
│ Configuration    │  Easy   │ Medium  │  None   │ Per Table│
│ Use Case         │Specific │ Events  │ General │ Dine-in  │
│ Flexibility      │  Low    │  High   │  Low    │ Medium   │
│ Customer Choice  │  None   │  Some   │  All    │  Some*   │
└──────────────────┴─────────┴─────────┴─────────┴──────────┘

* Only if multiple groups exist
```

---

## 🔄 Integration Points

```
MenuQRGenerator
       ↓
   Supabase
   ┌─────────────────────┐
   │ menu_groups table   │
   │ - id                │
   │ - name              │
   │ - restaurant_id     │
   │ - is_active         │
   └─────────────────────┘
       ↓
   QR Code Library
   (qrcode package)
       ↓
   Base64 Image
       ↓
   Download
       ↓
   Print


Customer Scan
       ↓
   URL Router
   (React Router)
       ↓
   MenuGroupSelect OR PublicMenu
       ↓
   Supabase
   ┌─────────────────────┐
   │ restaurants         │
   │ menu_groups         │
   │ categories          │
   │ menu_items          │
   └─────────────────────┘
       ↓
   Rendered Menu
       ↓
   Cart System
       ↓
   WhatsApp Order
```

---

## 🎨 Color Coding

```
🟢 Green  = Completed & Working
🟡 Yellow = In Progress
🔵 Blue   = Core Feature
🟣 Purple = Enhancement
⚪ White  = Future Feature

Current Status:
🟢 MenuQRGenerator Component
🟢 MenuGroupSelect Page
🟢 PublicMenu URL Support
🟢 Conditional Selector
🟢 All 3 QR Types
🟢 Documentation
⚪ Analytics Tracking
⚪ QR Styling Options
⚪ Bulk Generation
```

---

## 📐 Print Layout Guide

```
┌─────────────────────────────────────┐
│        Restaurant Name               │
│                                      │
│      ┌───────────────────┐          │
│      │                   │          │
│      │                   │          │
│      │    QR CODE        │          │  2" x 2" minimum
│      │    (400x400px)    │          │  3" x 3" recommended
│      │                   │          │
│      │                   │          │
│      └───────────────────┘          │
│                                      │
│        "Scan for Menu"               │
│     (Breakfast Menu | Full Menu)    │
└─────────────────────────────────────┘

Margins: 0.25" all sides
Paper: White matte cardstock
Finish: Optional lamination
Placement: Table tent, menu insert, poster
```

---

**Visual Summary Complete!** ✅ 
All diagrams show the complete QR code system architecture, flows, and integrations.
