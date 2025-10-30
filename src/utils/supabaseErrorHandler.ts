import { PostgrestError } from "@supabase/supabase-js";
import { errorService } from "@/services/errorService";

export type SupabaseErrorType = 
  | "permission" 
  | "not-found" 
  | "conflict" 
  | "validation" 
  | "network" 
  | "timeout"
  | "rate-limit"
  | "general";

interface SupabaseErrorContext {
  operation: string;
  table?: string;
  userId?: string;
  restaurantId?: string;
}

/**
 * Map Supabase error codes to user-friendly messages
 */
const errorMessages: Record<string, string> = {
  "23505": "This record already exists. Please use a different value.",
  "23503": "Cannot perform this operation due to related records.",
  "23502": "Required field is missing. Please fill in all required fields.",
  "23514": "The provided value doesn't meet the requirements.",
  "42501": "You don't have permission to perform this action.",
  "42P01": "The requested resource doesn't exist.",
  "42703": "Invalid field or column specified.",
  "42883": "The requested function doesn't exist.",
  "PGRST301": "The requested resource was not found.",
  "PGRST204": "You don't have permission to access this resource.",
  "22P02": "Invalid input format. Please check your data.",
  "P0001": "A custom error occurred. Please contact support.",
  "57014": "The operation was cancelled due to timeout.",
  "08P01": "Connection error. Please check your internet connection.",
  "08006": "Connection lost. Please refresh the page.",
  "08003": "Connection does not exist. Please refresh the page.",
  "28P01": "Invalid authentication. Please log in again.",
  "28000": "Invalid authorization. Please check your credentials.",
  "3D000": "Database does not exist.",
  "3F000": "Invalid schema name.",
  "40001": "Operation failed due to concurrent update. Please try again.",
  "40P01": "Deadlock detected. Please try again.",
};

/**
 * Categorize Supabase errors
 */
export function categorizeSupabaseError(error: PostgrestError): SupabaseErrorType {
  const code = error.code;
  
  if (code === "42501" || code === "PGRST204" || code === "28P01" || code === "28000") {
    return "permission";
  }
  if (code === "42P01" || code === "PGRST301") {
    return "not-found";
  }
  if (code === "23505" || code === "40001" || code === "40P01") {
    return "conflict";
  }
  if (code === "23502" || code === "23514" || code === "22P02") {
    return "validation";
  }
  if (code === "08P01" || code === "08006" || code === "08003") {
    return "network";
  }
  if (code === "57014") {
    return "timeout";
  }
  if (code?.startsWith("429")) {
    return "rate-limit";
  }
  
  return "general";
}

/**
 * Get user-friendly error message
 */
export function getSupabaseErrorMessage(error: PostgrestError): string {
  // Check for specific error code
  if (error.code && errorMessages[error.code]) {
    return errorMessages[error.code];
  }
  
  // Check for rate limiting
  if (error.message?.includes("rate limit")) {
    return "Too many requests. Please wait a moment and try again.";
  }
  
  // Check for network errors
  if (error.message?.includes("NetworkError") || error.message?.includes("Failed to fetch")) {
    return "Network error. Please check your internet connection.";
  }
  
  // Return the original message if no mapping found, but clean it up
  return cleanErrorMessage(error.message || "An unexpected error occurred");
}

/**
 * Clean up technical error messages for users
 */
function cleanErrorMessage(message: string): string {
  // Remove technical details
  message = message.replace(/\b[A-Z_]+\b:/g, ""); // Remove error codes
  message = message.replace(/\bat line \d+\b/g, ""); // Remove line numbers
  message = message.replace(/\bcolumn \d+\b/g, ""); // Remove column numbers
  message = message.replace(/\btable "[^"]+"\b/g, "record"); // Replace table names
  message = message.replace(/\brelation "[^"]+"\b/g, "record"); // Replace relation names
  
  // Capitalize first letter
  return message.charAt(0).toUpperCase() + message.slice(1);
}

/**
 * Handle Supabase errors with logging and user-friendly messages
 */
export async function handleSupabaseError(
  error: PostgrestError,
  context: SupabaseErrorContext
): Promise<{ message: string; type: SupabaseErrorType }> {
  const errorType = categorizeSupabaseError(error);
  const userMessage = getSupabaseErrorMessage(error);
  
  // Log to error service
  await errorService.logError(
    new Error(error.message),
    {
      errorType,
      userId: context.userId,
      restaurantId: context.restaurantId,
      additionalData: {
        operation: context.operation,
        table: context.table,
        code: error.code,
        details: error.details,
        hint: error.hint,
      },
    }
  );
  
  return {
    message: userMessage,
    type: errorType,
  };
}

/**
 * Wrapper for Supabase operations with error handling
 */
export async function withSupabaseErrorHandling<T>(
  operation: () => Promise<{ data: T | null; error: PostgrestError | null }>,
  context: SupabaseErrorContext
): Promise<{ data: T | null; error: { message: string; type: SupabaseErrorType } | null }> {
  try {
    const { data, error } = await operation();
    
    if (error) {
      const handledError = await handleSupabaseError(error, context);
      return { data: null, error: handledError };
    }
    
    return { data, error: null };
  } catch (unexpectedError) {
    // Handle unexpected errors
    const error = unexpectedError instanceof Error 
      ? unexpectedError 
      : new Error(String(unexpectedError));
    
    await errorService.logError(error, {
      errorType: "general",
      additionalData: context,
    });
    
    return {
      data: null,
      error: {
        message: "An unexpected error occurred. Please try again.",
        type: "general",
      },
    };
  }
}

/**
 * Retry logic for transient errors
 */
export async function retrySupabaseOperation<T>(
  operation: () => Promise<{ data: T | null; error: PostgrestError | null }>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<{ data: T | null; error: PostgrestError | null }> {
  let lastError: PostgrestError | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const { data, error } = await operation();
    
    if (!error) {
      return { data, error: null };
    }
    
    lastError = error;
    
    // Don't retry on non-transient errors
    const errorType = categorizeSupabaseError(error);
    if (errorType === "permission" || errorType === "validation" || errorType === "not-found") {
      return { data: null, error };
    }
    
    // Wait before retrying (exponential backoff)
    if (attempt < maxRetries - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs * Math.pow(2, attempt)));
    }
  }
  
  return { data: null, error: lastError };
}
