import webpush from "web-push";

/**
 * VAPID configuration for Web Push.
 *
 * Keys come from env (`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`).
 * Generate a keypair once with `npx web-push generate-vapid-keys` and store the
 * pair in your secrets; the public key is also surfaced to the browser via
 * `GET /api/push/vapid-public-key` so the service worker can subscribe.
 *
 * If keys are absent the push feature degrades gracefully: `isPushConfigured()`
 * returns false and routes/worker skip sending instead of crashing.
 */

const publicKey = process.env.VAPID_PUBLIC_KEY ?? "";
const privateKey = process.env.VAPID_PRIVATE_KEY ?? "";
const subject = process.env.VAPID_SUBJECT ?? "mailto:admin@huyenbi.io.vn";

let configured = false;
if (publicKey && privateKey) {
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
}

export function isPushConfigured(): boolean {
  return configured;
}

export function getVapidPublicKey(): string {
  return publicKey;
}

export interface PushTarget {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

/**
 * Send a push payload to one subscription.
 *
 * Returns `"ok"` on success, `"gone"` when the endpoint is dead (HTTP 404/410 —
 * the caller should delete the subscription), or `"error"` for transient
 * failures (the caller may retry).
 */
export async function sendPush(
  target: PushTarget,
  payload: PushPayload,
): Promise<"ok" | "gone" | "error"> {
  if (!configured) return "error";
  try {
    await webpush.sendNotification(
      {
        endpoint: target.endpoint,
        keys: { p256dh: target.p256dh, auth: target.auth },
      },
      JSON.stringify(payload),
    );
    return "ok";
  } catch (err: unknown) {
    const statusCode = (err as { statusCode?: number })?.statusCode;
    if (statusCode === 404 || statusCode === 410) return "gone";
    return "error";
  }
}
