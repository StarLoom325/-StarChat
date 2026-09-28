const CACHE_VERSION = 'gapyar-v1';
const APP_SHELL = [
  './',
  './index.html',
  './config.js',
  './manifest.json',
  './launchericon-96x96.png',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_VERSION)
      .then(c => c.addAll(APP_SHELL).catch(()=>{}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);

  if (req.method !== 'GET') return;

  // Supabase و WebSocket ها هرگز کش نشن
  if (url.hostname.endsWith('supabase.co') ||
      url.hostname.endsWith('supabase.in') ||
      req.headers.get('upgrade') === 'websocket') {
    return;
  }

  const staticHosts = [self.location.host, 'cdn.jsdelivr.net', 'fonts.googleapis.com', 'fonts.gstatic.com'];

  if (staticHosts.includes(url.host)) {
    e.respondWith(
      caches.match(req).then(cached => cached || fetch(req).then(res => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then(c => c.put(req, copy)).catch(()=>{});
        }
        return res;
      }).catch(() => cached))
    );
  }
});

self.addEventListener('message', (e) => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});
