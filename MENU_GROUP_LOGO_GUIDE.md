# 🖼️ MENU GROUP LOGO / PROFILE PICTURE GUIDE

**Feature:** Upload unique logos for each menu group  
**Status:** ✅ Ready to Use

---

## 🎯 **WHAT IT DOES**

### **Set Different Logos for Each Menu Group:**
```
Restaurant: "My Restaurant"
  ↓
Menu Groups:
├─ 🍕 "Rwandan Cuisine" (has its own logo)
├─ 🍝 "International" (has its own logo)
└─ 🍰 "Desserts" (uses restaurant logo)
```

**Each menu group can have its own profile picture/logo!**

---

## ⚡ **HOW TO SET IT UP**

### **Step-by-Step:**

**1. Go to Menu Group Settings:**
```
Dashboard → Your Restaurant → Menu Groups → Select Group → Settings
```

**2. Click "Customization" Tab**

**3. Scroll to "Menu Group Logo / Profile Picture" Section:**
```
┌──────────────────────────────────────────┐
│ 🖼️ Menu Group Logo / Profile Picture    │
│                                          │
│ Logo URL:                                │
│ [https://example.com/your-logo.png]      │
│                                          │
│ Enter the URL of your menu group logo.  │
│ If not set, restaurant's main logo      │
│ will be used.                            │
│                                          │
│ Preview:                                 │
│ [Shows logo if URL is valid]            │
└──────────────────────────────────────────┘
```

**4. Enter Logo URL**

**5. Click "Save Customization"**

**6. Done!** ✅

---

## 📊 **PRIORITY SYSTEM**

### **Which Logo Shows:**
```
Priority 1: Menu Group Logo (if set)
           ↓
Priority 2: Restaurant Logo (fallback)
           ↓
Priority 3: First Letter (if no logos)
```

### **Example:**
```
Menu Group "Rwandan Cuisine":
- Has logo URL: https://example.com/rwandan.png
- Shows: The Rwandan Cuisine logo ✅

Menu Group "Desserts":
- No logo URL set
- Shows: Restaurant's main logo ✅

Restaurant has no logo:
- Shows: "R" (first letter) ✅
```

---

## 🎨 **USE CASES**

### **Use Case 1: Different Cuisines**
```
Restaurant: "Global Fusion"

Menu Groups:
├─ 🍜 "Asian Cuisine"
│  Logo: Dragon icon
│  
├─ 🍝 "Italian Menu"
│  Logo: Italian flag colors
│  
└─ 🌮 "Mexican Food"
   Logo: Sombrero icon
```

### **Use Case 2: Time-Based Menus**
```
Restaurant: "Bistro Café"

Menu Groups:
├─ ☀️ "Breakfast"
│  Logo: Sun icon
│  
├─ 🍽️ "Lunch"
│  Logo: Fork & knife
│  
└─ 🌙 "Dinner"
   Logo: Moon icon
```

### **Use Case 3: Special Events**
```
Restaurant: "Fine Dining"

Menu Groups:
├─ 💍 "Wedding Menu"
│  Logo: Rings icon
│  
├─ 🎄 "Christmas Special"
│  Logo: Christmas tree
│  
└─ 📋 "Regular Menu"
   Logo: Restaurant logo
```

---

## 📷 **HOW TO GET LOGO URLS**

### **Option 1: Use Image Hosting**
```
1. Upload to Imgur (imgur.com)
2. Copy direct link
3. Paste in logo URL field

Example:
https://i.imgur.com/abc123.png
```

### **Option 2: Use Cloud Storage**
```
1. Upload to Google Drive
2. Get shareable link
3. Paste in logo URL field

Example:
https://drive.google.com/uc?id=abc123
```

### **Option 3: Use Supabase Storage**
```
1. Upload to Supabase storage bucket
2. Get public URL
3. Paste in logo URL field

Example:
https://your-project.supabase.co/storage/v1/object/public/logos/menu-logo.png
```

### **Option 4: Use Your Website**
```
1. Upload to your website
2. Get direct URL
3. Paste in logo URL field

Example:
https://yourwebsite.com/images/logo.png
```

---

## ✅ **BEST PRACTICES**

### **Image Specifications:**
```
✅ Format: JPG, PNG, or WebP
✅ Size: 200x200px to 500x500px
✅ Aspect Ratio: 1:1 (square)
✅ File Size: < 500KB
✅ Background: Transparent PNG preferred
```

### **Design Tips:**
```
✅ Simple & clear design
✅ Works at small sizes
✅ Contrasts with background
✅ Represents the menu group
✅ Brand consistent
```

---

## 🎯 **PUBLIC MENU DISPLAY**

### **What Customers See:**
```
┌────────────────────────────┐
│                            │
│    [Menu Group Logo]       │ ← Shows group logo
│      👆 Circular           │
│   Restaurant Name          │
│                            │
│  [Menu Groups Selector]    │
│  [Rwandan] [Italian]       │
│                            │
│     Menu Items...          │
└────────────────────────────┘
```

**Logo changes when switching menu groups!**

---

## 📝 **EXAMPLES**

### **Example 1: Set Logo for "Breakfast Menu"**
```
1. Go to: Menu Group Settings → Breakfast Menu
2. Click: Customization tab
3. Find: Menu Group Logo section
4. Enter: https://i.imgur.com/breakfast-icon.png
5. Save
6. Result: Breakfast menu shows breakfast icon
```

### **Example 2: Multiple Cuisines**
```
Rwandan Cuisine:
URL: https://example.com/rwandan-flag.png

Italian Menu:
URL: https://example.com/italian-flag.png

Asian Fusion:
URL: https://example.com/chopsticks.png

Each group has unique visual identity!
```

---

## 🔧 **CUSTOMIZATION OPTIONS**

### **After Setting Logo URL:**
```
You can also customize:

Logo Styling Section:
├─ Border Width: 4px
├─ Border Color: Brand color
├─ Border Radius: Circle/Square/Rounded
└─ Show/Hide Border
```

**These styling options apply to the logo!**

---

## 🚨 **TROUBLESHOOTING**

### **Issue 1: Logo Not Showing**
```
Problem: Entered URL but logo doesn't appear

Solutions:
✅ Check URL is publicly accessible
✅ Verify image format (JPG/PNG/WebP)
✅ Try opening URL in new browser tab
✅ Make sure URL starts with https://
✅ No authentication required for image
```

### **Issue 2: Logo Looks Bad**
```
Problem: Logo is blurry or pixelated

Solutions:
✅ Use higher resolution image (500x500px)
✅ Make sure aspect ratio is 1:1 (square)
✅ Use PNG with transparent background
✅ Optimize image file size
```

### **Issue 3: Logo Not Updating**
```
Problem: Changed URL but old logo still shows

Solutions:
✅ Clear browser cache (Ctrl+F5)
✅ Wait a few seconds for cache to update
✅ Check you clicked "Save Customization"
✅ Verify new URL in settings
```

---

## 💡 **PRO TIPS**

### **Tip 1: Use Transparent PNGs**
```
✅ Works with any background
✅ Looks professional
✅ No white box around logo
```

### **Tip 2: Test on Mobile**
```
✅ Logo appears circular
✅ Check readability
✅ Test different screen sizes
```

### **Tip 3: Brand Consistency**
```
✅ Use similar style across groups
✅ Same color palette
✅ Consistent icon style
```

### **Tip 4: Fallback is OK**
```
✅ Don't set logo for every group
✅ Some can use restaurant logo
✅ Only set where it adds value
```

---

## 📊 **WORKFLOW**

### **Recommended Process:**

**1. Plan Your Logos:**
```
List menu groups:
- Which need unique logos?
- Which use restaurant logo?
- What icons represent each?
```

**2. Prepare Images:**
```
- Design/find icons
- Resize to 500x500px
- Save as PNG (transparent)
- Upload to hosting
- Get URLs
```

**3. Set Logos:**
```
For each menu group:
- Go to settings
- Enter logo URL
- Preview
- Save
- Test on public menu
```

**4. Test:**
```
- Visit public menu
- Switch between groups
- Check logos change
- Test on mobile
- Verify loading speed
```

---

## ✅ **SUMMARY**

**What You Can Do:**
- ✅ Set unique logo for each menu group
- ✅ Upload from any image hosting
- ✅ Preview before saving
- ✅ Customize logo styling
- ✅ Fallback to restaurant logo

**How It Works:**
1. Enter logo URL in menu group settings
2. Save customization
3. Logo shows on public menu
4. Changes when switching groups

**Benefits:**
- ✅ Visual identity per menu group
- ✅ Better user experience
- ✅ Easy to distinguish menus
- ✅ Professional appearance
- ✅ Flexible & customizable

---

**Now your menu groups can have unique visual identities!** 🎨
