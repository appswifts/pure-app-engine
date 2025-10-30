import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image, fileType, provider = 'huggingface' } = await req.json();

    if (!image) {
      return new Response(
        JSON.stringify({ error: 'Image data is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get API keys from environment (admin configured)
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    const huggingfaceKey = Deno.env.get('HUGGINGFACE_API_KEY');

    let extractedData;

    if (provider === 'openai' && openaiKey) {
      // Use OpenAI Vision API
      extractedData = await extractWithOpenAI(image, fileType, openaiKey);
    } else {
      // Use HuggingFace (free OCR.space fallback)
      extractedData = await extractWithOCR(image, fileType);
    }

    return new Response(
      JSON.stringify(extractedData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('AI menu extraction error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to extract menu data' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function extractWithOpenAI(base64Image: string, fileType: string, apiKey: string) {
  const imageData = base64Image.includes('base64,') 
    ? base64Image 
    : `data:${fileType};base64,${base64Image}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Extract menu items from this image. Return a JSON object with this structure:
{
  "categories": [
    {
      "name": "Category Name",
      "description": "Optional category description",
      "items": [
        {
          "name": "Item Name",
          "description": "Item description",
          "price": 0
        }
      ]
    }
  ]
}
Only return valid JSON, no additional text.`
            },
            {
              type: 'image_url',
              image_url: { url: imageData }
            }
          ]
        }
      ],
      max_tokens: 2000
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;
  
  return JSON.parse(content);
}

async function extractWithOCR(base64Image: string, fileType: string) {
  // Remove data URL prefix if present
  const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
  
  // Use OCR.space free API
  const formData = new FormData();
  formData.append('base64Image', `data:${fileType};base64,${base64Data}`);
  formData.append('language', 'eng');
  formData.append('isOverlayRequired', 'false');
  formData.append('detectOrientation', 'true');
  formData.append('scale', 'true');
  formData.append('OCREngine', '2');

  const response = await fetch('https://api.ocr.space/parse/image', {
    method: 'POST',
    headers: {
      'apikey': 'helloworld' // Free tier API key
    },
    body: formData
  });

  if (!response.ok) {
    throw new Error('OCR extraction failed');
  }

  const data = await response.json();
  
  if (!data.ParsedResults || data.ParsedResults.length === 0) {
    throw new Error('No text found in image');
  }

  const text = data.ParsedResults[0].ParsedText;
  
  // Simple parsing logic for menu items
  const lines = text.split('\n').filter((line: string) => line.trim());
  const items: any[] = [];
  
  for (const line of lines) {
    // Try to extract price patterns
    const priceMatch = line.match(/(\d+[\.,]\d{2}|\d+)/);
    if (priceMatch) {
      const price = parseFloat(priceMatch[0].replace(',', '.'));
      const name = line.replace(priceMatch[0], '').trim();
      
      if (name) {
        items.push({
          name: name,
          description: '',
          price: price
        });
      }
    }
  }

  return {
    categories: [
      {
        name: 'Imported Items',
        description: 'Items extracted from menu',
        items: items
      }
    ]
  };
}
