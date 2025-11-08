import { useState, useEffect } from 'react';
import { LoadingTracker, getDebugInfo } from '@/utils/debugUtils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, RefreshCw, Download, Bug } from 'lucide-react';

export function LoadingDebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    // Check for debug mode in URL params or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const debugMode = urlParams.get('debug') === 'true' || 
                      localStorage.getItem('debugMode') === 'true';
    
    if (debugMode) {
      setIsOpen(true);
    }

    // Update debug info every second when panel is open
    if (isOpen) {
      const interval = setInterval(() => {
        setDebugInfo(getDebugInfo());
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [isOpen, refreshKey]);

  const refresh = () => {
    setRefreshKey(prev => prev + 1);
    setDebugInfo(getDebugInfo());
  };

  const downloadLog = () => {
    const log = {
      ...getDebugInfo(),
      timestamp: new Date().toISOString(),
      localStorage: { ...localStorage },
      sessionStorage: { ...sessionStorage }
    };
    
    const blob = new Blob([JSON.stringify(log, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debug-log-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 shadow-lg"
        size="sm"
        variant="outline"
      >
        <Bug className="h-4 w-4 mr-2" />
        Debug
      </Button>
    );
  }

  const loadingStates = debugInfo?.loadingStates || {};
  const activeLoading = Object.entries(loadingStates).filter(
    ([_, state]: [string, any]) => state.isLoading
  );
  const completedWithErrors = Object.entries(loadingStates).filter(
    ([_, state]: [string, any]) => state.errors.length > 0
  );

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-96 max-h-[80vh] overflow-y-auto shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-sm font-medium">Loading Debug Panel</CardTitle>
        <div className="flex gap-2">
          <Button onClick={refresh} size="icon" variant="ghost" className="h-6 w-6">
            <RefreshCw className="h-3 w-3" />
          </Button>
          <Button onClick={downloadLog} size="icon" variant="ghost" className="h-6 w-6">
            <Download className="h-3 w-3" />
          </Button>
          <Button 
            onClick={() => setIsOpen(false)} 
            size="icon" 
            variant="ghost"
            className="h-6 w-6"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-xs">
        {/* Active Loading States */}
        {activeLoading.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2 text-yellow-600">
              Active Loading ({activeLoading.length})
            </h4>
            {activeLoading.map(([component, state]: [string, any]) => {
              const duration = Date.now() - state.startTime;
              return (
                <div key={component} className="bg-yellow-50 p-2 rounded mb-2">
                  <div className="font-medium">{component}</div>
                  <div className="text-muted-foreground">
                    Loading for {(duration / 1000).toFixed(1)}s
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Components with Errors */}
        {completedWithErrors.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2 text-red-600">
              Components with Errors ({completedWithErrors.length})
            </h4>
            {completedWithErrors.map(([component, state]: [string, any]) => (
              <div key={component} className="bg-red-50 p-2 rounded mb-2">
                <div className="font-medium">{component}</div>
                {state.errors.map((error: any, idx: number) => (
                  <div key={idx} className="text-red-600 mt-1">
                    {error?.message || String(error)}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* All Loading States */}
        <div>
          <h4 className="font-semibold mb-2">All Components</h4>
          <div className="space-y-1">
            {Object.entries(loadingStates).map(([component, state]: [string, any]) => {
              const duration = state.completedTime 
                ? state.completedTime - state.startTime 
                : Date.now() - state.startTime;
              
              return (
                <div 
                  key={component} 
                  className={`flex justify-between p-1 rounded ${
                    state.isLoading ? 'bg-yellow-50' : 
                    state.errors.length > 0 ? 'bg-red-50' : 
                    'bg-green-50'
                  }`}
                >
                  <span>{component}</span>
                  <span className="text-muted-foreground">
                    {(duration / 1000).toFixed(1)}s
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* System Info */}
        <div className="pt-2 border-t">
          <div className="text-muted-foreground">
            URL: {debugInfo?.url}
          </div>
          <div className="text-muted-foreground">
            Time: {new Date(debugInfo?.timestamp).toLocaleTimeString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
