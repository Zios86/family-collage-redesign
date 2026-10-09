const CACHE_NAME = 'family-collage-v2';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './music.mp3',
  './photos/01.jpg',
  './photos/02.jpg',
  './photos/03.jpg',
  './photos/04.jpg',
  './photos/05.jpg',
  './photos/06.jpg',
  './photos/07.jpg',
  './photos/08.jpg',
  './photos/09.jpg',
  './photos/10.jpg',
  './photos/11.jpg',
  './photos/12.jpg',
  './photos/13.jpg',
  './photos/14.jpg',
  './photos/15.jpg',
  './photos/16.jpg',
  './photos/17.jpg',
  './photos/18.jpg',
  './photos/19.jpg',
  './photos/20.jpg',
  './photos/21.jpg',
  './photos/22.jpg',
  './photos/23.jpg',
  './photos/24.jpg',
  './photos/25.jpg',
  './photos/26.jpg',
  './photos/27.jpg',
  './photos/28.jpg'
];

// Установка Service Worker и кеширование файлов
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    }).catch((error) => {
      console.log('Cache addAll error:', error);
    })
  );
  self.skipWaiting();
});

// Активация Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Стратегия Network First, Fallback to Cache
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((response) => {
          return response || new Response('Offline - no cached version available', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({
              'Content-Type': 'text/plain'
            })
          });
        });
      })
  );
});

// Обработка сообщений
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
