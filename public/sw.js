// Mobile-optimized Service Worker for New Steps Project
const CACHE_NAME = 'new-steps-mobile-v1';
const STATIC_CACHE = 'new-steps-static-v1';

// Critical resources to cache for mobile (PUBLIC ONLY - no admin/auth)
const CRITICAL_RESOURCES = [
  '/',
  '/shoes',
  '/about',
  '/donate',
  '/get-involved',
  '/images/logo-optimized.jpg',
  '/images/home_photo-400w.webp',
  '/images/aboutus-400w.webp',
  '/manifest.json'
];

// API endpoints to cache for offline functionality (PUBLIC ONLY - no admin)
const API_CACHE_PATTERNS = [
  '/api/shoes',
  '/api/health'
];

// ROUTES TO NEVER CACHE - Admin, Auth, Account routes
const NEVER_CACHE_PATTERNS = [
  '/admin',
  '/api/admin',
  '/login',
  '/api/auth', 
  '/account',
  '/api/user'
];

// Helper function to check if URL should never be cached
function shouldNeverCache(url) {
  return NEVER_CACHE_PATTERNS.some(pattern => url.pathname.startsWith(pattern));
}

// Install event - cache critical resources
self.addEventListener('install', event => {
  event.waitUntil(
    Promise.all([
      // Cache static resources
      caches.open(STATIC_CACHE).then(cache => {
        return cache.addAll(CRITICAL_RESOURCES);
      }),
      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE) {
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control immediately
      self.clients.claim()
    ])
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin requests
  if (url.origin !== location.origin) {
    return;
  }
  
  // NEVER CACHE admin, auth, or account routes - always go to network
  if (shouldNeverCache(url)) {
    console.log('🚫 SW: NEVER CACHE route:', url.pathname);
    event.respondWith(
      fetch(request, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      })
    );
    return;
  }

  // API requests - Network First with cache fallback (PUBLIC ONLY)
  if (API_CACHE_PATTERNS.some(pattern => url.pathname.startsWith(pattern))) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Cache successful API responses
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache if network fails
          return caches.match(request);
        })
    );
    return;
  }

  // Static resources - Cache First
  if (request.destination === 'image' || 
      request.destination === 'style' || 
      request.destination === 'script' ||
      url.pathname.startsWith('/images/')) {
    event.respondWith(
      caches.match(request).then(response => {
        if (response) {
          return response;
        }
        
        return fetch(request).then(response => {
          // Cache successful responses
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(STATIC_CACHE).then(cache => {
              cache.put(request, responseClone);
            });
          }
          return response;
        });
      })
    );
    return;
  }

  // HTML pages - Network First with cache fallback (PUBLIC ONLY)
  if (request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Only cache PUBLIC pages (not admin/auth/account)
          if (response.ok && !shouldNeverCache(url)) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache or offline page (but not for never-cache routes)
          if (!shouldNeverCache(url)) {
            return caches.match(request).then(response => {
              if (response) {
                return response;
              }
              // Return cached homepage as fallback
              return caches.match('/');
            });
          }
          // For never-cache routes, don't provide fallback
          throw new Error('Network unavailable for secure route');
        })
    );
    return;
  }

  // Default: Network only for other requests
});

// Background sync for offline actions (if supported)
if ('sync' in self.registration) {
  self.addEventListener('sync', event => {
    if (event.tag === 'background-sync') {
      event.waitUntil(
        // Handle background sync tasks
        console.log('Background sync triggered')
      );
    }
  });
}

// Push notifications (if supported)
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body,
      icon: '/images/logo-optimized.jpg',
      badge: '/images/logo-optimized.jpg',
      vibrate: [200, 100, 200],
      data: data.data || {},
      actions: data.actions || []
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Notification click handling
self.addEventListener('notificationclick', event => {
  event.notification.close();

  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});

// Error handling
self.addEventListener('error', event => {
  console.error('Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', event => {
  console.error('Service Worker unhandled rejection:', event.reason);
}); 