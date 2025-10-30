import { ChefHat } from "lucide-react";

interface LoadingSpinnerProps {
  message?: string;
  fullScreen?: boolean;
}

export const LoadingSpinner = ({ message = "Loading...", fullScreen = false }: LoadingSpinnerProps) => {
  const content = (
    <div className="flex flex-col items-center justify-center space-y-4 p-8">
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-400 to-orange-600 opacity-20 blur-xl animate-pulse"></div>
        <div className="relative bg-white rounded-full p-4 shadow-lg">
          <ChefHat className="h-12 w-12 text-orange-500 animate-bounce" />
        </div>
      </div>
      <div className="text-center space-y-2">
        <p className="text-lg font-medium text-gray-900">{message}</p>
        <div className="flex items-center justify-center space-x-1">
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
        </div>
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
};
