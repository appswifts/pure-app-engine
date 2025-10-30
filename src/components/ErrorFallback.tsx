import { AlertCircle, RefreshCw, WifiOff, Database, Shield, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export type ErrorType = 
  | "network" 
  | "permission" 
  | "not-found" 
  | "timeout" 
  | "database" 
  | "validation" 
  | "general";

interface ErrorFallbackProps {
  error?: Error;
  errorType?: ErrorType;
  resetError?: () => void;
  customMessage?: string;
  showDetails?: boolean;
}

const errorConfigs = {
  network: {
    icon: WifiOff,
    title: "Connection Problem",
    description: "We're having trouble connecting to our servers. Please check your internet connection and try again.",
    suggestions: [
      "Check your internet connection",
      "Try disabling VPN if you're using one",
      "Clear browser cache and cookies",
      "Try again in a few moments"
    ]
  },
  permission: {
    icon: Shield,
    title: "Access Denied",
    description: "You don't have permission to access this resource. Please check your account status or contact support.",
    suggestions: [
      "Verify you're logged in with the correct account",
      "Check your subscription status",
      "Contact support if you believe this is an error"
    ]
  },
  "not-found": {
    icon: AlertCircle,
    title: "Not Found",
    description: "The resource you're looking for doesn't exist or has been moved.",
    suggestions: [
      "Check the URL for typos",
      "The item might have been deleted",
      "Try navigating from the main menu"
    ]
  },
  timeout: {
    icon: Clock,
    title: "Request Timeout",
    description: "The operation took too long to complete. This might be due to slow network or high server load.",
    suggestions: [
      "Check your internet speed",
      "Try again during off-peak hours",
      "Refresh the page and retry"
    ]
  },
  database: {
    icon: Database,
    title: "Database Error",
    description: "We encountered an issue with our database. Our team has been notified.",
    suggestions: [
      "Try refreshing the page",
      "Your data is safe",
      "If the problem persists, contact support"
    ]
  },
  validation: {
    icon: AlertCircle,
    title: "Invalid Data",
    description: "The data provided doesn't meet our requirements. Please check your input and try again.",
    suggestions: [
      "Review the form for errors",
      "Ensure all required fields are filled",
      "Check data formats (dates, numbers, etc.)"
    ]
  },
  general: {
    icon: AlertCircle,
    title: "Something Went Wrong",
    description: "An unexpected error occurred. We apologize for the inconvenience.",
    suggestions: [
      "Try refreshing the page",
      "Clear your browser cache",
      "Try again in a few moments",
      "Contact support if the issue persists"
    ]
  }
};

export default function ErrorFallback({
  error,
  errorType = "general",
  resetError,
  customMessage,
  showDetails = false
}: ErrorFallbackProps) {
  const config = errorConfigs[errorType];
  const Icon = config.icon;

  // Determine error type from error message if not provided
  const getErrorType = (error?: Error): ErrorType => {
    if (!error) return errorType;
    
    const message = error.message.toLowerCase();
    
    if (message.includes("network") || message.includes("fetch")) return "network";
    if (message.includes("permission") || message.includes("unauthorized") || message.includes("403")) return "permission";
    if (message.includes("not found") || message.includes("404")) return "not-found";
    if (message.includes("timeout")) return "timeout";
    if (message.includes("database") || message.includes("supabase")) return "database";
    if (message.includes("validation") || message.includes("invalid")) return "validation";
    
    return errorType;
  };

  const finalErrorType = getErrorType(error);
  const finalConfig = errorConfigs[finalErrorType];
  const FinalIcon = finalConfig.icon;

  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 text-muted-foreground">
            <FinalIcon className="h-full w-full" />
          </div>
          <CardTitle>{customMessage || finalConfig.title}</CardTitle>
          <CardDescription>{finalConfig.description}</CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-medium text-sm mb-2">Suggestions:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              {finalConfig.suggestions.map((suggestion, index) => (
                <li key={index}>• {suggestion}</li>
              ))}
            </ul>
          </div>

          {showDetails && error && process.env.NODE_ENV === "development" && (
            <details className="cursor-pointer">
              <summary className="text-sm font-medium text-muted-foreground hover:text-foreground">
                Technical Details (Development)
              </summary>
              <div className="mt-2 p-3 bg-muted rounded-lg">
                <p className="text-xs font-mono text-destructive break-all">
                  {error.message}
                </p>
                {error.stack && (
                  <pre className="mt-2 text-xs overflow-x-auto">
                    {error.stack.split('\n').slice(0, 5).join('\n')}
                  </pre>
                )}
              </div>
            </details>
          )}
        </CardContent>

        <CardFooter className="flex gap-2">
          {resetError && (
            <Button onClick={resetError} className="flex-1">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          )}
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline"
            className="flex-1"
          >
            Reload Page
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
