# Reduced-Motion Screenshots

Evidence captured with `prefers-reduced-motion: reduce` media query active.

## Surfaces Tested

| File | Surface | Description |
|------|---------|-------------|
| `home-reduced.png` | Home (`/`) | Landing page with ambient background animation and mystic-cursor effects |
| `than-so-hoc-reduced.png` | Thần Số Học (`/than-so-hoc`) | Module_Page with Result_Card animation (fade-in, chart transitions) |
| `ai-chat-reduced.png` | AI Chat (`/ai-chat`) | Chat interface with streaming text animation and message transitions |

## Expected Observed Behavior (prefers-reduced-motion: reduce)

### Home (`/`)
- **ambient-bg**: opacity animation should be suppressed or reduced to static state
- **mystic-cursor**: particle/trail effects should be disabled or static
- **Hero section**: any entrance animations should resolve instantly or be removed

### Thần Số Học (`/than-so-hoc`)
- **Result_Card**: fade-in/slide-up entrance animation should be instant (duration → 0 or `animation: none`)
- **Chart components**: transitions between states should be instant, no easing curves visible
- **Tilt-card**: 3D tilt effect should be disabled (no transform on hover/gyroscope)

### AI Chat (`/ai-chat`)
- **Message streaming**: text should still appear incrementally (functional, not decorative) but without character-by-character typing animation
- **Message transitions**: new messages should appear without slide/fade animation
- **Loading indicators**: spinner/pulse animations should be replaced with static indicators

## Methodology
- Browser: Chromium-based (Chrome/Edge) with DevTools → Rendering → Emulate CSS media feature `prefers-reduced-motion: reduce`
- Viewport: 1280×800 (default audit viewport)
- Screenshots are placeholders pending live environment capture

## References
- Requirements: R4.6, R7.2, R13.1.e
- Design: Tooling Pass > reduced-motion evidence collection
