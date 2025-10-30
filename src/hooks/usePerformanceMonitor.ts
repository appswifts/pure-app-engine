import { useEffect, useRef, useCallback } from 'react';

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage?: number;
  componentMounts: number;
  rerenders: number;
}

export const usePerformanceMonitor = (componentName: string) => {
  const renderStartTime = useRef<number>(0);
  const mountCount = useRef<number>(0);
  const rerenderCount = useRef<number>(0);
  const metricsRef = useRef<PerformanceMetrics>({
    renderTime: 0,
    componentMounts: 0,
    rerenders: 0,
  });

  // Start performance measurement
  const startMeasurement = useCallback(() => {
    renderStartTime.current = performance.now();
  }, []);

  // End performance measurement
  const endMeasurement = useCallback(() => {
    const renderTime = performance.now() - renderStartTime.current;
    metricsRef.current.renderTime = renderTime;
    
    // Log slow renders in development
    if (process.env.NODE_ENV === 'development' && renderTime > 16) {
    }
  }, [componentName]);

  // Track component lifecycle
  useEffect(() => {
    mountCount.current += 1;
    metricsRef.current.componentMounts = mountCount.current;
    
    return () => {
      // Cleanup on unmount
      if (process.env.NODE_ENV === 'development') {
      }
    };
  }, [componentName]);

  // Track rerenders
  useEffect(() => {
    rerenderCount.current += 1;
    metricsRef.current.rerenders = rerenderCount.current;
  });

  // Memory usage tracking
  const trackMemoryUsage = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      metricsRef.current.memoryUsage = memory.usedJSHeapSize / 1024 / 1024; // MB
    }
  }, []);

  return {
    startMeasurement,
    endMeasurement,
    trackMemoryUsage,
    metrics: metricsRef.current,
  };
};

// Memory leak detection hook
export const useMemoryLeakDetection = () => {
  const intervalRef = useRef<NodeJS.Timeout>();
  const initialMemory = useRef<number>(0);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    // Track initial memory
    if ('memory' in performance) {
      initialMemory.current = (performance as any).memory.usedJSHeapSize;
    }

    // Check memory usage every 30 seconds
    intervalRef.current = setInterval(() => {
      if ('memory' in performance) {
        const currentMemory = (performance as any).memory.usedJSHeapSize;
        const memoryIncrease = (currentMemory - initialMemory.current) / 1024 / 1024;
        
        if (memoryIncrease > 50) { // 50MB increase
        }
      }
    }, 30000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);
};

// Performance observer for Core Web Vitals
export const useWebVitals = () => {
  useEffect(() => {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

    // Largest Contentful Paint
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as any;
      if (lastEntry) {
      }
    });

    // First Input Delay
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        const fid = entry.processingStart - entry.startTime;
      });
    });

    // Cumulative Layout Shift
    const clsObserver = new PerformanceObserver((list) => {
      let clsValue = 0;
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
    });

    try {
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      fidObserver.observe({ entryTypes: ['first-input'] });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (error) {
      // Silently fail if observers are not supported
    }

    return () => {
      lcpObserver.disconnect();
      fidObserver.disconnect();
      clsObserver.disconnect();
    };
  }, []);
};
