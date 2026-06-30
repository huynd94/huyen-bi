/* Huyền Bí — Service Worker for Web Push reminders.
 *
 * Minimal SW: shows notifications pushed from the server and focuses/opens the
 * app when a notification is clicked. No offline caching here (kept separate
 * from any future PWA cache strategy to avoid surprising cache behavior).
 */

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {};
  }

  const title = data.title || "Huyền Bí";
  const options = {
    body: data.body || "",
    tag: data.tag || "huyen-bi-reminder",
    icon: "/icon-maskable.svg",
    badge: "/favicon.svg",
    data: { url: data.url || "/" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Focus an existing tab if one is already open, else open a new one.
        for (const client of clientList) {
          if ("focus" in client) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
        return undefined;
      }),
  );
});
