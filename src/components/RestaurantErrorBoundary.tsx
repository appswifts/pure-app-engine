import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, RefreshCw, Home, Database, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

class RestaurantErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('RestaurantErrorBoundary caught error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  toggleDetails = () => {
    this.setState(prev => ({ showDetails: !prev.showDetails }));
  };

  getErrorType = (error: Error): string => {
    const message = error.message.toLowerCase();
    
    if (message.includes('restaurant') && message.includes('not found')) {
      return 'restaurant_not_found';
    }
    if (message.includes('409') || message.includes('conflict') || message.includes('duplicate')) {
      return 'duplicate_restaurant';
    }
    if (message.includes('permission') || message.includes('unauthorized')) {
      return 'permission_denied';
    }
    if (message.includes('network') || message.includes('fetch')) {
      return 'network_error';
    }
    if (message.includes('database') || message.includes('pgrst')) {
      return 'database_error';
    }
    
    return 'unknown_error';
  };

  getErrorMessage = (errorType: string): { title: string; description: string; action: string } => {
    switch (errorType) {
      case 'restaurant_not_found':
        return {
          title: 'Restaurant Not Found',
          description: 'Your restaurant profile could not be loaded. This might be because it hasn\'t been created yet or there was an issue during setup.',
          action: 'Return to dashboard to set up your restaurant profile.',
        };
      case 'duplicate_restaurant':
        return {
          title: 'Duplicate Restaurant Detected',
          description: 'Multiple restaurant profiles were found for your account. This has been handled automatically, but you may need to refresh the page.',
          action: 'Reload the page to continue.',
        };
      case 'permission_denied':
        return {
          title: 'Access Denied',
          description: 'You don\'t have permission to access this restaurant\'s data. Please make sure you\'re logged in with the correct account.',
          action: 'Return to login or contact support if this is your restaurant.',
        };
      case 'network_error':
        return {
          title: 'Connection Error',
          description: 'Unable to connect to the server. Please check your internet connection and try again.',
          action: 'Reload the page when your connection is restored.',
        };
      case 'database_error':
        return {
          title: 'Database Error',
          description: 'There was an issue communicating with the database. This is usually temporary.',
          action: 'Reload the page to try again.',
        };
      default:
        return {
          title: 'Something Went Wrong',
          description: 'An unexpected error occurred while loading your restaurant data.',
          action: 'Try reloading the page or return to the dashboard.',
        };
    }
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const errorType = this.getErrorType(this.state.error);
      const errorMessages = this.getErrorMessage(errorType);

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-accent/10 to-primary/5">
          <Card className="max-w-2xl w-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-destructive/10 rounded-full">
                  <AlertCircle className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <CardTitle className="text-2xl">{errorMessages.title}</CardTitle>
                  <CardDescription>{errorMessages.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <Alert>
                <Database className="h-4 w-4" />
                <AlertTitle>What you can do:</AlertTitle>
                <AlertDescription>{errorMessages.action}</AlertDescription>
              </Alert>

              {/* Error Details (Collapsible) */}
              <div className="border rounded-lg">
                <button
                  onClick={this.toggleDetails}
                  className="w-full flex items-center justify-between p-4 text-sm font-medium hover:bg-accent/50 transition-colors"
                >
                  <span>Technical Details</span>
                  {this.state.showDetails ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
                
                {this.state.showDetails && (
                  <div className="p-4 pt-0 space-y-3">
                    <div>
                      <p className="text-sm font-medium mb-1">Error Type:</p>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {errorType}
                      </code>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium mb-1">Error Message:</p>
                      <code className="text-xs bg-muted px-2 py-1 rounded block overflow-x-auto">
                        {this.state.error.message}
                      </code>
                    </div>

                    {this.state.errorInfo && (
                      <div>
                        <p className="text-sm font-medium mb-1">Stack Trace:</p>
                        <pre className="text-xs bg-muted px-3 py-2 rounded overflow-x-auto max-h-48">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>

            <CardFooter className="flex gap-3">
              <Button onClick={this.handleReload} variant="default" className="flex-1">
                <RefreshCw className="h-4 w-4 mr-2" />
                Reload Page
              </Button>
              <Button onClick={this.handleGoHome} variant="outline" className="flex-1">
                <Home className="h-4 w-4 mr-2" />
                Go to Dashboard
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default RestaurantErrorBoundary;
