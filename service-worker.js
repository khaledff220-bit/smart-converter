/**
 * ==========================================
 * المحول الذكي الشامل - Service Worker
 * Smart Converter PWA - Service Worker
 * الإصدار: 3.0.0 | التاريخ: 2026
 * ==========================================
 * 
 * هذا الملف مسؤول عن:
 * - التخزين المؤقت للملفات الأساسية
 * - دعم العمل بدون إنترنت
 * - تحديث الملفات تلقائياً
 * - تحسين الأداء وسرعة التحميل
 */

// ==========================================
// إعدادات التخزين المؤقت
// ==========================================
const CACHE_NAME = 'smart-converter-v3';
const CACHE_VERSION = '2026.03.06.01'; // تنسيق: السنة.الشهر.اليوم.الإصدار

// الملفات الأساسية التي يجب تخزينها مؤقتاً
const STATIC_CACHE_URLS = [
  '/',
  '/index.html',
  '/about.html',
  '/privacy.html',
  '/style.css',
  '/app.js',
  '/manifest.json',
  '/images/apple-touch-icon.png',
  '/images/icon-192.png',
  '/images/icon-512.png'
];

// الملفات التي يمكن تخزينها مؤقتاً ولكنها غير أساسية
const OPTIONAL_CACHE_URLS = [
  '/images/favicon-32x32.png',
  '/images/favicon-16x16.png'
];

// ==========================================
// مرحلة التثبيت (Install)
// ==========================================
self.addEventListener('install', event => {
  console.log(`🔄 Service Worker: تثبيت الإصدار ${CACHE_VERSION}`);
  
  // تخطي مرحلة الانتظار والتفعيل فوراً
  self.skipWaiting();
  
  // تخزين الملفات الأساسية مؤقتاً
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('✅ Service Worker: تخزين الملفات الأساسية');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        // تخزين الملفات الاختيارية في الخلفية
        caches.open(CACHE_NAME)
          .then(cache => {
            cache.addAll(OPTIONAL_CACHE_URLS)
              .catch(err => console.log('⚠️ بعض الملفات الاختيارية لم يتم تخزينها:', err));
          });
        console.log('✅ Service Worker: تم التثبيت بنجاح');
      })
      .catch(error => {
        console.error('❌ Service Worker: فشل التثبيت', error);
      })
  );
});

// ==========================================
// مرحلة التفعيل (Activate)
// ==========================================
self.addEventListener('activate', event => {
  console.log(`🔄 Service Worker: تفعيل الإصدار ${CACHE_VERSION}`);
  
  // تنظيف التخزين المؤقت القديم
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // حذف جميع الإصدارات القديمة
          if (cacheName !== CACHE_NAME) {
            console.log(`🗑️ Service Worker: حذف الإصدار القديم ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // التحكم في جميع الصفحات المفتوحة فوراً
      console.log('✅ Service Worker: تم التفعيل والتحكم في الصفحات');
      return self.clients.claim();
    })
  );
});

// ==========================================
// استراتيجيات جلب الملفات (Fetch)
// ==========================================
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  
  // تجاهل طلبات التحليلات والإعلانات (لا نخزنها مؤقتاً)
  if (url.hostname.includes('google') || 
      url.hostname.includes('googletagmanager') ||
      url.hostname.includes('pagead2')) {
    return;
  }
  
  // استراتيجية مختلفة حسب نوع الملف
  if (request.destination === 'document') {
    // استراتيجية الصفحات: Network First (الإنترنت أولاً)
    event.respondWith(networkFirstStrategy(request));
  } else if (request.destination === 'style' || 
             request.destination === 'script' ||
             request.destination === 'font') {
    // استراتيجية الملفات الأساسية: Cache First (التخزين أولاً)
    event.respondWith(cacheFirstStrategy(request));
  } else if (request.destination === 'image') {
    // استراتيجية الصور: Cache First مع تحديث في الخلفية
    event.respondWith(staleWhileRevalidateStrategy(request));
  } else {
    // استراتيجية افتراضية للبقية: Network First مع Fallback
    event.respondWith(networkFirstWithFallback(request));
  }
});

/**
 * استراتيجية: الإنترنت أولاً (Network First)
 * مناسبة للصفحات الرئيسية التي تتغير محتواها
 */
async function networkFirstStrategy(request) {
  try {
    // محاولة جلب الملف من الإنترنت
    const networkResponse = await fetch(request);
    
    // إذا نجح الجلب، قم بتحديث التخزين المؤقت
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
      console.log('📦 تم تحديث التخزين المؤقت:', request.url);
    }
    
    return networkResponse;
  } catch (error) {
    // إذا فشل الاتصال، استخدم التخزين المؤقت
    console.log('📱 وضع عدم الاتصال - استخدام التخزين المؤقت:', request.url);
    const cachedResponse = await caches.match(request);
    
    // إذا كان هناك تخزين مؤقت، استخدمه
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // إذا لم يكن هناك تخزين مؤقت، أعد توجيه للصفحة الرئيسية
    if (request.destination === 'document') {
      return caches.match('/');
    }
    
    // إرجاع خطأ
    return new Response('غير متاح حالياً', {
      status: 408,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

/**
 * استراتيجية: التخزين أولاً (Cache First)
 * مناسبة للملفات الثابتة مثل CSS, JS, Fonts
 */
async function cacheFirstStrategy(request) {
  // ابحث في التخزين المؤقت أولاً
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    // إذا وجد في التخزين، استخدمه
    console.log('📦 استخدام من التخزين المؤقت:', request.url);
    return cachedResponse;
  }
  
  // إذا لم يوجد، حاول الجلب من الإنترنت
  try {
    const networkResponse = await fetch(request);
    
    // خزن النسخة الجديدة
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('❌ فشل جلب الملف:', request.url);
    return new Response('الملف غير متاح', { status: 404 });
  }
}

/**
 * استراتيجية: قديم مع تحديث (Stale-While-Revalidate)
 * مناسبة للصور والمحتويات التي تتغير قليلاً
 */
async function staleWhileRevalidateStrategy(request) {
  // ابحث في التخزين المؤقت أولاً
  const cachedResponse = await caches.match(request);
  
  // حاول تحديث التخزين في الخلفية
  const networkPromise = fetch(request)
    .then(networkResponse => {
      if (networkResponse.ok) {
        caches.open(CACHE_NAME).then(cache => {
          cache.put(request, networkResponse.clone());
          console.log('📦 تحديث الصورة:', request.url);
        });
      }
      return networkResponse;
    })
    .catch(() => null);
  
  // أعد الملف المخزن مؤقتاً فوراً (إذا وجد)
  if (cachedResponse) {
    console.log('📦 صورة من التخزين:', request.url);
    return cachedResponse;
  }
  
  // إذا لم يوجد تخزين، انتظر الجلب من الإنترنت
  const networkResponse = await networkPromise;
  if (networkResponse) {
    return networkResponse;
  }
  
  // إذا فشل كل شيء، أعد صورة افتراضية
  return new Response('', { status: 404 });
}

/**
 * استراتيجية: الإنترنت أولاً مع صفحة خطأ مخصصة
 */
async function networkFirstWithFallback(request) {
  try {
    // محاولة جلب الملف من الإنترنت
    const networkResponse = await fetch(request);
    
    // إذا كان الملف ناجحاً، خزنه مؤقتاً
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // إذا فشل الاتصال، استخدم التخزين المؤقت
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // للملفات غير الموجودة في التخزين، أعد صفحة الخطأ للصفحات
    if (request.destination === 'document') {
      return caches.match('/');
    }
    
    return new Response('', { status: 404 });
  }
}

// ==========================================
// معالجة رسائل من الصفحة الرئيسية
// ==========================================
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('🔄 تخطي الانتظار وتحديث Service Worker');
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_CLEAN') {
    // تنظيف التخزين المؤقت يدوياً
    caches.delete(CACHE_NAME).then(() => {
      console.log('🧹 تم تنظيف التخزين المؤقت');
      event.source.postMessage({ type: 'CACHE_CLEANED' });
    });
  }
});

// ==========================================
// معالجة المزامنة في الخلفية (Background Sync)
// ==========================================
self.addEventListener('sync', event => {
  if (event.tag === 'sync-currency-rates') {
    console.log('🔄 مزامنة أسعار العملات في الخلفية');
    // يمكن إضافة منطق مزامنة أسعار العملات هنا
  }
});

// ==========================================
// إشعارات التحديث (Push Notifications)
// ==========================================
self.addEventListener('push', event => {
  const data = event.data.json();
  
  const options = {
    body: data.body,
    icon: '/images/icon-192.png',
    badge: '/images/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/'
    }
  };
  
  event.waitUntil(
    self.registration.showNotification('المحول الذكي', options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});

// ==========================================
// تسجيل نجاح التحميل
// ==========================================
console.log('✅ Service Worker: تم تحميل الإصدار 3.0.0 بنجاح');
