import { useEffect } from "react";

import {
  MYSTIC_CURSOR_STORAGE_KEY,
  readMysticCursorEnabled,
  subscribeMysticCursor,
} from "@/lib/mystic-cursor-store";

/**
 * CSS class applied to `<html>` while the bespoke star cursor is active.
 *
 * The actual cursor visuals live in `src/index.css` and are scoped under
 * `:root.mystic-cursor-enabled` so adding/removing this class fully
 * enables or disables the effect with no JS-driven repaint cost. Exported
 * for tests that assert the toggle behaviour.
 */
export const MYSTIC_CURSOR_ROOT_CLASS = "mystic-cursor-enabled";

/**
 * Coarse pointer / touch detection. The Mystic_Cursor must only activate
 * when the primary pointer can hover (Requirement 17.1) — touch screens
 * already get the system caret/indicator and overriding their cursor
 * makes nothing better.
 */
function hoverCapable(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  try {
    return window.matchMedia("(hover: hover)").matches;
  } catch {
    return false;
  }
}

/**
 * Detect the OS-level reduced-motion preference. When `true`, the cursor
 * trail and any cursor-bound animation must be removed and the system
 * cursor restored (Requirement 17.4).
 */
function reducedMotionPreferred(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

/**
 * Mystic_Cursor — render layer + activation gate for the bespoke star cursor.
 *
 * Although the *visual* cursor is rendered entirely via CSS in
 * `src/index.css` (data-URL SVG attached to `cursor:` for various element
 * roles), this component is the **single owner of the activation
 * decision**. It computes whether the cursor should be active given:
 *
 * 1. **Pointer capability** — `(hover: hover)` must match. Touch / coarse
 *    pointer devices keep the system cursor (Requirement 17.1).
 * 2. **Reduced-motion preference** — when the user has
 *    `prefers-reduced-motion: reduce`, the trail / animation is removed
 *    and the system cursor is restored (Requirement 17.4).
 * 3. **User toggle** — `localStorage["mystic-cursor-enabled"]` (default
 *    `true`). Toggle is exposed in the user dropdown ("Preferences")
 *    surfaced by `Navbar` / `MobileDrawer` (Requirement 17.5).
 *
 * The decision is materialised by toggling
 * {@link MYSTIC_CURSOR_ROOT_CLASS} on `<html>`. The CSS rules in
 * `src/index.css` are scoped to that class so removing it instantly
 * reverts every element to the OS cursor — including:
 *
 * - `text` cursor for `input`, `textarea`, `[contenteditable]`
 *   (Requirement 17.2).
 * - `pointer` cursor for `a`, `button`, `[role="button"]`, `select`,
 *   `label[for]` (Requirement 17.3).
 *
 * The component renders an `aria-hidden="true"` placeholder with
 * `pointer-events: none` so screen readers ignore it and it can never
 * intercept input even if a future iteration mounts a DOM-based trail
 * here (Requirement 3.12).
 *
 * Validates: Requirements 3.12, 17.1, 17.2, 17.3, 17.4, 17.5.
 */
export function MysticCursor() {
  useEffect(() => {
    // SSR / non-DOM guard — never run on the server.
    if (typeof document === "undefined") return;

    const root = document.documentElement;

    // Recompute the effective state every time any input changes.
    let userEnabled = readMysticCursorEnabled();

    const apply = () => {
      const active = hoverCapable() && !reducedMotionPreferred() && userEnabled;
      root.classList.toggle(MYSTIC_CURSOR_ROOT_CLASS, active);
    };
    apply();

    // Subscribe to user preference changes (in-memory + cross-tab).
    const unsubscribeStore = subscribeMysticCursor((next) => {
      userEnabled = next;
      apply();
    });

    const onStorage = (event: StorageEvent) => {
      if (event.key !== MYSTIC_CURSOR_STORAGE_KEY) return;
      userEnabled = readMysticCursorEnabled();
      apply();
    };
    window.addEventListener("storage", onStorage);

    // Re-evaluate when the device's pointer or motion preference changes
    // (e.g. plugging in a mouse, OS-level toggle).
    const motionMql =
      typeof window.matchMedia === "function"
        ? window.matchMedia("(prefers-reduced-motion: reduce)")
        : null;
    const hoverMql =
      typeof window.matchMedia === "function"
        ? window.matchMedia("(hover: hover)")
        : null;
    const onMediaChange = () => apply();

    motionMql?.addEventListener?.("change", onMediaChange);
    hoverMql?.addEventListener?.("change", onMediaChange);

    return () => {
      unsubscribeStore();
      window.removeEventListener("storage", onStorage);
      motionMql?.removeEventListener?.("change", onMediaChange);
      hoverMql?.removeEventListener?.("change", onMediaChange);
      root.classList.remove(MYSTIC_CURSOR_ROOT_CLASS);
    };
  }, []);

  // Decorative placeholder — kept so a future iteration can attach a DOM
  // trail layer here without rewiring the activation contract. Hidden from
  // assistive tech and inert to pointer events per Requirement 3.12.
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none"
      data-mystic-cursor-root
    />
  );
}
