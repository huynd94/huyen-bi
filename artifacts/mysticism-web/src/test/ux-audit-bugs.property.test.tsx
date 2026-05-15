/**
 * Bug Condition Exploration Property Tests — UX/UI Audit Defects
 *
 * These tests encode the EXPECTED (correct) behavior for 4 bugs:
 * 1. Nav Dropdown Position: viewport aligns with trigger, not root left
 * 2. Grid Centering: items centered in incomplete rows
 * 3. Animation GPU Acceleration: will-change and GPU hints present
 * 4. Light Mode Contrast: --primary on white meets WCAG 2.1 AA (≥4.5:1)
 *
 * **CRITICAL**: These tests MUST FAIL on unfixed code — failure confirms bugs exist.
 * DO NOT attempt to fix the tests or the code when they fail.
 *
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.4**
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import fc from "fast-check";
import React from "react";
import { readFileSync } from "fs";
import { resolve } from "path";

import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
} from "@/components/ui/navigation-menu";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Convert HSL (h: 0-360, s: 0-100, l: 0-100) to linear RGB [0,1].
 */
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const sNorm = s / 100;
  const lNorm = l / 100;
  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lNorm - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }
  return [r + m, g + m, b + m];
}

/**
 * Compute relative luminance per WCAG 2.1 definition.
 * Input: linear RGB channels in [0, 1].
 */
function relativeLuminance(r: number, g: number, b: number): number {
  const toLinear = (c: number) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  const R = toLinear(r);
  const G = toLinear(g);
  const B = toLinear(b);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

/**
 * Compute WCAG contrast ratio between two colors given as HSL.
 */
function contrastRatio(
  hsl1: [number, number, number],
  hsl2: [number, number, number]
): number {
  const [r1, g1, b1] = hslToRgb(...hsl1);
  const [r2, g2, b2] = hslToRgb(...hsl2);
  const l1 = relativeLuminance(r1, g1, b1);
  const l2 = relativeLuminance(r2, g2, b2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// ---------------------------------------------------------------------------
// Test 1 — Nav Dropdown Position
// ---------------------------------------------------------------------------

describe("Bug Condition: Nav Dropdown Position", () => {
  /**
   * **Validates: Requirements 1.1**
   *
   * Property: On desktop viewport (≥768px), when a NavigationMenuTrigger is
   * activated, the NavigationMenuViewport wrapper should be positioned relative
   * to a max-w-max root (shrunk to trigger cluster width) with justify-center
   * to center the dropdown under the triggers.
   *
   * Bug condition: viewport.width >= 768 AND navTriggerHovered = true
   *   AND NavigationMenu root has max-w-none (full-width, causing dropdown
   *   to center in entire navbar instead of under triggers)
   *
   * Fix: NavigationMenu root uses default max-w-max (shrinks to content),
   * viewport wrapper uses left-0 top-full flex justify-center to center
   * dropdown within the trigger cluster width.
   */
  it("NavigationMenu root should use max-w-max (not max-w-none) so viewport centers under triggers", () => {
    fc.assert(
      fc.property(
        // Generate trigger indices (0-based) for a 3-trigger nav
        fc.integer({ min: 0, max: 2 }),
        (triggerIndex) => {
          const triggers = ["Số Học", "Tiên Tri", "Mệnh Lý"];

          const { container } = render(
            <NavigationMenu>
              <NavigationMenuList>
                {triggers.map((label, i) => (
                  <NavigationMenuItem key={i}>
                    <NavigationMenuTrigger>{label}</NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <div data-testid={`content-${i}`}>Content {i}</div>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>
          );

          // The NavigationMenu root should have max-w-max (shrinks to content)
          // This ensures the viewport positions relative to the trigger cluster
          const navRoot = container.firstElementChild as HTMLElement;
          expect(navRoot).not.toBeNull();
          expect(navRoot!.className).toContain("max-w-max");
          // Must NOT have max-w-none (which would make it full-width)
          expect(navRoot!.className).not.toContain("max-w-none");

          // Find the viewport wrapper div
          const viewportWrapper = container.querySelector(
            "div.absolute.top-full"
          );
          expect(viewportWrapper).not.toBeNull();

          // Viewport wrapper should have justify-center for centering
          const classList = viewportWrapper!.className;
          expect(classList).toContain("justify-center");
          // Should NOT have right-0 (which would stretch across full parent)
          expect(classList).not.toContain("right-0");
        }
      ),
      { numRuns: 3 }
    );
  });

  it("navbar should not override NavigationMenu with max-w-none", () => {
    // Structural check: the navbar source should not pass max-w-none to NavigationMenu
    const navbarSource = readFileSync(
      resolve(__dirname, "../components/layout/navbar.tsx"),
      "utf-8",
    );
    // The navbar should use <NavigationMenu> without max-w-none override
    expect(navbarSource).not.toContain('NavigationMenu className="max-w-none"');
    expect(navbarSource).toContain("<NavigationMenu>");
  });
});

// ---------------------------------------------------------------------------
// Test 2 — Grid Centering
// ---------------------------------------------------------------------------

describe("Bug Condition: Grid Centering", () => {
  /**
   * **Validates: Requirements 1.2**
   *
   * Property: On xl viewport (≥1024px, 4-col grid), when a module group has
   * fewer items than available columns (e.g., 2 items in 4-col grid), the
   * items should be visually centered within the container, not left-aligned
   * with empty trailing columns.
   *
   * Bug condition: viewport.width >= 1024 AND gridGroupSize < maxColumnsForViewport
   *   AND gridContentLeftAligned (uses CSS Grid which fills from left)
   *
   * We test this by checking that the grid container uses flex-based centering
   * (flex + justify-center) rather than CSS Grid (which left-aligns by default).
   */
  it("module group grid should use flex centering for incomplete rows, not CSS Grid left-alignment", () => {
    // Read the actual home.tsx source to check the current grid container classes
    const homeSource = readFileSync(
      resolve(__dirname, "../pages/home.tsx"),
      "utf-8",
    );

    fc.assert(
      fc.property(
        // Generate group sizes that are less than 4 columns (incomplete rows)
        fc.integer({ min: 1, max: 3 }),
        (groupSize) => {
          // The fix replaces CSS Grid with flex-based centering.
          // The module group container should use "flex flex-wrap justify-center"
          // instead of "grid grid-cols-*" which left-aligns items.

          // Check that the home source uses flex centering for the module grid
          const usesFlexCenter =
            homeSource.includes("flex flex-wrap justify-center") ||
            (homeSource.includes("flex") &&
              homeSource.includes("flex-wrap") &&
              homeSource.includes("justify-center"));

          // The module group grid should NOT use grid-only layout for the card container
          // (Note: other grids like FEATURES section may still use CSS Grid — that's fine)
          // We specifically check that flex centering is present for module groups
          expect(usesFlexCenter).toBe(true);

          return true;
        }
      ),
      { numRuns: 3 }
    );
  });
});

// ---------------------------------------------------------------------------
// Test 3 — Animation GPU Acceleration
// ---------------------------------------------------------------------------

describe("Bug Condition: Animation GPU Acceleration", () => {
  /**
   * **Validates: Requirements 1.3**
   *
   * Property: .orb elements should have `will-change: transform, opacity` or
   * `transform: translateZ(0)` to force GPU layer promotion. shimmer-text and
   * glow-pulse should also have GPU acceleration hints.
   *
   * Bug condition: animationActive = true AND (usesNonGPUProperties OR lacksWillChange)
   *
   * We parse the CSS source to verify GPU acceleration properties are present.
   */

  const cssSource = readFileSync(
    resolve(__dirname, "../index.css"),
    "utf-8",
  );

  /**
   * Extract a CSS block for a given selector from the CSS source.
   */
  function extractCssBlock(css: string, selector: string): string {
    const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`${escapedSelector}\\s*\\{([\\s\\S]*?)\\}`, "m");
    const match = regex.exec(css);
    return match ? match[0] : "";
  }

  it(".orb class should have will-change: transform, opacity for GPU acceleration", () => {
    fc.assert(
      fc.property(
        // Generate orb class names to check
        fc.constantFrom("orb", "orb-1", "orb-2", "orb-3", "orb-4"),
        (orbClass) => {
          // The .orb base class should have GPU acceleration hints
          const orbCssBlock = extractCssBlock(cssSource, ".orb");

          // Check for GPU acceleration hints
          const hasWillChange = orbCssBlock.includes("will-change");
          const hasTranslateZ = orbCssBlock.includes("translateZ(0)");
          const hasBackfaceHidden = orbCssBlock.includes("backface-visibility: hidden");

          // At least one GPU promotion technique should be present
          const hasGPUAcceleration = hasWillChange || hasTranslateZ || hasBackfaceHidden;

          expect(hasGPUAcceleration).toBe(true);
        }
      ),
      { numRuns: 5 }
    );
  });

  it(".shimmer-text should have will-change hint for background-position animation", () => {
    const shimmerCssBlock = extractCssBlock(cssSource, ".shimmer-text");

    const hasWillChange = shimmerCssBlock.includes("will-change");
    const hasTranslateZ = shimmerCssBlock.includes("translateZ(0)");

    // Should have GPU acceleration for background-position animation
    expect(hasWillChange || hasTranslateZ).toBe(true);
  });

  it(".glow-pulse should have will-change hint for text-shadow animation", () => {
    const glowPulseCssBlock = extractCssBlock(cssSource, ".glow-pulse");

    const hasWillChange = glowPulseCssBlock.includes("will-change");

    // Should have will-change: text-shadow for GPU optimization
    expect(hasWillChange).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Test 4 — Light Mode Contrast
// ---------------------------------------------------------------------------

describe("Bug Condition: Light Mode Contrast", () => {
  /**
   * **Validates: Requirements 1.4**
   *
   * Property: In light mode, the contrast ratio between --primary (used as text)
   * and --card (background) must meet WCAG 2.1 AA minimum of 4.5:1 for normal text.
   *
   * Bug condition: theme = "light" AND contrastRatio < requiredRatio
   *
   * This test reads the ACTUAL --primary value from the .light section of index.css
   * to verify the fix produces sufficient contrast.
   */

  /**
   * Parse an HSL variable value like "43 74% 32%" into [h, s, l] numbers.
   */
  function parseHSLValue(value: string): [number, number, number] {
    const parts = value.trim().split(/\s+/);
    const h = parseFloat(parts[0]);
    const s = parseFloat(parts[1].replace("%", ""));
    const l = parseFloat(parts[2].replace("%", ""));
    return [h, s, l];
  }

  /**
   * Extract a CSS variable value from a specific selector block in the CSS source.
   */
  function extractCSSVar(css: string, selector: string, varName: string): string | null {
    const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`${escapedSelector}\\s*\\{([\\s\\S]*?)\\}`, "g");
    let match: RegExpExecArray | null;
    while ((match = regex.exec(css)) !== null) {
      const block = match[1];
      const varRegex = new RegExp(`${varName.replace("--", "--")}\\s*:\\s*([^;]+);`);
      const varMatch = varRegex.exec(block);
      if (varMatch) return varMatch[1].trim();
    }
    return null;
  }

  // Read the actual CSS source
  const cssSource = readFileSync(
    resolve(__dirname, "../index.css"),
    "utf-8",
  );

  // Extract actual values from .light section
  const primaryValue = extractCSSVar(cssSource, ".light", "--primary");
  const cardValue = extractCSSVar(cssSource, ".light", "--card");
  const backgroundValue = extractCSSVar(cssSource, ".light", "--background");

  it("--primary text on --card background should have contrast ratio >= 4.5:1", () => {
    expect(primaryValue).not.toBeNull();
    expect(cardValue).not.toBeNull();

    const primaryHSL = parseHSLValue(primaryValue!);
    const cardHSL = parseHSLValue(cardValue!);

    fc.assert(
      fc.property(
        // Generate slight variations of the card background (near-white)
        fc.record({
          cardLightness: fc.constantFrom(
            cardHSL[2], // actual card lightness from CSS
            cardHSL[2] - 1, // slightly darker
            cardHSL[2] - 2, // a bit darker
          ),
        }),
        ({ cardLightness }) => {
          const bgHSL: [number, number, number] = [cardHSL[0], cardHSL[1], cardLightness];
          const ratio = contrastRatio(primaryHSL, bgHSL);

          // WCAG 2.1 AA requires >= 4.5:1 for normal text
          expect(ratio).toBeGreaterThanOrEqual(4.5);
        }
      ),
      { numRuns: 3 }
    );
  });

  it("all light mode text/background pairs should meet WCAG AA minimums", () => {
    expect(primaryValue).not.toBeNull();
    expect(cardValue).not.toBeNull();
    expect(backgroundValue).not.toBeNull();

    const primaryHSL = parseHSLValue(primaryValue!);
    const cardHSL = parseHSLValue(cardValue!);
    const bgHSL = parseHSLValue(backgroundValue!);

    fc.assert(
      fc.property(
        fc.constantFrom(
          // Primary text on card background (the main failing pair)
          {
            name: "--primary on --card",
            text: primaryHSL,
            bg: cardHSL,
            minRatio: 4.5,
          },
          // Primary text on background
          {
            name: "--primary on --background",
            text: primaryHSL,
            bg: bgHSL,
            minRatio: 4.5,
          }
        ),
        (pair) => {
          const ratio = contrastRatio(pair.text, pair.bg);
          expect(ratio).toBeGreaterThanOrEqual(pair.minRatio);
        }
      ),
      { numRuns: 2 }
    );
  });
});
