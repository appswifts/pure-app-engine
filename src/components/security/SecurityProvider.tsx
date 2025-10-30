import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { checkRateLimit } from '@/lib/validation';

interface SecurityContextType {
  isRateLimited: (key: string, max?: number) => boolean;
  reportSecurityEvent: (event: string, details: any) => void;
  validateSession: () => Promise<boolean>;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export const SecurityProvider = ({ children }: { children: React.ReactNode }) => {
  const [sessionValid, setSessionValid] = useState(false);

  // Rate limiting wrapper
  const isRateLimited = (key: string, max: number = 10): boolean => {
    return !checkRateLimit(key, max);
  };

  // Security event reporting - logs to console in development only
  const reportSecurityEvent = async (event: string, details: any) => {
    // Server-side logging only (Edge Functions handle this with service role)
    // Client-side logging is limited to development mode
    if (process.env.NODE_ENV === 'development') {
      console.log('Security event:', event, details);
    }
    
    // In production, security events should be logged via Edge Functions
    // with proper authentication and rate limiting
  };

  // Session validation
  const validateSession = async (): Promise<boolean> => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        reportSecurityEvent('session_validation_error', { error: error.message });
        return false;
      }
      
      const isValid = !!session && !!session.user;
      setSessionValid(isValid);
      
      // Don't expose session details in logs for security
      if (!isValid && process.env.NODE_ENV === 'development') {
        reportSecurityEvent('invalid_session_detected', { 
          timestamp: new Date().toISOString()
        });
      }
      
      return isValid;
    } catch (error) {
      reportSecurityEvent('session_validation_exception', { error });
      return false;
    }
  };

  // Periodic session validation
  useEffect(() => {
    validateSession();
    
    const interval = setInterval(validateSession, 5 * 60 * 1000); // Every 5 minutes
    return () => clearInterval(interval);
  }, []);

  // Monitor for suspicious activity
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        validateSession();
      }
    };

    const handleFocus = () => {
      validateSession();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  return (
    <SecurityContext.Provider value={{
      isRateLimited,
      reportSecurityEvent,
      validateSession
    }}>
      {children}
    </SecurityContext.Provider>
  );
};

export const useSecurity = () => {
  const context = useContext(SecurityContext);
  if (context === undefined) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
};