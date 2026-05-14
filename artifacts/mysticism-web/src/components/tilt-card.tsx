import {
  useCallback,
  useEffect,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

import { cn } from "@/lib/utils";
import { animationRegistry } from "@/components/ui/animation-registry";

/**
 * Public API of {@link TiltCard}.
 *
 * The component is a drop-in wrapper that adds a subtle 3D tilt on hover.
 * It is intentionally minimal: only `children` and `className` are exposed
 * so call sites stay agnostic of the internal motion implementation. The
 * tilt magnitude, spring configuration and reduced-motion handling are all
 * derived from `animationRegistry.tilt` and the user's OS / device — never
 * configurable via props.
 */
interface TiltCardProps {
  /** Card content to be tilted. */
  children: ReactNode;
  /** Optional class names forwarded to the outer element. */
  className?: string;
}

/**
 * Soft cap (degrees) applied during normal pointer movement.
 *
 * Requirement 9.6: "tilt 3D tối đa ±8 độ".
 *
 * The mouse-to-angle mapping multiplies a normalised pointer offset
 * (clamped to `[-1, 1]`) by this constant, so under well-behaved input the
 * absolute angle never exceeds 8°.
 */
const SOFT_CAP_DEG = 8;

/**
 * Hard cap (degrees) applied as a defensive safety net.
 *
 * Requirement 9.6: "không vượt quá ±15 độ để tránh cảm giác 'đồ chơi'".
 *
 * Even if upstream code ever feeds an out-of-range pointer offset (e.g.
 * during automated tests, weird `pointermove` events from accessibility
 * tooling, or a future refactor that bypasses the soft cap), the final
 * `clamp(..., -HARD_CAP_DEG, HARD_CAP_DEG)` guarantees the rotation values
 * surfaced to Framer Motion never break this contract.
 */
const HARD_CAP_DEG = 15;

/** Z-distance (px) used for the perspective projection. */
const TILT_PERSPECTIVE = 1000;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Returns `true` when the tilt effect must be disabled for the current
 * environment.
 *
 * The tilt is suppressed in three situations, all spelled out by Requirement
 * 9.6 and the reduced-motion guidance in 9.4:
 *
 * - During SSR / non-DOM environments where `window` is unavailable.
 * - When `prefers-reduced-motion: reduce` is set, so motion-sensitive users
 *   never see a continuous 3D animation.
 * - On touch / coarse pointer devices (`(hover: none)` or
 *   `(pointer: coarse)`), where there is no real hover gesture and the
 *   tilt would either flicker on tap or simply never trigger.
 *
 * The function is wrapped in a `try/catch` because some test runners (e.g.
 * older happy-dom builds) implement `matchMedia` but throw on unknown
 * features. In that case we fall back to "enabled" so unit tests still
 * exercise the motion path.
 */
function shouldDisableTilt(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return true;
  }
  try {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return true;
    }
    if (window.matchMedia("(hover: none)").matches) {
      return true;
    }
    if (window.matchMedia("(pointer: coarse)").matches) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Card wrapper that applies a subtle 3D tilt while the cursor hovers over
 * its bounding box.
 *
 * The implementation is driven by Framer Motion: pointer position is
 * captured as a normalised offset, mapped to `rotateX` / `rotateY` motion
 * values, and then smoothed by a spring with the parameters defined in
 * `animationRegistry.tilt.spring` (`stiffness: 120, damping: 18`).
 *
 * The component preserves its previous public API — only `children` and
 * `className` are forwarded — so existing call sites (e.g. the home page
 * module grid) keep working without changes.
 *
 * Accessibility / device considerations (Requirement 9.6):
 *
 * - Disabled when `prefers-reduced-motion: reduce`.
 * - Disabled on touch / coarse-pointer devices (`(hover: none)`,
 *   `(pointer: coarse)`).
 * - SSR-safe: behaves as a plain `<div>` until `window` is available.
 *
 * The reactive media-query listeners are attached in a `useEffect` so they
 * are torn down on unmount, avoiding leaked subscriptions.
 *
 * @example
 *   <TiltCard className="rounded-lg">
 *     <ModuleCard module={module} />
 *   </TiltCard>
 */
export function TiltCard({ children, className }: TiltCardProps): ReactElement {
  const [disabled, setDisabled] = useState<boolean>(() => shouldDisableTilt());

  const tiltSpring = animationRegistry.tilt.spring ?? {
    stiffness: 120,
    damping: 18,
  };

  // Raw pointer-driven rotation values…
  const rotateXMV = useMotionValue(0);
  const rotateYMV = useMotionValue(0);
  // …smoothed by the spring config from the animation registry so the
  // visible rotation matches the documented motion language.
  const rotateX = useSpring(rotateXMV, {
    stiffness: tiltSpring.stiffness,
    damping: tiltSpring.damping,
  });
  const rotateY = useSpring(rotateYMV, {
    stiffness: tiltSpring.stiffness,
    damping: tiltSpring.damping,
  });

  /**
   * Subscribe to the three media queries that can flip the disabled state
   * at runtime (the user can toggle reduced-motion in OS settings or move
   * a window between a touch screen and a regular monitor). We add and
   * remove listeners with the standard `addEventListener('change')` API,
   * falling back to `addListener` for browsers that haven't migrated yet.
   */
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }

    const queries = [
      "(prefers-reduced-motion: reduce)",
      "(hover: none)",
      "(pointer: coarse)",
    ].map((q) => window.matchMedia(q));

    const update = () => setDisabled(shouldDisableTilt());

    // Reflect the current state on mount in case the lazy initialiser ran
    // before the document was fully ready.
    update();

    const subscribe = (mql: MediaQueryList): (() => void) => {
      if (typeof mql.addEventListener === "function") {
        mql.addEventListener("change", update);
        return () => mql.removeEventListener("change", update);
      }
      // Fallback for older browsers that only expose the deprecated API.
      const legacy = mql as MediaQueryList & {
        addListener?: (listener: () => void) => void;
        removeListener?: (listener: () => void) => void;
      };
      legacy.addListener?.(update);
      return () => legacy.removeListener?.(update);
    };

    const unsubscribers = queries.map(subscribe);

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, []);

  /**
   * Maps the pointer position inside the card's bounding box to the two
   * rotation motion values, applying the soft cap (±8°) during the mapping
   * and the hard cap (±15°) as a final clamp. The hard cap is never hit by
   * well-behaved input but guarantees the contract from Requirement 9.6
   * even if the upstream calculation is ever changed.
   */
  const handleMouseMove = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      if (disabled) {
        return;
      }
      const rect = event.currentTarget.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        return;
      }

      // Normalised offset in [-1, 1]; the outer clamp protects against a
      // pointer briefly reported outside the card (sub-pixel rounding,
      // `mousemove` fired during a layout shift, etc.).
      const nx = clamp(((event.clientX - rect.left) / rect.width - 0.5) * 2, -1, 1);
      const ny = clamp(((event.clientY - rect.top) / rect.height - 0.5) * 2, -1, 1);

      // `rotateY` follows the horizontal offset; `rotateX` is inverted so
      // pushing the cursor towards the top of the card tilts it forward.
      const ry = clamp(nx * SOFT_CAP_DEG, -HARD_CAP_DEG, HARD_CAP_DEG);
      const rx = clamp(-ny * SOFT_CAP_DEG, -HARD_CAP_DEG, HARD_CAP_DEG);

      rotateXMV.set(rx);
      rotateYMV.set(ry);
    },
    [disabled, rotateXMV, rotateYMV],
  );

  /**
   * Reset the rotation when the pointer leaves so the card springs back to
   * its rest pose instead of getting "stuck" at the last sampled angle.
   */
  const handleMouseLeave = useCallback(() => {
    rotateXMV.set(0);
    rotateYMV.set(0);
  }, [rotateXMV, rotateYMV]);

  if (disabled) {
    return <div className={cn(className)}>{children}</div>;
  }

  return (
    <motion.div
      className={cn(className)}
      style={{
        rotateX,
        rotateY,
        transformPerspective: TILT_PERSPECTIVE,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </motion.div>
  );
}
