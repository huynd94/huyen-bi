/**
 * Unit Tests — Theme Transition Behavior for AmbientBg
 *
 * Verifies that theme switches correctly mount/unmount the appropriate
 * background layers while preserving orb elements unchanged.
 *
 * _Requirements: 3.2, 8.1, 8.2_
 */

import { describe, it, expect, beforeEach } from "vitest";
import { render, act, fireEvent } from "@testing-library/react";
import React, { type ReactNode } from "react";
import { ThemeProvider, useTheme } from "@/contexts/theme";

import { AmbientBg } from "./ambient-bg";

// ---------------------------------------------------------------------------
// Test Wrapper — controllable theme provider
// ---------------------------------------------------------------------------

/**
 * A wrapper that renders AmbientBg inside a ThemeProvider and exposes
 * buttons to set the theme, allowing us to simulate theme transitions.
 */
function ThemeController({ children }: { children: ReactNode }) {
  const { theme, setTheme } = useTheme();
  return (
    <>
      <button
        data-testid="set-dark"
        onClick={() => setTheme("dark")}
      >
        Set Dark
      </button>
      <button
        data-testid="set-light"
        onClick={() => setTheme("light")}
      >
        Set Light
      </button>
      <span data-testid="current-theme">{theme}</span>
      {children}
    </>
  );
}

function renderWithTheme() {
  return render(
    <ThemeProvider>
      <ThemeController>
        <AmbientBg />
      </ThemeController>
    </ThemeProvider>,
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getStarField(container: HTMLElement) {
  return container.querySelector(".ambient-star-field");
}

function getCloudField(container: HTMLElement) {
  return container.querySelector(".ambient-cloud-field");
}

function getOrbs(container: HTMLElement) {
  return container.querySelectorAll(".orb");
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Theme Transition Behavior", () => {
  beforeEach(() => {
    // Ensure localStorage is clean so ThemeProvider defaults to system (dark)
    window.localStorage.clear();
    // Mock matchMedia to return dark by default
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: (query: string) => ({
        matches: query === "(prefers-color-scheme: dark)",
        media: query,
        onchange: null,
        addEventListener: (_: string, __: unknown) => {},
        removeEventListener: (_: string, __: unknown) => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      }),
    });
  });

  it("dark→light: unmounts star field and mounts cloud field in same render", () => {
    const { container, getByTestId } = renderWithTheme();

    // Initial state: dark mode — star field present, cloud field absent
    expect(getStarField(container)).toBeInTheDocument();
    expect(getCloudField(container)).not.toBeInTheDocument();

    // Switch to light — wrap in act to flush all state updates
    act(() => {
      fireEvent.click(getByTestId("set-light"));
    });

    // After theme switch: star field gone, cloud field present
    expect(getStarField(container)).not.toBeInTheDocument();
    expect(getCloudField(container)).toBeInTheDocument();
  });

  it("light→dark: unmounts cloud field and mounts star field in same render", () => {
    const { container, getByTestId } = renderWithTheme();

    // Start in light mode
    act(() => {
      fireEvent.click(getByTestId("set-light"));
    });
    expect(getCloudField(container)).toBeInTheDocument();
    expect(getStarField(container)).not.toBeInTheDocument();

    // Switch back to dark
    act(() => {
      fireEvent.click(getByTestId("set-dark"));
    });

    // After theme switch: cloud field gone, star field present
    expect(getCloudField(container)).not.toBeInTheDocument();
    expect(getStarField(container)).toBeInTheDocument();
  });

  it("orb elements remain unchanged after theme switch dark→light→dark", () => {
    const { container, getByTestId } = renderWithTheme();

    // Capture initial orb state in dark mode
    const orbsBefore = getOrbs(container);
    expect(orbsBefore).toHaveLength(4);

    const orbClassesBefore = Array.from(orbsBefore).map((el) => el.className);

    // Switch to light
    act(() => {
      fireEvent.click(getByTestId("set-light"));
    });

    // Orbs should still be present and unchanged
    const orbsAfterLight = getOrbs(container);
    expect(orbsAfterLight).toHaveLength(4);
    const orbClassesAfterLight = Array.from(orbsAfterLight).map((el) => el.className);
    expect(orbClassesAfterLight).toEqual(orbClassesBefore);

    // Verify individual orb classes are preserved
    expect(container.querySelector(".orb-1")).toBeInTheDocument();
    expect(container.querySelector(".orb-2")).toBeInTheDocument();
    expect(container.querySelector(".orb-3")).toBeInTheDocument();
    expect(container.querySelector(".orb-4")).toBeInTheDocument();

    // Switch back to dark
    act(() => {
      fireEvent.click(getByTestId("set-dark"));
    });

    // Orbs should still be present and unchanged
    const orbsAfterDark = getOrbs(container);
    expect(orbsAfterDark).toHaveLength(4);
    const orbClassesAfterDark = Array.from(orbsAfterDark).map((el) => el.className);
    expect(orbClassesAfterDark).toEqual(orbClassesBefore);
  });
});
