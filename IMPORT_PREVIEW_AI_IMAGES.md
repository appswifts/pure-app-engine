# AI Image Generation in Import Preview

## ✅ Feature Added

The **ImportPreview** component now supports AI image generation for individual menu items!

---

## 🎨 How It Works

### **Visual Experience:**

1. **"No image" placeholder** for items without images
2. **Hover over the placeholder** → Sparkles button appears with dark overlay
3. **Click sparkles button** → AI starts generating
4. **Live generation animation** → Purple gradient with spinning sparkles
5. **Image appears** → Generated image replaces placeholder

---

## 💫 User Flow

```
Import Menu from AI/PDF
    ↓
Review Items in ImportPreview
    ↓
See "No image" placeholder
    ↓
Hover over placeholder
    ↓
Dark overlay with sparkles icon appears
    ↓
Click sparkles button
    ↓
[Purple gradient with animated sparkles - 10-30s]
    ↓
Generated image appears!
    ↓
Continue with import
```

---

## 🎯 Features

### **Hover-to-Generate**
- Clean UI when not interacting
- Sparkles button appears on hover
- Dark overlay (60% opacity) with white sparkles icon
- Clear "Generate AI Image" tooltip

### **Live Generation State**
- Purple-blue gradient background
- Animated spinning sparkles icon
- Pulse animation
- Prevents multiple simultaneous generations

### **Smart Integration**
- Uses same Hugging Face Stable Diffusion v1.5
- Auto-generates prompt: `"delicious {item name}, food photography, professional lighting, high quality, appetizing"`
- Saves as base64 data URL
- Toast notifications for progress

---

## 🛠️ Technical Details

### **State Management:**
```typescript
const [generatingItemImage, setGeneratingItemImage] = useState<{
  categoryIndex: number;
  itemIndex: number;
} | null>(null);
```

### **Function:**
```typescript
handleGenerateSingleItemImage(categoryIndex, itemIndex)
  ↓
Fetch from Hugging Face API
  ↓
Convert blob to base64
  ↓
Update item.image_url
  ↓
Show success toast
```

### **Visual States:**
1. **Default**: Gray "No image" box
2. **Hover**: Dark overlay with sparkles button
3. **Generating**: Purple gradient with spinning sparkles
4. **Complete**: Generated image displayed

---

## 🎨 UI Components

### **Image Cell Structure:**
```jsx
<div className="relative group">
  {/* Image or "No image" placeholder */}
  
  {/* Hover overlay with sparkles button */}
  <button 
    onClick={handleGenerateSingleItemImage}
    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100"
  >
    <Sparkles />
  </button>
</div>
```

### **Loading State:**
```jsx
{isGenerating && (
  <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-blue-100 animate-pulse">
    <Sparkles className="animate-spin text-purple-600" />
  </div>
)}
```

---

## ⚡ Performance

- **Per-item generation**: ~10-30 seconds
- **Prevents multiple simultaneous**: Only one item generates at a time
- **Non-blocking**: Can edit other items while generating
- **Disabled during import**: Button disabled when importing to DB

---

## 🎉 Benefits

✅ **Generate images on-demand** - Only generate what you need
✅ **Visual feedback** - Clear loading states
✅ **Fast workflow** - Hover and click, no dialogs
✅ **Professional results** - Same quality as main generator
✅ **Seamless integration** - Works with existing import flow

---

## 📋 Files Modified

**Updated:**
- `src/components/menu/ImportPreview.tsx`
  - Added `generatingItemImage` state
  - Added `handleGenerateSingleItemImage` function
  - Updated image cell with hover overlay and sparkles button
  - Added loading animation for individual items

---

## 💡 Usage Tips

1. **Hover over "No image"** boxes to reveal generate button
2. **Click sparkles** to start generation
3. **Wait 10-30 seconds** for high-quality result
4. **Generate selectively** - only items you want images for
5. **Use before importing** to ensure all items have images

---

## 🚀 Summary

The ImportPreview now has **live AI image generation** for individual items! Users can:

✅ Hover to reveal generate button
✅ Click to generate single item image
✅ See live generation animation
✅ Get professional food images instantly

**Perfect for filling in missing images before import!** ✨
