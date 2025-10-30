import { supabase } from "@/integrations/supabase/client";

export interface ErrorLog {
  message: string;
  stack?: string;
  componentStack?: string;
  errorType?: string;
  url: string;
  userAgent: string;
  timestamp: string;
  userId?: string;
  restaurantId?: string;
  additionalData?: Record<string, any>;
}

class ErrorService {
  private static instance: ErrorService;
  private errorQueue: ErrorLog[] = [];
  private isOnline: boolean = navigator.onLine;

  private constructor() {
    // Listen for online/offline events
    window.addEventListener("online", () => {
      this.isOnline = true;
      this.flushErrorQueue();
    });
    
    window.addEventListener("offline", () => {
      this.isOnline = false;
    });
  }

  static getInstance(): ErrorService {
    if (!ErrorService.instance) {
      ErrorService.instance = new ErrorService();
    }
    return ErrorService.instance;
  }

  /**
   * Log an error with context
   */
  async logError(
    error: Error,
    context?: {
      componentStack?: string;
      errorType?: string;
      userId?: string;
      restaurantId?: string;
      additionalData?: Record<string, any>;
    }
  ): Promise<void> {
    const errorLog: ErrorLog = {
      message: error.message,
      stack: error.stack,
      componentStack: context?.componentStack,
      errorType: context?.errorType || this.categorizeError(error),
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      userId: context?.userId,
      restaurantId: context?.restaurantId,
      additionalData: context?.additionalData,
    };

    // Store in localStorage for persistence
    this.storeErrorLocally(errorLog);

    // Send to server if online
    if (this.isOnline) {
      await this.sendErrorToServer(errorLog);
    } else {
      this.errorQueue.push(errorLog);
    }

    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("Error logged:", errorLog);
    }
  }

  /**
   * Categorize error based on its characteristics
   */
  private categorizeError(error: Error): string {
    const message = error.message.toLowerCase();
    
    if (message.includes("network") || message.includes("fetch")) {
      return "network";
    }
    if (message.includes("permission") || message.includes("unauthorized") || message.includes("403")) {
      return "permission";
    }
    if (message.includes("not found") || message.includes("404")) {
      return "not-found";
    }
    if (message.includes("timeout")) {
      return "timeout";
    }
    if (message.includes("database") || message.includes("supabase")) {
      return "database";
    }
    if (message.includes("validation") || message.includes("invalid")) {
      return "validation";
    }
    
    return "general";
  }

  /**
   * Store error in localStorage
   */
  private storeErrorLocally(errorLog: ErrorLog): void {
    try {
      const errors = JSON.parse(localStorage.getItem("app_errors") || "[]");
      errors.push(errorLog);
      
      // Keep only last 20 errors
      if (errors.length > 20) {
        errors.shift();
      }
      
      localStorage.setItem("app_errors", JSON.stringify(errors));
    } catch (e) {
      console.error("Failed to store error locally:", e);
    }
  }

  /**
   * Send error to server (could be Supabase, Sentry, etc.)
   */
  private async sendErrorToServer(errorLog: ErrorLog): Promise<void> {
    try {
      // In production, you might want to send this to a dedicated error tracking service
      // For now, we'll just log it to console
      
      // Example: Send to Supabase logs table (if you have one)
      // await supabase.from("error_logs").insert(errorLog);
      
      // Example: Send to external service
      // await fetch("https://your-error-service.com/log", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(errorLog),
      // });
      
      console.log("Error would be sent to server:", errorLog);
    } catch (e) {
      console.error("Failed to send error to server:", e);
    }
  }

  /**
   * Flush queued errors when coming back online
   */
  private async flushErrorQueue(): Promise<void> {
    while (this.errorQueue.length > 0) {
      const errorLog = this.errorQueue.shift();
      if (errorLog) {
        await this.sendErrorToServer(errorLog);
      }
    }
  }

  /**
   * Get stored errors from localStorage
   */
  getStoredErrors(): ErrorLog[] {
    try {
      return JSON.parse(localStorage.getItem("app_errors") || "[]");
    } catch {
      return [];
    }
  }

  /**
   * Clear stored errors
   */
  clearStoredErrors(): void {
    localStorage.removeItem("app_errors");
  }

  /**
   * Handle async errors with proper error boundaries
   */
  static async handleAsync<T>(
    asyncFn: () => Promise<T>,
    errorContext?: {
      componentName?: string;
      operation?: string;
      fallbackValue?: T;
    }
  ): Promise<T | undefined> {
    try {
      return await asyncFn();
    } catch (error) {
      const errorService = ErrorService.getInstance();
      
      if (error instanceof Error) {
        await errorService.logError(error, {
          additionalData: {
            componentName: errorContext?.componentName,
            operation: errorContext?.operation,
          },
        });
      }
      
      if (errorContext?.fallbackValue !== undefined) {
        return errorContext.fallbackValue;
      }
      
      throw error;
    }
  }
}

export default ErrorService;

// Export singleton instance
export const errorService = ErrorService.getInstance();
