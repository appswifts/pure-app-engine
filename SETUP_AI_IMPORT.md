# 🚀 Quick Setup Guide - AI Menu Import

## ✅ What's Been Implemented

All components are ready! Here's what was created:

### 📁 Files Created

1. **Backend/Database**
   - `supabase/migrations/create_ai_imports_table.sql` - Database schema
   - `src/integrations/supabase/types.ts` - TypeScript types (updated)

2. **Services**
   - `src/lib/services/ai-menu-import.ts` - OpenAI integration service

3. **Components**
   - `src/components/menu/AIMenuUploader.tsx` - File upload component
   - `src/components/menu/ImportPreview.tsx` - Data review component

4. **Pages**
   - `src/pages/AIMenuImport.tsx` - Complete AI import page

5. **Documentation**
   - `AI_MENU_IMPORT_README.md` - Full documentation
   - `SETUP_AI_IMPORT.md` - This file

### 📦 Dependencies Added

```json
{
  "openai": "^4.75.0",
  "pdf-parse": "^1.1.1"
}
```

## 🔧 Setup Steps

### Step 1: Install Dependencies

```bash
npm install
```

This will install the OpenAI SDK and other required packages.

### Step 2: Run Database Migration

You need to create the `ai_imports` table in Supabase.

**Option A: Using Supabase Dashboard**
1. Go to your Supabase project dashboard
2. Navigate to "SQL Editor"
3. Copy the contents of `supabase/migrations/create_ai_imports_table.sql`
4. Paste and run the SQL

**Option B: Using Supabase CLI**
```bash
supabase db push
```

### Step 3: Add Route to Your App

Find your router configuration (usually `App.tsx` or similar) and add:

```typescript
import AIMenuImport from './pages/AIMenuImport';

// In your Routes
<Route path="/ai-menu-import" element={<AIMenuImport />} />
```

### Step 4: Add Navigation Link (Optional)

Add a link in your dashboard sidebar:

```typescript
import { Sparkles } from 'lucide-react';

<Link to="/ai-menu-import" className="nav-link">
  <Sparkles className="w-4 h-4 mr-2" />
  AI Menu Import
</Link>
```

### Step 5: Get Your OpenAI API Key

1. Visit https://platform.openai.com/api-keys
2. Sign in (or create account)
3. Click "Create new secret key"
4. Copy the key (starts with `sk-`)
5. **Keep it secure!**

You'll enter this in the app when you first use the AI import feature.

## 🎯 How to Use

1. Navigate to `/ai-menu-import`
2. Select your restaurant
3. (Optional) Select a category or leave empty to auto-create
4. Enter your OpenAI API key
5. Upload a menu image
6. Click "Extract Menu Data"
7. Review and edit the extracted items
8. Click "Confirm & Import"
9. Done! ✨

## 💰 Cost Information

- **Cost per image**: ~$0.03 USD
- **Model used**: GPT-4 Vision (high detail)
- **Processing time**: 10-30 seconds per image

## 📝 Image Requirements

- **Formats**: JPG, JPEG, PNG, WebP
- **Max size**: 10MB
- **Quality**: Clear, readable text
- **Lighting**: Good lighting, minimal glare

## ⚠️ Important Notes

### Security
- API key is stored in browser localStorage (client-side)
- For production, consider server-side API key management
- Never commit API keys to version control

### Database
- Make sure to run the migration before using the feature
- Row Level Security (RLS) is enabled automatically
- Users can only see their own imports

### Testing
Before going live, test with:
1. A sample menu image
2. Various image qualities
3. Different menu formats
4. Multiple categories

## 🐛 Troubleshooting

### "OpenAI client not initialized"
- Make sure you entered the API key in the setup step

### "Failed to extract menu data"
- Check your API key is valid
- Ensure you have credits in OpenAI account
- Verify image is clear and readable

### Database errors
- Confirm migration was run successfully
- Check RLS policies are in place
- Verify user is authenticated

### Import not working
- Check browser console for errors
- Verify restaurant is selected
- Ensure categories exist or can be created

## 📚 Full Documentation

See `AI_MENU_IMPORT_README.md` for:
- Complete API reference
- Advanced usage examples
- Data structure details
- Security best practices
- Future enhancements

## ✨ Next Steps

After setup, you can:
1. Test the import with sample menus
2. Add analytics tracking
3. Implement server-side API calls
4. Add PDF support
5. Create import history view
6. Enable bulk image processing

## 🤝 Need Help?

If you encounter issues:
1. Check the documentation
2. Review browser console logs
3. Verify all setup steps were completed
4. Check OpenAI account status

## 🎉 You're Ready!

Everything is set up and ready to use. Share your OpenAI API key when you first access the page, and start importing menus with AI! 🚀
