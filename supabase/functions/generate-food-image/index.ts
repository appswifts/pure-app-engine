import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper function to retry with exponential backoff
async function fetchWithRetry(url: string, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      console.log(`Attempt ${i + 1} of ${maxRetries}`)
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'MenuForest-AI-Generator/1.0'
        }
      })
      
      if (response.ok) {
        return response
      }
      
      // If not last attempt and server error, retry
      if (i < maxRetries - 1 && response.status >= 500) {
        const delay = Math.pow(2, i) * 1000 // 1s, 2s, 4s
        console.log(`Server error ${response.status}, retrying in ${delay}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      
      // Last attempt or client error, return the response
      return response
    } catch (error) {
      if (i === maxRetries - 1) throw error
      const delay = Math.pow(2, i) * 1000
      console.log(`Network error, retrying in ${delay}ms...`, error)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  throw new Error('Max retries exceeded')
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // No authentication required - this is a public image generation service
    const { prompt } = await req.json()
    
    if (!prompt) {
      throw new Error('Prompt is required')
    }

    console.log('Generating image for prompt:', prompt)

    // Use Pollinations AI - completely free, no API key needed
    const encodedPrompt = encodeURIComponent(prompt)
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=768&height=768&nologo=true&enhance=true`
    
    console.log('Fetching image from Pollinations:', imageUrl)
    
    const response = await fetchWithRetry(imageUrl)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Pollinations API error:', response.status, errorText)
      throw new Error(`Image generation failed after retries: ${response.status}`)
    }

    // Get image blob
    const imageBlob = await response.blob()
    
    // Convert to ArrayBuffer
    const arrayBuffer = await imageBlob.arrayBuffer()
    
    // Convert to base64
    const base64 = btoa(
      new Uint8Array(arrayBuffer).reduce(
        (data, byte) => data + String.fromCharCode(byte),
        ''
      )
    )
    
    const dataUrl = `data:image/png;base64,${base64}`

    return new Response(
      JSON.stringify({ imageUrl: dataUrl }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
