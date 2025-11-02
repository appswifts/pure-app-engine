import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting map: user_id -> { count, resetTime }
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// File type magic bytes for validation
const MAGIC_BYTES: Record<string, number[][]> = {
  'image/jpeg': [[0xFF, 0xD8, 0xFF]],
  'image/png': [[0x89, 0x50, 0x4E, 0x47]],
  'image/gif': [[0x47, 0x49, 0x46, 0x38]],
  'image/webp': [[0x52, 0x49, 0x46, 0x46]],
  'application/pdf': [[0x25, 0x50, 0x44, 0x46]],
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

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
    // Authenticate request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rate limiting: 5 requests per hour per user
    const now = Date.now();
    const userLimit = rateLimitMap.get(user.id);
    
    if (userLimit) {
      if (now < userLimit.resetTime) {
        if (userLimit.count >= 5) {
          return new Response(
            JSON.stringify({ error: 'Rate limit exceeded. Maximum 5 requests per hour.' }),
            { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        userLimit.count++;
      } else {
        rateLimitMap.set(user.id, { count: 1, resetTime: now + 3600000 }); // 1 hour
      }
    } else {
      rateLimitMap.set(user.id, { count: 1, resetTime: now + 3600000 });
    }

    const { image, fileType, model = 'google/gemini-2.5-flash', existingCategories = [] } = await req.json();

    // Validate input
    if (!image || typeof image !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid image data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!fileType || typeof fileType !== 'string') {
      return new Response(
        JSON.stringify({ error: 'File type is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate file type is allowed
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(fileType)) {
      return new Response(
        JSON.stringify({ error: 'Unsupported file type. Only images and PDFs are allowed.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract base64 data
    const base64Data = image.includes('base64,') ? image.split('base64,')[1] : image;
    
    // Validate base64 size (10MB limit)
    const estimatedSize = (base64Data.length * 3) / 4;
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    
    if (estimatedSize > MAX_SIZE) {
      return new Response(
        JSON.stringify({ error: 'File size exceeds 10MB limit' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify file type with magic bytes
    try {
      const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      const magicBytes = MAGIC_BYTES[fileType];
      
      if (magicBytes) {
        const isValidType = magicBytes.some(signature => 
          signature.every((byte, index) => binaryData[index] === byte)
        );
        
        if (!isValidType) {
          return new Response(
            JSON.stringify({ error: 'File content does not match declared type' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    } catch (decodeError) {
      return new Response(
        JSON.stringify({ error: 'Invalid base64 encoding' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Starting menu extraction with model: ${model} for user: ${user.id}`);
    
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
    
    // Call Lovable AI Gateway with vision model (with timeout)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    let response;
    try {
      response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
    } catch (fetchError: unknown) {
      clearTimeout(timeoutId);
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        return new Response(
          JSON.stringify({ error: 'Request timeout. Please try with a smaller file.' }),
          { status: 408, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw fetchError;
    }

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
      
      throw new Error(`AI Gateway error: ${response.status}`);
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
        error: error.message || 'Failed to extract menu data'
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
