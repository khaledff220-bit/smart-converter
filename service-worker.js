const CACHE_NAME = 'converter-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/manifest.json',
  // أضف مسار الأيقونات هنا عندما تنشئها
  // '/images/icon-192.png', 
  // '/images/icon-512.png'
];

// تثبيت عامل الخدمة وتخزين الأصول (Assets) مؤقتاً
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// اعتراض الطلبات وتوفير الرد من الذاكرة المؤقتة أولاً
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // العودة بالبيانات المخزنة مؤقتاً إذا وجدت
        if (response) {
          return response;
        }
        // وإلا، جلبها من الشبكة
        return fetch(event.request);
      })
  );
});

// تفعيل عامل الخدمة وحذف أي ذاكرة مؤقتة قديمة
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            // حذف الذاكرة المؤقتة القديمة
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
