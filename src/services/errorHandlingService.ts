import { supabase } from '@/integrations/supabase/client';

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';
export type ErrorCategory = 'auth' | 'database' | 'payment' | 'api' | 'validation' | 'network' | 'unknown';

interface ErrorLog {
  message: string;
  severity: ErrorSeverity;
  category: ErrorCategory;
  context?: any;
  stack?: string;
  userId?: string;
  timestamp: string;
}

class ErrorHandlingService {
  private isDevelopment = import.meta.env.DEV;
  private errorQueue: ErrorLog[] = [];
  private isProcessing = false;

  /**
   * Log an error with proper categorization and severity
   */
  logError(
    error: any,
    category: ErrorCategory = 'unknown',
    severity: ErrorSeverity = 'medium',
    context?: any
  ): void {
    const errorLog: ErrorLog = {
      message: this.extractErrorMessage(error),
      severity,
      category,
      context,
      stack: error?.stack,
      timestamp: new Date().toISOString(),
    };

    // In development, log to console
    if (this.isDevelopment) {
    }

    // Add to queue for batch processing
    this.errorQueue.push(errorLog);
    this.processErrorQueue();
  }

  /**
   * Handle API errors with proper user feedback
   */
  handleApiError(error: any, operation: string): string {
    const message = this.extractErrorMessage(error);
    
    // Log the error
    this.logError(error, 'api', 'medium', { operation });

    // Return user-friendly message
    if (error?.code === 'PGRST116') {
      return 'The requested data was not found';
    }
    if (error?.code === '23505') {
      return 'This item already exists';
    }
    if (error?.code === '23503') {
      return 'Cannot perform this operation due to related data';
    }
    if (error?.code === '42501') {
      return 'You do not have permission to perform this action';
    }
    if (message.includes('network')) {
      return 'Network error. Please check your connection';
    }
    if (message.includes('timeout')) {
      return 'Request timed out. Please try again';
    }

    return `Operation failed: ${operation}`;
  }

  /**
   * Handle authentication errors
   */
  handleAuthError(error: any): string {
    const message = this.extractErrorMessage(error);
    
    this.logError(error, 'auth', 'high', { type: 'authentication' });

    if (message.includes('Invalid login')) {
      return 'Invalid email or password';
    }
    if (message.includes('Email not confirmed')) {
      return 'Please verify your email before logging in';
    }
    if (message.includes('refresh_token')) {
      return 'Your session has expired. Please log in again';
    }

    return 'Authentication failed. Please try again';
  }

  /**
   * Handle payment-related errors
   */
  handlePaymentError(error: any, paymentMethod?: string): string {
    this.logError(error, 'payment', 'critical', { paymentMethod });

    const message = this.extractErrorMessage(error);
    
    if (message.includes('insufficient')) {
      return 'Insufficient funds for this transaction';
    }
    if (message.includes('declined')) {
      return 'Payment was declined. Please try another method';
    }
    if (message.includes('expired')) {
      return 'Payment method has expired';
    }

    return 'Payment processing failed. Please try again or contact support';
  }

  /**
   * Handle validation errors
   */
  handleValidationError(errors: Record<string, string>): string {
    const errorMessages = Object.values(errors).filter(Boolean);
    
    this.logError(
      { message: 'Validation failed', errors },
      'validation',
      'low',
      { errors }
    );

    if (errorMessages.length === 1) {
      return errorMessages[0];
    }
    
    return `Please fix the following errors: ${errorMessages.join(', ')}`;
  }

  /**
   * Extract error message from various error types
   */
  private extractErrorMessage(error: any): string {
    if (typeof error === 'string') return error;
    if (error?.message) return error.message;
    if (error?.error) return this.extractErrorMessage(error.error);
    if (error?.data?.message) return error.data.message;
    return 'An unexpected error occurred';
  }

  /**
   * Process error queue - batch send to backend
   */
  private async processErrorQueue(): Promise<void> {
    if (this.isProcessing || this.errorQueue.length === 0) return;

    this.isProcessing = true;
    const errors = [...this.errorQueue];
    this.errorQueue = [];

    try {
      // In production, send to backend
      if (!this.isDevelopment && errors.some(e => e.severity === 'critical' || e.severity === 'high')) {
        const { data: { user } } = await supabase.auth.getUser();
        
        await supabase.functions.invoke('log-errors', {
          body: {
            errors: errors.map(e => ({ ...e, userId: user?.id })),
            userAgent: navigator.userAgent,
            url: window.location.href,
          }
        });
      }
    } catch (error) {
      // Silently fail - don't create infinite loop
      if (this.isDevelopment) {
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Clear error queue
   */
  clearQueue(): void {
    this.errorQueue = [];
  }
}

export const errorHandler = new ErrorHandlingService();
export default errorHandler;
