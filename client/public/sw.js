const CACHE_NAME = 'kaiveni-v1';
const OFFLINE_URL = '/offline.html';

// Assets to cache immediately
const ESSENTIAL_ASSETS = [
  '/',
  '/manifest.json',
  '/offline.html',
  // Core CSS and JS will be cached dynamically
];

// Routes that should work offline
const OFFLINE_ROUTES = [
  '/',
  '/auth',
  '/profile',
  '/coins',
  '/browse',
];

// API routes that should be cached for offline viewing
const CACHEABLE_API_ROUTES = [
  '/api/user',
  '/api/settings',
  '/api/atolls',
];

// Install event - cache essential assets
self.addEventListener('install', (event) => {
  console.log('[SW] Install event');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching essential assets');
        return cache.addAll(ESSENTIAL_ASSETS);
      })
      .then(() => {
        // Skip waiting to activate immediately
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Failed to cache essential assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activate event');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        // Take control of all clients immediately
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
  
  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Handle different types of requests with appropriate strategies
  if (url.pathname.startsWith('/api/')) {
    // API requests - Network First with cache fallback
    event.respondWith(handleApiRequest(request));
  } else if (url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2)$/)) {
    // Static assets - Cache First
    event.respondWith(handleStaticAssets(request));
  } else {
    // Navigation requests - Network First with offline fallback
    event.respondWith(handleNavigation(request));
  }
});

// Handle API requests with Network First strategy
async function handleApiRequest(request) {
  const url = new URL(request.url);
  
  try {
    // Always try network first for API requests
    const networkResponse = await fetch(request);
    
    // Cache successful GET requests for certain endpoints
    if (networkResponse.ok && CACHEABLE_API_ROUTES.some(route => url.pathname.startsWith(route))) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed for API request, trying cache:', url.pathname);
    
    // For critical endpoints, try to return cached version
    if (CACHEABLE_API_ROUTES.some(route => url.pathname.startsWith(route))) {
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
    }
    
    // Return a proper API error response
    return new Response(
      JSON.stringify({ 
        message: 'Network unavailable. Please check your connection and try again.',
        offline: true 
      }),
      { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Handle static assets with Cache First strategy
async function handleStaticAssets(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If not in cache, fetch from network and cache
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Failed to load static asset:', request.url);
    // For critical assets, you might want to return a fallback
    throw error;
  }
}

// Handle navigation requests with Network First and offline fallback
async function handleNavigation(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // Cache successful navigation responses
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed for navigation, trying cache:', request.url);
    
    // Try to return cached version
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // For SPA routes, return the main app
    const url = new URL(request.url);
    if (OFFLINE_ROUTES.includes(url.pathname) || url.pathname.startsWith('/')) {
      const appResponse = await caches.match('/');
      if (appResponse) {
        return appResponse;
      }
    }
    
    // Last resort - return offline page if available
    const offlineResponse = await caches.match(OFFLINE_URL);
    if (offlineResponse) {
      return offlineResponse;
    }
    
    // If nothing works, return a basic offline message
    return new Response(
      `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Kaiveni - Offline</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 2rem;
            background: linear-gradient(135deg, #A8E6CF 0%, #AED6F1 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
          }
          .container {
            background: white;
            padding: 2rem;
            border-radius: 1rem;
            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
            max-width: 400px;
          }
          h1 { color: #2d3748; margin-bottom: 1rem; }
          p { color: #4a5568; margin-bottom: 1.5rem; }
          .heart { font-size: 2rem; margin-bottom: 1rem; }
          .retry-btn {
            background: linear-gradient(135deg, #A8E6CF 0%, #AED6F1 100%);
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 0.5rem;
            cursor: pointer;
            font-weight: 600;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="heart">💙</div>
          <h1>Kaiveni</h1>
          <p>You're offline. Please check your internet connection to continue finding your perfect match.</p>
          <button class="retry-btn" onclick="window.location.reload()">Try Again</button>
        </div>
      </body>
      </html>`,
      {
        status: 200,
        headers: { 'Content-Type': 'text/html' }
      }
    );
  }
}

// Background sync for failed requests (if supported)
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync event:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Here you could implement background sync for critical operations
  // like posting messages or updating profile when connection is restored
  console.log('[SW] Performing background sync');
  
  try {
    // Check if we're back online
    const response = await fetch('/api/user');
    if (response.ok) {
      console.log('[SW] Connection restored');
      
      // Notify all clients that we're back online
      const clients = await self.clients.matchAll();
      clients.forEach(client => {
        client.postMessage({ type: 'ONLINE_STATUS', online: true });
      });
    }
  } catch (error) {
    console.log('[SW] Still offline during background sync');
  }
}

// Push notification handling (for future features)
self.addEventListener('push', (event) => {
  console.log('[SW] Push message received');
  
  const options = {
    body: 'You have a new connection request!',
    icon: '/manifest-icon-192.png',
    badge: '/manifest-icon-192.png',
    tag: 'kaiveni-notification',
    data: {
      url: '/'
    }
  };
  
  if (event.data) {
    try {
      const data = event.data.json();
      options.body = data.message || options.body;
      options.data.url = data.url || options.data.url;
    } catch (e) {
      console.error('[SW] Error parsing push data:', e);
    }
  }
  
  event.waitUntil(
    self.registration.showNotification('Kaiveni', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked');
  
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll().then((clientList) => {
      // Try to focus existing window
      for (const client of clientList) {
        if (client.url === event.notification.data.url && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Open new window if no existing window found
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data.url);
      }
    })
  );
});

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

// Error handling
self.addEventListener('error', (event) => {
  console.error('[SW] Error occurred:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('[SW] Unhandled promise rejection:', event.reason);
});

console.log('[SW] Service Worker loaded successfully');
