// Firebase Cloud Messaging (FCM) Service Worker for 3PLE A DATA (RC 9746103)
// Handles background push notifications for transactions, wallet credits, and security alerts.

const FIREBASE_CONFIG = {
  projectId: "gen-lang-client-0527687246",
  appId: "1:573695049450:web:362359651daf861ecb2193",
  apiKey: "AIzaSyDqKJq92cModeMDAorq1MyLZHBGAYo_iF0",
  authDomain: "gen-lang-client-0527687246.firebaseapp.com",
  storageBucket: "gen-lang-client-0527687246.firebasestorage.app",
  messagingSenderId: "573695049450"
};

// Immediate activation
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Attempt to load Firebase compat scripts for background messaging
let fcmInitialized = false;
try {
  importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
  importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

  if (typeof firebase !== 'undefined') {
    firebase.initializeApp(FIREBASE_CONFIG);
    const messaging = firebase.messaging();

    messaging.onBackgroundMessage((payload) => {
      console.log('[FCM SW] Received background message:', payload);
      const title = payload.notification?.title || payload.data?.title || '3PLE A DATA Alert';
      const body = payload.notification?.body || payload.data?.body || 'New transaction or security event';
      const type = payload.data?.type || 'general';

      const options = {
        body,
        icon: '/logo.png',
        badge: '/logo.png',
        tag: payload.data?.tag || `3plea-${type}-${Date.now()}`,
        data: payload.data || {},
        vibrate: [150, 60, 150],
        actions: [
          { action: 'open_app', title: 'Open App' },
          { action: 'dismiss', title: 'Dismiss' }
        ]
      };

      return self.registration.showNotification(title, options);
    });
    fcmInitialized = true;
  }
} catch (err) {
  console.warn('[FCM SW] Fallback to standard Push API listener:', err);
}

// Universal Push API fallback listener
self.addEventListener('push', (event) => {
  if (fcmInitialized && event.data) {
    // If FCM compat already processed it, return unless raw push
  }

  let payload = {
    title: '3PLE A DATA Alert',
    body: 'Successful transaction or wallet update recorded.',
    type: 'general'
  };

  if (event.data) {
    try {
      payload = event.data.json();
    } catch {
      payload.body = event.data.text() || payload.body;
    }
  }

  const title = payload.title || (payload.notification && payload.notification.title) || '3PLE A DATA (RC 9746103)';
  const body = payload.body || (payload.notification && payload.notification.body) || 'Wallet or transaction notification';
  const type = payload.type || (payload.data && payload.data.type) || 'general';

  const options = {
    body,
    icon: '/logo.png',
    badge: '/logo.png',
    tag: payload.tag || `3plea-${type}-${Date.now()}`,
    data: payload.data || payload,
    vibrate: [200, 80, 200],
    actions: [
      { action: 'open_app', title: 'Open 3PLE A' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing window if available
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open new window
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })
  );
});
