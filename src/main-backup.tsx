import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { useWebVitals } from "./hooks/usePerformanceMonitor";
import { injectCriticalCSS, optimizeFontLoading } from "./lib/css-optimizer";

// Initialize performance optimizations
injectCriticalCSS();
optimizeFontLoading();

// Performance monitoring wrapper
const AppWithMonitoring = () => {
  useWebVitals();
  return <App />;
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppWithMonitoring />
  </StrictMode>,
);