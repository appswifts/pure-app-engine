# AI Image Generation Setup Guide

## 🎨 Overview
The menu management system now includes **AI-powered image generation** using Stable Diffusion v1.5 from Hugging Face. Generate professional food images on-demand!

---

## 🚀 Quick Setup

### 1. Get Your Hugging Face API Key

1. Go to [Hugging Face](https://huggingface.co/)
2. Create a free account or log in
3. Navigate to [Settings → Access Tokens](https://huggingface.co/settings/tokens)
4. Click **"New token"**
5. Give it a name (e.g., "Menu Image Generator")
6. Select **Read** role
7. Click **Generate token**
8. **Copy the token** (you won't see it again!)

### 2. Add API Key to Your Project

1. Copy `.env.example` to `.env` if you haven't already:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` file and add your API key:
   ```env
   VITE_HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxxxxxxx
   ```

3. **Restart your dev server**:
   ```bash
   npm run dev
   ```

---

## 🎯 How to Use

### In Menu Item Dialog:

1. **Open Add/Edit Item dialog**
2. **Click "Generate with AI"** button next to the Image URL field
3. **AI Generator Panel appears** with:
   - Pre-filled prompt based on item name
   - "Generate Image" button
   - Tips for better results

4. **Customize the prompt** (optional):
   - Default: `"delicious [item name], food photography, professional lighting, high quality"`
   - Add more details for better results

5. **Click "Generate Image"**:
   - Shows animated loading state
   - "Creating your image... This may take 10-30 seconds"
   - Live generation progress

6. **Preview & Use**:
   - Generated image appears in preview
   - Click "Use This Image" to apply it
   - Or click regenerate icon to try again

7. **Save** the item with the AI-generated image!

---

## 🎨 AI Model Information

### **Stable Diffusion v1.5**
- **Model:** `runwayml/stable-diffusion-v1-5`
- **Provider:** Hugging Face Inference API
- **Speed:** 10-30 seconds per image
- **Quality:** High-quality, realistic food images
- **Cost:** FREE (Hugging Face's free tier)

### Why This Model?

✅ **Best for food photography**
✅ **Fast generation** (~20 seconds)
✅ **Consistent quality**
✅ **Free to use**
✅ **No setup beyond API key**

### Alternative Models (if you want to experiment):

You can change the model in `AIImageGenerator.tsx`:

```typescript
// Current model (recommended):
"https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5"

// Alternative options:
// SDXL (slower but better quality):
"https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0"

// Food-specific model:
"https://api-inference.huggingface.co/models/nousr/robo-diffusion-food"
```

---

## 💡 Tips for Better Images

### **Prompt Engineering Tips:**

1. **Be Specific**:
   - ❌ "chicken"
   - ✅ "grilled chicken breast with vegetables, professional food photography"

2. **Include Style Keywords**:
   - "food photography"
   - "professional lighting"
   - "high quality"
   - "appetizing"
   - "detailed"
   - "restaurant style"

3. **Mention Presentation**:
   - "plated beautifully"
   - "garnished"
   - "on a white plate"
   - "rustic wooden table"

4. **Add Lighting**:
   - "natural light"
   - "soft lighting"
   - "studio lighting"

### **Example Prompts:**

```
✅ Good Prompts:

"delicious grilled chicken with roasted vegetables, food photography, professional lighting, appetizing, high quality"

"fresh caesar salad with crispy croutons, professional food photography, restaurant style, natural light"

"chocolate lava cake with vanilla ice cream, dessert photography, studio lighting, appetizing, detailed"

"traditional Rwandan buffet with various dishes, colorful, food photography, high quality"
```

---

## 🔧 Features

### **Live Generation Preview**
- Animated loading state during generation
- Progress indicator
- Estimated time display (10-30 seconds)

### **Image Preview**
- Real-time preview of generated image
- Full-size display in dialog
- Option to regenerate if not satisfied

### **Smart Integration**
- Auto-fills prompt with item name
- Saves as base64 data URL
- Works with existing image URL field
- Can switch between AI and manual URL

### **User-Friendly UI**
- Beautiful gradient background
- Clear instructions
- Helpful tips section
- Sparkles icon for AI features
- One-click apply

---

## 🐛 Troubleshooting

### **"Hugging Face API key not configured"**
- Make sure you added the API key to `.env` file
- Restart your dev server
- Check that the variable name is exactly `VITE_HUGGINGFACE_API_KEY`

### **"Failed to generate image"**
- Check your internet connection
- Verify your API key is valid
- Hugging Face might be rate limiting (wait a minute and try again)
- Model might be loading (try again in a few seconds)

### **Generation is slow**
- Normal! AI generation takes 10-30 seconds
- First generation may be slower as model loads
- Subsequent generations are faster

### **Image quality not good**
- Improve your prompt with more details
- Add style keywords like "professional", "high quality"
- Try regenerating with a different prompt
- Consider using the SDXL model for better quality (slower)

---

## 📊 Technical Details

### **How It Works:**

1. **User clicks "Generate with AI"**
2. **Component sends request** to Hugging Face API:
   ```typescript
   POST https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5
   Body: { inputs: "your prompt", options: { wait_for_model: true } }
   ```
3. **Hugging Face processes** with Stable Diffusion
4. **Returns image blob** (binary data)
5. **Convert to base64** for storage
6. **Display preview** and apply to form

### **Storage:**

- Images stored as base64 data URLs in `menu_items.image_url`
- Can be stored directly in database
- Alternative: Upload to storage service (future enhancement)

### **API Limits:**

- **Free tier:** ~1000 requests/month
- **Rate limit:** ~100 requests/day
- **Generation time:** 10-30 seconds per image

---

## 🚀 Future Enhancements

Possible improvements:

- [ ] Upload to cloud storage (S3, Cloudinary)
- [ ] Multiple image variations
- [ ] Style presets (photography, illustration, minimalist)
- [ ] Batch generation for multiple items
- [ ] Image editing (crop, filters)
- [ ] Save favorite prompts
- [ ] Image history/gallery

---

## 📝 Component Files

### **New Files Created:**

1. **`src/components/menu/AIImageGenerator.tsx`**
   - Main AI generator component
   - Handles API calls
   - Shows live preview
   - Manages generation state

2. **Modified Files:**
   - `src/pages/MenuGroupManagement.tsx` - Integrated generator
   - `.env.example` - Added API key config

---

## 🎉 Summary

You now have **AI-powered image generation** in your menu management! Users can:

✅ Generate professional food images in seconds
✅ Customize prompts for better results
✅ See live generation progress
✅ Preview before applying
✅ Regenerate if not satisfied

**All powered by Stable Diffusion v1.5 and Hugging Face!** 🚀
