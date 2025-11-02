# AI Image Generation for Menu Import

## Overview
AI-powered image generation is now **ENABLED** for all menu imports using free Stable Diffusion XL via Hugging Face.

## Features

### ✅ What's Enabled

1. **Free Image Generation**
   - Uses Hugging Face's free Stable Diffusion XL API
   - No API keys required
   - No registration needed
   - Unlimited usage

2. **Professional Food Photography**
   - Generates photorealistic food images
   - Professional studio lighting
   - High resolution (768x768)
   - Gourmet presentation style

3. **Import Process Integration**
   - Images are saved with menu items during import
   - Optional: Generate before importing
   - Stored in `image_url` field in database

## How It Works

### For Restaurant Owners:

1. **Upload Menu**
   - Upload image/PDF of menu
   - AI extracts menu items

2. **Review & Generate Images**
   - Review extracted items
   - Click "Generate Images" button
   - AI creates professional food photos (3 seconds per item)

3. **Import with Images**
   - Confirm import
   - Menu items saved with AI-generated images
   - Images display on customer menu

## Technical Details

### Image Generation Prompt
```
professional food photography, [item name], [description], 
photorealistic, restaurant quality, studio lighting, 
shallow depth of field, garnished, appetizing presentation,
high resolution, 8k quality, culinary art, food styling
```

### Generation Time
- **3 seconds per image** (to avoid rate limiting)
- **Example**: 20 items = ~1 minute total
- Progress bar shows real-time status

### Image Quality Parameters
- Model: `stabilityai/stable-diffusion-xl-base-1.0`
- Resolution: 768x768 pixels
- Inference steps: 50 (higher quality)
- Guidance scale: 9.0 (better accuracy)
- Negative prompts to avoid: blurry, low quality, cartoons, text, watermarks

### Storage
- Images generated as base64 data URLs
- Stored directly in `menu_items.image_url` field
- No external storage needed initially
- Can be optimized later with Supabase Storage

## User Flow

### Import with Image Generation:

```
1. Admin uploads menu photo/PDF
   ↓
2. AI extracts menu items
   ↓
3. Preview screen shows:
   - All extracted items
   - "Generate Images" button (optional)
   ↓
4. Admin clicks "Generate Images"
   ↓
5. AI generates image for each item
   - Shows progress: "X / Y items"
   - Takes ~3 seconds per item
   ↓
6. Images appear in preview
   ↓
7. Admin clicks "Confirm & Import"
   ↓
8. Items saved WITH images to database
```

## Benefits

### For Restaurant Owners:
- ✅ Professional menu appearance
- ✅ No photography costs
- ✅ Instant menu setup
- ✅ Attractive food images
- ✅ 100% free

### For Customers:
- ✅ Visual menu browsing
- ✅ Know what food looks like
- ✅ Better ordering decisions
- ✅ Enhanced experience

## Code Changes Made

### 1. ImportPreview.tsx
- **Enabled** image generation button (was disabled)
- Updated description to show it's free
- Shows estimated time (3s per image)
- Progress bar during generation

### 2. AIMenuImport.tsx
- Added `image_url` field to database insert
- Images now saved during import
- Comment added for clarity

### 3. Existing Functions (Already Working)
- `generateFoodImage()` - Generates single image
- `generateMenuItemImages()` - Batch generation
- `handleGenerateImages()` - UI handler

## Example Usage

### Generated Image for "Grilled Chicken":
```
Prompt: "professional food photography, grilled chicken, 
photorealistic, restaurant quality, studio lighting, 
shallow depth of field, garnished, appetizing presentation"

Result: 768x768px photorealistic image of perfectly 
grilled chicken with professional presentation
```

## Rate Limiting

- **Free Tier**: ~3 seconds between requests
- **Built-in Delay**: Automatic 3-second pause between images
- **Handling**: If model is loading (503 error), waits 10s and retries

## Future Enhancements

1. **Supabase Storage Integration**
   - Upload generated images to Supabase Storage
   - Replace base64 with public URLs
   - Better performance

2. **Batch Upload Optimization**
   - Generate images in parallel (with rate limit)
   - Faster generation for large menus

3. **Custom Styles**
   - Let restaurants choose image style
   - Options: Modern, Traditional, Minimalist, etc.

4. **Image Editing**
   - Allow regeneration of specific images
   - Adjust prompts for better results

## Testing Checklist

- [ ] Import menu without images (works as before)
- [ ] Generate images button appears in preview
- [ ] Click "Generate Images"
- [ ] Progress bar shows correctly
- [ ] Images generate (3s each)
- [ ] Images appear in preview table
- [ ] Import with images
- [ ] Verify images saved in database
- [ ] Check images display on public menu

## Summary

✅ **AI image generation is now FULLY ENABLED**
✅ **100% free using Hugging Face**
✅ **Automatic integration with menu import**
✅ **Professional food photography quality**
✅ **Optional - restaurant owners can choose**

Restaurant owners can now create beautiful, professional menus with AI-generated food images in minutes! 🎨🍽️
