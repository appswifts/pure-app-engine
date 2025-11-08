/**
 * Utility to clean up stale auth tokens and fix loading issues
 */
export class AuthCleanup {
  /**
   * Clear all Supabase auth tokens from localStorage
   */
  static clearAuthTokens() {
    const keysToRemove: string[] = [];
    
    // Find all Supabase auth token keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes('supabase') && key.includes('auth-token')) {
        keysToRemove.push(key);
      }
    }
    
    // Remove the tokens
    keysToRemove.forEach(key => {
      console.log(`Removing auth token: ${key}`);
      localStorage.removeItem(key);
    });
    
    console.log(`Cleared ${keysToRemove.length} auth tokens`);
    return keysToRemove.length;
  }
  
  /**
   * Validate and refresh auth tokens if needed
   */
  static async validateTokens() {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Auth validation error:', error);
        return false;
      }
      
      if (!session) {
        console.warn('No active session found');
        return false;
      }
      
      // Check if token is expired
      const expiresAt = session.expires_at;
      const now = Math.floor(Date.now() / 1000);
      
      if (expiresAt && expiresAt < now) {
        console.warn('Session token expired');
        
        // Try to refresh
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError) {
          console.error('Failed to refresh session:', refreshError);
          return false;
        }
        
        console.log('Session refreshed successfully');
        return true;
      }
      
      console.log('Session is valid');
      return true;
    } catch (error) {
      console.error('Token validation failed:', error);
      return false;
    }
  }
  
  /**
   * Fix auth loading issues
   */
  static async fixAuthLoading() {
    console.group('Auth Loading Fix');
    
    // 1. Validate current tokens
    const isValid = await this.validateTokens();
    
    if (!isValid) {
      // 2. Clear invalid tokens
      console.log('Clearing invalid tokens...');
      this.clearAuthTokens();
      
      // 3. Reload to get fresh auth state
      console.log('Reloading page for fresh auth state...');
      window.location.reload();
    } else {
      console.log('Auth tokens are valid');
    }
    
    console.groupEnd();
  }
}

// Expose to window for debugging
if (typeof window !== 'undefined') {
  (window as any).AuthCleanup = AuthCleanup;
}
