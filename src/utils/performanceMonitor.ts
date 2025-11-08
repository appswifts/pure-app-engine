/**
 * Performance monitoring utility for tracking page load times
 */
export class PerformanceMonitor {
  private static loadTimes: Map<string, number[]> = new Map();
  
  /**
   * Track a page load time
   */
  static trackPageLoad(pageName: string, loadTime: number) {
    if (!this.loadTimes.has(pageName)) {
      this.loadTimes.set(pageName, []);
    }
    
    const times = this.loadTimes.get(pageName)!;
    times.push(loadTime);
    
    // Keep only last 100 measurements
    if (times.length > 100) {
      times.shift();
    }
    
    console.log(`⚡ ${pageName} loaded in ${loadTime.toFixed(2)}ms`);
  }
  
  /**
   * Get performance stats for a page
   */
  static getStats(pageName: string) {
    const times = this.loadTimes.get(pageName);
    if (!times || times.length === 0) {
      return null;
    }
    
    const sorted = [...times].sort((a, b) => a - b);
    const avg = times.reduce((sum, t) => sum + t, 0) / times.length;
    const median = sorted[Math.floor(sorted.length / 2)];
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    
    return {
      average: avg.toFixed(2),
      median: median.toFixed(2),
      min: min.toFixed(2),
      max: max.toFixed(2),
      p95: p95.toFixed(2),
      samples: times.length
    };
  }
  
  /**
   * Get all performance stats
   */
  static getAllStats() {
    const stats: Record<string, any> = {};
    
    for (const [page, _] of this.loadTimes) {
      stats[page] = this.getStats(page);
    }
    
    return stats;
  }
  
  /**
   * Clear all stats
   */
  static clear() {
    this.loadTimes.clear();
    console.log('✅ Performance stats cleared');
  }
  
  /**
   * Print a performance report
   */
  static printReport() {
    console.group('📊 Performance Report');
    
    for (const [page, _] of this.loadTimes) {
      const stats = this.getStats(page);
      if (stats) {
        console.group(`📄 ${page}`);
        console.table(stats);
        console.groupEnd();
      }
    }
    
    console.groupEnd();
  }
}

// Expose to window for debugging
if (typeof window !== 'undefined') {
  (window as any).PerformanceMonitor = PerformanceMonitor;
}
