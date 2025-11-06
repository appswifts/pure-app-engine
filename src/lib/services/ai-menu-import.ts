import OpenAI from 'openai';
import * as pdfjsLib from 'pdfjs-dist';
import { supabase } from '@/integrations/supabase/client';

// Set up PDF.js worker using the installed version
// This ensures the worker version matches the library version
if (typeof window !== 'undefined') {
  // Use jsdelivr CDN which is more reliable
  // Version 5.x uses .mjs, older versions use .js
  const majorVersion = parseInt(pdfjsLib.version.split('.')[0]);
  const extension = majorVersion >= 4 ? 'mjs' : 'js';
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.${extension}`;
}

// AI Provider types
export type AIProvider = 'openai' | 'huggingface';

// Supported file types
export type SupportedFileType = 'image' | 'pdf' | 'excel' | 'csv';

/**
 * Detect file type from MIME type
 */
export const detectFileType = (file: File): SupportedFileType => {
  const mimeType = file.type.toLowerCase();
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  
  // Images
  if (mimeType.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(extension)) {
    return 'image';
  }
  
  // PDF
  if (mimeType === 'application/pdf' || extension === 'pdf') {
    return 'pdf';
  }
  
  // Excel
  if (mimeType.includes('spreadsheet') || 
      ['xlsx', 'xls', 'xlsm'].includes(extension)) {
    return 'excel';
  }
  
  // CSV
  if (mimeType === 'text/csv' || extension === 'csv') {
    return 'csv';
  }
  
  // Default to image for unknown types
  return 'image';
};

// Types for extracted menu data
export interface ExtractedMenuItem {
  name: string;
  description?: string;
  price: number;
  category?: string;
  image_url?: string;
}

export interface ExtractedCategory {
  name: string;
  description?: string;
  items: ExtractedMenuItem[];
}

export interface ExtractedMenuData {
  restaurant_name?: string;
  categories: ExtractedCategory[];
  raw_text?: string;
  detected_categories?: string[]; // Categories detected from document
}

// Initialize AI clients
let openaiClient: OpenAI | null = null;
let huggingfaceApiKey: string | null = null;
let currentProvider: AIProvider = 'huggingface'; // Default to free option

export const initializeOpenAI = (apiKey: string) => {
  openaiClient = new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true, // For client-side usage - consider moving to server-side
  });
  currentProvider = 'openai';
};

export const initializeHuggingFace = (apiKey: string) => {
  huggingfaceApiKey = apiKey;
  currentProvider = 'huggingface';
};

export const getOpenAIClient = (): OpenAI => {
  if (!openaiClient) {
    throw new Error('OpenAI client not initialized. Call initializeOpenAI first.');
  }
  return openaiClient;
};

export const getCurrentProvider = (): AIProvider => {
  return currentProvider;
};

export const setProvider = (provider: AIProvider) => {
  currentProvider = provider;
};

/**
 * Convert file to base64 for OpenAI Vision API
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix to get pure base64
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Convert base64 to Blob for API requests
 */
const base64ToBlob = (base64: string, mimeType: string): Blob => {
  const byteCharacters = atob(base64);
  const byteArrays = [];
  
  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    const byteNumbers = new Array(slice.length);
    
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }
  
  return new Blob(byteArrays, { type: mimeType });
};

/**
 * Extract text using OCR.space free API
 */
const extractTextWithOCRSpace = async (
  base64Image: string,
  mimeType: string
): Promise<string> => {
  try {
    const formData = new FormData();
    const blob = base64ToBlob(base64Image, mimeType);
    formData.append('base64Image', `data:${mimeType};base64,${base64Image}`);
    formData.append('language', 'eng');
    formData.append('isOverlayRequired', 'false');
    formData.append('detectOrientation', 'true');
    formData.append('scale', 'true');
    formData.append('OCREngine', '2'); // Use OCR Engine 2 for better accuracy

    const response = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      headers: {
        'apikey': 'K87899142388957', // Free tier API key
      },
      body: formData,
    });

    const result = await response.json();
    
    if (result.IsErroredOnProcessing) {
      throw new Error(result.ErrorMessage?.[0] || 'OCR processing failed');
    }

    const extractedText = result.ParsedResults?.[0]?.ParsedText || '';
    return extractedText;
  } catch (error: any) {
    console.error('OCR.space error:', error);
    throw new Error('Failed to extract text from image');
  }
};

/**
 * Extract menu data using advanced AI vision models via edge function
 */
const extractMenuFromImageAdvanced = async (
  base64Image: string,
  mimeType: string,
  existingCategories: { id: string; name: string }[] = []
): Promise<ExtractedMenuData> => {
  try {
    console.log('Starting advanced AI menu extraction...');
    
    const { data, error } = await supabase.functions.invoke('ai-menu-extract-advanced', {
      body: {
        image: `data:${mimeType};base64,${base64Image}`,
        fileType: mimeType,
        model: 'google/gemini-2.5-flash', // Fast and accurate vision model
        existingCategories: existingCategories,
      }
    });

    if (error) {
      console.error('Edge function error:', error);
      throw new Error(error.message || 'AI extraction failed');
    }

    if (!data || !data.categories) {
      throw new Error('Invalid response from AI extraction service');
    }

    console.log('AI extraction successful:', data);
    return data as ExtractedMenuData;
  } catch (error: any) {
    console.error('Advanced AI extraction error:', error);
    // Fallback to legacy OCR method
    console.log('Falling back to legacy OCR method...');
    return extractMenuFromImageLegacy(base64Image, mimeType);
  }
};

/**
 * Legacy OCR extraction (fallback method)
 */
const extractMenuFromImageLegacy = async (
  base64Image: string,
  mimeType: string
): Promise<ExtractedMenuData> => {
  try {
    console.log('Starting legacy OCR extraction...');
    const extractedText = await extractTextWithOCRSpace(base64Image, mimeType);
    console.log('Extracted Text:', extractedText);

    let parsedData = parseTextToMenuStructure(extractedText);
    parsedData = postProcessExtractedData(parsedData);
    
    const extractedData: ExtractedMenuData = {
      restaurant_name: undefined,
      categories: parsedData.categories || [],
      raw_text: extractedText,
    };

    if (extractedData.categories.length === 0 || extractedData.categories[0].items.length === 0) {
      console.warn('No menu items detected with legacy OCR');
      extractedData.categories = [{
        name: 'Menu Items',
        description: 'Please review and edit these items',
        items: [{
          name: 'Review Required',
          description: 'No items were automatically detected',
          price: 0,
          category: 'Menu Items',
        }],
      }];
    }

    return extractedData;
  } catch (error: any) {
    console.error('Legacy extraction error:', error);
    throw new Error(error.message || 'Failed to extract menu data');
  }
};

/**
 * Detect currency from text
 */
const detectCurrency = (text: string): string => {
  const currencyPatterns = [
    { pattern: /(?:RWF|Frw|francs?\s*rwandais?)/i, currency: 'RWF' },
    { pattern: /(?:USD|\$|dollars?)/i, currency: 'USD' },
    { pattern: /(?:EUR|€|euros?)/i, currency: 'EUR' },
    { pattern: /(?:GBP|£|pounds?)/i, currency: 'GBP' },
    { pattern: /(?:KES|KSh|shillings?)/i, currency: 'KES' },
    { pattern: /(?:TZS|TSh)/i, currency: 'TZS' },
    { pattern: /(?:UGX)/i, currency: 'UGX' },
  ];

  for (const { pattern, currency } of currencyPatterns) {
    if (pattern.test(text)) {
      console.log('Detected currency:', currency);
      return currency;
    }
  }

  // Default to RWF for Rwanda
  return 'RWF';
};

/**
 * Normalize price based on currency
 */
const normalizePrice = (price: number, currency: string): number => {
  // For currencies with large denominations (RWF, UGX, TZS), keep as is
  // For currencies with decimal precision (USD, EUR, GBP), keep decimals
  
  if (['RWF', 'UGX', 'TZS', 'KES'].includes(currency)) {
    // These currencies typically don't use decimals
    return Math.round(price);
  }
  
  // For USD, EUR, GBP - keep 2 decimal places
  return Math.round(price * 100) / 100;
};

/**
 * Parse plain text into menu structure with intelligent detection
 */
const parseTextToMenuStructure = (text: string): any => {
  const lines = text.split('\n').filter(line => line.trim());
  const categories: any[] = [];
  let currentCategory: any = null;

  // Common category keywords (case-insensitive)
  const categoryKeywords = [
    'appetizer', 'starter', 'entree', 'main', 'dish', 'side', 'dessert',
    'beverage', 'drink', 'coffee', 'tea', 'juice', 'smoothie', 'cocktail',
    'salad', 'soup', 'pizza', 'pasta', 'burger', 'sandwich', 'grill',
    'seafood', 'vegetarian', 'vegan', 'breakfast', 'lunch', 'dinner',
    'special', 'combo', 'meal', 'plat', 'menu', 'category', 'food', 'snack',
    'hot', 'cold', 'fresh', 'fried', 'grilled', 'baked', 'steamed',
    'african', 'rwandan', 'chinese', 'indian', 'italian', 'american'
  ];

  // Noise words to filter out (common unwanted text)
  const noisePatterns = [
    /^page \d+$/i,
    /^\d+$/,  // Just numbers
    /^[^a-zA-Z0-9]+$/,  // Just special characters
    /www\./i,
    /http/i,
    /email/i,
    /phone/i,
    /address/i,
    /copyright/i,
    /©/,
    /®/,
    /™/,
    /tax/i,
    /vat/i,
    /service charge/i,
    /terms and conditions/i,
    /^menu$/i,  // Just the word "menu" alone
    /all rights reserved/i,
  ];

  // Currency detection
  const detectedCurrency = detectCurrency(text);
  
  // Price patterns: matches various formats
  // "$10", "10.99", "10,000", "Frw 5000", "5000 RWF"
  const pricePattern = /(?:[$€£¥₹₽Frw\s])?([\d,]+\.?\d*)\s*(?:RWF|USD|EUR|GBP|Frw|rwf|francs?)?/i;

  lines.forEach((line, index) => {
    line = line.trim();
    if (!line) return;

    // Filter out noise/unwanted content
    const isNoise = noisePatterns.some(pattern => pattern.test(line));
    if (isNoise) {
      console.log('Filtering out noise:', line);
      return;
    }

    // Skip very short lines (likely page numbers or artifacts)
    if (line.length < 2) return;

    const lowerLine = line.toLowerCase();
    const nextLine = lines[index + 1]?.trim() || '';

    // Detect category headers
    const hasPrice = pricePattern.test(line);
    const hasCategoryKeyword = categoryKeywords.some(kw => lowerLine.includes(kw));
    const isAllCaps = line === line.toUpperCase() && line.length > 2 && line.length < 50;
    const nextLineHasPrice = pricePattern.test(nextLine);
    const endsWithColon = line.endsWith(':');
    
    // Skip if it's a header/footer artifact
    const isHeaderFooter = /^(page|total|subtotal|grand total)/i.test(line);
    if (isHeaderFooter && !hasPrice) return;

    // Category detection logic
    if (!hasPrice && (isAllCaps || hasCategoryKeyword || endsWithColon) && (nextLineHasPrice || !nextLine || index === 0)) {
      // Save previous category
      if (currentCategory && currentCategory.items.length > 0) {
        categories.push(currentCategory);
      }
      
      // Create new category
      currentCategory = {
        name: line.replace(/[:\-_]/g, '').trim(),
        description: null,
        items: [],
      };
      return;
    }

    // Detect menu items with prices
    const priceMatch = line.match(pricePattern);
    
    if (priceMatch) {
      if (!currentCategory) {
        currentCategory = {
          name: 'Main Menu',
          description: null,
          items: [],
        };
      }

      // Extract and normalize price
      let priceStr = priceMatch[1].replace(/,/g, '');
      let price = parseFloat(priceStr);
      
      // Normalize based on detected currency
      price = normalizePrice(price, detectedCurrency);

      // Extract item name (everything before the price)
      const priceIndex = line.indexOf(priceMatch[0]);
      let itemName = line.substring(0, priceIndex).trim();
      
      // Extract description (everything after the price)
      let description = line.substring(priceIndex + priceMatch[0].length).trim();

      // Clean up item name (remove dots, dashes, etc.)
      itemName = itemName.replace(/[\.\-_]+$/g, '').replace(/^[\-•*]\s*/, '').trim();
      
      // If description is too short or looks like currency, ignore it
      if (description.length < 5 || /^[A-Z]{3}$/i.test(description)) {
        description = '';
      }

      // Validate item before adding
      const isValidItem = itemName && 
                         itemName.length > 2 && 
                         itemName.length < 100 &&
                         price > 0 && 
                         price < 1000000 &&  // Reasonable price limit
                         !/^[\d\s.,]+$/.test(itemName);  // Not just numbers

      if (isValidItem) {
        // Additional cleaning
        itemName = itemName
          .replace(/^\d+\.?\s*/, '')  // Remove leading numbers
          .replace(/\s+/g, ' ')  // Normalize spaces
          .trim();

        // Skip if name is too generic or noise
        const genericNames = ['item', 'food', 'dish', 'option', 'choice', 'n/a', 'tbd'];
        const isGeneric = genericNames.some(generic => 
          itemName.toLowerCase() === generic
        );

        if (!isGeneric) {
          currentCategory.items.push({
            name: itemName,
            description: description || null,
            price: price,
            category: currentCategory.name,
          });
        }
      }
    }
    // Check if this might be a description for the previous item
    else if (currentCategory && currentCategory.items.length > 0) {
      const lastItem = currentCategory.items[currentCategory.items.length - 1];
      // If the line doesn't look like a category and is descriptive
      if (!isAllCaps && line.length > 10 && !hasCategoryKeyword && !endsWithColon) {
        lastItem.description = (lastItem.description || '') + ' ' + line;
        lastItem.description = lastItem.description.trim();
      }
    }
  });

  // Push final category
  if (currentCategory && currentCategory.items.length > 0) {
    categories.push(currentCategory);
  }

  return {
    categories: categories.length > 0 ? categories : [{
      name: 'Extracted Items',
      description: null,
      items: [{ name: 'No items found', description: 'Please review the extracted text', price: 0 }],
    }],
    detectedCurrency,
  };
};

/**
 * Post-process extracted data to improve quality
 */
const postProcessExtractedData = (data: any): any => {
  // Remove duplicate items within same category
  data.categories = data.categories.map((category: any) => {
    const uniqueItems = new Map();
    
    category.items.forEach((item: any) => {
      const key = item.name.toLowerCase().trim();
      
      // Keep the item with description if duplicate
      if (!uniqueItems.has(key) || (item.description && !uniqueItems.get(key).description)) {
        uniqueItems.set(key, item);
      }
    });
    
    return {
      ...category,
      items: Array.from(uniqueItems.values()),
    };
  });
  
  // Remove empty categories
  data.categories = data.categories.filter((cat: any) => 
    cat.items && cat.items.length > 0 && cat.items[0].name !== 'No items found'
  );
  
  // Sort categories by item count (most items first)
  data.categories.sort((a: any, b: any) => b.items.length - a.items.length);
  
  // Capitalize category names properly
  data.categories = data.categories.map((cat: any) => ({
    ...cat,
    name: cat.name
      .split(' ')
      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' '),
  }));
  
  return data;
};

/**
 * Extract menu data from image using GPT-4 Vision
 */
const extractMenuFromImageOpenAI = async (
  base64Image: string,
  mimeType: string
): Promise<ExtractedMenuData> => {
  const client = getOpenAIClient();

  const prompt = `You are a restaurant menu data extraction expert. Analyze this menu image and extract ALL menu items with their details.

IMPORTANT: Return ONLY valid JSON, no markdown, no code blocks, no explanation.

Extract the following information:
1. All menu categories (e.g., Starters, Main Dishes, Drinks, Desserts)
2. For each item: name, description (if available), price
3. Group items by their categories

Return in this exact JSON structure:
{
  "restaurant_name": "Name if visible",
  "categories": [
    {
      "name": "Category Name",
      "description": "Category description if any",
      "items": [
        {
          "name": "Item Name",
          "description": "Item description",
          "price": 5000
        }
      ]
    }
  ]
}

Price extraction rules:
- Extract numeric value only (e.g., "5,000 RWF" → 5000)
- Remove commas, currency symbols, and spaces
- If price range, use the lower price
- If no price found, use 0

Be thorough and extract ALL items visible in the image.`;

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4-vision-preview',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt,
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
                detail: 'high', // Use high detail for better accuracy
              },
            },
          ],
        },
      ],
      max_tokens: 4096,
      temperature: 0.1, // Low temperature for consistency
    });

    const content = response.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    // Parse the JSON response
    let jsonData;
    try {
      // Try to extract JSON if wrapped in markdown code blocks
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/);
      const jsonString = jsonMatch ? jsonMatch[1] : content;
      jsonData = JSON.parse(jsonString.trim());
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', content);
      throw new Error('Invalid JSON response from AI. Please try again.');
    }

    // Validate and clean the data
    const extractedData: ExtractedMenuData = {
      restaurant_name: jsonData.restaurant_name || undefined,
      categories: (jsonData.categories || []).map((cat: any) => ({
        name: cat.name || 'Uncategorized',
        description: cat.description || undefined,
        items: (cat.items || []).map((item: any) => ({
          name: item.name || 'Unknown Item',
          description: item.description || undefined,
          price: parseFloat(String(item.price || 0).replace(/[^0-9.]/g, '')) || 0,
          category: cat.name,
        })),
      })),
      raw_text: content,
    };

    return extractedData;
  } catch (error: any) {
    console.error('OpenAI API Error:', error);
    throw new Error(error.message || 'Failed to extract menu data from image');
  }
};

/**
 * Extract menu data from image using the best available method
 */
export const extractMenuFromImage = async (
  base64Image: string,
  mimeType: string,
  existingCategories: { id: string; name: string }[] = []
): Promise<ExtractedMenuData> => {
  // Always try advanced AI first (uses Lovable AI)
  return extractMenuFromImageAdvanced(base64Image, mimeType, existingCategories);
};

/**
 * Extract text from PDF using PDF.js with better organization
 */
const extractTextFromPDF = async (file: File): Promise<string> => {
  try {
    console.log('Loading PDF file...');
    const arrayBuffer = await file.arrayBuffer();
    
    // Load PDF with error handling
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    console.log(`PDF loaded: ${pdf.numPages} pages`);
    let fullText = '';
    
    // Extract text from each page with spatial organization
    for (let i = 1; i <= pdf.numPages; i++) {
      console.log(`Extracting text from page ${i}/${pdf.numPages}...`);
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      // Group text items by line based on Y position
      const lines: { y: number; items: any[] }[] = [];
      
      textContent.items.forEach((item: any) => {
        if (!item.str || !item.str.trim()) return;
        
        const y = item.transform[5]; // Y position
        const x = item.transform[4]; // X position
        
        // Find or create line at this Y position
        let line = lines.find(l => Math.abs(l.y - y) < 5); // 5px tolerance
        
        if (!line) {
          line = { y, items: [] };
          lines.push(line);
        }
        
        line.items.push({ x, text: item.str });
      });
      
      // Sort lines by Y position (top to bottom)
      lines.sort((a, b) => b.y - a.y);
      
      // Sort items within each line by X position (left to right)
      lines.forEach(line => {
        line.items.sort((a, b) => a.x - b.x);
      });
      
      // Reconstruct text with proper line breaks and spacing
      const pageText = lines
        .map(line => {
          // Sort items by X position
          const sortedItems = line.items.sort((a, b) => a.x - b.x);
          
          // Join with intelligent spacing
          let lineText = '';
          for (let j = 0; j < sortedItems.length; j++) {
            const item = sortedItems[j];
            const nextItem = sortedItems[j + 1];
            
            lineText += item.text;
            
            // Add spacing based on distance to next item
            if (nextItem) {
              const gap = nextItem.x - (item.x + item.text.length * 5); // Estimate width
              
              // Large gap = tab/column separator
              if (gap > 50) {
                lineText += '    '; // Multiple spaces for columns
              } else if (gap > 10) {
                lineText += ' ';
              }
              // Small gap = might be part of same word, no space
            }
          }
          
          return lineText.trim();
        })
        .filter(line => line.length > 0)
        .join('\n');
      
      if (pageText.trim()) {
        fullText += pageText + '\n\n'; // Double newline between pages
        console.log(`Page ${i} extracted (${lines.length} lines): ${pageText.substring(0, 100)}...`);
      } else {
        console.warn(`Page ${i} has no text (might be an image)`);
      }
    }
    
    console.log(`Total text extracted: ${fullText.length} characters`);
    return fullText.trim();
  } catch (error: any) {
    console.error('PDF text extraction error:', error);
    
    // Provide helpful error message
    if (error.message?.includes('Invalid PDF')) {
      throw new Error('Invalid PDF file. Please ensure the file is not corrupted.');
    }
    
    throw new Error('Failed to extract text from PDF. The file might be corrupted or password-protected.');
  }
};

/**
 * Extract menu data from PDF using AI vision
 */
export const extractMenuFromPDF = async (
  file: File,
  existingCategories: { id: string; name: string }[] = []
): Promise<ExtractedMenuData> => {
  try {
    console.log('Starting PDF extraction with AI...');
    
    // Extract text from PDF
    const extractedText = await extractTextFromPDF(file);
    
    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error('No text found in PDF. The PDF might be image-based or empty.');
    }
    
    // Try AI-powered extraction first
    try {
      console.log('Using AI to parse PDF text...');
      const base64 = await fileToBase64(file);
      return await extractMenuFromImageAdvanced(base64, 'application/pdf', existingCategories);
    } catch (aiError) {
      console.warn('AI extraction failed, falling back to text parsing:', aiError);
      
      // Fallback to text parsing
      let parsedData = parseTextToMenuStructure(extractedText);
      parsedData = postProcessExtractedData(parsedData);
      
      const extractedData: ExtractedMenuData = {
        restaurant_name: undefined,
        categories: parsedData.categories || [],
        raw_text: extractedText,
      };
      
      if (extractedData.categories.length === 0 || extractedData.categories[0].items.length === 0) {
        extractedData.categories = [{
          name: 'Menu Items',
          description: 'Please review and edit these items',
          items: [{
            name: 'Review Required',
            description: 'No items were automatically detected from the PDF',
            price: 0,
            category: 'Menu Items',
          }],
        }];
      }
      
      return extractedData;
    }
  } catch (error: any) {
    console.error('PDF extraction error:', error);
    throw new Error(error.message || 'Failed to extract menu data from PDF');
  }
};

/**
 * Validate extracted menu data
 */
export const validateExtractedData = (data: ExtractedMenuData): string[] => {
  const errors: string[] = [];

  if (!data.categories || data.categories.length === 0) {
    errors.push('No categories found in the extracted data');
  }

  data.categories.forEach((category, catIndex) => {
    if (!category.name) {
      errors.push(`Category ${catIndex + 1} is missing a name`);
    }

    if (!category.items || category.items.length === 0) {
      errors.push(`Category "${category.name}" has no items`);
    }

    category.items.forEach((item, itemIndex) => {
      if (!item.name) {
        errors.push(`Item ${itemIndex + 1} in category "${category.name}" is missing a name`);
      }

      if (item.price === undefined || item.price < 0) {
        errors.push(`Item "${item.name}" has an invalid price`);
      }
    });
  });

  return errors;
};

/**
 * Get supported file types
 */
export const getSupportedFileTypes = () => {
  return {
    images: ['.jpg', '.jpeg', '.png', '.webp'],
    pdfs: ['.pdf'],
  };
};

/**
 * Check if file type is supported
 */
export const isSupportedFileType = (file: File): boolean => {
  const supportedTypes = getSupportedFileTypes();
  const allSupported = [
    ...supportedTypes.images.map(ext => `image/${ext.slice(1)}`),
    'application/pdf',
  ];

  // Also check file extension
  const extension = `.${file.name.split('.').pop()?.toLowerCase()}`;
  const isImageExtension = supportedTypes.images.includes(extension);
  const isPDFExtension = extension === '.pdf';
  
  return allSupported.includes(file.type) || isImageExtension || isPDFExtension;
};

/**
 * Generate food image using Hugging Face Stable Diffusion XL
 */
export const generateFoodImage = async (
  itemName: string,
  description?: string
): Promise<string> => {
  try {
    // Create highly detailed prompt for realistic food photography
    const basePrompt = itemName.toLowerCase();
    const descPrompt = description ? description.toLowerCase() : '';
    
    // Build professional food photography prompt
    const prompt = [
      'professional food photography',
      basePrompt,
      descPrompt,
      'photorealistic',
      'restaurant quality',
      'studio lighting',
      'shallow depth of field',
      'garnished',
      'appetizing presentation',
      'high resolution',
      '8k quality',
      'culinary art',
      'food styling',
      'gourmet presentation'
    ].filter(Boolean).join(', ');
    
    console.log('Generating image with prompt:', prompt);
    
    // Call Supabase Edge Function to avoid CORS issues
    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
    const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error('Supabase configuration not found');
      return '';
    }
    
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/generate-food-image`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ prompt }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('Image generation failed:', response.status, errorData);
      
      // If model is loading, wait and retry once
      if (response.status === 503) {
        console.log('Model is loading, waiting 10 seconds...');
        await new Promise(resolve => setTimeout(resolve, 10000));
        return generateFoodImage(itemName, description);
      }
      
      throw new Error(`Image generation failed: ${errorData.error || response.status}`);
    }

    // Response contains the base64 image URL
    const data = await response.json();
    
    if (!data.imageUrl) {
      throw new Error('No image URL in response');
    }
    
    console.log('Image generated successfully for:', itemName);
    return data.imageUrl;
  } catch (error: any) {
    console.error('Image generation error for', itemName, ':', error);
    // Return empty string to skip this image
    return '';
  }
};

/**
 * Generate images for multiple menu items in batch
 */
export const generateMenuItemImages = async (
  items: ExtractedMenuItem[],
  onProgress?: (current: number, total: number) => void
): Promise<Map<string, string>> => {
  const imageMap = new Map<string, string>();
  
  console.log(`Starting image generation for ${items.length} items...`);
  
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    
    // Update progress
    if (onProgress) {
      onProgress(i + 1, items.length);
    }
    
    try {
      console.log(`Generating image ${i + 1}/${items.length}: ${item.name}`);
      const imageUrl = await generateFoodImage(item.name, item.description || undefined);
      
      if (imageUrl) {
        imageMap.set(item.name, imageUrl);
        console.log(`✓ Image generated for: ${item.name}`);
      } else {
        console.warn(`✗ No image generated for: ${item.name}`);
      }
      
      // Add delay to avoid rate limiting (Hugging Face free tier)
      // Wait 3 seconds between requests
      if (i < items.length - 1) {
        console.log('Waiting 3 seconds before next request...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    } catch (error) {
      console.warn(`✗ Failed to generate image for ${item.name}:`, error);
      // Continue with other items
    }
  }
  
  console.log(`Image generation complete. Generated ${imageMap.size}/${items.length} images.`);
  return imageMap;
};

/**
 * Smart category matching - finds best match from existing categories
 * Uses fuzzy matching and similarity scoring
 */
export const matchCategory = (
  detectedCategory: string,
  existingCategories: { id: string; name: string }[]
): { match: { id: string; name: string } | null; similarity: number; shouldCreate: boolean } => {
  if (!existingCategories || existingCategories.length === 0) {
    return { match: null, similarity: 0, shouldCreate: true };
  }

  const normalize = (str: string) => 
    str.toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, ' ');

  const normalizedDetected = normalize(detectedCategory);
  let bestMatch: { id: string; name: string } | null = null;
  let highestSimilarity = 0;

  for (const existing of existingCategories) {
    const normalizedExisting = normalize(existing.name);
    
    // Exact match
    if (normalizedDetected === normalizedExisting) {
      return { match: existing, similarity: 1, shouldCreate: false };
    }

    // Contains check
    if (normalizedDetected.includes(normalizedExisting) || 
        normalizedExisting.includes(normalizedDetected)) {
      const similarity = Math.max(
        normalizedDetected.length / normalizedExisting.length,
        normalizedExisting.length / normalizedDetected.length
      ) * 0.9; // 90% similarity for contains
      
      if (similarity > highestSimilarity) {
        highestSimilarity = similarity;
        bestMatch = existing;
      }
    }

    // Word overlap similarity
    const detectedWords = normalizedDetected.split(' ');
    const existingWords = normalizedExisting.split(' ');
    const commonWords = detectedWords.filter(w => existingWords.includes(w));
    const wordSimilarity = (commonWords.length * 2) / (detectedWords.length + existingWords.length);
    
    if (wordSimilarity > highestSimilarity) {
      highestSimilarity = wordSimilarity;
      bestMatch = existing;
    }
  }

  // Use threshold of 0.7 (70% similarity) to auto-match
  const shouldCreate = highestSimilarity < 0.7;
  
  return {
    match: shouldCreate ? null : bestMatch,
    similarity: highestSimilarity,
    shouldCreate
  };
};

/**
 * Parse CSV file content
 */
export const parseCSV = async (file: File): Promise<ExtractedMenuData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length === 0) {
          reject(new Error('CSV file is empty'));
          return;
        }

        // Parse header
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        
        // Find column indices
        const nameIdx = headers.findIndex(h => h.includes('name') || h.includes('item'));
        const priceIdx = headers.findIndex(h => h.includes('price') || h.includes('cost'));
        const categoryIdx = headers.findIndex(h => h.includes('category') || h.includes('type'));
        const descIdx = headers.findIndex(h => h.includes('desc') || h.includes('detail'));

        if (nameIdx === -1 || priceIdx === -1) {
          reject(new Error('CSV must have "name" and "price" columns'));
          return;
        }

        const categoriesMap = new Map<string, ExtractedMenuItem[]>();
        const detectedCategories: string[] = [];

        // Parse data rows
        for (let i = 1; i < lines.length; i++) {
          const row = lines[i].split(',').map(cell => cell.trim());
          
          const name = row[nameIdx];
          const priceStr = row[priceIdx]?.replace(/[^0-9.]/g, '');
          const price = parseFloat(priceStr) || 0;
          const category = categoryIdx >= 0 ? row[categoryIdx] : 'Menu Items';
          const description = descIdx >= 0 ? row[descIdx] : '';

          if (!name || price === 0) continue;

          if (!categoriesMap.has(category)) {
            categoriesMap.set(category, []);
            if (category !== 'Menu Items') {
              detectedCategories.push(category);
            }
          }

          categoriesMap.get(category)!.push({
            name,
            price,
            category,
            description: description || undefined,
          });
        }

        const categories: ExtractedCategory[] = Array.from(categoriesMap.entries()).map(
          ([name, items]) => ({
            name,
            items,
          })
        );

        resolve({
          categories,
          detected_categories: detectedCategories,
          raw_text: text,
        });
      } catch (error: any) {
        reject(new Error(`Failed to parse CSV: ${error.message}`));
      }
    };

    reader.onerror = () => reject(new Error('Failed to read CSV file'));
    reader.readAsText(file);
  });
};

/**
 * Parse Excel file (requires additional library)
 * For now, prompts user to export to CSV
 */
export const parseExcel = async (file: File): Promise<ExtractedMenuData> => {
  // Note: Full Excel parsing requires xlsx library
  // For MVP, we'll suggest CSV export
  throw new Error(
    'Excel files are not yet supported. Please export your Excel file to CSV format and try again. ' +
    'In Excel: File → Save As → CSV (Comma delimited)'
  );
};

/**
 * Main export function - automatically detects file type and extracts menu
 */
export const extractMenuFromFile = async (
  file: File,
  existingCategories: { id: string; name: string }[] = []
): Promise<ExtractedMenuData & { categoryMatches?: Map<string, any> }> => {
  const fileType = detectFileType(file);
  let extracted: ExtractedMenuData;

  switch (fileType) {
    case 'csv':
      extracted = await parseCSV(file);
      break;
    
    case 'excel':
      extracted = await parseExcel(file);
      break;
    
    case 'pdf':
      extracted = await extractMenuFromPDF(file, existingCategories);
      break;
    
    case 'image':
    default:
      const base64 = await fileToBase64(file);
      extracted = await extractMenuFromImage(base64, file.type, existingCategories);
      break;
  }

  // Smart category matching
  const categoryMatches = new Map<string, any>();
  
  if (extracted.detected_categories && existingCategories.length > 0) {
    for (const detectedCat of extracted.detected_categories) {
      const matchResult = matchCategory(detectedCat, existingCategories);
      categoryMatches.set(detectedCat, matchResult);
      
      console.log(`Category "${detectedCat}":`, matchResult.match 
        ? `Matched to "${matchResult.match.name}" (${(matchResult.similarity * 100).toFixed(0)}%)`
        : 'Will create new');
    }
  }

  return {
    ...extracted,
    categoryMatches,
  };
};
