/**
 * Property Test: Accessibility Non-Interference
 *
 * **Property 7: Accessibility non-interference**
 *
 * For any rendered state of the Ambient_Background, the container SHALL have
 * `aria-hidden="true"` and `pointer-events: none`, and neither Star_Field_Layer
 * nor Cloud_Field_Layer SHALL contain text content or interactive elements.
 *
 * **Validates: Requirements 7.1, 7.2, 7.3**
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import fc from "fast-check";
import React from "react";

import { AmbientBg } from "@/components/ambient-bg";
import { ThemeProvider } from "@/contexts/theme";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Interactive element tag names that should never appear in decorative layers */
const INTERACTIVE_TAGS = ["a", "button", "input", "select", "textarea", "details", "summary"];

/**
 * Render AmbientBg with a given theme by setting localStorage before render.
 */
function renderWithTheme(theme: "dark" | "light") {
  // Set theme in localStorage so ThemeProvider picks it up
  window.localStorage.setItem("theme", theme);

  const result = render(
    <ThemeProvider>
      <AmbientBg />
    </ThemeProvider>,
  );

  return result;
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("Property 7: Accessibility non-interference", () => {
  /**
   * **Validates: Requirements 7.1**
   *
   * The AmbientBg container has `aria-hidden="true"` for any theme,
   * excluding it from the accessibility tree.
   */
  it("container has aria-hidden attribute for any theme", () => {
    fc.assert(
      fc.property(
        fc.constantFrom("dark" as const, "light" as const),
        (theme) => {
          const { container, unmount } = renderWithTheme(theme);

          // The wrapper div is the first child of the container
          const wrapper = container.firstElementChild as HTMLElement;
          expect(wrapper).not.toBeNull();

          // aria-hidden must be present (React renders `aria-hidden` as "true" string)
          expect(wrapper!.getAttribute("aria-hidden")).toBe("true");

          unmount();
        },
      ),
      { numRuns: 10 },
    );
  });

  /**
   * **Validates: Requirements 7.2**
   *
   * The AmbientBg container has `pointer-events: none` (via className
   * "pointer-events-none") for any theme, preventing interaction interception.
   */
  it("container has pointer-events-none class for any theme", () => {
    fc.assert(
      fc.property(
        fc.constantFrom("dark" as const, "light" as const),
        (theme) => {
          const { container, unmount } = renderWithTheme(theme);

          const wrapper = container.firstElementChild as HTMLElement;
          expect(wrapper).not.toBeNull();

          // The wrapper uses Tailwind's pointer-events-none class
          expect(wrapper!.className).toContain("pointer-events-none");

          unmount();
        },
      ),
      { numRuns: 10 },
    );
  });

  /**
   * **Validates: Requirements 7.3**
   *
   * Star field and cloud field layers contain no text content.
   * For any theme, the background layers should be purely visual with no
   * readable text that would confuse screen readers if aria-hidden were removed.
   */
  it("background layers contain no text content for any theme", () => {
    fc.assert(
      fc.property(
        fc.constantFrom("dark" as const, "light" as const),
        (theme) => {
          const { container, unmount } = renderWithTheme(theme);

          const wrapper = container.firstElementChild as HTMLElement;
          expect(wrapper).not.toBeNull();

          if (theme === "dark") {
            // Star field layer
            const starField = wrapper!.querySelector(".ambient-star-field");
            expect(starField).not.toBeNull();
            // Star field should have no text content
            expect(starField!.textContent).toBe("");
          } else {
            // Cloud field layer
            const cloudField = wrapper!.querySelector(".ambient-cloud-field");
            expect(cloudField).not.toBeNull();
            // Cloud field and all its children should have no text content
            expect(cloudField!.textContent).toBe("");
          }

          unmount();
        },
      ),
      { numRuns: 10 },
    );
  });

  /**
   * **Validates: Requirements 7.3**
   *
   * Star field and cloud field layers contain no interactive elements
   * (buttons, links, inputs, etc.) for any theme.
   */
  it("background layers contain no interactive elements for any theme", () => {
    fc.assert(
      fc.property(
        fc.constantFrom("dark" as const, "light" as const),
        fc.constantFrom(...INTERACTIVE_TAGS),
        (theme, interactiveTag) => {
          const { container, unmount } = renderWithTheme(theme);

          const wrapper = container.firstElementChild as HTMLElement;
          expect(wrapper).not.toBeNull();

          if (theme === "dark") {
            const starField = wrapper!.querySelector(".ambient-star-field");
            expect(starField).not.toBeNull();
            // No interactive elements inside star field
            const interactiveElements = starField!.querySelectorAll(interactiveTag);
            expect(interactiveElements.length).toBe(0);
          } else {
            const cloudField = wrapper!.querySelector(".ambient-cloud-field");
            expect(cloudField).not.toBeNull();
            // No interactive elements inside cloud field
            const interactiveElements = cloudField!.querySelectorAll(interactiveTag);
            expect(interactiveElements.length).toBe(0);
          }

          unmount();
        },
      ),
      { numRuns: 14 }, // 2 themes × 7 interactive tags
    );
  });
});
