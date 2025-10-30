// CSS optimization utilities for removing unused styles and improving performance

export const criticalCSS = `
/* Critical CSS for above-the-fold content */
.loading-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Critical layout styles */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.btn-primary {
  background-color: #F97316;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-primary:hover {
  background-color: #EA580C;
}
`;

// Function to inject critical CSS inline
export const injectCriticalCSS = () => {
  if (typeof document === 'undefined') return;
  
  const style = document.createElement('style');
  style.textContent = criticalCSS;
  style.setAttribute('data-critical', 'true');
  document.head.appendChild(style);
};

// Remove unused CSS classes (development helper)
export const analyzeUnusedCSS = () => {
  if (process.env.NODE_ENV !== 'development') return;
  
  const allStyleSheets = Array.from(document.styleSheets);
  const usedSelectors = new Set<string>();
  const unusedSelectors: string[] = [];
  
  allStyleSheets.forEach(sheet => {
    try {
      const rules = Array.from(sheet.cssRules || sheet.rules || []);
      rules.forEach((rule: any) => {
        if (rule.selectorText) {
          const selector = rule.selectorText;
          try {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
              usedSelectors.add(selector);
            } else {
              unusedSelectors.push(selector);
            }
          } catch (e) {
            // Invalid selector, skip
          }
        }
      });
    } catch (e) {
      // Cross-origin or other issues, skip
    }
  });
  
  
  return { used: usedSelectors, unused: unusedSelectors };
};

// Optimize font loading
export const optimizeFontLoading = () => {
  if (typeof document === 'undefined') return;
  
  // Add font-display: swap to existing font faces for better performance
  const style = document.createElement('style');
  style.textContent = `
    @font-face {
      font-family: 'Inter';
      font-display: swap;
    }
  `;
  document.head.appendChild(style);
};

// Lazy load non-critical CSS
export const lazyLoadCSS = (href: string, media = 'all') => {
  if (typeof document === 'undefined') return;
  
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  link.media = 'print'; // Load as print first (non-blocking)
  
  link.onload = () => {
    link.media = media; // Switch to target media when loaded
  };
  
  document.head.appendChild(link);
};
