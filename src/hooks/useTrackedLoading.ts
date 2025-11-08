import { useState, useCallback, useEffect } from 'react';
import { LoadingTracker, logError } from '@/utils/debugUtils';

interface UseTrackedLoadingOptions {
  componentName: string;
  onError?: (error: any) => void;
  timeout?: number; // Optional timeout in ms
}

export function useTrackedLoading({ 
  componentName, 
  onError,
  timeout = 30000 // 30 second default timeout
}: UseTrackedLoadingOptions) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const startLoading = useCallback(() => {
    setLoading(true);
    setError(null);
    LoadingTracker.startLoading(componentName);
    
    // Set timeout to catch stuck loading states
    const id = setTimeout(() => {
      console.warn(`⚠️ [${componentName}] Loading timeout after ${timeout}ms`);
      logError(componentName, new Error(`Loading timeout after ${timeout}ms`));
      setLoading(false);
      LoadingTracker.endLoading(componentName, false);
    }, timeout);
    
    setTimeoutId(id);
  }, [componentName, timeout]);

  const endLoading = useCallback((success: boolean = true, errorData?: any) => {
    // Clear timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    
    setLoading(false);
    LoadingTracker.endLoading(componentName, success);
    
    if (!success && errorData) {
      setError(errorData);
      logError(componentName, errorData);
      if (onError) {
        onError(errorData);
      }
    }
  }, [componentName, onError, timeoutId]);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeoutId]);

  return {
    loading,
    error,
    startLoading,
    endLoading,
    isLoading: loading
  };
}

// Helper hook for async operations with loading tracking
export function useAsyncWithTracking<T = any>(
  componentName: string,
  asyncOperation: () => Promise<T>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const { loading, error, startLoading, endLoading } = useTrackedLoading({
    componentName
  });

  useEffect(() => {
    let mounted = true;
    
    const execute = async () => {
      startLoading();
      try {
        const result = await asyncOperation();
        if (mounted) {
          setData(result);
          endLoading(true);
        }
      } catch (err) {
        if (mounted) {
          endLoading(false, err);
        }
      }
    };
    
    execute();
    
    return () => {
      mounted = false;
    };
  }, dependencies);

  return {
    data,
    loading,
    error,
    refetch: () => {
      startLoading();
      asyncOperation()
        .then((result) => {
          setData(result);
          endLoading(true);
        })
        .catch((err) => {
          endLoading(false, err);
        });
    }
  };
}
