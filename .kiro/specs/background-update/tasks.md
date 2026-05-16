# Implementation Plan: Background Update

## Overview

Add two new conditional background layers to the existing `AmbientBg` component: a Star Field (dark mode, 60+ radial-gradient dots with twinkle + drift) and a Cloud Field (light mode, 5 blurred div elements with horizontal drift). All animations are CSS-only keyframes. New layers render before orbs in DOM order. Reduced motion applies `STATIC_LAYER_STYLE`. No changes to public API or `computeAmbientOpacity`.

## Tasks

- [x] 1. Add CSS keyframes and layer styles to index.css
  - [x] 1.1 Add star field CSS classes and keyframes
    - Add `.ambient-star-field` class: absolute positioning, inset 0, `background-image` with 60+ radial-gradient dots (1–2px sizes), `will-change: transform, opacity`, `transform: translateZ(0)`
    - Add `@keyframes stars-field-twinkle`: opacity 0.3 → 1.0 → 0.3, duration 6s
    - Add `@keyframes stars-field-drift`: translate(0,0) → translate(2vw,1vh) → translate(-1vw,-0.5vh), duration 90s
    - Compose both animations on `.ambient-star-field`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 4.1, 4.3_

  - [x] 1.2 Add cloud field CSS classes and keyframes
    - Add `.ambient-cloud-field` class: absolute positioning, inset 0, overflow hidden
    - Add `.ambient-cloud` base class: white/near-white background, border-radius for organic shape, `filter: blur(8–15px)`, `will-change: transform`, `transform: translateZ(0)`
    - Add `.ambient-cloud-1` through `.ambient-cloud-5` with varying sizes, positions, opacity (0.4–0.8), and animation durations (30–80s) with staggered delays
    - Add `@keyframes cloud-drift`: translateX(-20%) → translateX(120%)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 4.2, 4.4_

- [x] 2. Update AmbientBg component with new layers
  - [x] 2.1 Add StarFieldLayer and CloudFieldLayer to ambient-bg.tsx
    - Add conditional star field div: render `<div className="ambient-star-field" style={layerStyle} />` when `theme === "dark"`
    - Add conditional cloud field container: render `.ambient-cloud-field` with 5 `.ambient-cloud` children when `theme === "light"`
    - Apply `STATIC_LAYER_STYLE` to both layers when `reducedMotion` is true
    - Place new layer elements BEFORE existing orb divs in JSX to maintain DOM order (layers below orbs)
    - _Requirements: 1.1, 1.5, 2.1, 2.5, 3.1, 3.3, 6.1, 6.2_

  - [x] 2.2 Add internal constants for star and cloud configuration
    - Export `STAR_FIELD_COUNT`, `STAR_TWINKLE_DURATION_RANGE`, `STAR_DRIFT_DURATION`, `CLOUD_COUNT`, `CLOUD_DRIFT_DURATION_RANGE`, `CLOUD_OPACITY_RANGE` as defined in design
    - _Requirements: 1.1, 2.3, 2.4_

- [x] 3. Checkpoint - Verify visual rendering
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Write tests for background layers
  - [x] 4.1 Write property test for theme-conditional layer visibility
    - **Property 1: Theme-conditional layer visibility**
    - For any theme value, exactly one background layer is rendered (star field XOR cloud field)
    - **Validates: Requirements 1.1, 1.5, 2.1, 2.5, 8.1, 8.2**

  - [x] 4.2 Write property test for wrapper opacity constraints
    - **Property 4: Wrapper opacity constraints**
    - For any theme value, `computeAmbientOpacity` returns ≤ 0.35 (dark) and ≤ 0.15 (light)
    - **Validates: Requirements 5.1, 5.2, 5.3**

  - [x] 4.3 Write property test for reduced motion disabling animations
    - **Property 5: Reduced motion disables all layer animations**
    - When reduced motion is active, all layers have `animation: none` and `opacity: 1`
    - **Validates: Requirements 6.1, 6.2**

  - [x] 4.4 Write property test for DOM order preserving layer stacking
    - **Property 6: DOM order preserves layer stacking**
    - Star/cloud layer elements always appear before orb elements in DOM
    - **Validates: Requirements 3.1, 3.3**

  - [x] 4.5 Write property test for accessibility non-interference
    - **Property 7: Accessibility non-interference**
    - Container has `aria-hidden` and `pointer-events: none`, layers contain no text or interactive elements
    - **Validates: Requirements 7.1, 7.2, 7.3**

  - [x] 4.6 Write unit tests for theme transition behavior
    - Verify theme switch from dark→light unmounts star field and mounts cloud field in same render
    - Verify theme switch from light→dark unmounts cloud field and mounts star field in same render
    - Verify existing orb elements remain unchanged after theme switch
    - _Requirements: 3.2, 8.1, 8.2_

- [x] 5. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The design uses TypeScript/React — all implementation follows existing project conventions
- CSS keyframes are added to the existing `index.css` file alongside current orb/star styles
- No changes to `computeAmbientOpacity` or the component's public API

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["2.1", "2.2"] },
    { "id": 2, "tasks": ["4.1", "4.2", "4.3", "4.4", "4.5", "4.6"] }
  ]
}
```
