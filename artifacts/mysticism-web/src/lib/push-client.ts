// Web Push client helper: service-worker registration, subscribe/unsubscribe,
// and reminder-preference API. All endpoints are Clerk-authenticated and
// account-scoped on the server (see api-server/src/routes/push.ts).

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

async function apiFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? `HTTP ${res.status}`);
  }
  return res.json();
}

export interface ReminderPrefs {
  dailyFortune: boolean;
  saoHan: boolean;
  timezone: string;
  sendHour: number;
  subscribed: boolean;
}

/** True when the browser can do Web Push at all. */
export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export function getNotificationPermission(): NotificationPermission | "unsupported" {
  if (!isPushSupported()) return "unsupported";
  return Notification.permission;
}

// VAPID public key is base64url; web-push/browser need it as a BufferSource.
function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const buffer = new ArrayBuffer(raw.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; i++) view[i] = raw.charCodeAt(i);
  return buffer;
}

async function registerServiceWorker(): Promise<ServiceWorkerRegistration> {
  return navigator.serviceWorker.register(`${BASE}/sw.js`);
}

export const pushApi = {
  getPrefs: (): Promise<ReminderPrefs> => apiFetch("/api/push/prefs"),

  updatePrefs: (
    payload: Partial<Pick<ReminderPrefs, "dailyFortune" | "saoHan" | "timezone" | "sendHour">>,
  ): Promise<{ success: boolean }> =>
    apiFetch("/api/push/prefs", { method: "PATCH", body: JSON.stringify(payload) }),

  /**
   * Full enable flow: request permission, register SW, create a PushSubscription
   * with the server's VAPID key, and persist it. Returns the granted permission.
   * Throws if push is unsupported, permission denied, or VAPID not configured.
   */
  async enable(): Promise<void> {
    if (!isPushSupported()) throw new Error("Trình duyệt không hỗ trợ thông báo đẩy.");

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      throw new Error("Bạn cần cấp quyền thông báo để nhận nhắc nhở.");
    }

    const { publicKey, configured } = await apiFetch("/api/push/vapid-public-key");
    if (!configured || !publicKey) {
      throw new Error("Máy chủ chưa cấu hình thông báo đẩy (VAPID).");
    }

    const registration = await registerServiceWorker();
    await navigator.serviceWorker.ready;

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });

    const json = subscription.toJSON();
    await apiFetch("/api/push/subscribe", {
      method: "POST",
      body: JSON.stringify({
        endpoint: json.endpoint,
        keys: { p256dh: json.keys?.p256dh, auth: json.keys?.auth },
      }),
    });
  },

  /** Unsubscribe this device and tell the server to forget the endpoint. */
  async disable(): Promise<void> {
    if (!isPushSupported()) return;
    const registration = await navigator.serviceWorker.getRegistration();
    const subscription = await registration?.pushManager.getSubscription();
    if (subscription) {
      const endpoint = subscription.endpoint;
      await subscription.unsubscribe();
      await apiFetch("/api/push/unsubscribe", {
        method: "POST",
        body: JSON.stringify({ endpoint }),
      });
    }
  },
};
