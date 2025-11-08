const CACHE_NAME = 'menuforest-v1.0.0';
const STATIC_CACHE_NAME = 'menuforest-static-v1.0.0';
const DYNAMIC_CACHE_NAME = 'menuforest-dynamic-v1.0.0';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/menuforestlogo.png',
  '/placeholder.svg',
  // Add other critical static assets
];

// API endpoints to cache
const API_CACHE_PATTERNS = [
  /\/api\/restaurants/,
  /\/api\/menu/,
  /\/api\/categories/,
  /supabase\.co.*\/rest\/v1\/(restaurants|menu_items|categories)/,
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME && 
                cacheName !== DYNAMIC_CACHE_NAME &&
                cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http(s) URLs
  if (!request.url.startsWith('http://') && !request.url.startsWith('https://')) {
    return;
  }

  // Handle different types of requests with appropriate strategies
  if (request.destination === 'image') {
    // Images: Cache first with fallback
    event.respondWith(cacheFirstStrategy(request, DYNAMIC_CACHE_NAME));
  } else if (API_CACHE_PATTERNS.some(pattern => pattern.test(request.url))) {
    // API calls: Network first with cache fallback
    event.respondWith(networkFirstStrategy(request, DYNAMIC_CACHE_NAME));
  } else if (request.destination === 'document') {
    // HTML pages: Network first for freshness
    event.respondWith(networkFirstStrategy(request, STATIC_CACHE_NAME));
  } else {
    // Static assets: Cache first
    event.respondWith(cacheFirstStrategy(request, STATIC_CACHE_NAME));
  }
});

// Cache first strategy - good for static assets and images
async function cacheFirstStrategy(request, cacheName) {
  try {
    // Skip non-http(s) URLs
    if (!request.url.startsWith('http://') && !request.url.startsWith('https://')) {
      return fetch(request);
    }
    
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // Return cached version and update in background
      updateCacheInBackground(request, cache);
      return cachedResponse;
    }
    
    // Not in cache, fetch from network
    const networkResponse = await fetch(request);
    
    // Only cache valid, same-origin or CORS-enabled responses
    if (networkResponse.ok && isCacheable(networkResponse)) {
      try {
        cache.put(request, networkResponse.clone());
      } catch (error) {
        // Silently fail cache.put() errors (e.g., opaque responses)
        console.warn('Failed to cache:', request.url, error.message);
      }
    }
    
    return networkResponse;
  } catch (error) {
    // Return fallback for images
    if (request.destination === 'image') {
      return caches.match('/placeholder.svg');
    }
    throw error;
  }
}

// Network first strategy - good for API calls and HTML
async function networkFirstStrategy(request, cacheName) {
  try {
    // Skip non-http(s) URLs
    if (!request.url.startsWith('http://') && !request.url.startsWith('https://')) {
      return fetch(request);
    }
    
    const networkResponse = await fetch(request);
    
    // Only cache valid, same-origin or CORS-enabled responses
    if (networkResponse.ok && isCacheable(networkResponse)) {
      const cache = await caches.open(cacheName);
      try {
        cache.put(request, networkResponse.clone());
      } catch (error) {
        // Silently fail cache.put() errors (e.g., opaque responses)
        console.warn('Failed to cache:', request.url, error.message);
      }
    }
    
    return networkResponse;
  } catch (error) {
    // Network failed, try cache
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // No cache available, return offline page for HTML requests
    if (request.destination === 'document') {
      return caches.match('/offline.html') || new Response('Offline', { status: 503 });
    }
    
    throw error;
  }
}

// Background cache update
async function updateCacheInBackground(request, cache) {
  try {
    // Skip non-http(s) URLs
    if (!request.url.startsWith('http://') && !request.url.startsWith('https://')) {
      return;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse.ok && isCacheable(networkResponse)) {
      try {
        cache.put(request, networkResponse.clone());
      } catch (error) {
        // Silently fail cache.put() errors
        console.warn('Failed to update cache:', request.url, error.message);
      }
    }
  } catch (error) {
    // Silently fail background updates
  }
}

// Helper function to check if a response can be cached
function isCacheable(response) {
  // Don't cache opaque responses (cross-origin requests without CORS)
  if (response.type === 'opaque') {
    return false;
  }
  
  // Don't cache error responses
  if (!response.ok) {
    return false;
  }
  
  // Don't cache POST responses
  if (response.status === 206) {
    return false;
  }
  
  // Cache successful responses with proper headers
  return true;
}

// Handle background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(handleBackgroundSync());
  }
});

async function handleBackgroundSync() {
  // Handle offline actions when connection is restored
  const pendingActions = await getStoredActions();
  
  for (const action of pendingActions) {
    try {
      await fetch(action.url, action.options);
      await removeStoredAction(action.id);
    } catch (error) {
      // Keep action for next sync
    }
  }
}

// Utility functions for offline action storage
async function getStoredActions() {
  // Implementation would depend on IndexedDB or other storage
  return [];
}

async function removeStoredAction(id) {
  // Implementation would depend on IndexedDB or other storage
}
