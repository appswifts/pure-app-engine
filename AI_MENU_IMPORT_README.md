# AI Menu Import Feature

## Overview

The AI Menu Import feature allows restaurant owners to automatically extract menu items from images using OpenAI's GPT-4 Vision API. This eliminates the need for manual data entry and speeds up the menu setup process significantly.

## Features

- ✨ **AI-Powered Extraction**: Uses GPT-4 Vision to read menu images and extract items
- 📸 **Image Support**: Accepts JPG, JPEG, PNG, and WebP formats
- ✏️ **Editable Preview**: Review and edit extracted data before importing
- 📊 **Category Auto-Detection**: Automatically detects menu categories
- 💰 **Price Extraction**: Intelligently extracts prices in various formats
- 🔄 **Batch Import**: Import multiple items and categories at once
- 💾 **Import History**: Track all AI import operations

## Prerequisites

### 1. Install Dependencies

```bash
npm install
```

The following packages are required (already added to package.json):
- `openai@^4.75.0` - OpenAI API client
- `pdf-parse@^1.1.1` - PDF processing (for future support)

### 2. Set Up Database

Run the migration to create the `ai_imports` table:

```bash
# Using Supabase CLI
supabase db push

# Or manually run the SQL file
# Located at: supabase/migrations/create_ai_imports_table.sql
```

### 3. Get OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy your API key (starts with `sk-`)
5. Keep it secure - you'll enter it in the application

**Cost Estimate**: ~$0.03 USD per image processed

## How to Use

### Step 1: Access the AI Import Page

Navigate to `/ai-menu-import` or add a link in your dashboard:

```typescript
// Add to your dashboard navigation
<Link to="/ai-menu-import">
  <Sparkles className="w-4 h-4 mr-2" />
  AI Menu Import
</Link>
```

### Step 2: Configure Settings

1. **Select Restaurant**: Choose which restaurant to import menu items to
2. **Select Category (Optional)**: 
   - Leave empty to auto-create categories from the image
   - Or select existing category to import all items there
3. **Enter OpenAI API Key**: 
   - Enter your API key (saved securely in localStorage)
   - Only needed once - it's remembered for future imports

### Step 3: Upload Menu Image

1. **Drag and drop** or **click to browse** for your menu image
2. **File Requirements**:
   - Format: JPG, JPEG, PNG, or WebP
   - Max size: 10MB
   - Clear, readable text
   - Good lighting, minimal glare

**Tips for Best Results**:
- Use high-quality images
- Ensure text is readable and not blurry
- Include complete menu sections
- Avoid images with heavy shadows or glare

### Step 4: Extract Data

1. Click **"Extract Menu Data"**
2. AI processes the image (takes 10-30 seconds)
3. Progress bar shows extraction status

### Step 5: Review & Edit

The AI will extract:
- **Categories**: e.g., "Starters", "Main Dishes", "Drinks"
- **Item Names**: Full menu item names
- **Descriptions**: Item descriptions (if visible)
- **Prices**: Automatically parsed and cleaned

**You can**:
- ✏️ Edit item names, descriptions, or prices
- 🗑️ Delete incorrect or unwanted items
- 📝 Rename categories
- ❌ Remove entire categories

### Step 6: Import

1. Review the summary showing total items found
2. Click **"Confirm & Import"**
3. Items are added to your restaurant menu
4. Success notification shows number of items imported

## Code Integration

### Add Route to Your App

```typescript
// In your App.tsx or router configuration
import AIMenuImport from './pages/AIMenuImport';

<Route path="/ai-menu-import" element={<AIMenuImport />} />
```

### Use Components Standalone

You can use individual components in your own pages:

```typescript
import { AIMenuUploader } from '@/components/menu/AIMenuUploader';
import { ImportPreview } from '@/components/menu/ImportPreview';
import { 
  initializeOpenAI, 
  extractMenuFromImage, 
  fileToBase64 
} from '@/lib/services/ai-menu-import';

// Initialize OpenAI
initializeOpenAI('your-api-key');

// Extract from file
const base64 = await fileToBase64(file);
const data = await extractMenuFromImage(base64, file.type);

// Show preview
<ImportPreview 
  extractedData={data} 
  onConfirm={handleImport}
/>
```

## API Reference

### `initializeOpenAI(apiKey: string)`

Initialize the OpenAI client with your API key.

```typescript
initializeOpenAI('sk-your-api-key');
```

### `extractMenuFromImage(base64: string, mimeType: string)`

Extract menu data from a base64-encoded image.

**Returns**: `Promise<ExtractedMenuData>`

```typescript
const data = await extractMenuFromImage(base64Image, 'image/jpeg');
```

### `fileToBase64(file: File)`

Convert a File object to base64 string.

```typescript
const base64 = await fileToBase64(file);
```

### `validateExtractedData(data: ExtractedMenuData)`

Validate extracted menu data and return any errors.

```typescript
const errors = validateExtractedData(data);
if (errors.length > 0) {
  console.warn('Validation issues:', errors);
}
```

## Data Structure

### ExtractedMenuData

```typescript
interface ExtractedMenuData {
  restaurant_name?: string;
  categories: ExtractedCategory[];
  raw_text?: string;
}

interface ExtractedCategory {
  name: string;
  description?: string;
  items: ExtractedMenuItem[];
}

interface ExtractedMenuItem {
  name: string;
  description?: string;
  price: number;
  category?: string;
  image_url?: string;
}
```

## Database Schema

### ai_imports Table

```sql
CREATE TABLE ai_imports (
  id UUID PRIMARY KEY,
  restaurant_id UUID NOT NULL,
  category_id UUID,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  status TEXT NOT NULL, -- 'processing', 'completed', 'failed'
  extracted_data JSONB,
  error_message TEXT,
  items_imported INTEGER,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  completed_at TIMESTAMP
);
```

## Troubleshooting

### Issue: "OpenAI client not initialized"

**Solution**: Make sure to call `initializeOpenAI()` before using any AI functions.

### Issue: "Invalid JSON response from AI"

**Solution**: 
- The AI couldn't parse the image properly
- Try a clearer, higher-quality image
- Ensure the menu text is readable

### Issue: "Failed to extract menu data"

**Solutions**:
- Check your OpenAI API key is valid
- Ensure you have credits in your OpenAI account
- Verify the image format is supported
- Check image size is under 10MB

### Issue: Incorrect prices extracted

**Solution**: 
- Review and edit prices in the preview step
- Ensure prices are clearly visible in the image
- AI tries to handle various currency formats

### Issue: Missing items

**Solution**:
- The image might have poor quality
- Some items might be in shadows or glare
- Try uploading multiple images for different menu sections

## Cost Management

**OpenAI GPT-4 Vision Pricing** (as of 2024):
- ~$0.03 per high-detail image
- ~$0.01 per low-detail image

**Tips to Reduce Costs**:
1. Combine multiple menu sections in one image when possible
2. Use high-quality but compressed images
3. Review the estimated cost before processing
4. Edit extracted data instead of re-processing

## Security

- ✅ API keys stored in localStorage (client-side only)
- ✅ Row Level Security (RLS) enabled on ai_imports table
- ✅ Users can only access their own import history
- ✅ File uploads validated for type and size
- ⚠️ Consider moving API calls to server-side for production

## Future Enhancements

- [ ] PDF support (multi-page documents)
- [ ] Bulk image upload (process multiple images at once)
- [ ] Image optimization before sending to API
- [ ] Server-side API key management
- [ ] Import history view with re-import capability
- [ ] Export extracted data to CSV/JSON
- [ ] Multi-language menu support
- [ ] Item image extraction from menu photos

## Support

For issues or questions:
1. Check this documentation
2. Review the TypeScript types for API details
3. Check browser console for detailed error messages
4. Ensure your OpenAI account has available credits

## License

Part of MenuForest Restaurant QR Ordering System
