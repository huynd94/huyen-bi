# Implementation Plan

## Overview

This task list implements fixes for 4 UX/UI bugs in the Huyền Bí mysticism web app following the exploratory bugfix workflow: (1) write exploration tests to confirm bugs exist, (2) write preservation tests to capture baseline behavior, (3) implement targeted fixes for each bug, (4) verify all tests pass. The bugs are: navigation sub-menu misalignment, homepage card grid left-alignment, janky animations, and low contrast in light mode.

## Tasks

- [x] 1. Write bug condition exploration tests
  - **Property 1: Bug Condition** - UX/UI Audit Defects (Nav Alignment, Grid Centering, Animation Jank, Contrast)
  - **CRITICAL**: These tests MUST FAIL on unfixed code - failure confirms the bugs exist
  - **DO NOT attempt to fix the tests or the code when they fail**
  - **NOTE**: These tests encode the expected behavior - they will validate the fixes when they pass after implementation
  - **GOAL**: Surface counterexamples that demonstrate all 4 bugs exist
  - **Scoped PBT Approach**: Scope properties to concrete failing cases for each bug condition
  - Test 1 - Nav Dropdown Position: Render NavigationMenu at desktop viewport (≥768px), hover/click the 3rd trigger ("Mệnh Lý"), assert that NavigationMenuViewport `getBoundingClientRect().left` aligns with the trigger's horizontal position, NOT the NavigationMenu root's left edge. Bug condition: `viewport.width >= 768 AND navTriggerHovered = true AND submenuPositionedAtRootLeft`
  - Test 2 - Grid Centering: Render homepage module group with 2 items on xl viewport (≥1024px, 4-col grid), measure bounding rects of grid items vs container, assert items are visually centered within the container (not left-aligned with empty trailing columns). Bug condition: `viewport.width >= 1024 AND gridGroupSize < maxColumnsForViewport`
  - Test 3 - Animation GPU Acceleration: Check that `.orb` elements have `will-change: transform, opacity` or `transform: translateZ(0)` computed styles, and that shimmer-text/glow-pulse use GPU-accelerated properties. Bug condition: `animationActive = true AND (usesNonGPUProperties OR lacksWillChange)`
  - Test 4 - Light Mode Contrast: Compute contrast ratio between `--primary` (HSL 43 74% 42%) and `--card` (HSL 40 30% 100%) in light mode, assert ratio ≥ 4.5:1 for normal text. Bug condition: `theme = "light" AND contrastRatio < requiredRatio`
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests FAIL (this is correct - it proves the bugs exist)
  - Document counterexamples found:
    - Nav: viewport.left equals NavigationMenu root left (pinned at left-0)
    - Grid: items start at column 1 with empty trailing columns 3-4
    - Animation: computed `will-change` is `auto`, no GPU layer promotion
    - Contrast: ratio of `--primary` on white is approximately 3.2:1 (below 4.5:1)
  - Mark task complete when tests are written, run, and failures are documented
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Unchanged Mobile, Dark Mode, Reduced-Motion, Hover, and Animation Behaviors
  - **IMPORTANT**: Follow observation-first methodology
  - Observe on UNFIXED code and write property-based tests for each preservation requirement:
  - Test A - Mobile Drawer Preservation: On viewport <768px, verify MobileDrawer renders with 5 group dropdowns, slides from left, and auto-closes after link selection. Generate random viewport widths (320–767px), assert drawer always renders and desktop nav is hidden.
  - Test B - Mobile Grid Preservation: On viewport <768px, verify grid uses `grid-cols-1` and cards display full-width stacked vertically. Generate random viewport widths (320–767px) and group sizes (1–5), assert single-column layout.
  - Test C - Dark Mode Token Preservation: Capture all CSS variable values under `.dark` selector, assert they remain identical. Generate all token pairs, verify no dark mode HSL value has changed.
  - Test D - Reduced Motion Preservation: With `prefers-reduced-motion: reduce`, verify orb drift, scroll reveal, shimmer-text, glow-pulse, tilt-card 3D animations are disabled or replaced with fade ≤150ms. Generate random animation states, assert all are suppressed.
  - Test E - Card Hover Effect Preservation: Verify `hover:border-primary/40`, `hover:bg-card/80`, and arrow translate transitions still function on card hover. Generate random card items, assert hover classes produce expected computed styles.
  - Test F - NavigationMenuContent Animation Preservation: Verify enter/exit animations (fade-in, slide-in, zoom-in/out) retain same duration and easing. Assert animation keyframes and timing are unchanged.
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 3. Fix navigation sub-menu misalignment (Bug 1.1)

  - [x] 3.1 Implement NavigationMenuViewport positioning fix
    - Open `artifacts/mysticism-web/src/components/ui/navigation-menu.tsx`
    - Locate the `NavigationMenuViewport` component's wrapper `<div>` with classes `absolute left-0 top-full flex justify-center`
    - Change to `absolute left-0 right-0 top-full flex justify-center` — this stretches the positioning context across the full NavigationMenu width and centers the viewport within it
    - This ensures dropdowns appear centered under the trigger cluster rather than pinned to the left edge
    - Verify the wrapper still has `relative` parent context from NavigationMenu root
    - _Bug_Condition: isBugCondition(input) where viewport.width >= 768 AND navTriggerHovered = true AND submenuPositionedAtRootLeft_
    - _Expected_Behavior: viewportAlignedWithTrigger(result) — dropdown content aligned horizontally with the trigger item_
    - _Preservation: Mobile drawer unaffected (viewport <768px uses MobileDrawer), NavigationMenuContent enter/exit animations retain same duration/easing_
    - _Requirements: 1.1, 2.1, 3.1, 3.6_

  - [x] 3.2 Verify bug condition exploration test for nav alignment now passes
    - **Property 1: Expected Behavior** - Sub-menu Alignment Below Trigger
    - **IMPORTANT**: Re-run the SAME nav dropdown position test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior (viewport aligns with trigger position)
    - When this test passes, it confirms the nav alignment bug is fixed
    - Run nav dropdown position test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug 1.1 is fixed)
    - _Requirements: 2.1_

  - [x] 3.3 Verify preservation tests still pass for nav fix
    - **Property 2: Preservation** - Mobile Drawer and Animation Preservation
    - **IMPORTANT**: Re-run the SAME tests from task 2 (Test A, Test F) - do NOT write new tests
    - Run mobile drawer preservation test and NavigationMenuContent animation preservation test
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions to mobile nav or animation transitions)
    - Confirm mobile drawer still slides from left with 5 groups on viewport <768px
    - Confirm enter/exit animations unchanged

- [x] 4. Fix homepage card grid left-alignment (Bug 1.2)

  - [x] 4.1 Implement grid centering fix
    - Open `artifacts/mysticism-web/src/pages/home.tsx`
    - Locate the module group grid container with classes like `grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`
    - Replace grid approach with flex-based centering: `flex flex-wrap justify-center gap-4`
    - Add responsive width classes to `ModuleCardItem`: `w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.75rem)] xl:w-[calc(25%-0.75rem)]`
    - For 5-item groups, use `xl:w-[calc(20%-0.8rem)]` if applicable
    - This naturally centers items when the last row is incomplete
    - _Bug_Condition: isBugCondition(input) where viewport.width >= 1024 AND gridGroupSize < maxColumnsForViewport AND gridContentLeftAligned_
    - _Expected_Behavior: gridItemsCentered(result) — items visually centered within container on incomplete rows_
    - _Preservation: Mobile single-column layout unaffected (w-full at base), card hover effects preserved_
    - _Requirements: 1.2, 2.2, 3.2, 3.5_

  - [x] 4.2 Verify bug condition exploration test for grid centering now passes
    - **Property 1: Expected Behavior** - Grid Content Centering
    - **IMPORTANT**: Re-run the SAME grid centering test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior (items centered in incomplete rows)
    - When this test passes, it confirms the grid alignment bug is fixed
    - Run grid centering test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug 1.2 is fixed)
    - _Requirements: 2.2_

  - [x] 4.3 Verify preservation tests still pass for grid fix
    - **Property 2: Preservation** - Mobile Grid and Hover Effect Preservation
    - **IMPORTANT**: Re-run the SAME tests from task 2 (Test B, Test E) - do NOT write new tests
    - Run mobile grid preservation test and card hover effect preservation test
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions to mobile layout or hover effects)
    - Confirm cards still display full-width stacked vertically on mobile
    - Confirm hover transitions still function

- [x] 5. Fix janky/stuttering animations (Bug 1.3)

  - [x] 5.1 Implement animation GPU acceleration fixes
    - Open `artifacts/mysticism-web/src/index.css`
    - **Orb optimization**: Add `will-change: transform, opacity` and `transform: translateZ(0)` to `.orb` class to force GPU layer promotion so `filter: blur(80px)` is rasterized once. Add `backface-visibility: hidden` as additional GPU hint.
    - **Shimmer-text optimization**: Add `will-change: background-position` and `transform: translateZ(0)` to `.shimmer-text` class to promote to GPU layer for `background-position` animation.
    - **Glow-pulse optimization**: Add `will-change: text-shadow` to `.glow-pulse` class as minimum optimization hint. Consider replacing `text-shadow` animation with pseudo-element `opacity` animation on a blurred clone if jank persists.
    - **Easing verification**: Verify `orb-drift-*` uses `ease-in-out`. Use `cubic-bezier(0.22, 0.61, 0.36, 1)` for enter animations and `cubic-bezier(0.4, 0, 1, 1)` for exit animations where appropriate.
    - Add `contain: strict` on orb container if layout isolation is needed
    - _Bug_Condition: isBugCondition(input) where animationActive = true AND (usesNonGPUProperties OR lacksWillChange OR hasInappropriateEasing)_
    - _Expected_Behavior: animationUsesGPUProperties(result) — animations run at 60fps using GPU-accelerated properties_
    - _Preservation: prefers-reduced-motion still disables all animations, animation keyframes/timing unchanged_
    - _Requirements: 1.3, 2.3, 3.3_

  - [x] 5.2 Verify bug condition exploration test for animation now passes
    - **Property 1: Expected Behavior** - Animation GPU Acceleration
    - **IMPORTANT**: Re-run the SAME animation GPU test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior (will-change present, GPU properties used)
    - When this test passes, it confirms the animation jank bug is fixed
    - Run animation GPU acceleration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug 1.3 is fixed)
    - _Requirements: 2.3_

  - [x] 5.3 Verify preservation tests still pass for animation fix
    - **Property 2: Preservation** - Reduced Motion and Animation Timing Preservation
    - **IMPORTANT**: Re-run the SAME tests from task 2 (Test D, Test F) - do NOT write new tests
    - Run reduced motion preservation test and animation timing preservation test
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions to reduced-motion behavior or animation durations)
    - Confirm `prefers-reduced-motion: reduce` still suppresses all animations
    - Confirm animation enter/exit durations and easing unchanged

- [x] 6. Fix low contrast ratios in light mode (Bug 1.4)

  - [x] 6.1 Implement light mode contrast fixes
    - Open `artifacts/mysticism-web/src/index.css`
    - Locate the `.light` CSS variables section
    - **Darken --primary**: Change `--primary: 43 74% 42%` to `--primary: 43 74% 32%` (darker gold ~#8e6b0e, contrast ~5.8:1 on white) to achieve ≥4.5:1 on `--card` background
    - **Verify --primary-foreground**: Ensure white text on the new darker `--primary` background still passes (white on #8e6b0e should be ~5.8:1, passes AA)
    - **Verify --muted-foreground**: Check `260 20% 30%` against `--background: 40 30% 98%` and `--card: 40 30% 100%`. If any pair fails 4.5:1, darken to `260 20% 25%`
    - **Scope to .light only**: All changes MUST be within the `.light` selector — do NOT modify `:root` or `.dark` selectors
    - Verify all text/background pairs meet WCAG 2.1 AA: ≥4.5:1 for normal text, ≥3:1 for large text
    - _Bug_Condition: isBugCondition(input) where theme = "light" AND contrastRatio(textColor, bgColor) < requiredRatio_
    - _Expected_Behavior: contrastRatio(result) >= requiredRatio — all pairs meet WCAG 2.1 AA minimums_
    - _Preservation: Dark mode tokens completely unchanged, all .dark CSS variables retain current HSL values_
    - _Requirements: 1.4, 2.4, 3.4_

  - [x] 6.2 Verify bug condition exploration test for contrast now passes
    - **Property 1: Expected Behavior** - Light Mode WCAG AA Contrast
    - **IMPORTANT**: Re-run the SAME contrast ratio test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior (contrast ≥ 4.5:1)
    - When this test passes, it confirms the contrast bug is fixed
    - Run light mode contrast test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug 1.4 is fixed)
    - _Requirements: 2.4_

  - [x] 6.3 Verify preservation tests still pass for contrast fix
    - **Property 2: Preservation** - Dark Mode Token Preservation
    - **IMPORTANT**: Re-run the SAME test from task 2 (Test C) - do NOT write new tests
    - Run dark mode token preservation test
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions to dark mode)
    - Confirm all `.dark` CSS variable values are identical to pre-fix values

- [x] 7. Checkpoint - Ensure all tests pass
  - Run full test suite including all exploration tests (should now PASS) and all preservation tests (should still PASS)
  - Verify no TypeScript compilation errors in modified files
  - Verify no visual regressions via manual inspection or screenshot comparison
  - Confirm all 4 bugs are resolved:
    - Nav dropdown aligns with trigger on desktop
    - Grid items centered on incomplete rows
    - Animations smooth at 60fps with GPU acceleration
    - All light mode text/background pairs meet WCAG 2.1 AA
  - Confirm all preservation requirements hold:
    - Mobile drawer works on <768px
    - Mobile grid single-column on <768px
    - prefers-reduced-motion still suppresses animations
    - Dark mode tokens unchanged
    - Card hover effects functional
    - Nav content enter/exit animations unchanged
  - Ask the user if questions arise

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1", "2"] },
    { "id": 1, "tasks": ["3.1", "4.1", "5.1", "6.1"] },
    { "id": 2, "tasks": ["3.2", "3.3", "4.2", "4.3", "5.2", "5.3", "6.2", "6.3"] },
    { "id": 3, "tasks": ["7"] }
  ]
}
```

## Notes

- All exploration tests (task 1) are expected to FAIL on unfixed code — this confirms the bugs exist
- All preservation tests (task 2) are expected to PASS on unfixed code — this captures baseline behavior
- Implementation tasks 3–6 are independent of each other and can be done in any order after tasks 1–2
- Each implementation task includes verification sub-tasks that re-run the same tests from tasks 1 and 2
- All CSS changes for contrast (task 6) are scoped to `.light` selector only — dark mode is untouched
- The flex-based grid fix (task 4) replaces CSS Grid with flexbox for natural centering of incomplete rows
