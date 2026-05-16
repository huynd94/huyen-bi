# UX/UI Audit Fixes — Bugfix Design

## Overview

This design addresses 4 UX/UI bugs discovered during audit of the Huyền Bí mysticism web app: (1) navigation sub-menu misalignment, (2) homepage card grid left-alignment on incomplete rows, (3) janky/stuttering animations due to non-GPU-accelerated properties, and (4) low contrast ratios in light mode failing WCAG 2.1 AA. The fix strategy is minimal and targeted — each bug has an isolated root cause in CSS/component positioning logic, and the fixes preserve all existing dark mode tokens, mobile layouts, reduced-motion behavior, and hover effects.

## Glossary

- **Bug_Condition (C)**: The set of conditions under which one of the 4 UI defects manifests — viewport ≥768px for nav positioning, viewport ≥1024px with incomplete card rows for grid alignment, any animation playback for jank, and light mode activation for contrast issues
- **Property (P)**: The desired correct behavior — sub-menu aligned below its trigger, cards centered in incomplete rows, animations at 60fps using GPU-accelerated properties, and all text/background pairs meeting WCAG 2.1 AA contrast ratios
- **Preservation**: Existing behaviors that must remain unchanged — mobile drawer navigation, mobile single-column grid, `prefers-reduced-motion` handling, dark mode color tokens, card hover effects, and NavigationMenuContent enter/exit animations
- **NavigationMenuViewport**: The wrapper `<div>` in `navigation-menu.tsx` that positions the Radix Viewport element; currently uses `absolute left-0 top-full` relative to the NavigationMenu root
- **Orb drift animations**: CSS keyframe animations (`orb-drift-1` through `orb-drift-4`) applied to large blurred gradient circles in `ambient-bg.tsx`
- **WCAG 2.1 AA**: Web Content Accessibility Guidelines Level AA requiring 4.5:1 contrast for normal text and 3:1 for large text/UI components

## Bug Details

### Bug Condition

The bugs manifest across 4 independent conditions in the Huyền Bí frontend. Each condition is isolated to specific viewport sizes, theme states, or animation contexts.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type UIState { viewport, theme, animationActive, navTriggerHovered, gridGroupSize }
  OUTPUT: boolean
  
  RETURN (input.viewport.width >= 768 AND input.navTriggerHovered = true
          AND submenuPositionedAtRootLeft(input))
         OR (input.viewport.width >= 1024 AND input.gridGroupSize < maxColumnsForViewport(input)
             AND gridContentLeftAligned(input))
         OR (input.animationActive = true
             AND (usesNonGPUProperties(input) OR lacksWillChange(input) OR hasInappropriateEasing(input)))
         OR (input.theme = "light"
             AND contrastRatio(textColor(input), bgColor(input)) < requiredRatio(input))
END FUNCTION
```

### Examples

- **Bug 1.1**: User hovers "Mệnh Lý" trigger (3rd item) → dropdown appears at left edge of entire NavigationMenu root instead of below "Mệnh Lý" trigger. Expected: dropdown left edge aligns with "Mệnh Lý" trigger position.
- **Bug 1.2**: "Số Học" group has 2 cards on xl viewport (4-col grid) → cards occupy columns 1-2, columns 3-4 are empty space on the right. Expected: 2 cards centered within the container.
- **Bug 1.3**: Orb-1 (55vw element with `filter: blur(80px)`) drifts across screen → animation stutters/drops frames because blur is recalculated every frame on a massive element. Expected: smooth 60fps drift using GPU-composited transform only.
- **Bug 1.4**: In light mode, `--muted-foreground: 260 20% 30%` (≈ #3d3054) on `--background: 40 30% 98%` (≈ #fdfbf7) yields approximately 7.8:1 contrast — this pair is actually fine. However, `--primary: 43 74% 42%` (≈ #ba8c12) used as text on `--card: 40 30% 100%` (white) yields approximately 3.2:1 — below the 4.5:1 threshold for normal-sized text.

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Mobile drawer (`MobileDrawer` component) must continue to slide from left with 5 group dropdowns and auto-close after link selection on viewports <768px
- Mobile grid (1-column layout at `grid-cols-1`) must continue to display cards full-width stacked vertically
- `prefers-reduced-motion: reduce` must continue to disable orb drift, scroll reveal, shimmer-text, glow-pulse animations and replace with static/fade ≤150ms
- Dark mode color tokens (`:root` and `.dark` CSS variables) must remain completely unchanged
- Card hover effects (`hover:border-primary/40`, `hover:bg-card/80`, arrow translate) must continue working with smooth transitions
- NavigationMenuContent enter/exit animations (fade-in, slide-in, zoom-in/out) must retain same duration and easing — only the positioning of the viewport wrapper changes

**Scope:**
All inputs that do NOT involve the 4 bug conditions should be completely unaffected by this fix. This includes:
- Dark mode rendering (all 4 fixes target light mode or are theme-agnostic positioning/performance fixes)
- Mobile viewport layouts (<768px for nav, <1024px for grid centering)
- Non-animated static content rendering
- Keyboard navigation and ARIA attributes on NavigationMenu
- Footer, AI settings modal, and all other page components

## Hypothesized Root Cause

Based on the bug description and source code analysis, the root causes are:

1. **NavigationMenuViewport positioning (Bug 1.1)**: The `NavigationMenuViewport` component wraps the Radix `Viewport` in a `<div className="absolute left-0 top-full flex justify-center">`. This positions the viewport container at the left edge of the `NavigationMenu` root (which has `relative` positioning). Radix's default behavior expects the viewport to be positioned relative to the list or uses its own internal positioning — the explicit `left-0` overrides this and forces all dropdowns to the same left-aligned position regardless of which trigger opened them.

2. **Grid centering on incomplete rows (Bug 1.2)**: The homepage grid uses `grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4` (or `xl:grid-cols-5`). CSS Grid by default places items starting from the first cell, filling left-to-right. When a group has fewer items than columns (e.g., 2 items in a 4-column grid), the remaining cells are empty on the right. No `justify-items: center` or flexbox centering wrapper is applied.

3. **Animation jank (Bug 1.3)**: Multiple causes:
   - `.orb` elements use `filter: blur(80px)` on elements up to 55vw wide. The blur filter is not GPU-composited by default and must be recalculated during animation.
   - Orb drift keyframes use `transform` (good) but the initial `orb-appear` animation combines with the continuous `filter: blur` creating composite layer issues.
   - `shimmer-text` animates `background-position` which triggers paint on every frame.
   - `glow-pulse` animates `text-shadow` which triggers paint.
   - Missing `will-change` hints prevent browsers from promoting elements to their own compositor layer ahead of time.

4. **Light mode contrast (Bug 1.4)**: The `--primary: 43 74% 42%` token (a dark gold/amber) is used as text color on white/near-white backgrounds (`--card: 40 30% 100%`). HSL `43 74% 42%` computes to approximately `#ba8c12` which against white (`#ffffff`) gives ~3.2:1 contrast — below the 4.5:1 AA threshold for normal text. The `--muted-foreground: 260 20% 30%` may also need verification against specific background combinations where opacity modifiers reduce effective contrast.

## Correctness Properties

Property 1: Bug Condition - Sub-menu Alignment Below Trigger

_For any_ desktop viewport (≥768px) where a NavigationMenuTrigger is hovered/clicked, the NavigationMenuViewport SHALL position its dropdown content aligned horizontally with the trigger item that opened it, not fixed at the left edge of the NavigationMenu root.

**Validates: Requirements 2.1**

Property 2: Bug Condition - Grid Content Centering

_For any_ viewport where the homepage module grid has fewer items than available columns in the last row, the grid items SHALL be visually centered within the container rather than left-aligned with empty space on the right.

**Validates: Requirements 2.2**

Property 3: Bug Condition - Animation GPU Acceleration

_For any_ continuous animation (orb drift, shimmer-text, glow-pulse), the animated properties SHALL be GPU-accelerated (`transform`, `opacity`) or use `will-change` hints, and SHALL NOT animate layout/paint-triggering properties (`filter`, `text-shadow`, `background-position` on large elements) on every frame.

**Validates: Requirements 2.3**

Property 4: Bug Condition - Light Mode WCAG AA Contrast

_For any_ text/background color pair in light mode, the contrast ratio SHALL meet WCAG 2.1 AA minimums: ≥4.5:1 for normal text (<18px or <14px bold) and ≥3:1 for large text (≥18px or ≥14px bold).

**Validates: Requirements 2.4**

Property 5: Preservation - Unchanged Behaviors

_For any_ input where none of the 4 bug conditions apply (mobile viewport, dark mode, reduced-motion, non-animated content), the fixed code SHALL produce exactly the same visual and interactive behavior as the original code, preserving mobile drawer navigation, mobile grid layout, dark mode tokens, card hover effects, and animation enter/exit transitions.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File**: `artifacts/mysticism-web/src/components/ui/navigation-menu.tsx`

**Component**: `NavigationMenuViewport`

**Specific Changes**:
1. **Remove fixed left-0 positioning**: Change the viewport wrapper `<div>` from `absolute left-0 top-full flex justify-center` to `absolute top-full left-0 right-0 flex justify-center` or remove the wrapper entirely and let Radix handle positioning natively. The recommended approach is to keep the wrapper but use `left-0 right-0` (full-width of the relative parent) with `flex justify-center` so the viewport centers itself under the NavigationMenuList. This way each dropdown appears centered under the nav rather than pinned to the left edge.

   Alternative (more precise): Remove the outer `<div>` wrapper entirely and apply positioning classes directly to the `NavigationMenuPrimitive.Viewport`, letting Radix's built-in positioning logic handle alignment. However, this may break the enter/exit animations that rely on the wrapper structure.

   **Recommended fix**: Change wrapper to `absolute left-0 right-0 top-full flex justify-center` — this stretches the positioning context across the full NavigationMenu width and centers the viewport within it, so dropdowns appear centered under the trigger cluster rather than pinned left.

---

**File**: `artifacts/mysticism-web/src/pages/home.tsx`

**Section**: Module group grid `<div className={...}>`

**Specific Changes**:
2. **Center incomplete grid rows**: Change the grid container to use `justify-items-center` won't work for grid (it centers content within cells, not cells within the grid). Instead, switch to a flex-based approach for the card container:
   - Replace `grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4` with `flex flex-wrap justify-center gap-4` and set fixed widths on cards via responsive classes.
   
   **Alternative (simpler, preserves grid)**: Keep the grid but add `justify-items-center` — this won't center the row but will center each card within its cell. The actual fix for centering incomplete rows in CSS Grid is not straightforward without subgrid or container queries.

   **Recommended fix**: Use `flex flex-wrap justify-center gap-4` on the container and add responsive width classes to `ModuleCardItem` (e.g., `w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.75rem)] xl:w-[calc(25%-0.75rem)]`). For the 5-item group, use `xl:w-[calc(20%-0.8rem)]`. This naturally centers items when the last row is incomplete.

---

**File**: `artifacts/mysticism-web/src/index.css`

**Section**: Orb styles, shimmer-text, glow-pulse

**Specific Changes**:
3. **GPU-accelerate orb blur**: Move `filter: blur(80px)` from the animated `.orb` class to a static backdrop or use `backdrop-filter` on a pseudo-element. Since the blur is decorative and static (doesn't change during animation), apply it once and let only `transform` and `opacity` animate:
   - Add `will-change: transform, opacity` to `.orb`
   - Keep `filter: blur(80px)` (it's static, not animated) but add `contain: strict` or `transform: translateZ(0)` to force GPU layer promotion so the blur is rasterized once
   - Add `backface-visibility: hidden` as additional GPU promotion hint

4. **Optimize shimmer-text**: The `background-position` animation is necessary for the shimmer effect. Add `will-change: background-position` and `transform: translateZ(0)` to promote to GPU layer. This is acceptable since shimmer-text is used on few elements (headings only).

5. **Optimize glow-pulse**: `text-shadow` animation triggers paint. Replace with a pseudo-element approach using `opacity` animation on a blurred clone, or accept the paint cost since glow-pulse is used sparingly. Add `will-change: text-shadow` as a minimum optimization hint.

6. **Add appropriate easing**: Verify that `orb-drift-*` uses `ease-in-out` (already does). For `shimmer-sweep`, change from `linear` to a smoother curve if perceived as janky, or keep `linear` for continuous sweep (which is correct for infinite shimmer).

---

**File**: `artifacts/mysticism-web/src/index.css`

**Section**: `.light` CSS variables

**Specific Changes**:
7. **Increase --primary lightness for text use**: The issue is `--primary: 43 74% 42%` used as text on white. Darken the primary in light mode to achieve ≥4.5:1 contrast on white:
   - Change `--primary: 43 74% 42%` → `--primary: 43 74% 32%` (darker gold, ~#8e6b0e, contrast ~5.8:1 on white)
   - Or use `--primary: 43 80% 28%` for even stronger contrast (~7:1)
   - Verify `--primary-foreground` (white text on primary background) still passes with the darker primary

8. **Verify --muted-foreground**: `260 20% 30%` on `40 30% 98%` should be approximately 7.8:1 — likely passes. But verify against `--card: 40 30% 100%` (pure white equivalent) and any opacity-modified backgrounds. If any pair fails, darken to `260 20% 25%`.

9. **Preserve dark mode**: All changes are scoped to the `.light` selector only. The `:root` and `.dark` selectors remain untouched.

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bugs on unfixed code, then verify the fixes work correctly and preserve existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bugs BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Write visual regression tests and computed-style assertions that check positioning, alignment, performance metrics, and contrast ratios on the UNFIXED code to observe failures.

**Test Cases**:
1. **Nav Dropdown Position Test**: Render NavigationMenu with multiple triggers, open the 3rd trigger, assert that viewport `getBoundingClientRect().left` is NOT equal to NavigationMenu root's left edge (will fail on unfixed code — viewport IS at left edge)
2. **Grid Centering Test**: Render homepage with a 2-item group on xl viewport, measure grid container vs items bounding rects, assert items are centered (will fail on unfixed code — items are left-aligned)
3. **Animation Performance Test**: Run orb animation and measure frame drops or check computed `will-change` property (will fail on unfixed code — no will-change, no GPU hints)
4. **Contrast Ratio Test**: Compute contrast ratio between `--primary` and `--card` in light mode, assert ≥4.5:1 (will fail on unfixed code — ratio is ~3.2:1)

**Expected Counterexamples**:
- Viewport left position equals NavigationMenu root left (0 or container offset)
- Grid items start at column 1 with empty trailing columns
- Computed `will-change` is `auto` (no optimization)
- Contrast ratio of primary-on-white is approximately 3.2:1

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := renderFixed(input)
  ASSERT viewportAlignedWithTrigger(result)        -- Bug 1.1
  ASSERT gridItemsCentered(result)                  -- Bug 1.2
  ASSERT animationUsesGPUProperties(result)         -- Bug 1.3
  ASSERT contrastRatio(result) >= requiredRatio     -- Bug 1.4
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT renderOriginal(input) = renderFixed(input)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many viewport/theme/animation state combinations automatically
- It catches edge cases at breakpoint boundaries that manual tests might miss
- It provides strong guarantees that mobile layout, dark mode, and reduced-motion behavior are unchanged

**Test Plan**: Observe behavior on UNFIXED code first for mobile layouts, dark mode rendering, and reduced-motion states, then write property-based tests capturing that behavior.

**Test Cases**:
1. **Mobile Drawer Preservation**: Verify MobileDrawer renders and functions on viewport <768px after nav positioning fix
2. **Mobile Grid Preservation**: Verify single-column card layout on mobile after grid centering fix
3. **Dark Mode Token Preservation**: Verify all dark mode CSS variable values are identical before and after light mode contrast fix
4. **Reduced Motion Preservation**: Verify `prefers-reduced-motion` still disables all animations after GPU optimization changes
5. **Hover Effect Preservation**: Verify card hover transitions still work after grid layout change
6. **Animation Enter/Exit Preservation**: Verify NavigationMenuContent fade/slide/zoom animations still work after viewport positioning change

### Unit Tests

- Test NavigationMenuViewport positioning: mock trigger positions, assert viewport aligns correctly
- Test contrast ratio calculation: given light mode HSL values, assert computed ratio ≥ thresholds
- Test grid centering: render module groups with varying item counts, assert visual centering
- Test `will-change` and `transform: translateZ(0)` presence on animated elements

### Property-Based Tests

- Generate random viewport widths (320–2560px) and trigger indices, verify dropdown always aligns with its trigger on desktop and drawer shows on mobile
- Generate random module group sizes (1–5 items) and viewport widths, verify items are centered when row is incomplete and full-width on mobile
- Generate random theme/reduced-motion combinations, verify animation properties match expected GPU-accelerated set
- Generate all text/background token pairs in light mode, verify each meets WCAG AA contrast threshold

### Integration Tests

- Full page render in light mode: screenshot comparison for contrast and readability
- Navigation flow: open each dropdown trigger sequentially, verify positioning doesn't jump
- Homepage scroll: verify scroll reveal animations are smooth (no layout shift) with GPU hints applied
- Theme toggle: switch dark→light→dark, verify no visual regression in either mode
