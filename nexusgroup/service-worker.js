/* eslint-disable no-restricted-globals */
const CACHE   = 'nexus-v2';
const ASSETS = [
  '/index.html',
  '/style.css',
  '/main.js',
  '/manifest.webmanifest',
  '/media/hero.webp',
  '/media/hero.mp4',
  '/media/fonts/Manrope-Regular.woff2',
  '/offline.html'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(res => 
      res || fetch(e.request).then(r => {
        const copy = r.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return r;
      }).catch(() => caches.match('/offline.html'))
    )
  );
});
