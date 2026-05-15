/**
 * Property Test: Wrapper Opacity Constraints
 *
 * **Property 4: Wrapper opacity constraints**
 *
 * For any theme value ("dark" or "light"), `computeAmbientOpacity(theme)`
 * SHALL return a value no greater than 0.35 for "dark" and no greater than
 * 0.15 for "light".
 *
 * **Validates: Requirements 5.1, 5.2, 5.3**
 */

import { describe, it, expect } from "vitest";
import fc from "fast-check";

import {
  computeAmbientOpacity,
  AMBIENT_OPACITY_DARK_MAX,
  AMBIENT_OPACITY_LIGHT_MAX,
} from "@/components/ambient-bg";

describe("Property 4: Wrapper opacity constraints", () => {
  /**
   * **Validates: Requirements 5.1, 5.2**
   *
   * For any theme value, computeAmbientOpacity returns a value within the
   * specified upper bounds: ≤ 0.35 for "dark", ≤ 0.15 for "light".
   */
  it("computeAmbientOpacity returns ≤ 0.35 for dark and ≤ 0.15 for light", () => {
    fc.assert(
      fc.property(
        fc.constantFrom("dark" as const, "light" as const),
        (theme) => {
          const opacity = computeAmbientOpacity(theme);

          // Opacity must be a finite number
          expect(opacity).toBeTypeOf("number");
          expect(Number.isFinite(opacity)).toBe(true);

          // Opacity must be non-negative
          expect(opacity).toBeGreaterThanOrEqual(0);

          if (theme === "dark") {
            // Requirement 5.1: dark mode wrapper opacity ≤ 0.35
            expect(opacity).toBeLessThanOrEqual(0.35);
          } else {
            // Requirement 5.2: light mode wrapper opacity ≤ 0.15
            expect(opacity).toBeLessThanOrEqual(0.15);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 5.3**
   *
   * The function uses the existing constants (AMBIENT_OPACITY_DARK_MAX and
   * AMBIENT_OPACITY_LIGHT_MAX) which encode the constraints. This verifies
   * the constants themselves satisfy the spec bounds.
   */
  it("exported opacity constants satisfy the spec upper bounds", () => {
    fc.assert(
      fc.property(
        fc.constantFrom("dark" as const, "light" as const),
        (theme) => {
          // Verify the constants are within spec bounds
          expect(AMBIENT_OPACITY_DARK_MAX).toBeLessThanOrEqual(0.35);
          expect(AMBIENT_OPACITY_LIGHT_MAX).toBeLessThanOrEqual(0.15);

          // Verify computeAmbientOpacity uses these constants correctly
          const result = computeAmbientOpacity(theme);
          if (theme === "dark") {
            expect(result).toBe(AMBIENT_OPACITY_DARK_MAX);
          } else {
            expect(result).toBe(AMBIENT_OPACITY_LIGHT_MAX);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
