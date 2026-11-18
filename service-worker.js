const CACHE_NAME = "que-onda-travel-v3";
const APP_SHELL = ["./", "./manifest.json", "./icons/icon.svg"];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("push", event => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (_) {
    payload = { body: event.data ? event.data.text() : "" };
  }

  const originalTitle = payload.title || "Qué Onda Travel";
  const isBooking = /reservaci[oó]n/i.test(originalTitle);
  const isReview = /opini[oó]n/i.test(originalTitle);

  const title = isBooking
    ? "🚨 ¡NUEVA RESERVACIÓN!"
    : isReview
      ? "🔔 ¡NUEVA OPINIÓN!"
      : "🚨 Qué Onda Travel · Nueva alerta";

  const body = isBooking
    ? "Tienes una solicitud nueva pendiente. Toca aquí para revisarla ahora."
    : isReview
      ? "Un cliente acaba de dejar una opinión. Toca aquí para revisarla."
      : (payload.body || "Tienes una nueva notificación.");

  const options = {
    body,
    icon: payload.icon || "./icons/icon.svg",
    badge: payload.badge || "./icons/icon.svg",
    data: { url: payload.url || "./" },
    tag: payload.tag || "que-onda-alert",
    renotify: true,
    requireInteraction: true,
    silent: false,
    vibrate: [300, 120, 300, 120, 500]
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  const target = new URL(
    event.notification.data && event.notification.data.url || "./",
    self.location.origin
  ).href;

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url.startsWith(self.location.origin) && "focus" in client) {
          client.navigate(target);
          return client.focus();
        }
      }
      return clients.openWindow(target);
    })
  );
});
