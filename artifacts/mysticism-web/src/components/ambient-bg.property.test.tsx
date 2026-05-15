/**
 * Property Test: Theme-conditional layer visibility
 *
 * For any theme value provided by Theme_Context, exactly one background layer
 * is visible: Star_Field_Layer when theme is "dark", Cloud_Field_Layer when
 * theme is "light", and the other layer is not rendered in the DOM.
 *
 * **Validates: Requirements 1.1, 1.5, 2.1, 2.5, 8.1, 8.2**
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import fc from "fast-check";
import React from "react";
import { ThemeProvider, type Theme } from "@/contexts/theme";
import { AmbientBg } from "@/components/ambient-bg";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Wrapper that renders AmbientBg within a ThemeProvider pre-set to a given theme.
 * We override localStorage and matchMedia to control the initial theme value.
 */
function renderWithTheme(theme: Theme) {
  // Set localStorage so ThemeProvider picks up the desired theme on init
  window.localStorage.setItem("theme", theme);

  const result = render(
    <ThemeProvider>
      <AmbientBg />
    </ThemeProvider>,
  );

  return result;
}

// ---------------------------------------------------------------------------
// Property 1: Theme-conditional layer visibility
// ---------------------------------------------------------------------------

describe("Property 1: Theme-conditional layer visibility", () => {
  /**
   * **Validates: Requirements 1.1, 1.5, 2.1, 2.5, 8.1, 8.2**
   *
   * For any theme value, exactly one background layer is rendered:
   * - Star field (className "ambient-star-field") when theme is "dark"
   * - Cloud field (className "ambient-cloud-field") when theme is "light"
   * - Both layers are NEVER rendered simultaneously (XOR condition)
   */
  it("exactly one background layer is rendered for any theme value (star field XOR cloud field)", () => {
    fc.assert(
      fc.property(
        fc.constantFrom<Theme>("dark", "light"),
        (theme) => {
          const { container } = renderWithTheme(theme);

          const starField = container.querySelector(".ambient-star-field");
          const cloudField = container.querySelector(".ambient-cloud-field");

          // XOR: exactly one layer must be present
          const starPresent = starField !== null;
          const cloudPresent = cloudField !== null;

          // Both should never be rendered simultaneously
          expect(starPresent && cloudPresent).toBe(false);

          // At least one must be rendered
          expect(starPresent || cloudPresent).toBe(true);

          // Correct layer for the given theme
          if (theme === "dark") {
            expect(starPresent).toBe(true);
            expect(cloudPresent).toBe(false);
          } else {
            expect(starPresent).toBe(false);
            expect(cloudPresent).toBe(true);
          }
        },
      ),
      { numRuns: 20 },
    );
  });

  it("star field is rendered only in dark mode", () => {
    fc.assert(
      fc.property(
        fc.constantFrom<Theme>("dark", "light"),
        (theme) => {
          const { container } = renderWithTheme(theme);
          const starField = container.querySelector(".ambient-star-field");

          if (theme === "dark") {
            expect(starField).toBeInTheDocument();
          } else {
            expect(starField).not.toBeInTheDocument();
          }
        },
      ),
      { numRuns: 20 },
    );
  });

  it("cloud field is rendered only in light mode", () => {
    fc.assert(
      fc.property(
        fc.constantFrom<Theme>("dark", "light"),
        (theme) => {
          const { container } = renderWithTheme(theme);
          const cloudField = container.querySelector(".ambient-cloud-field");

          if (theme === "light") {
            expect(cloudField).toBeInTheDocument();
          } else {
            expect(cloudField).not.toBeInTheDocument();
          }
        },
      ),
      { numRuns: 20 },
    );
  });
});
