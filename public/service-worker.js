// Service Worker for Nova AI PWA
// Provides offline support, caching, and background sync

const CACHE_NAME = 'nova-ai-v1';
const RUNTIME_CACHE = 'nova-ai-runtime-v1';
const API_CACHE = 'nova-ai-api-v1';

const ASSETS_TO_CACHE = [
  '/',
  '/chat',
  '/auth',
  '/offline.html'
];

// Install event - cache essential assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE && cacheName !== API_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // API requests - network first, fall back to cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(API_CACHE).then((cache) => {
            cache.put(request, clone);
          });
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // HTML pages - network first
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, clone);
          });
          return response;
        })
        .catch(() => 
          caches.match(request)
            .then((response) => response || caches.match('/offline.html'))
        )
    );
    return;
  }

  // Static assets - cache first
  if (request.method === 'GET') {
    event.respondWith(
      caches.match(request)
        .then((response) => {
          if (response) return response;
          return fetch(request).then((response) => {
            const clone = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, clone);
            });
            return response;
          });
        })
        .catch(() => caches.match('/offline.html'))
    );
    return;
  }
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-messages') {
    event.waitUntil(
      (async () => {
        try {
          // Get pending messages from IndexedDB
          const db = await openDB();
          const pendingMessages = await db.getAll('pendingMessages');
          
          // Send each pending message
          for (const msg of pendingMessages) {
            await fetch('/api/chat', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(msg)
            });
            await db.delete('pendingMessages', msg.id);
          }
        } catch (error) {
          console.error('[ServiceWorker] Sync error:', error);
        }
      })()
    );
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  const options = {
    badge: '/icon-192.png',
    icon: '/icon-192.png',
    ...data
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Nova AI', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((windows) => {
      const window = windows.find(w => w.url.includes('/chat'));
      if (window) {
        return window.focus();
      }
      return clients.openWindow('/chat');
    })
  );
});

// Helper to open IndexedDB
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('NovaAI', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pendingMessages')) {
        db.createObjectStore('pendingMessages', { keyPath: 'id' });
      }
    };
  });
}
