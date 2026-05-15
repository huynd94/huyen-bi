/**
 * Property Test: Reduced Motion Disables All Layer Animations
 *
 * **Property 5: Reduced motion disables all layer animations**
 *
 * When `prefers-reduced-motion: reduce` is active, all animated layers
 * (Star_Field_Layer and Cloud_Field_Layer) SHALL have `animation` set to
 * "none" and `opacity` set to 1.
 *
 * **Validates: Requirements 6.1, 6.2**
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import fc from "fast-check";
import React from "react";

import { AmbientBg } from "@/components/ambient-bg";
import { ThemeProvider } from "@/contexts/theme";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Mock matchMedia to simulate reduced motion preference.
 * Returns a cleanup function to restore original matchMedia.
 */
function mockMatchMedia(reducedMotion: boolean) {
  const listeners: Array<(event: MediaQueryListEvent) => void> = [];

  const mockMql = {
    matches: reducedMotion,
    media: "(prefers-reduced-motion: reduce)",
    addEventListener: vi.fn((_event: string, handler: (event: MediaQueryListEvent) => void) => {
      listeners.push(handler);
    }),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    onchange: null,
    dispatchEvent: vi.fn(),
  };

  const originalMatchMedia = window.matchMedia;

  window.matchMedia = vi.fn((query: string) => {
    if (query === "(prefers-reduced-motion: reduce)") {
      return mockMql as unknown as MediaQueryList;
    }
    // For color-scheme queries used by ThemeProvider
    return {
      matches: query === "(prefers-color-scheme: dark)",
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      onchange: null,
      dispatchEvent: vi.fn(),
    } as unknown as MediaQueryList;
  });

  return {
    restore: () => {
      window.matchMedia = originalMatchMedia;
    },
  };
}

/**
 * Wrapper that provides ThemeProvider with a specific initial theme.
 * Uses localStorage to set the theme before rendering.
 */
function renderWithTheme(theme: "dark" | "light", reducedMotion: boolean) {
  // Set theme in localStorage so ThemeProvider picks it up
  window.localStorage.setItem("theme", theme);

  // Mock matchMedia for reduced motion
  const mock = mockMatchMedia(reducedMotion);

  const result = render(
    <ThemeProvider>
      <AmbientBg />
    </ThemeProvider>
  );

  return { ...result, restoreMatchMedia: mock.restore };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Property 5: Reduced motion disables all layer animations", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    window.localStorage.clear();
  });

  /**
   * **Validates: Requirements 6.1**
   *
   * When reduced motion is active and theme is "dark", the Star_Field_Layer
   * SHALL have animation set to "none" and opacity set to 1.
   */
  it("star field layer has animation: none and opacity: 1 when reduced motion is active", () => {
    fc.assert(
      fc.property(
        // Generate dark theme (the only theme that shows star field)
        fc.constant("dark" as const),
        (theme) => {
          const { container, restoreMatchMedia } = renderWithTheme(theme, true);

          try {
            const starField = container.querySelector(".ambient-star-field") as HTMLElement;
            expect(starField).not.toBeNull();

            // Verify inline style has animation: none
            expect(starField.style.animation).toBe("none");
            // Verify inline style has opacity: 1
            expect(starField.style.opacity).toBe("1");
          } finally {
            restoreMatchMedia();
            cleanup();
          }
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * **Validates: Requirements 6.2**
   *
   * When reduced motion is active and theme is "light", the Cloud_Field_Layer
   * SHALL have animation set to "none" and opacity set to 1.
   */
  it("cloud field layer has animation: none and opacity: 1 when reduced motion is active", () => {
    fc.assert(
      fc.property(
        // Generate light theme (the only theme that shows cloud field)
        fc.constant("light" as const),
        (theme) => {
          const { container, restoreMatchMedia } = renderWithTheme(theme, true);

          try {
            const cloudField = container.querySelector(".ambient-cloud-field") as HTMLElement;
            expect(cloudField).not.toBeNull();

            // Verify inline style has animation: none
            expect(cloudField.style.animation).toBe("none");
            // Verify inline style has opacity: 1
            expect(cloudField.style.opacity).toBe("1");
          } finally {
            restoreMatchMedia();
            cleanup();
          }
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * **Validates: Requirements 6.1, 6.2**
   *
   * For any theme value, when reduced motion is active, the rendered
   * background layer (star field for dark, cloud field for light) SHALL
   * have animation set to "none" and opacity set to 1.
   */
  it("for any theme, active layer has static style when reduced motion is active", () => {
    fc.assert(
      fc.property(
        fc.constantFrom("dark" as const, "light" as const),
        (theme) => {
          const { container, restoreMatchMedia } = renderWithTheme(theme, true);

          try {
            if (theme === "dark") {
              const starField = container.querySelector(".ambient-star-field") as HTMLElement;
              expect(starField).not.toBeNull();
              expect(starField.style.animation).toBe("none");
              expect(starField.style.opacity).toBe("1");
            } else {
              const cloudField = container.querySelector(".ambient-cloud-field") as HTMLElement;
              expect(cloudField).not.toBeNull();
              expect(cloudField.style.animation).toBe("none");
              expect(cloudField.style.opacity).toBe("1");
            }
          } finally {
            restoreMatchMedia();
            cleanup();
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * **Validates: Requirements 6.1, 6.2**
   *
   * Contrast case: when reduced motion is NOT active, layers should NOT
   * have the static style applied (animation should not be "none").
   * This confirms the property is specifically tied to reduced motion state.
   */
  it("layers do NOT have static style when reduced motion is inactive", () => {
    fc.assert(
      fc.property(
        fc.constantFrom("dark" as const, "light" as const),
        (theme) => {
          const { container, restoreMatchMedia } = renderWithTheme(theme, false);

          try {
            if (theme === "dark") {
              const starField = container.querySelector(".ambient-star-field") as HTMLElement;
              expect(starField).not.toBeNull();
              // When reduced motion is NOT active, animation should not be "none"
              expect(starField.style.animation).not.toBe("none");
            } else {
              const cloudField = container.querySelector(".ambient-cloud-field") as HTMLElement;
              expect(cloudField).not.toBeNull();
              // When reduced motion is NOT active, animation should not be "none"
              expect(cloudField.style.animation).not.toBe("none");
            }
          } finally {
            restoreMatchMedia();
            cleanup();
          }
        }
      ),
      { numRuns: 20 }
    );
  });
});
