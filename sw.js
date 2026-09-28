/* =========================================================
   sw.js — Service Worker گپ‌یار
========================================================= */

const CACHE_VERSION = 'gapyar-v4';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './launchericon-96x96.png',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(APP_SHELL).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  if (req.method !== 'GET') return;

  if (url.hostname.endsWith('supabase.co') ||
      url.hostname.endsWith('supabase.in') ||
      req.headers.get('upgrade') === 'websocket') {
    return;
  }

  const staticHosts = [self.location.host, 'cdn.jsdelivr.net', 'fonts.googleapis.com', 'fonts.gstatic.com'];
  if (staticHosts.includes(url.host)) {
    event.respondWith(
      caches.match(req).then(cached => cached || fetch(req).then(res => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then(c => c.put(req, copy)).catch(() => {});
        }
        return res;
      }).catch(() => cached))
    );
  }
});

/* --- Push notifications (اختیاری — برای Web Push) --- */
self.addEventListener('push', (event) => {
  let data = {};
  try{
    data = event.data ? event.data.json() : {};
  }catch(e){
    data = { title: 'پیام جدید', body: event.data ? event.data.text() : '' };
  }

  const title = data.title || 'گپ‌یار';
  const options = {
    body: data.body || 'پیام جدید دریافت کردید',
    icon: data.icon || './launchericon-96x96.png',
    badge: './launchericon-96x96.png',
    tag: data.tag || 'gapyar-msg',
    renotify: true,
    data: data.data || {},
    vibrate: [150, 80, 150],
    requireInteraction: false,
    dir: 'rtl',
    lang: 'fa'
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

/* --- Notification click --- */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = (event.notification.data && event.notification.data.url) || './';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

/* --- پیام از کلاینت: نمایش اعلان فوری --- */
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }

  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, tag, data } = event.data;
    self.registration.showNotification(title || 'گپ‌یار', {
      body: body || '',
      icon: './launchericon-96x96.png',
      badge: './launchericon-96x96.png',
      tag: tag || 'gapyar-msg',
      renotify: true,
      data: data || {},
      vibrate: [150, 80, 150],
      dir: 'rtl',
      lang: 'fa'
    });
