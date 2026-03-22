// File: public/service-worker.js
const CACHE_NAME = "my-app-cache-v1.0.83";
const VERSION = "1.0.83"; // Extract version for cache busting // Extract version for cache busting // Extract version for cache busting // Extract version for cache busting // Extract version for cache busting // Extract version for cache busting // Extract version for cache busting // Extract version for cache busting // Extract version for cache busting // Extract version for cache busting // Extract version for cache busting // Extract version for cache busting // Extract version for cache busting // Extract version for cache busting // Extract version for cache busting // Extract version for cache busting // Extract version for cache busting // Extract version for cache busting // Extract version for cache busting // Extract version for cache busting // Extract version for cache busting // Extract version for cache busting // Extract version for cache busting // Extract version for cache busting // Extract version for cache busting // Extract version for cache busting // Extract version for cache busting // Extract version for cache busting // Extract version for cache busting // Extract version for cache busting // Extract version for cache busting // Extract version for cache busting // Extract version for cache busting // Extract version for cache busting // Extract version for cache busting // Extract version for cache busting // Extract version for cache busting // Extract version for cache busting // Extract version for cache busting // Extract version for cache busting // Extract version for cache busting // Extract version for cache busting // Extract version for cache busting // Extract version for cache busting // Extract version for cache busting // Extract version for cache busting // Extract version for cache busting // Extract version for cache busting // Extract version for cache busting // Extract version for cache busting

// Detect if we're in development mode
const isDevelopment = location.hostname === 'localhost' || location.hostname === '127.0.0.1';

// Add version parameter to URLs for cache busting
const urlsToCache = [
  // Only cache essential files, not CSS/JS in development
  "/manifest.json",
  `/icons/favicon.svg?v=${VERSION}`,
  `/icons/logo192.png?v=${VERSION}`,
  `/icons/logo512.png?v=${VERSION}`
]

// Install event: Cache the files
self.addEventListener("install", (event) => {
  // Forces the waiting service worker to become active
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Opened cache")
      return cache.addAll(urlsToCache)
    })
  )
})

// Activate event: Clean up old caches
self.addEventListener("activate", (event) => {
  // Take control of all clients immediately
  event.waitUntil(clients.claim());
  
  const cacheWhitelist = [CACHE_NAME]
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            console.log("Deleting old cache:", cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
})

// Helper function to check if URL is cacheable
function isCacheableRequest(url) {
  const urlObj = new URL(url);
  
  // In development, don't cache most assets to allow for live updates
  if (isDevelopment) {
    // Only cache essential static files in development
    const essentialFiles = [
      '/manifest.json',
      '/favicon.svg',
      '/icons/',
      '/service-worker.js'
    ];
    
    const isEssential = essentialFiles.some(file => urlObj.pathname.includes(file));
    if (!isEssential) {
      return false; // Don't cache CSS, JS, HTML in development
    }
  }
  
  // Only cache same-origin requests and HTTP/HTTPS URLs
  const isSameOrigin = urlObj.origin === self.location.origin;
  const isHttps = urlObj.protocol === 'https:' || urlObj.protocol === 'http:';
  
  // Don't cache chrome extensions, data URLs, etc.
  const unsupportedProtocols = [
    'chrome-extension:',
    'chrome:',
    'data:',
    'file:',
    'chrome-search:'
  ];
  
  // Don't cache API requests or dynamic content
  const isApiRequest = urlObj.pathname.includes('/api/');
  
  // Don't cache specific dynamic routes like zoom meetings
  const isDynamicContent = [
    '/zoom/',
    '/question/',
    '/answer/',
    '/article/',
    '/tag/',
    '/tool/',
    '/project/',
    '/user/'
  ].some(path => urlObj.pathname.includes(path));
  
  return isHttps && !unsupportedProtocols.includes(urlObj.protocol) && !isApiRequest && !isDynamicContent;
}

// Fetch event: Serve cached files or fallback to network
self.addEventListener("fetch", (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  try {
    const url = new URL(event.request.url);
    
    // For API requests, use a network-first strategy (always try network first)
    if (url.pathname.includes('/api/')) {
      event.respondWith(
        fetch(event.request)
          .catch(() => caches.match(event.request))
      );
      return;
    }

    // For icon requests, ensure we use versioned URLs for cache busting
    if (url.pathname.includes('/icons/') && !url.search.includes('v=')) {
      const versionedUrl = `${event.request.url}?v=${VERSION}`;
      const versionedRequest = new Request(versionedUrl, {
        method: event.request.method,
        headers: event.request.headers,
        mode: event.request.mode,
        credentials: event.request.credentials,
        cache: event.request.cache,
        redirect: event.request.redirect,
        referrer: event.request.referrer
      });
      
      event.respondWith(
        caches.match(versionedRequest)
          .then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // If not in cache, fetch the original URL (without version parameter)
            return fetch(event.request)
              .then((response) => {
                if (response && response.status === 200) {
                  // Only cache HTTP/HTTPS responses
                  try {
                    const requestUrl = new URL(event.request.url);
                    if (requestUrl.protocol === 'http:' || requestUrl.protocol === 'https:') {
                      const responseToCache = response.clone();
                      caches.open(CACHE_NAME)
                        .then((cache) => {
                          cache.put(versionedRequest, responseToCache);
                        })
                        .catch(error => {
                          console.log('Cache put error:', error);
                        });
                    }
                  } catch (e) {
                    console.log('Invalid URL for caching:', event.request.url);
                  }
                }
                return response;
              });
          })
      );
      return;
    }
    
    // Check if request is cacheable (skip chrome-extension:// URLs and others)
    if (!isCacheableRequest(event.request.url)) {
      // For non-cacheable URLs, just pass through without caching
      event.respondWith(fetch(event.request).catch(() => new Response('Not available')));
      return;
    }
    
    // Use different strategies based on environment
    if (isDevelopment) {
      // In development: Network-first strategy (always get fresh content)
      event.respondWith(
        fetch(event.request)
          .then((response) => {
            // Only cache if it's a successful response and cacheable
            if (response && response.status === 200 && response.type === 'basic' && isCacheableRequest(event.request.url)) {
              // Double-check the URL protocol before caching
              try {
                const requestUrl = new URL(event.request.url);
                if (requestUrl.protocol === 'http:' || requestUrl.protocol === 'https:') {
                  const responseToCache = response.clone();
                  caches.open(CACHE_NAME)
                    .then((cache) => {
                      cache.put(event.request, responseToCache);
                    })
                    .catch(error => {
                      console.log('Cache put error:', error);
                    });
                }
              } catch (e) {
                console.log('Invalid URL for caching:', event.request.url);
              }
            }
            return response;
          })
          .catch((error) => {
            // Fallback to cache only when network fails
            console.log('Network failed, trying cache:', error);
            return caches.match(event.request)
              .then((cachedResponse) => {
                if (cachedResponse) {
                  return cachedResponse;
                }
                
                // For navigation requests, try to serve index.html
                if (event.request.mode === 'navigate') {
                  return caches.match('/index.html');
                }
                
                return new Response('Network error happened', {
                  status: 408,
                  headers: { 'Content-Type': 'text/plain' },
                });
              });
          })
      );
    } else {
      // In production: Cache-first strategy for better performance
      event.respondWith(
        caches.match(event.request)
          .then((cachedResponse) => {
            // Return cached response if found
            if (cachedResponse) {
              return cachedResponse;
            }
            
            // Clone the request because it's a stream that can only be consumed once
            const fetchRequest = event.request.clone();
            
            // Try fetching from network
            return fetch(fetchRequest)
              .then((response) => {
                // Check if we received a valid response
                if (!response || response.status !== 200 || response.type !== 'basic') {
                  return response;
                }
                
                // Clone the response as it's a stream that can only be consumed once
                const responseToCache = response.clone();
                
                // Cache the fetched response for future use
                try {
                  const requestUrl = new URL(event.request.url);
                  if (requestUrl.protocol === 'http:' || requestUrl.protocol === 'https:') {
                    caches.open(CACHE_NAME)
                      .then((cache) => {
                        cache.put(event.request, responseToCache);
                      })
                      .catch(error => {
                        console.log('Cache put error:', error);
                      });
                  }
                } catch (e) {
                  console.log('Invalid URL for caching:', event.request.url);
                }
                  
                return response;
              })
              .catch((error) => {
                // When offline and fetch fails, try to serve index.html for navigation requests
                console.log('Fetch failed; returning offline page instead.', error);
                if (event.request.mode === 'navigate') {
                  return caches.match('/index.html');
                }
                
                // For other resources like API calls, return a simple error response
                return new Response('Network error happened', {
                  status: 408,
                  headers: { 'Content-Type': 'text/plain' },
                });
              });
          })
      );
    }
  } catch (error) {
    console.error('Service worker fetch handler error:', error);
    // Fallback for any unexpected errors in our code
    event.respondWith(fetch(event.request));
  }
}); 