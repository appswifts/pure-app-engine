// Debug helpers for MenuForest application
import { supabase } from "@/integrations/supabase/client";

export const debugLog = (component: string, action: string, data: any) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔍 [${component}] ${action}:`, data);
  }
};

export const debugError = (component: string, action: string, error: any) => {
  console.error(`❌ [${component}] ${action} Error:`, {
    message: error?.message,
    details: error?.details,
    hint: error?.hint,
    code: error?.code,
    stack: error?.stack
  });
};

export const debugSupabaseQuery = async (
  queryName: string, 
  queryPromise: Promise<any>
) => {
  const startTime = performance.now();
  debugLog('Supabase', `Starting ${queryName}`, { timestamp: new Date().toISOString() });
  
  try {
    const result = await queryPromise;
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    debugLog('Supabase', `${queryName} Success`, {
      duration: `${duration.toFixed(2)}ms`,
      dataCount: result.data?.length || 0,
      error: result.error
    });
    
    if (result.error) {
      debugError('Supabase', queryName, result.error);
    }
    
    return result;
  } catch (error) {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    debugError('Supabase', queryName, error);
    debugLog('Supabase', `${queryName} Failed`, {
      duration: `${duration.toFixed(2)}ms`
    });
    
    throw error;
  }
};

export const debugAuth = async () => {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  debugLog('Auth', 'Current State', {
    hasSession: !!session,
    hasUser: !!user,
    userId: user?.id,
    userEmail: user?.email,
    sessionError,
    userError
  });
  
  return { session, user, sessionError, userError };
};

export const debugRestaurantAccess = async (restaurantId: string, userId: string) => {
  debugLog('Restaurant', 'Checking Access', { restaurantId, userId });
  
  const { data, error } = await supabase
    .from('restaurants')
    .select('id, name, user_id')
    .eq('id', restaurantId)
    .single();
    
  debugLog('Restaurant', 'Access Check Result', {
    found: !!data,
    ownerMatch: data?.user_id === userId,
    error
  });
  
  return { data, error };
};
