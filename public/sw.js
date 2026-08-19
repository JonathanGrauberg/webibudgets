// public/sw.js
// Service Worker mínimo — a propósito no cachea nada todavía. Su único trabajo
// hoy es existir y estar activo: es un requisito técnico de Chrome para que la
// web se considere "instalable" (junto con el manifest, los íconos y HTTPS).
// Si más adelante querés soporte offline real, acá es donde se agrega.

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', (event) => {
  // Dejamos pasar todo tal cual — sin caché por ahora.
  event.respondWith(fetch(event.request))
})