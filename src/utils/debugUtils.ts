// Debug utilities for tracking loading states and errors
export class LoadingTracker {
  private static loadingStates: Map<string, { 
    isLoading: boolean; 
    startTime: number; 
    errors: any[];
    completedTime?: number;
    performanceStartTime?: number;
  }> = new Map();

  static startLoading(component: string) {
    console.log(`🔄 [${component}] Loading started at ${new Date().toISOString()}`);
    this.loadingStates.set(component, {
      isLoading: true,
      startTime: Date.now(),
      performanceStartTime: performance.now(),
      errors: []
    });
  }

  static endLoading(component: string, success: boolean = true) {
    const state = this.loadingStates.get(component);
    if (state) {
      const performanceDuration = state.performanceStartTime 
        ? performance.now() - state.performanceStartTime 
        : Date.now() - state.startTime;
      console.log(`${success ? '✅' : '❌'} [${component}] Loading ${success ? 'completed' : 'failed'} in ${Math.round(performanceDuration)}ms`);
      state.isLoading = false;
      state.completedTime = Date.now();
    }
  }

  static addError(component: string, error: any) {
    const state = this.loadingStates.get(component);
    if (state) {
      state.errors.push(error);
      console.error(`🚨 [${component}] Error:`, error);
    }
  }

  static getLoadingState(component: string) {
    return this.loadingStates.get(component);
  }

  static getAllStates() {
    const states: any = {};
    this.loadingStates.forEach((value, key) => {
      states[key] = value;
    });
    return states;
  }

  static reset() {
    this.loadingStates.clear();
  }
}

// Enhanced error logging
export function logError(component: string, error: any, context?: any) {
  console.group(`🚨 Error in ${component}`);
  console.error('Error:', error);
  if (context) {
    console.log('Context:', context);
  }
  console.trace();
  console.groupEnd();
  
  LoadingTracker.addError(component, error);
}

// Debug info component helper
export function getDebugInfo() {
  return {
    loadingStates: LoadingTracker.getAllStates(),
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href
  };
}
