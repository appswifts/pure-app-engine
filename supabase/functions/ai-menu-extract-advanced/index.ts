import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MenuItem {
  name: string;
  description?: string;
  price: number;
  category?: string;
  allergens?: string[];
  dietary_tags?: string[];
}

interface MenuCategory {
  name: string;
  description?: string;
  items: MenuItem[];
}

interface ExtractionResult {
  categories: MenuCategory[];
  restaurant_name?: string;
  currency?: string;
  confidence_score?: number;
  raw_text?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image, fileType, model = 'google/gemini-2.5-flash', existingCategories = [] } = await req.json();

    if (!image) {
      return new Response(
        JSON.stringify({ error: 'Image data is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Starting menu extraction with model: ${model}`);
    
    // Get Lovable AI key from environment
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Prepare image data
    const imageData = image.includes('base64,') 
      ? image 
      : `data:${fileType};base64,${image}`;

    // Build comprehensive system prompt
    const systemPrompt = `You are an expert menu data extraction AI with exceptional accuracy in reading restaurant menus from any format.

Your task is to extract ALL menu information with 100% accuracy. Follow these rules:

1. EXTRACT EVERYTHING: Don't miss any items, prices, or details
2. ORGANIZE BY CATEGORY: Group items logically (Appetizers, Main Dishes, Drinks, Desserts, etc.)
3. PRICE ACCURACY: Extract exact prices, handle multiple currencies (RWF, USD, EUR, etc.)
4. DESCRIPTIONS: Include all item descriptions, ingredients, and preparation methods
5. DIETARY INFO: Note allergens, vegetarian/vegan options, spicy levels
6. MULTI-LANGUAGE: Handle menus in English, French, Kinyarwanda, or any language
7. FORMAT HANDLING: Process both structured menus and handwritten text
8. CURRENCY DETECTION: Identify and note the currency used

${existingCategories.length > 0 ? `\nEXISTING CATEGORIES (try to match these when possible):\n${existingCategories.map((c: any) => `- ${c.name}`).join('\n')}` : ''}

Return ONLY valid JSON with this exact structure (no markdown, no code blocks):
{
  "restaurant_name": "Restaurant name if visible",
  "currency": "RWF/USD/EUR/etc",
  "confidence_score": 0.95,
  "categories": [
    {
      "name": "Category Name",
      "description": "Optional category description",
      "items": [
        {
          "name": "Item Name",
          "description": "Detailed description with ingredients",
          "price": 5000,
          "allergens": ["nuts", "dairy"],
          "dietary_tags": ["vegetarian", "spicy"]
        }
      ]
    }
  ]
}`;

    const userPrompt = `Analyze this restaurant menu image and extract ALL menu items with complete details. Be thorough and accurate.`;

    console.log('Calling Lovable AI Gateway...');
    
    // Call Lovable AI Gateway with vision model
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: userPrompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageData
                }
              }
            ]
          }
        ],
        max_tokens: 4000,
        temperature: 0.1, // Low temperature for consistency
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status} - ${errorText}`);
    }

    const aiResponse = await response.json();
    console.log('AI Response received:', JSON.stringify(aiResponse).substring(0, 200));
    
    const content = aiResponse.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content in AI response');
    }

    // Parse the JSON response (handle markdown code blocks)
    let extractedData: ExtractionResult;
    try {
      // Remove markdown code blocks if present
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || 
                       content.match(/```\s*([\s\S]*?)\s*```/);
      const jsonString = jsonMatch ? jsonMatch[1] : content;
      extractedData = JSON.parse(jsonString.trim());
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Invalid JSON response from AI. Please try again.');
    }

    // Post-process and validate
    extractedData = validateAndCleanData(extractedData);
    
    console.log(`Successfully extracted ${extractedData.categories.length} categories with ${
      extractedData.categories.reduce((sum, cat) => sum + cat.items.length, 0)
    } items`);

    return new Response(
      JSON.stringify(extractedData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Menu extraction error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to extract menu data',
        details: error.stack
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Validate and clean extracted data
 */
function validateAndCleanData(data: ExtractionResult): ExtractionResult {
  // Ensure categories array exists
  if (!data.categories || !Array.isArray(data.categories)) {
    data.categories = [];
  }

  // Filter and clean categories
  data.categories = data.categories
    .filter(cat => cat && cat.name && cat.items && cat.items.length > 0)
    .map(cat => ({
      name: cleanText(cat.name),
      description: cat.description ? cleanText(cat.description) : undefined,
      items: cat.items
        .filter(item => item && item.name && item.price !== undefined)
        .map(item => ({
          name: cleanText(item.name),
          description: item.description ? cleanText(item.description) : undefined,
          price: normalizePrice(item.price),
          category: cat.name,
          allergens: item.allergens || [],
          dietary_tags: item.dietary_tags || []
        }))
    }));

  // Remove duplicate items within categories
  data.categories = data.categories.map(cat => {
    const uniqueItems = new Map();
    cat.items.forEach(item => {
      const key = item.name.toLowerCase().trim();
      if (!uniqueItems.has(key) || (item.description && !uniqueItems.get(key).description)) {
        uniqueItems.set(key, item);
      }
    });
    return { ...cat, items: Array.from(uniqueItems.values()) };
  });

  // Remove empty categories
  data.categories = data.categories.filter(cat => cat.items.length > 0);

  // Set confidence score if not present
  if (!data.confidence_score) {
    data.confidence_score = calculateConfidenceScore(data);
  }

  return data;
}

/**
 * Clean text (remove extra spaces, trim, capitalize properly)
 */
function cleanText(text: string): string {
  if (!text) return '';
  
  return text
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/^\d+\.?\s*/, '') // Remove leading numbers
    .replace(/[\.\-_]+$/g, ''); // Remove trailing punctuation
}

/**
 * Normalize price (remove currency symbols, commas, ensure it's a valid number)
 */
function normalizePrice(price: any): number {
  if (typeof price === 'number') return Math.max(0, price);
  
  const priceStr = String(price).replace(/[^0-9.]/g, '');
  const priceNum = parseFloat(priceStr);
  
  return isNaN(priceNum) ? 0 : Math.max(0, priceNum);
}

/**
 * Calculate confidence score based on data quality
 */
function calculateConfidenceScore(data: ExtractionResult): number {
  let score = 0.5; // Base score
  
  // Has categories
  if (data.categories.length > 0) score += 0.2;
  
  // Has items
  const totalItems = data.categories.reduce((sum, cat) => sum + cat.items.length, 0);
  if (totalItems > 0) score += 0.1;
  if (totalItems > 5) score += 0.1;
  
  // Has descriptions
  const itemsWithDesc = data.categories.reduce((sum, cat) => 
    sum + cat.items.filter(item => item.description).length, 0);
  if (itemsWithDesc > 0) score += 0.1;
  
  return Math.min(1, score);
}
