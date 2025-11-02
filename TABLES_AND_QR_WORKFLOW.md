# Tables & QR Code Complete Workflow

## ✅ **Step-by-Step Guide**

### **Step 1: Create Tables** 
**Location:** `http://localhost:8080/dashboard/tables`

1. Click **"Tables"** in the sidebar
2. Click **"Add Table"** button
3. Fill in table details:
   - **Table Name** (required): e.g., "Table 1", "Patio Table 5"
   - **Seats** (optional): Number of seats
   - **Location** (optional): e.g., "Main Dining Room", "Patio"
4. Click **"Create"**
5. Repeat for all your tables

**Example Tables:**
```
Table 1 - Main Dining Room - 4 seats
Table 2 - Main Dining Room - 2 seats
Patio Table 1 - Outdoor Patio - 6 seats
VIP Table - Private Room - 8 seats
Bar Seating - Bar Area - 10 seats
```

---

### **Step 2: Generate QR Codes**
**Location:** `http://localhost:8080/dashboard/qr`

1. Click **"QR Codes"** in the sidebar
2. Click **"Generate QR Codes"** tab
3. Choose QR type:

#### **Option A: Single Menu Group QR**
```
Use when: One table = One specific menu
Perfect for: Single-cuisine restaurants or specific sections

Steps:
1. Open "Single Menu Group QR Code" accordion
2. Select Table (e.g., "Table 1")
3. Select Menu Group (e.g., "Chinese")
4. Click "Generate Single Group QR"
5. Add organization info:
   - Custom Name: "Chinese Menu - Table 1"
   - Category: "Table QR"
   - Notes: "Main dining area, near window"
6. Click "Save to Library"
```

#### **Option B: Multiple Menu Groups QR**
```
Use when: Customer chooses from limited options
Perfect for: Events, special menus, limited selections

Steps:
1. Open "Multiple Menu Groups QR Code" accordion
2. Select Table (e.g., "VIP Table")
3. Check multiple groups (e.g., "Chinese" + "Rwandan")
4. Click "Generate Multi-Group QR"
5. Add organization info:
   - Custom Name: "Event Menu - VIP Table"
   - Category: "Event QR"
   - Notes: "Special event, March 15"
6. Click "Save to Library"
```

#### **Option C: Full Restaurant Menu QR**
```
Use when: Customer sees all menu options
Perfect for: General access, main entrance

Steps:
1. Open "Full Restaurant Menu QR Code" accordion
2. Select Table (e.g., "Table 1")
3. Click "Generate Full Menu QR"
4. Add organization info:
   - Custom Name: "Full Menu - Table 1"
   - Category: "Full Menu"
   - Notes: "Main entrance, table 1-10"
5. Click "Save to Library"
```

---

### **Step 3: Manage Your QR Library**
**Location:** `http://localhost:8080/dashboard/qr` → **"QR Library"** tab

#### **Search & Filter:**
```
Search: Type table name, custom name, or menu group
Category Filter: Select category (Table QR, Event QR, etc.)
Type Filter: Select Single/Multi/Full
```

#### **Download QR Codes:**
```
1. Find your QR code in the library
2. Click "Download" button
3. Print at 400x400px resolution
4. Place on table
```

#### **Delete QR Codes:**
```
1. Find QR code to remove
2. Click trash icon
3. Confirm deletion
```

---

## 🎯 **Complete Example Workflow**

### **Scenario: Restaurant with 10 Tables**

#### **Phase 1: Setup Tables**
```
Navigate to: /dashboard/tables

Create:
✅ Table 1 - Main Dining - 4 seats
✅ Table 2 - Main Dining - 4 seats
✅ Table 3 - Main Dining - 2 seats
✅ Table 4 - Window Seat - 2 seats
✅ Table 5 - Window Seat - 4 seats
✅ Patio 1 - Outdoor - 6 seats
✅ Patio 2 - Outdoor - 6 seats
✅ Bar 1 - Bar Area - 10 seats
✅ VIP Room - Private - 8 seats
✅ Counter - Counter Area - 15 seats
```

#### **Phase 2: Generate QR Codes**
```
Navigate to: /dashboard/qr

For Tables 1-5 (Chinese Menu Only):
- Type: Single Group
- Table: Table 1, 2, 3, 4, 5
- Group: Chinese
- Save each with names:
  → "Chinese Menu - Table 1"
  → "Chinese Menu - Table 2"
  → etc.

For Patio Tables (Chinese + Rwandan):
- Type: Multi-Group
- Table: Patio 1, Patio 2
- Groups: Chinese, Rwandan
- Save with names:
  → "Patio Menu - Patio 1"
  → "Patio Menu - Patio 2"

For Bar & Counter (Full Menu):
- Type: Full Menu
- Table: Bar 1, Counter
- Save with names:
  → "Full Menu - Bar"
  → "Full Menu - Counter"
```

#### **Phase 3: Print & Deploy**
```
1. Go to QR Library tab
2. Search "Table" to find all table QRs
3. Download each QR code
4. Print on table tents/cards
5. Place on respective tables
```

---

## 📊 **Organization Tips**

### **Naming Conventions:**
```
Format: [Menu Type] - [Location/Table]

Examples:
✅ "Chinese Menu - Table 1"
✅ "Event Menu - VIP Room"
✅ "Full Menu - Main Entrance"
✅ "Patio Special - Outdoor 1"
```

### **Category Strategy:**
```
Table QR      → Permanent table assignments
Event QR      → Special events/catering
Seasonal QR   → Seasonal menus
Outdoor QR    → Patio/outdoor tables
Takeout QR    → Pickup/takeout stations
```

### **Notes Best Practices:**
```
Include:
- Physical location
- Section/area
- Special instructions
- When to use (if temporary)
- Last updated date

Example:
"Main dining area, window seat section, tables 4-8.
Replace monthly. Last updated: Nov 1, 2025"
```

---

## 🔄 **Maintenance Workflow**

### **Adding New Tables:**
```
1. Dashboard → Tables
2. Click "Add Table"
3. Create new table
4. Dashboard → QR Codes
5. Generate QR for new table
6. Save to library
7. Download and print
```

### **Updating Existing QR:**
```
1. Dashboard → QR Codes
2. QR Library tab
3. Delete old version
4. Generate QR Codes tab
5. Create new version
6. Save with updated info
7. Download and replace
```

### **Seasonal Menu Changes:**
```
1. Update menu groups in Menu Management
2. Generate new QR codes
3. Save with seasonal category
4. Download new versions
5. Replace old QR codes on tables
6. Delete old seasonal QRs from library
```

---

## 🎨 **Visual Workflow**

```
┌─────────────────┐
│  Create Tables  │ → /dashboard/tables
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Generate QRs   │ → /dashboard/qr (Generate tab)
│  - Select Table │
│  - Choose Type  │
│  - Add Details  │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Save to Lib    │ → Click "Save to Library"
│  - Custom Name  │
│  - Category     │
│  - Notes        │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Manage Library │ → /dashboard/qr (Library tab)
│  - Search       │
│  - Filter       │
│  - Download     │
└─────────────────┘
```

---

## ✅ **Quick Reference**

### **Dashboard Navigation:**
```
📊 Overview       → /dashboard/overview
🍽️ Menu          → /dashboard/menu
✨ AI Import     → /dashboard/ai-import
🏢 Tables        → /dashboard/tables      ← NEW!
📱 QR Codes      → /dashboard/qr
💻 Embed         → /dashboard/embed
💳 Subscription  → /dashboard/subscription
⚙️ Settings      → /dashboard/settings
```

### **Key Features:**
```
Table Management:
✅ Create tables with names, seats, locations
✅ Auto-generate slugs for URLs
✅ Edit existing tables
✅ Delete tables (removes associated QRs)

QR Code Generation:
✅ Three QR types (Single/Multi/Full)
✅ Table selection required
✅ Menu group selection
✅ Custom naming
✅ Category assignment
✅ Notes for context

QR Library:
✅ Grid view of all saved QRs
✅ Search by name/table/group
✅ Filter by category/type
✅ Download functionality
✅ Delete from library
✅ Shows all metadata
```

---

## 🚀 **Getting Started Checklist**

- [ ] Create all your tables in Table Management
- [ ] Decide QR strategy for each table
- [ ] Generate QR codes with proper organization
- [ ] Save all QR codes to library with good names
- [ ] Download and print QR codes
- [ ] Place QR codes on tables
- [ ] Test scanning QR codes with phone
- [ ] Update library when menus change

---

## 📞 **Need Help?**

**Common Questions:**

Q: Can I edit a table after creating it?
A: Yes! Click the edit icon next to any table.

Q: What happens if I delete a table?
A: Associated QR codes are also deleted. Create backups first!

Q: Can I have multiple QR codes for one table?
A: Yes! Generate different types for different purposes.

Q: How do I reprint a lost QR code?
A: Go to QR Library, search for it, and download again.

Q: Can I change a QR code's organization details?
A: Delete and regenerate with new details.

---

**Status:** ✅ **FULLY FUNCTIONAL**
**Ready to use!** Start with creating your tables!
