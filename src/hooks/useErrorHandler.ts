import { useCallback, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { errorService } from "@/services/errorService";

export type ErrorLevel = "info" | "warning" | "error" | "critical";

interface ErrorHandlerOptions {
  showToast?: boolean;
  logToConsole?: boolean;
  logToService?: boolean;
  fallbackMessage?: string;
  componentName?: string;
}

interface ErrorState {
  hasError: boolean;
  error: Error | null;
  isRecovering: boolean;
}

export function useErrorHandler(options: ErrorHandlerOptions = {}) {
  const { toast } = useToast();
  const [errorState, setErrorState] = useState<ErrorState>({
    hasError: false,
    error: null,
    isRecovering: false,
  });

  const {
    showToast = true,
    logToConsole = process.env.NODE_ENV === "development",
    logToService = true,
    fallbackMessage = "An unexpected error occurred",
    componentName = "Unknown",
  } = options;

  /**
   * Handle errors with appropriate actions
   */
  const handleError = useCallback(
    async (error: Error | unknown, level: ErrorLevel = "error", customMessage?: string) => {
      // Convert unknown errors to Error objects
      const errorObj = error instanceof Error 
        ? error 
        : new Error(String(error));

      // Update error state
      setErrorState({
        hasError: true,
        error: errorObj,
        isRecovering: false,
      });

      // Log to console if enabled
      if (logToConsole) {
        console.error(`[${componentName}]`, errorObj);
      }

      // Log to service if enabled
      if (logToService) {
        await errorService.logError(errorObj, {
          errorType: level,
          additionalData: {
            componentName,
            customMessage,
          },
        });
      }

      // Show toast if enabled
      if (showToast) {
        const message = customMessage || errorObj.message || fallbackMessage;
        
        switch (level) {
          case "critical":
            toast({
              title: "Critical Error",
              description: message,
              variant: "destructive",
              duration: 10000,
            });
            break;
          case "error":
            toast({
              title: "Error",
              description: message,
              variant: "destructive",
              duration: 5000,
            });
            break;
          case "warning":
            toast({
              title: "Warning",
              description: message,
              variant: "default",
              duration: 4000,
            });
            break;
          case "info":
            toast({
              title: "Information",
              description: message,
              variant: "default",
              duration: 3000,
            });
            break;
        }
      }
    },
    [componentName, fallbackMessage, logToConsole, logToService, showToast, toast]
  );

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setErrorState({
      hasError: false,
      error: null,
      isRecovering: false,
    });
  }, []);

  /**
   * Attempt to recover from error
   */
  const recoverFromError = useCallback(async (recoveryFn?: () => Promise<void>) => {
    setErrorState(prev => ({ ...prev, isRecovering: true }));
    
    try {
      if (recoveryFn) {
        await recoveryFn();
      }
      clearError();
      
      toast({
        title: "Recovered",
        description: "Successfully recovered from the error",
        variant: "default",
      });
    } catch (recoveryError) {
      handleError(recoveryError, "critical", "Failed to recover from error");
    } finally {
      setErrorState(prev => ({ ...prev, isRecovering: false }));
    }
  }, [clearError, handleError, toast]);

  /**
   * Wrap async functions with error handling
   */
  const wrapAsync = useCallback(
    <T,>(asyncFn: () => Promise<T>) => {
      return async (): Promise<T | undefined> => {
        try {
          return await asyncFn();
        } catch (error) {
          handleError(error);
          return undefined;
        }
      };
    },
    [handleError]
  );

  /**
   * Execute function with error handling
   */
  const tryExecute = useCallback(
    async <T,>(
      fn: () => T | Promise<T>,
      options?: {
        fallbackValue?: T;
        customMessage?: string;
        level?: ErrorLevel;
      }
    ): Promise<T | undefined> => {
      try {
        return await fn();
      } catch (error) {
        handleError(error, options?.level || "error", options?.customMessage);
        return options?.fallbackValue;
      }
    },
    [handleError]
  );

  return {
    errorState,
    handleError,
    clearError,
    recoverFromError,
    wrapAsync,
    tryExecute,
  };
}
