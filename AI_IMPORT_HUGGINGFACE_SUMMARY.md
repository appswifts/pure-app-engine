# AI Menu Import - Hugging Face Implementation

## ✅ Completed Features

### 1. **Navigation Fixed**
- Added `'ai-import': '/dashboard/ai-import'` to urlMap in Dashboard.tsx
- Added `'ai-import'` check to getActiveTabFromPath function
- AI Import sidebar item is now fully clickable and navigable

### 2. **PDF Support Added**
- Installed `pdfjs-dist` library for browser-based PDF parsing
- Implemented `extractTextFromPDF()` function using PDF.js
- Updated `extractMenuFromPDF()` to handle PDF text extraction
- Added PDF support to file type validation
- Updated AIMenuUploader UI to show PDF icon for uploaded PDFs
- Modified AIMenuImport page to handle both images and PDFs

### 3. **Enhanced Hugging Face Integration**

#### **OCR Text Extraction**
- Uses **OCR.space free API** (no API key required)
- Extracts text from images with high accuracy
- Supports JPG, PNG, WEBP, and PDF formats

#### **Intelligent Menu Parsing**
The system now includes advanced text parsing with:

**Category Detection:**
- All uppercase text (e.g., "MAIN DISHES")
- Lines with category keywords (appetizer, main, dessert, drinks, etc.)
- Lines ending with colon (e.g., "Beverages:")
- Followed by items with prices

**Menu Item Detection:**
- Detects various price formats:
  - `$10`, `10.99`, `10,000`, `Frw 5000`, `5000 RWF`
- Extracts item name before price
- Extracts description after price
- Handles multi-line descriptions
- Cleans up formatting (removes dots, dashes, bullets)

**Smart Validation:**
- Validates item names (must be > 1 character)
- Validates prices (must be > 0)
- Skips invalid or empty entries
- Groups items by detected categories

#### **AI Image Generation**
- Uses **Stable Diffusion XL Base 1.0** from Hugging Face
- Generates professional food photography
- Features:
  - High-quality 512x512 images
  - Restaurant menu style
  - Studio lighting effects
  - Automatic retry on model loading (503 errors)
  - 3-second delay between requests (rate limiting)
  - Progress tracking for batch generation

**Prompt Template:**
```
professional food photography, {item_name}, {description}, high quality, appetizing, restaurant menu style, well lit, white plate, studio lighting, 8k, food styling
```

**Negative Prompt:**
```
blurry, low quality, unappetizing, messy, dark, ugly, distorted, text, watermark
```

## 📋 Supported File Types

### Images
- `.jpg` / `.jpeg`
- `.png`
- `.webp`

### Documents
- `.pdf` (text extraction)

## 🎯 How It Works

### Step 1: Upload
1. User selects restaurant and menu group
2. User uploads menu image or PDF
3. System validates file type and size (max 10MB)

### Step 2: Extract
1. **For Images:**
   - Convert to base64
   - Send to OCR.space API
   - Extract text with high accuracy
   
2. **For PDFs:**
   - Load PDF using PDF.js
   - Extract text from all pages
   - Combine text for parsing

### Step 3: Parse
1. Analyze extracted text line by line
2. Detect categories using keywords and formatting
3. Detect menu items with prices using regex patterns
4. Group items under detected categories
5. Extract descriptions and clean formatting

### Step 4: Review
1. Display extracted data in editable table
2. User can edit names, descriptions, prices
3. User can delete unwanted items
4. User can generate AI images for items
5. Progress bar shows image generation status

### Step 5: Import
1. Create categories in database
2. Insert menu items with details
3. Upload generated images (if any)
4. Record import history

## 🔧 Configuration

### No API Keys Required!
The system uses completely **FREE** services:

1. **OCR.space API** - Free tier with embedded API key
2. **Hugging Face Inference API** - Free tier (rate limited)

### Rate Limits
- **OCR extraction:** Reasonable free tier limits
- **Image generation:** 3-second delay between requests

## 📝 Example Parsing

### Input Text:
```
MAIN DISHES

Brochette 5000 RWF Traditional grilled meat skewers
Isombe 3000 Cassava leaves with peanut sauce
Pizza Margherita $15.99 Classic tomato and mozzarella

BEVERAGES

Primus Beer 2000 Local Rwandan beer
Fresh Juice 1500 Seasonal fruit juice
```

### Parsed Output:
```json
{
  "categories": [
    {
      "name": "MAIN DISHES",
      "items": [
        {
          "name": "Brochette",
          "description": "Traditional grilled meat skewers",
          "price": 5000
        },
        {
          "name": "Isombe",
          "description": "Cassava leaves with peanut sauce",
          "price": 3000
        },
        {
          "name": "Pizza Margherita",
          "description": "Classic tomato and mozzarella",
          "price": 15.99
        }
      ]
    },
    {
      "name": "BEVERAGES",
      "items": [
        {
          "name": "Primus Beer",
          "description": "Local Rwandan beer",
          "price": 2000
        },
        {
          "name": "Fresh Juice",
          "description": "Seasonal fruit juice",
          "price": 1500
        }
      ]
    }
  ]
}
```

## 🚀 Usage Instructions

1. **Navigate to AI Import**
   - Click "AI Menu Import" in Dashboard sidebar
   - Sparkles icon ✨ indicates AI feature

2. **Select Restaurant & Provider**
   - Choose your restaurant
   - Provider: "Hugging Face (Free)" is default
   - Click "Continue to Upload"

3. **Upload Menu**
   - Drag & drop or click to select file
   - Supports images (JPG, PNG, WEBP) and PDFs
   - Max size: 10MB

4. **Extract Data**
   - Click "Process File"
   - Wait for OCR extraction (10-30 seconds)
   - System will parse text and detect items

5. **Review & Edit**
   - Check extracted items in table
   - Edit names, descriptions, prices as needed
   - Delete unwanted items
   - Optionally generate AI images (takes ~3 seconds per item)

6. **Import**
   - Click "Import to Menu"
   - Items will be added to your restaurant menu
   - Success notification will show total imported

## 🐛 Known Limitations

1. **OCR Accuracy:**
   - Depends on image quality
   - Handwritten menus may not work well
   - Complex layouts may need manual review

2. **Text Parsing:**
   - May miss items without clear price indicators
   - Multi-column layouts may parse incorrectly
   - Non-standard formats may need manual editing

3. **Image Generation:**
   - Rate limited (3 seconds per image)
   - May take 5-10 minutes for large menus
   - Model loading time (first request may take 10-30 seconds)
   - Free tier may have daily limits

4. **PDF Support:**
   - Only extracts text (not images from PDF)
   - Requires text-based PDFs (not scanned images)
   - Complex PDF layouts may need manual review

## 📦 Dependencies

```json
{
  "openai": "^4.75.0",        // For future paid option
  "pdf-parse": "^1.1.1",       // Server-side fallback
  "pdfjs-dist": "latest"       // Browser PDF parsing
}
```

## 🔍 Debugging

Enable console logging to see:
- Extracted text from OCR
- Parsed menu structure
- Image generation progress
- Error messages

Open browser console (F12) during import process.

## 🎉 Benefits

✅ **100% Free** - No API keys required  
✅ **Fast** - OCR in seconds  
✅ **Smart** - Intelligent parsing  
✅ **Flexible** - Supports images & PDFs  
✅ **Visual** - AI-generated food images  
✅ **Editable** - Full control over imported data  
✅ **Trackable** - Import history saved  

## 🔮 Future Enhancements

- [ ] Multi-language OCR support
- [ ] Handwriting recognition
- [ ] Batch upload (multiple files)
- [ ] Image extraction from PDFs
- [ ] Custom parsing rules
- [ ] Menu template recognition
- [ ] Auto-categorization suggestions
