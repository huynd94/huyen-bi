import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Plus, Share2, Sparkles, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  applyPwaEvent,
  loadPwaPromptState,
  PWA_PROMPT_STORAGE_KEY,
  savePwaPromptState,
  shouldShowPrompt,
  type PwaPromptState,
} from "@/pwa/pwa-prompt-state";

/**
 * Subset of the W3C `BeforeInstallPromptEvent` shape we rely on.
 *
 * Defined inline because TypeScript's lib DOM typings do not yet ship the
 * event in the standard `WindowEventMap`. We only touch `prompt()` /
 * `userChoice` and never persist the object — the reference is held in a
 * ref so React state updates do not invalidate it.
 */
interface BeforeInstallPromptEvent extends Event {
  /** Resolves once the native install dialog has been shown. */
  prompt(): Promise<void>;
  /** Resolves with the user's decision after the dialog is dismissed. */
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
}

/**
 * Detect whether the current device is iOS Safari (or an iOS WebKit shell
 * such as in-app browsers that still expose `navigator.standalone`).
 *
 * iOS Safari does **not** fire `beforeinstallprompt`; the only path is the
 * "Share → Add to Home Screen" sequence. We surface a Vietnamese 3-step
 * guide instead — see Requirement 16.4.
 */
function isIosSafari(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  if (!/iPad|iPhone|iPod/.test(ua)) return false;
  // `standalone` is a non-standard iOS-only property; presence (regardless of
  // value) confirms WebKit. Chrome/Firefox on iOS share this surface.
  return "standalone" in navigator;
}

/**
 * True when the app is already running as an installed PWA — either through
 * `display-mode: standalone` (Android/desktop) or `navigator.standalone`
 * (iOS Safari home-screen shortcut). Used to short-circuit the prompt and
 * mark the FSM `installed` so we never ask again on this device.
 */
function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return false;
  const nav = navigator as Navigator & { standalone?: boolean };
  if (nav.standalone === true) return true;
  if (typeof window.matchMedia !== "function") return false;
  try {
    return window.matchMedia("(display-mode: standalone)").matches;
  } catch {
    return false;
  }
}

/**
 * `Pwa_Install_Prompt` — non-modal, theme-aware install nudge.
 *
 * Behaviour (Requirements 16.1–16.4 and `design.md` "PWA install prompt"
 * section):
 *
 * - **Eligibility** is decided by the FSM in
 *   `src/pwa/pwa-prompt-state.ts`. The component only renders when
 *   {@link shouldShowPrompt} returns `true` *and* either the browser has
 *   already fired `beforeinstallprompt` (captured in a ref) *or* the
 *   device is iOS Safari (where the event is unavailable).
 * - **Layout** is responsive but never modal:
 *   - `< md`: a thin sticky banner along the bottom of the viewport with a
 *     subtle backdrop blur — small footprint, easy to ignore.
 *   - `>= md`: a card anchored to the bottom-right corner.
 *   - Both layouts are wrapped in `role="region"` with a Vietnamese
 *     `aria-label` so screen readers can identify and skip the surface.
 * - **Actions**:
 *   - "Cài Huyền Bí": calls `event.prompt()` when available, then routes
 *     the result through {@link applyPwaEvent} (`install` on accept,
 *     `dismiss` on user-cancel). On iOS Safari, expands an inline 3-step
 *     guide ("Chia sẻ → Thêm vào Màn hình chính → Thêm") instead of
 *     calling the unavailable native API.
 *   - "Bỏ qua": records a dismissal at `Date.now()`; the FSM enforces a
 *     14-day cooldown before the prompt resurfaces.
 * - **Layering**: `z-50` sits above page content but below the sonner
 *   `<Toaster />` viewport (which uses `z-[100]`), so success/error toasts
 *   always stack above the prompt.
 * - **Reduced motion**: the slide-in is gated by Tailwind's
 *   `motion-reduce:` variant which collapses the entrance to a no-op for
 *   users with `prefers-reduced-motion: reduce`.
 *
 * The component lives in `App.tsx` near the root and is mounted exactly
 * once. It does **not** render any DOM until eligibility is confirmed, so
 * SSR / first paint is unaffected.
 *
 * Validates: Requirements 16.1, 16.2, 16.3, 16.4.
 */
export function PwaInstallPrompt() {
  const [state, setState] = useState<PwaPromptState | null>(null);
  const [hasNativePrompt, setHasNativePrompt] = useState(false);
  const [iosFallback, setIosFallback] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const deferredRef = useRef<BeforeInstallPromptEvent | null>(null);

  // ---------------------------------------------------------------------
  // Mount: hydrate FSM state, wire native events, detect iOS Safari.
  // ---------------------------------------------------------------------
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Already installed in a previous session — mark FSM and never show.
    if (isStandaloneDisplay()) {
      const initial = loadPwaPromptState();
      const next = applyPwaEvent(initial, { kind: "install" });
      savePwaPromptState(next);
      setState(next);
      return;
    }

    setState(loadPwaPromptState());
    setIosFallback(isIosSafari());

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      deferredRef.current = event as BeforeInstallPromptEvent;
      setHasNativePrompt(true);
    };

    const onAppInstalled = () => {
      deferredRef.current = null;
      setHasNativePrompt(false);
      setState((prev) => {
        const base = prev ?? loadPwaPromptState();
        const next = applyPwaEvent(base, { kind: "install" });
        savePwaPromptState(next);
        return next;
      });
    };

    // Cross-tab sync: when another tab dismisses or installs, mirror the
    // change locally so we don't pop the banner back open here.
    const onStorage = (event: StorageEvent) => {
      if (event.key !== PWA_PROMPT_STORAGE_KEY) return;
      setState(loadPwaPromptState());
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onAppInstalled);
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onAppInstalled);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  // ---------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------
  const handleInstall = useCallback(async () => {
    const deferred = deferredRef.current;
    if (deferred) {
      try {
        await deferred.prompt();
        const choice = await deferred.userChoice;
        if (choice.outcome === "accepted") {
          setState((prev) => {
            const base = prev ?? loadPwaPromptState();
            const next = applyPwaEvent(base, { kind: "install" });
            savePwaPromptState(next);
            return next;
          });
        } else {
          // User cancelled the native dialog → start the 14-day cooldown.
          setState((prev) => {
            const base = prev ?? loadPwaPromptState();
            const next = applyPwaEvent(base, {
              kind: "dismiss",
              at: Date.now(),
            });
            savePwaPromptState(next);
            return next;
          });
        }
      } catch {
        // The browser may reject `prompt()` if it has already been used.
        // Treat as dismissal so the user is not nagged immediately.
        setState((prev) => {
          const base = prev ?? loadPwaPromptState();
          const next = applyPwaEvent(base, {
            kind: "dismiss",
            at: Date.now(),
          });
          savePwaPromptState(next);
          return next;
        });
      } finally {
        deferredRef.current = null;
        setHasNativePrompt(false);
      }
      return;
    }

    // No native event — must be iOS Safari (or a browser that does not
    // implement `beforeinstallprompt`). Expand the inline guide rather
    // than opening a modal.
    setExpanded(true);
  }, []);

  const handleDismiss = useCallback(() => {
    setState((prev) => {
      const base = prev ?? loadPwaPromptState();
      const next = applyPwaEvent(base, { kind: "dismiss", at: Date.now() });
      savePwaPromptState(next);
      return next;
    });
    deferredRef.current = null;
    setHasNativePrompt(false);
    setExpanded(false);
  }, []);

  // ---------------------------------------------------------------------
  // Visibility derivation
  // ---------------------------------------------------------------------
  const visible = useMemo(() => {
    if (state === null) return false;
    if (!shouldShowPrompt(state)) return false;
    return hasNativePrompt || iosFallback;
  }, [state, hasNativePrompt, iosFallback]);

  if (!visible) return null;

  return (
    <aside
      role="region"
      aria-label="Cài đặt ứng dụng Huyền Bí"
      data-testid="pwa-install-prompt"
      className={cn(
        // Position: thin sticky banner on mobile, bottom-right card on desktop.
        "fixed z-50 no-print",
        "inset-x-0 bottom-0",
        "md:inset-auto md:bottom-4 md:right-4 md:left-auto md:w-80",
        // Animation honours prefers-reduced-motion.
        "animate-in slide-in-from-bottom-2 duration-300",
        "motion-reduce:animate-none motion-reduce:duration-0",
      )}
    >
      <div
        className={cn(
          // Visual surface — thin on mobile (no rounded edges, just top
          // border so it reads as a banner), card-shaped on desktop.
          "bg-card/95 backdrop-blur-md text-card-foreground",
          "border-t border-border md:border md:rounded-lg",
          "shadow-md",
          "px-4 py-3 md:p-4",
        )}
      >
        <div className="flex items-start gap-3">
          <div
            aria-hidden="true"
            className={cn(
              "shrink-0 hidden md:flex",
              "h-9 w-9 items-center justify-center",
              "rounded-md bg-primary/10 text-primary border border-primary-border",
            )}
          >
            <Sparkles className="h-4 w-4" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold leading-tight">
              Cài Huyền Bí lên màn hình chính
            </p>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              Mở nhanh hơn và dùng được khi không có mạng.
            </p>

            {expanded && iosFallback && (
              <ol
                className={cn(
                  "mt-3 space-y-2 text-xs text-foreground",
                  "rounded-md border border-border bg-muted/40 p-3",
                )}
                aria-label="Hướng dẫn cài Huyền Bí trên iOS Safari"
              >
                <li className="flex items-start gap-2">
                  <span
                    aria-hidden="true"
                    className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-semibold text-primary"
                  >
                    1
                  </span>
                  <span className="leading-relaxed">
                    Nhấn nút Chia sẻ{" "}
                    <Share2
                      aria-hidden="true"
                      className="inline-block h-3.5 w-3.5 align-text-bottom text-primary"
                    />{" "}
                    ở thanh dưới Safari.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span
                    aria-hidden="true"
                    className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-semibold text-primary"
                  >
                    2
                  </span>
                  <span className="leading-relaxed">
                    Cuộn xuống và chọn{" "}
                    <strong className="font-semibold">
                      Thêm vào Màn hình chính
                    </strong>
                    .
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span
                    aria-hidden="true"
                    className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-semibold text-primary"
                  >
                    3
                  </span>
                  <span className="leading-relaxed">
                    Nhấn{" "}
                    <strong className="font-semibold">Thêm</strong>{" "}
                    ở góc trên bên phải để hoàn tất.
                  </span>
                </li>
              </ol>
            )}

            <div className="mt-3 flex items-center gap-2">
              {!expanded && (
                <Button
                  type="button"
                  size="sm"
                  variant="default"
                  onClick={handleInstall}
                  data-testid="pwa-install-prompt-install"
                >
                  <Plus aria-hidden="true" className="h-4 w-4" />
                  Cài Huyền Bí
                </Button>
              )}
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={handleDismiss}
                data-testid="pwa-install-prompt-dismiss"
              >
                {expanded ? "Đóng" : "Bỏ qua"}
              </Button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Đóng nhắc cài đặt"
            data-testid="pwa-install-prompt-close"
            className={cn(
              "shrink-0 rounded-md p-1 text-muted-foreground",
              "hover:text-foreground",
              "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            )}
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

export default PwaInstallPrompt;
