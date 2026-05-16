# Design Document: Background Update

## Overview

This feature extends the existing `AmbientBg` component by adding two new conditional layers — a **Star Field** (dark mode) and a **Cloud Field** (light mode) — rendered below the existing orb elements. All new animations use CSS `@keyframes` exclusively for GPU-composited performance. The existing `computeAmbientOpacity` function and wrapper opacity constraints remain unchanged.

## Architecture

### High-Level Component Structure

```
AmbientBg (wrapper: fixed, inset-0, opacity via computeAmbientOpacity)
├── StarFieldLayer (conditional: theme === "dark")
├── CloudFieldLayer (conditional: theme === "light")
├── .orb.orb-1
├── .orb.orb-2
├── .orb.orb-3
└── .orb.orb-4
```

The new layers are rendered **before** the orb elements in DOM order, ensuring they sit below orbs in the stacking context without needing explicit z-index manipulation.

---

## Components and Interfaces

### StarFieldLayer

A purely presentational `<div>` rendered only when `theme === "dark"`. It uses a CSS `background-image` composed of 50–100 `radial-gradient` dots to simulate stars.

**Rendering strategy:** Generate star positions and sizes at build time (static CSS) rather than runtime JS. The star field is a single `<div>` with a large composite `background-image` property containing many radial-gradient layers — identical to the existing `.ambient-stars` pattern in `index.css`.

```tsx
// Star field layer — rendered only in dark mode
{theme === "dark" && (
  <div
    className="ambient-star-field"
    style={reducedMotion ? STATIC_LAYER_STYLE : undefined}
  />
)}
```

**CSS classes:**
- `.ambient-star-field` — positioned absolute, inset 0, contains radial-gradient background-image with 60+ star dots
- Animations: `stars-field-twinkle` (opacity 0.3–1.0, 4–8s) and `stars-field-drift` (translate, 60–120s)
- GPU hints: `will-change: transform, opacity; transform: translateZ(0)`

### CloudFieldLayer

A purely presentational container rendered only when `theme === "light"`. Contains multiple `<div>` elements styled as cloud shapes using CSS border-radius, background-color (white/near-white), and `filter: blur()`.

```tsx
// Cloud field layer — rendered only in light mode
{theme === "light" && (
  <div
    className="ambient-cloud-field"
    style={reducedMotion ? STATIC_LAYER_STYLE : undefined}
  >
    <div className="ambient-cloud ambient-cloud-1" />
    <div className="ambient-cloud ambient-cloud-2" />
    <div className="ambient-cloud ambient-cloud-3" />
    <div className="ambient-cloud ambient-cloud-4" />
    <div className="ambient-cloud ambient-cloud-5" />
  </div>
)}
```

**CSS classes:**
- `.ambient-cloud-field` — positioned absolute, inset 0, overflow hidden
- `.ambient-cloud` — white/near-white background, border-radius for organic shape, `filter: blur(8–15px)`, opacity 0.4–0.8
- Animation: `cloud-drift` (translateX from -20% to 120%, 30–80s per cloud, staggered delays)
- GPU hints: `will-change: transform; transform: translateZ(0)`

---

### Updated AmbientBg Component API

No changes to the public API. The component continues to:
- Accept no props
- Read theme from `useTheme()` hook
- Read reduced-motion preference via `matchMedia`
- Render with `aria-hidden` and `pointer-events: none`

### Internal Constants (new)

```typescript
/** Number of star points in the star field CSS background */
export const STAR_FIELD_COUNT = 60;

/** Twinkle animation duration range in seconds */
export const STAR_TWINKLE_DURATION_RANGE = [4, 8] as const;

/** Drift animation duration for star field in seconds */
export const STAR_DRIFT_DURATION = 90;

/** Number of cloud elements */
export const CLOUD_COUNT = 5;

/** Cloud drift animation duration range in seconds */
export const CLOUD_DRIFT_DURATION_RANGE = [30, 80] as const;

/** Cloud opacity range */
export const CLOUD_OPACITY_RANGE = [0.4, 0.8] as const;
```

---

## Data Models

No new data models are introduced. The feature is purely presentational with no state beyond what already exists (theme, reducedMotion).

---

## CSS Keyframes (new additions to index.css)

```css
/* Star field twinkle — varies opacity */
@keyframes stars-field-twinkle {
  0%, 100% { opacity: 0.3; }
  50%      { opacity: 1; }
}

/* Star field slow drift */
@keyframes stars-field-drift {
  0%   { transform: translate(0, 0) translateZ(0); }
  50%  { transform: translate(2vw, 1vh) translateZ(0); }
  100% { transform: translate(-1vw, -0.5vh) translateZ(0); }
}

/* Cloud horizontal drift — left to right, then reset */
@keyframes cloud-drift {
  0%   { transform: translateX(-20%) translateZ(0); }
  100% { transform: translateX(120%) translateZ(0); }
}
```

---

## Error Handling

- **SSR/missing matchMedia:** Already handled by existing `readReducedMotion()` function — returns `false` gracefully.
- **Missing theme context:** Falls back to "dark" (existing behavior from `ThemeContext` default value).
- **Browser without CSS animation support:** Layers render statically (same as reduced-motion fallback) — no JS animation fallback needed.

---

## Theme Transition Behavior

When theme changes between "dark" and "light":
1. React conditional rendering (`theme === "dark"` / `theme === "light"`) immediately mounts/unmounts the appropriate layer.
2. No CSS transition on the layer swap — the wrapper opacity already provides visual continuity.
3. Both layers are never rendered simultaneously.

---

## Reduced Motion Behavior

When `prefers-reduced-motion: reduce` is active:
- Both layers receive `style={{ animation: "none", opacity: 1 }}` via the existing `STATIC_LAYER_STYLE` constant.
- Stars render as a static starry background (visible but not twinkling/drifting).
- Clouds render in their initial position (visible but not drifting).
- The `useEffect` listener on `matchMedia("(prefers-reduced-motion: reduce)")` already handles runtime changes.

---

## Performance Considerations

1. **Single composite background-image** for stars (no individual DOM elements per star) — minimizes DOM nodes.
2. **CSS-only animations** — offloaded to compositor thread, no JS frame callbacks.
3. **`will-change` + `translateZ(0)`** — promotes layers to GPU compositing.
4. **Conditional rendering** — only the active layer (star OR cloud) is in the DOM at any time.
5. **Cloud elements limited to 5** — sufficient visual density with minimal DOM overhead.

---

## Testing Strategy

### Unit Tests (Example-based)
- Verify DOM order: star/cloud layers render before orb elements (Req 3.1, 3.3)
- Verify existing orbs are unchanged (Req 3.2)
- Verify CSS keyframes exist in stylesheet (Req 4.1, 4.2)
- Verify GPU compositing hints are applied (Req 4.3, 4.4)
- Verify `computeAmbientOpacity` is used without modification (Req 5.3)
- Verify runtime reduced-motion change triggers re-render (Req 6.3)
- Verify `aria-hidden` and `pointer-events: none` on container (Req 7.1, 7.2)
- Verify theme switch mounts/unmounts correct layers (Req 8.1, 8.2)

### Property Tests
- Theme-conditional visibility: for all theme values, exactly one layer is rendered
- Star configuration bounds: all star sizes and durations within spec
- Cloud configuration bounds: all cloud durations and opacities within spec
- Wrapper opacity constraints: pure function output within bounds for all inputs
- Reduced motion: all layers static when preference is active
- DOM order: background layers always precede orb elements
- Accessibility: no text or interactive content in decorative layers

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Theme-conditional layer visibility

*For any* theme value provided by Theme_Context, exactly one background layer is visible: Star_Field_Layer when theme is "dark", Cloud_Field_Layer when theme is "light", and the other layer is not rendered in the DOM.

**Validates: Requirements 1.1, 1.5, 2.1, 2.5, 8.1, 8.2**

### Property 2: Star configuration bounds

*For any* star point in the Star_Field_Layer, its radial-gradient size SHALL be between 1px and 2px, and its twinkle animation duration SHALL be between 4 and 8 seconds.

**Validates: Requirements 1.2, 1.3**

### Property 3: Cloud configuration bounds

*For any* cloud element in the Cloud_Field_Layer, its animation duration SHALL be between 30 and 80 seconds, and its opacity SHALL be between 0.4 and 0.8.

**Validates: Requirements 2.3, 2.4**

### Property 4: Wrapper opacity constraints

*For any* theme value ("dark" or "light"), `computeAmbientOpacity(theme)` SHALL return a value no greater than 0.35 for "dark" and no greater than 0.15 for "light".

**Validates: Requirements 5.1, 5.2, 5.3**

### Property 5: Reduced motion disables all layer animations

*For any* state where `prefers-reduced-motion: reduce` is active, all animated layers (Star_Field_Layer and Cloud_Field_Layer) SHALL have `animation` set to "none" and `opacity` set to 1.

**Validates: Requirements 6.1, 6.2**

### Property 6: DOM order preserves layer stacking

*For any* rendered state of the Ambient_Background, the new background layer elements (star field or cloud field) SHALL appear before all orb elements in DOM order, ensuring they render below orbs in the visual stacking context.

**Validates: Requirements 3.1, 3.3**

### Property 7: Accessibility non-interference

*For any* rendered state of the Ambient_Background, the container SHALL have `aria-hidden="true"` and `pointer-events: none`, and neither Star_Field_Layer nor Cloud_Field_Layer SHALL contain text content or interactive elements.

**Validates: Requirements 7.1, 7.2, 7.3**
