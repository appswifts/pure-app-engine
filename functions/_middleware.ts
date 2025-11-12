// Cloudflare Pages Functions Middleware
// Advanced caching and optimization for restaurant menu app

interface Env {
  ASSETS: any;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, next, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  // Add security headers
  const securityHeaders = {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  };

  // Check if this is a static asset
  const staticExtensions = ['.js', '.css', '.woff', '.woff2', '.ttf', '.jpg', '.jpeg', '.png', '.webp', '.svg', '.ico'];
  const isStaticAsset = staticExtensions.some(ext => path.endsWith(ext));

  // Check if this is an API call (Supabase or other)
  const isApiCall = path.startsWith('/api/') || url.hostname.includes('supabase.co');

  // For API calls, pass through without caching
  if (isApiCall) {
    const response = await next();
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        ...Object.fromEntries(response.headers),
        ...securityHeaders,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  }

  // Get the response
  const response = await next();

  // Clone response for modification
  const newHeaders = new Headers(response.headers);

  // Add security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    newHeaders.set(key, value);
  });

  // Set cache headers based on file type
  if (isStaticAsset) {
    if (path.match(/\.(js|css|woff2?|ttf)$/)) {
      // Long cache for hashed assets
      newHeaders.set('Cache-Control', 'public, max-age=31536000, immutable');
    } else if (path.match(/\.(jpg|jpeg|png|webp|svg|ico)$/)) {
      // Medium cache for images (30 days)
      newHeaders.set('Cache-Control', 'public, max-age=2592000, s-maxage=2592000');
    }
  } else if (path.endsWith('.html') || path === '/' || !path.includes('.')) {
    // Short cache for HTML and SPA routes (1 hour)
    newHeaders.set('Cache-Control', 'public, max-age=3600, s-maxage=3600, must-revalidate');
  }

  // Enable CORS for assets if needed
  if (isStaticAsset) {
    newHeaders.set('Access-Control-Allow-Origin', '*');
    newHeaders.set('Cross-Origin-Resource-Policy', 'cross-origin');
  }

  // Add performance headers
  newHeaders.set('X-Content-Type-Options', 'nosniff');
  
  // Enable early hints for faster loading
  if (path === '/' || path.endsWith('.html')) {
    newHeaders.set('Link', '</assets/index.css>; rel=preload; as=style, </assets/index.js>; rel=preload; as=script');
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
};
