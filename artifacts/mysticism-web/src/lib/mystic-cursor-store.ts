/**
 * Pub/sub store for the **Mystic_Cursor** user preference.
 *
 * Single source of truth for whether the bespoke star cursor is enabled.
 * State lives in `localStorage["mystic-cursor-enabled"]` so the choice
 * persists across reloads. Subscribers are notified synchronously when the
 * value changes; cross-tab sync is handled by listening to the browser's
 * `storage` event in the consuming component.
 *
 * The store is intentionally framework-agnostic (no React imports) so it
 * can be initialised before React hydrates and so headless tests can drive
 * it directly.
 *
 * Validates: Requirements 17.5.
 */

/**
 * `localStorage` key used for the persisted toggle. Exported so tests and
 * the React hook stay in lock-step with the navbar UI.
 */
export const MYSTIC_CURSOR_STORAGE_KEY = "mystic-cursor-enabled";

/**
 * Default user preference when no value has been written yet. The cursor
 * is decorative and opt-out, matching the existing UX before this task.
 */
export const MYSTIC_CURSOR_DEFAULT_ENABLED = true;

type Listener = (enabled: boolean) => void;

const listeners = new Set<Listener>();

/**
 * Read the persisted preference. Returns {@link MYSTIC_CURSOR_DEFAULT_ENABLED}
 * during SSR, when `localStorage` throws (private mode in some browsers),
 * or when no value has been written yet.
 */
export function readMysticCursorEnabled(): boolean {
  if (typeof window === "undefined") return MYSTIC_CURSOR_DEFAULT_ENABLED;
  try {
    const raw = window.localStorage.getItem(MYSTIC_CURSOR_STORAGE_KEY);
    if (raw === null) return MYSTIC_CURSOR_DEFAULT_ENABLED;
    return raw === "true";
  } catch {
    return MYSTIC_CURSOR_DEFAULT_ENABLED;
  }
}

/**
 * Persist the preference and notify every subscriber. No-op on SSR.
 * Failures to write `localStorage` (quota, disabled storage) still emit
 * the in-memory change so the current tab honours the toggle.
 */
export function writeMysticCursorEnabled(enabled: boolean): void {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(
        MYSTIC_CURSOR_STORAGE_KEY,
        enabled ? "true" : "false",
      );
    } catch {
      // Swallow — preference still applies to the current tab via listeners.
    }
  }
  for (const listener of listeners) {
    listener(enabled);
  }
}

/**
 * Subscribe to changes. Returns an unsubscribe function. The listener is
 * **not** invoked synchronously with the current value; consumers should
 * call {@link readMysticCursorEnabled} once on mount.
 */
export function subscribeMysticCursor(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Toggle the preference and return the new value. Convenience wrapper for
 * dropdown menu actions where the caller does not already know the
 * current state.
 */
export function toggleMysticCursor(): boolean {
  const next = !readMysticCursorEnabled();
  writeMysticCursorEnabled(next);
  return next;
}
