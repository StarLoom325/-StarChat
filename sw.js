/* =========================================================
   sw.js — Service Worker گپ‌یار
   - Cache: پوسته‌ی اپ
   - Push: دریافت اعلان‌ها
========================================================= */

const CACHE_VERSION = 'gapyar-v3';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './launchericon-96x96.png',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
];

/* ---------------------- Install ---------------------- */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(APP_SHELL).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

/* ---------------------- Activate ---------------------- */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

/* ---------------------- Fetch (Cache-first برای استاتیک) ---------------------- */
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  if (req.method !== 'GET') return;

  // Supabase و WebSocket ها رو کش نکن
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

/* ---------------------- Push ---------------------- */
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

/* ---------------------- Notification click ---------------------- */
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

/* ---------------------- Message from client ---------------------- */
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }

  // اگه کلاینت خواست اعلان فوری نشون بدیم
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
  }
});
