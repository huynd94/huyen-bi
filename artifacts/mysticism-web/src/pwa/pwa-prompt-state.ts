/**
 * PWA install prompt state machine.
 *
 * Pure logic for deciding when to show the install prompt and persisting the
 * decision in `localStorage`. UI side-effects live in
 * `src/components/pwa-install-prompt.tsx`.
 *
 * State transitions:
 * - `successful_reading`: increment `successfulReadingsCount`.
 * - `dismiss`: record the dismiss timestamp; cooldown lasts 14 days.
 * - `install`: terminal state, prompt never shows again.
 * - `time_advance`: no-op on state, used by tests to advance virtual clock.
 *
 * Validates: Requirements 16.1, 16.2.
 */

/** Persisted state for the PWA install prompt. */
export interface PwaPromptState {
  /** Number of successful readings the user has completed (≥ 1 unlocks prompt). */
  successfulReadingsCount: number;
  /** Timestamp (ms since epoch) of the last dismissal, or null if never dismissed. */
  dismissedAt: number | null;
  /** True after the user accepts install. Terminal: prompt never shows again. */
  installed: boolean;
}

/** Event accepted by the reducer. */
export type PwaPromptEvent =
  | { kind: "successful_reading" }
  | { kind: "dismiss"; at: number }
  | { kind: "install" }
  | { kind: "time_advance"; deltaMs: number };

/** Cooldown after a dismissal, in milliseconds (14 days). */
export const DISMISS_COOLDOWN_MS = 14 * 24 * 3600 * 1000;

/** localStorage key used for persistence. */
export const PWA_PROMPT_STORAGE_KEY = "pwa-prompt-state";

/** Default state for a fresh device. */
export const DEFAULT_PWA_PROMPT_STATE: PwaPromptState = {
  successfulReadingsCount: 0,
  dismissedAt: null,
  installed: false,
};

/**
 * Decide whether the install prompt should be visible.
 *
 * Invariants:
 * - `false` when `successfulReadingsCount < 1`.
 * - `false` when `installed === true` (terminal).
 * - `false` when `dismissedAt !== null` and `now - dismissedAt < 14 days`.
 * - `true` otherwise.
 */
export function shouldShowPrompt(
  state: PwaPromptState,
  now: number = Date.now(),
): boolean {
  if (state.installed) return false;
  if (state.successfulReadingsCount < 1) return false;
  if (state.dismissedAt !== null && now - state.dismissedAt < DISMISS_COOLDOWN_MS) {
    return false;
  }
  return true;
}

/**
 * Pure reducer for PWA prompt events. Always returns a fresh state object.
 *
 * `install` is terminal: subsequent events do not flip `installed` back to
 * `false`, but other counters still update for diagnostic purposes.
 */
export function applyPwaEvent(
  state: PwaPromptState,
  event: PwaPromptEvent,
): PwaPromptState {
  switch (event.kind) {
    case "successful_reading":
      return {
        ...state,
        successfulReadingsCount: state.successfulReadingsCount + 1,
      };
    case "dismiss":
      return { ...state, dismissedAt: event.at };
    case "install":
      return { ...state, installed: true };
    case "time_advance":
      // No-op on persisted state. Tests use this to advance their virtual
      // clock; `shouldShowPrompt` accepts an explicit `now` argument.
      return state;
  }
}

function isPwaPromptState(value: unknown): value is PwaPromptState {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.successfulReadingsCount === "number" &&
    Number.isFinite(v.successfulReadingsCount) &&
    (v.dismissedAt === null || typeof v.dismissedAt === "number") &&
    typeof v.installed === "boolean"
  );
}

/**
 * Load state from `localStorage["pwa-prompt-state"]`. Returns the default state
 * when the key is missing, JSON parse fails, or the shape is invalid.
 */
export function loadPwaPromptState(): PwaPromptState {
  if (typeof localStorage === "undefined") {
    return { ...DEFAULT_PWA_PROMPT_STATE };
  }
  try {
    const raw = localStorage.getItem(PWA_PROMPT_STORAGE_KEY);
    if (raw === null) return { ...DEFAULT_PWA_PROMPT_STATE };
    const parsed = JSON.parse(raw) as unknown;
    if (!isPwaPromptState(parsed)) return { ...DEFAULT_PWA_PROMPT_STATE };
    return {
      successfulReadingsCount: parsed.successfulReadingsCount,
      dismissedAt: parsed.dismissedAt,
      installed: parsed.installed,
    };
  } catch {
    return { ...DEFAULT_PWA_PROMPT_STATE };
  }
}

/**
 * Persist state to `localStorage["pwa-prompt-state"]`. Silently ignores
 * storage errors (quota exceeded, disabled storage, SSR).
 */
export function savePwaPromptState(state: PwaPromptState): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(PWA_PROMPT_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage may be unavailable (private mode, quota). Best-effort persist.
  }
}
