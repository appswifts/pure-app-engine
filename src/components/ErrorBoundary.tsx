import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
      errorCount: 0,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("Error caught by boundary:", error, errorInfo);
    }

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Update state with error details
    this.setState(prevState => ({
      errorInfo,
      errorCount: prevState.errorCount + 1,
    }));

    // Log to external service in production
    if (process.env.NODE_ENV === "production") {
      this.logErrorToService(error, errorInfo);
    }
  }

  logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    // This could be replaced with actual error logging service
    // like Sentry, LogRocket, etc.
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // Store in localStorage for debugging
    try {
      const errors = JSON.parse(localStorage.getItem("app_errors") || "[]");
      errors.push(errorData);
      // Keep only last 10 errors
      if (errors.length > 10) {
        errors.shift();
      }
      localStorage.setItem("app_errors", JSON.stringify(errors));
    } catch (e) {
      console.error("Failed to log error:", e);
    }
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return <>{this.props.fallback}</>;
      }

      const { error, errorInfo, errorCount } = this.state;
      const isDevelopment = process.env.NODE_ENV === "development";

      return (
        <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-primary/5 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 text-destructive">
                <AlertTriangle className="h-full w-full" />
              </div>
              <CardTitle className="text-2xl">Oops! Something went wrong</CardTitle>
              <CardDescription>
                We apologize for the inconvenience. The application encountered an unexpected error.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {errorCount > 2 && (
                <Alert className="border-orange-200 bg-orange-50">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-800">
                    Multiple errors detected. The application might be experiencing issues.
                    Please try refreshing the page or contact support if the problem persists.
                  </AlertDescription>
                </Alert>
              )}

              {isDevelopment && error && (
                <div className="space-y-2">
                  <div className="rounded-lg bg-muted p-4">
                    <h3 className="font-semibold text-sm mb-2">Error Details (Development Mode)</h3>
                    <p className="text-sm text-destructive font-mono">{error.message}</p>
                  </div>
                  
                  {error.stack && (
                    <details className="cursor-pointer">
                      <summary className="text-sm font-medium text-muted-foreground hover:text-foreground">
                        View Stack Trace
                      </summary>
                      <pre className="mt-2 text-xs bg-muted p-3 rounded-lg overflow-x-auto">
                        {error.stack}
                      </pre>
                    </details>
                  )}
                  
                  {errorInfo?.componentStack && (
                    <details className="cursor-pointer">
                      <summary className="text-sm font-medium text-muted-foreground hover:text-foreground">
                        View Component Stack
                      </summary>
                      <pre className="mt-2 text-xs bg-muted p-3 rounded-lg overflow-x-auto">
                        {errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              <div className="bg-muted/50 rounded-lg p-4">
                <h3 className="font-semibold text-sm mb-2">What can you do?</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Try refreshing the page</li>
                  <li>• Clear your browser cache and cookies</li>
                  <li>• Check your internet connection</li>
                  <li>• Contact support if the issue persists</li>
                </ul>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={this.handleReset}
                variant="default"
                className="w-full sm:w-auto"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
              <Button
                onClick={this.handleReload}
                variant="outline"
                className="w-full sm:w-auto"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Reload Page
              </Button>
              <Button
                onClick={this.handleGoHome}
                variant="outline"
                className="w-full sm:w-auto"
              >
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </Button>
              <Button
                onClick={() => window.location.href = "mailto:support@menuforest.com?subject=Error Report"}
                variant="outline"
                className="w-full sm:w-auto"
              >
                <Mail className="mr-2 h-4 w-4" />
                Contact Support
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
