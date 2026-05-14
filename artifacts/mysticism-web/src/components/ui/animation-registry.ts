/**
 * Animation Registry — single source of truth for the motion language used
 * across the Huyền Bí UX/UI upgrade.
 *
 * Every interactive transition (hover, dropdown, dialog, tab switch, toast),
 * every reveal (scroll reveal), and every continuous gesture (tilt) is
 * declared here as an {@link AnimationVariant}. Both Framer Motion call sites
 * and CSS-driven transitions read from this registry instead of hard-coding
 * durations/easings, so the *Animation language* table in `design.md` cannot
 * drift away from the implementation.
 *
 * The module is pure TypeScript: no DOM access, no React, no runtime
 * dependencies. It is therefore safe to import from both browser bundles and
 * Node-side test runners.
 *
 * Design references:
 *
 * - `design.md` → "Animation language" table for duration / easing windows.
 * - `design.md` → "Property 17: Cấu hình Motion bám duration / easing /
 *   reduced-motion" for the invariants this registry must satisfy.
 *
 * Validates: Requirements 9.1, 9.2, 9.3, 9.4.
 */

// ---------------------------------------------------------------------------
// Easing constants
// ---------------------------------------------------------------------------

/**
 * Easing applied to enter / reveal transitions (open dropdowns, fade-in
 * cards, scroll reveal). Matches the "ease-out" cubic from `design.md`.
 *
 * Requirement 9.3: enter must use `cubic-bezier(0.22, 0.61, 0.36, 1)`.
 */
export const ENTER_EASING = "cubic-bezier(0.22, 0.61, 0.36, 1)" as const;

/**
 * Easing applied to exit transitions (close dropdowns, fade-out toasts).
 * Matches the "ease-in" cubic from `design.md`.
 *
 * Requirement 9.3: exit must use `cubic-bezier(0.4, 0, 1, 1)`.
 */
export const EXIT_EASING = "cubic-bezier(0.4, 0, 1, 1)" as const;

/**
 * Maximum duration permitted for any reduced-motion fallback variant, in
 * milliseconds. Requirement 9.4 caps the substituted fade at 150ms so screen
 * users with `prefers-reduced-motion: reduce` never see a slow animation.
 */
export const REDUCED_MOTION_MAX_DURATION_MS = 150 as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Distinguishes tween-based variants (cubic-bezier curves over a fixed
 * `duration`) from spring-based ones. Spring variants — only `tilt` for now
 * — derive their motion from physical parameters and ignore `duration`; we
 * still expose `duration: 0` for them so downstream code can treat the
 * registry uniformly.
 */
export type AnimationKind = "tween" | "spring";

/**
 * A single named animation variant.
 *
 * `properties` lists the underlying CSS / Framer Motion props that this
 * variant animates. Naming follows the convention used by call sites:
 *
 * - CSS-style names (`opacity`, `transform`) are used when the variant is
 *   driven by a CSS transition (toaster, tab indicator).
 * - Framer Motion prop names (`y`, `scale`, `rotateX`, `rotateY`) are used
 *   when the variant is consumed by `motion.*` components.
 *
 * The fields are intentionally read-only so the registry remains immutable
 * at runtime.
 */
export interface AnimationVariant {
  /** Stable identifier, matches the key in {@link animationRegistry}. */
  readonly name: AnimationVariantName;
  /**
   * Duration in milliseconds. For `tween` variants this is the tween length;
   * for `spring` variants it is `0` and the actual length is determined by
   * `spring.stiffness` / `spring.damping`.
   */
  readonly duration: number;
  /**
   * CSS `cubic-bezier(...)` easing string. For `spring` variants the value
   * is still set (so consumers that always read `easing` do not crash) but
   * is informational only.
   *
   * Requirement 9.3 forbids `linear`; every entry in this registry uses
   * either {@link ENTER_EASING} or {@link EXIT_EASING}.
   */
  readonly easing: string;
  /** Animated properties (CSS or Framer Motion). Never empty. */
  readonly properties: readonly string[];
  /**
   * Underlying motion model. Defaults to `"tween"`. `"spring"` is reserved
   * for continuous gestures (`tilt`).
   */
  readonly kind: AnimationKind;
  /**
   * Spring parameters, only present when `kind === "spring"`. The values
   * mirror Framer Motion's `{ type: "spring", stiffness, damping }` shape.
   */
  readonly spring?: {
    readonly stiffness: number;
    readonly damping: number;
  };
}

/**
 * Names of every variant exposed by {@link animationRegistry}. Defined as a
 * union of string literals so TypeScript can narrow at call sites and so
 * `getReducedMotionVariant` only accepts known names.
 */
export type AnimationVariantName =
  | "hover"
  | "dropdownEnter"
  | "dropdownExit"
  | "dialogEnter"
  | "dialogExit"
  | "tabSwitch"
  | "scrollReveal"
  | "toast"
  | "tilt";

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

/**
 * The motion language for the Huyền Bí UX/UI upgrade.
 *
 * Durations are picked inside the windows defined by Requirement 9.2 and
 * the *Animation language* table in `design.md`:
 *
 * | Variant         | Window         | Picked |
 * |-----------------|----------------|--------|
 * | `hover`         | 120–180 ms     | 150 ms |
 * | `dropdownEnter` | 200–280 ms     | 240 ms |
 * | `dropdownExit`  | 180–220 ms     | 200 ms |
 * | `dialogEnter`   | 200–280 ms     | 240 ms |
 * | `dialogExit`    | 180–220 ms     | 200 ms |
 * | `tabSwitch`     | 200 ms         | 200 ms |
 * | `scrollReveal`  | 500–700 ms     | 600 ms |
 * | `toast`         | 240 ms         | 240 ms |
 * | `tilt`          | spring, cont.  | 0 ms   |
 *
 * The registry is frozen — both the outer object and each variant — so it
 * cannot be mutated at runtime by accident.
 */
export const animationRegistry: Readonly<
  Record<AnimationVariantName, AnimationVariant>
> = Object.freeze({
  hover: Object.freeze({
    name: "hover",
    duration: 150,
    easing: ENTER_EASING,
    properties: Object.freeze(["transform", "box-shadow"]) as readonly string[],
    kind: "tween",
  }),
  dropdownEnter: Object.freeze({
    name: "dropdownEnter",
    duration: 240,
    easing: ENTER_EASING,
    properties: Object.freeze(["opacity", "y", "scale"]) as readonly string[],
    kind: "tween",
  }),
  dropdownExit: Object.freeze({
    name: "dropdownExit",
    duration: 200,
    easing: EXIT_EASING,
    properties: Object.freeze(["opacity", "y", "scale"]) as readonly string[],
    kind: "tween",
  }),
  dialogEnter: Object.freeze({
    name: "dialogEnter",
    duration: 240,
    easing: ENTER_EASING,
    properties: Object.freeze(["opacity", "scale"]) as readonly string[],
    kind: "tween",
  }),
  dialogExit: Object.freeze({
    name: "dialogExit",
    duration: 200,
    easing: EXIT_EASING,
    properties: Object.freeze(["opacity", "scale"]) as readonly string[],
    kind: "tween",
  }),
  tabSwitch: Object.freeze({
    name: "tabSwitch",
    duration: 200,
    easing: ENTER_EASING,
    properties: Object.freeze(["opacity", "x"]) as readonly string[],
    kind: "tween",
  }),
  scrollReveal: Object.freeze({
    name: "scrollReveal",
    duration: 600,
    easing: ENTER_EASING,
    properties: Object.freeze(["opacity", "y"]) as readonly string[],
    kind: "tween",
  }),
  toast: Object.freeze({
    name: "toast",
    duration: 240,
    easing: ENTER_EASING,
    properties: Object.freeze(["opacity", "y"]) as readonly string[],
    kind: "tween",
  }),
  tilt: Object.freeze({
    name: "tilt",
    duration: 0,
    easing: ENTER_EASING,
    properties: Object.freeze(["rotateX", "rotateY"]) as readonly string[],
    kind: "spring",
    spring: Object.freeze({ stiffness: 120, damping: 18 }),
  }),
}) as Readonly<Record<AnimationVariantName, AnimationVariant>>;

// ---------------------------------------------------------------------------
// Reduced-motion fallback
// ---------------------------------------------------------------------------

/**
 * Returns the reduced-motion fallback for a registered variant.
 *
 * Per Requirement 9.4, when the user's OS reports
 * `prefers-reduced-motion: reduce`, every animation in the app must collapse
 * to a short fade:
 *
 * - `duration` ≤ {@link REDUCED_MOTION_MAX_DURATION_MS} (150 ms).
 * - `properties` reduces to a single `"opacity"` entry — no transforms, no
 *   spring rotations.
 * - `easing` is preserved from the source variant so the fade still feels
 *   in-character with the rest of the app.
 * - `kind` is forced back to `"tween"` so spring parameters cannot leak
 *   through (a spring on `opacity` would be jittery).
 *
 * The returned object is a fresh, frozen value; mutating it does not affect
 * {@link animationRegistry}.
 *
 * @param name — Registered variant name.
 * @returns A frozen {@link AnimationVariant} suitable for reduced-motion users.
 *
 * @example
 *   const variant = getReducedMotionVariant("dialogEnter");
 *   //   ↳ { duration: 150, easing: ENTER_EASING, properties: ["opacity"], … }
 */
export function getReducedMotionVariant(
  name: AnimationVariantName,
): AnimationVariant {
  const source = animationRegistry[name];
  const cappedDuration = Math.min(
    source.duration,
    REDUCED_MOTION_MAX_DURATION_MS,
  );
  return Object.freeze({
    name: source.name,
    duration: cappedDuration,
    easing: source.easing,
    properties: Object.freeze(["opacity"]) as readonly string[],
    kind: "tween",
  });
}
