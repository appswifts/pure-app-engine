/**
 * Edge Functions Utility
 * 
 * This utility provides a safe, standardized way to call Supabase Edge Functions.
 * It prevents common issues like 401 authentication errors.
 * 
 * ALWAYS use this utility instead of manual fetch() calls.
 */

import { supabase } from '@/integrations/supabase/client';

/**
 * Call a Supabase Edge Function safely
 * 
 * @example
 * const result = await callEdgeFunction('generate-food-image', { 
 *   prompt: 'delicious pizza' 
 * });
 * 
 * if (result.success) {
 *   console.log('Image URL:', result.data.imageUrl);
 * } else {
 *   console.error('Error:', result.error);
 * }
 */
export async function callEdgeFunction<TRequest = any, TResponse = any>(
  functionName: string,
  body?: TRequest,
  options?: {
    retries?: number;
    retryDelay?: number;
  }
): Promise<{ success: true; data: TResponse } | { success: false; error: string }> {
  const { retries = 1, retryDelay = 1000 } = options || {};

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      // Use Supabase client for automatic auth handling
      const { data, error } = await supabase.functions.invoke<TResponse>(functionName, {
        body,
      });

      if (error) {
        // If this is the last retry or not a retryable error, fail
        if (attempt === retries - 1 || !isRetryableError(error)) {
          return {
            success: false,
            error: error.message || 'Unknown error occurred',
          };
        }

        // Wait before retry
        console.warn(`Function ${functionName} failed (attempt ${attempt + 1}/${retries}), retrying...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
        continue;
      }

      return {
        success: true,
        data: data as TResponse,
      };
    } catch (error: any) {
      if (attempt === retries - 1) {
        return {
          success: false,
          error: error.message || 'Network error occurred',
        };
      }

      console.warn(`Function ${functionName} threw error (attempt ${attempt + 1}/${retries}), retrying...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
    }
  }

  return {
    success: false,
    error: 'Max retries exceeded',
  };
}

/**
 * Check if an error is retryable
 */
function isRetryableError(error: any): boolean {
  const retryableStatuses = [408, 429, 500, 502, 503, 504];
  const errorMessage = error.message?.toLowerCase() || '';
  
  return (
    retryableStatuses.some(status => errorMessage.includes(String(status))) ||
    errorMessage.includes('timeout') ||
    errorMessage.includes('network') ||
    errorMessage.includes('temporarily')
  );
}

/**
 * Generate a food image using AI
 * 
 * @example
 * const imageUrl = await generateFoodImage('Pepperoni Pizza', 'Classic Italian pizza');
 */
export async function generateFoodImage(
  itemName: string,
  description?: string
): Promise<string> {
  const prompt = [
    `Professional food photography of ${itemName}`,
    description,
    'appetizing presentation',
    'high resolution',
    '8k quality',
    'culinary art',
    'food styling',
    'gourmet presentation'
  ].filter(Boolean).join(', ');

  const result = await callEdgeFunction<
    { prompt: string },
    { imageUrl: string }
  >('generate-food-image', { prompt }, { retries: 2, retryDelay: 2000 });

  if (!result.success) {
    console.error('Failed to generate image:', 'error' in result ? result.error : 'Unknown error');
    return '';
  }

  return result.data.imageUrl || '';
}

/**
 * Extract menu data from file using AI
 * 
 * @example
 * const menuData = await extractMenuFromFile(file, 'openai');
 */
export async function extractMenuFromFile(
  file: File,
  provider: 'openai' | 'huggingface' = 'openai'
): Promise<any> {
  // Convert file to base64
  const base64 = await fileToBase64(file);

  const result = await callEdgeFunction<
    { file: string; fileName: string; provider: string },
    any
  >('ai-menu-extract', {
    file: base64,
    fileName: file.name,
    provider,
  }, { retries: 1 });

  if (!result.success) {
    throw new Error('error' in result ? result.error : 'Failed to extract menu');
  }

  return result.data;
}

/**
 * Convert file to base64 string
 */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}

/**
 * Type definitions for common Edge Function responses
 */
export interface EdgeFunctionError {
  error: string;
  details?: any;
}

export interface ImageGenerationResponse {
  imageUrl: string;
}

export interface MenuExtractionResponse {
  categories: Array<{
    name: string;
    items: Array<{
      name: string;
      description: string;
      price: number;
    }>;
  }>;
}
