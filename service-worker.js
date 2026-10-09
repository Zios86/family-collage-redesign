const CACHE_NAME = 'family-collage-v3';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
  './music.mp3',
  './fonts/lobster-cyrillic.woff2',
  './fonts/lobster-latin.woff2',
  './fonts/pacifico-cyrillic.woff2',
  './fonts/pacifico-latin.woff2',
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

function putInCache(request, response) {
  if (response && response.status === 200 && response.type === 'basic') {
    const copy = response.clone();
    caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
  }
  return response;
}

const offlineResponse = () => new Response('Offline - no cached version available', {
  status: 503,
  statusText: 'Service Unavailable',
  headers: new Headers({ 'Content-Type': 'text/plain' })
});

// Страница и манифест: сначала сеть (чтобы правки доходили), при отсутствии сети — кеш
function networkFirst(request) {
  return fetch(request)
    .then((response) => putInCache(request, response))
    .catch(() => caches.match(request).then((cached) => cached || offlineResponse()));
}

// Фото, музыка, шрифты, иконки не меняются: сразу из кеша, без ожидания сети
function cacheFirst(request) {
  return caches.match(request).then((cached) => {
    return cached || fetch(request).then((response) => putInCache(request, response));
  }).catch(offlineResponse);
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  // Аудио запрашивается кусками (Range) — Safari ждёт на них ответ 206,
  // поэтому берём из сети, а кеш используем только без интернета
  if (request.headers.has('range')) {
    event.respondWith(
      fetch(request).catch(() => caches.match(url.pathname.endsWith('.mp3') ? './music.mp3' : request)
        .then((cached) => cached || offlineResponse()))
    );
    return;
  }

  const isPage = request.mode === 'navigate' || /\.(html|json)$/.test(url.pathname);
  event.respondWith(isPage ? networkFirst(request) : cacheFirst(request));
});

// Обработка сообщений
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
