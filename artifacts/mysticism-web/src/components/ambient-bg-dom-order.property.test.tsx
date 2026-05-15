/**
 * Property Test: DOM order preserves layer stacking
 *
 * **Property 6: DOM order preserves layer stacking**
 *
 * For any rendered state of the Ambient_Background, the new background layer
 * elements (star field or cloud field) SHALL appear before all orb elements
 * in DOM order, ensuring they render below orbs in the visual stacking context.
 *
 * **Validates: Requirements 3.1, 3.3**
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import fc from "fast-check";
import React from "react";

import { AmbientBg } from "@/components/ambient-bg";
import { ThemeProvider } from "@/contexts/theme";
import type { Theme } from "@/contexts/theme";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Renders AmbientBg within a ThemeProvider that forces a specific theme.
 * We manipulate localStorage to set the theme before rendering.
 */
function renderWithTheme(theme: Theme) {
  // Set localStorage so ThemeProvider picks up the desired theme
  window.localStorage.setItem("theme", theme);

  const result = render(
    <ThemeProvider>
      <AmbientBg />
    </ThemeProvider>
  );

  return result;
}

// ---------------------------------------------------------------------------
// Property 6: DOM order preserves layer stacking
// ---------------------------------------------------------------------------

describe("Property 6: DOM order preserves layer stacking", () => {
  /**
   * **Validates: Requirements 3.1, 3.3**
   *
   * For any theme value, the background layer (star field in dark mode,
   * cloud field in light mode) appears BEFORE all orb elements in DOM order.
   * This ensures layers render below orbs in the visual stacking context
   * without needing explicit z-index manipulation.
   */
  it("star/cloud layer elements always appear before orb elements in DOM", () => {
    fc.assert(
      fc.property(
        fc.constantFrom("dark" as const, "light" as const),
        (theme) => {
          const { container } = renderWithTheme(theme);

          // The AmbientBg wrapper is the first child rendered by ThemeProvider
          const wrapper = container.querySelector("[aria-hidden]") as HTMLElement;
          expect(wrapper).not.toBeNull();

          const children = Array.from(wrapper!.children);

          // Find the index of the background layer
          let layerIndex = -1;
          if (theme === "dark") {
            layerIndex = children.findIndex((el) =>
              el.classList.contains("ambient-star-field")
            );
          } else {
            layerIndex = children.findIndex((el) =>
              el.classList.contains("ambient-cloud-field")
            );
          }

          // The background layer must exist
          expect(layerIndex).toBeGreaterThanOrEqual(0);

          // Find all orb elements
          const orbIndices = children
            .map((el, i) => (el.classList.contains("orb") ? i : -1))
            .filter((i) => i >= 0);

          // There should be orb elements present
          expect(orbIndices.length).toBeGreaterThan(0);

          // The background layer index must be LESS than ALL orb indices
          // (i.e., it appears before orbs in DOM order)
          for (const orbIndex of orbIndices) {
            expect(layerIndex).toBeLessThan(orbIndex);
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * **Validates: Requirements 3.1, 3.3**
   *
   * Verifies that in dark mode, the star field is the first child element
   * of the wrapper (before any orbs), confirming it renders at the lowest
   * visual layer.
   */
  it("in dark mode, star field is rendered before all orb elements", () => {
    fc.assert(
      fc.property(
        fc.constant("dark" as const),
        (theme) => {
          const { container } = renderWithTheme(theme);

          const wrapper = container.querySelector("[aria-hidden]") as HTMLElement;
          expect(wrapper).not.toBeNull();

          const children = Array.from(wrapper!.children);

          // Star field must be present
          const starField = children.find((el) =>
            el.classList.contains("ambient-star-field")
          );
          expect(starField).toBeDefined();

          // Star field index
          const starFieldIndex = children.indexOf(starField!);

          // First orb index
          const firstOrbIndex = children.findIndex((el) =>
            el.classList.contains("orb")
          );

          expect(firstOrbIndex).toBeGreaterThan(-1);
          expect(starFieldIndex).toBeLessThan(firstOrbIndex);
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * **Validates: Requirements 3.1, 3.3**
   *
   * Verifies that in light mode, the cloud field is rendered before all orb
   * elements in DOM order.
   */
  it("in light mode, cloud field is rendered before all orb elements", () => {
    fc.assert(
      fc.property(
        fc.constant("light" as const),
        (theme) => {
          const { container } = renderWithTheme(theme);

          const wrapper = container.querySelector("[aria-hidden]") as HTMLElement;
          expect(wrapper).not.toBeNull();

          const children = Array.from(wrapper!.children);

          // Cloud field must be present
          const cloudField = children.find((el) =>
            el.classList.contains("ambient-cloud-field")
          );
          expect(cloudField).toBeDefined();

          // Cloud field index
          const cloudFieldIndex = children.indexOf(cloudField!);

          // First orb index
          const firstOrbIndex = children.findIndex((el) =>
            el.classList.contains("orb")
          );

          expect(firstOrbIndex).toBeGreaterThan(-1);
          expect(cloudFieldIndex).toBeLessThan(firstOrbIndex);
        }
      ),
      { numRuns: 10 }
    );
  });
});
