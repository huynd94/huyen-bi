/**
 * Design Token Registry — semantic foreground/background pairs and WCAG
 * contrast helpers used by the UX/UI upgrade.
 *
 * The registry is intentionally **theme-agnostic**: it lists pairs by *name*
 * (matching CSS custom properties without the leading `--`, e.g. `primary` and
 * `primary-foreground`), not by concrete HSL values. Tests resolve those names
 * against the real CSS at run-time so the same registry covers both light and
 * dark themes.
 *
 * This module is pure TypeScript: no DOM access, no React, no runtime
 * dependencies. It is safe to import from both Vitest (Node) tests and from
 * the browser bundle.
 *
 * @see Requirements 1.1, 2.1, 3.2, 3.8
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * WCAG size bucket controlling the minimum contrast ratio required for a pair.
 *
 * - `text`        — body text and small UI text → must reach **4.5 : 1**
 * - `large-or-ui` — large text (≥ 18px or ≥ 14px bold) and non-text UI parts
 *                   such as borders, focus rings, icons → must reach **3 : 1**
 *
 * Reference: WCAG 2.1 Success Criteria 1.4.3 (text) and 1.4.11 (non-text).
 */
export type SizeBucket = 'text' | 'large-or-ui';

/**
 * A pair of design tokens whose contrast must satisfy the WCAG threshold for
 * the declared {@link SizeBucket}.
 *
 * `foreground` and `background` are the CSS custom-property names **without**
 * the leading `--`, e.g. `'primary-foreground'` resolves at runtime to the
 * value of `--primary-foreground`.
 */
export interface TokenPair {
  /** Human-readable label for diagnostics, e.g. `"primary on background"`. */
  readonly name: string;
  /** Foreground token name, without the `--` prefix. */
  readonly foreground: string;
  /** Background token name, without the `--` prefix. */
  readonly background: string;
  /** WCAG size bucket controlling the threshold (4.5 vs 3). */
  readonly sizeBucket: SizeBucket;
}

/**
 * An HSL color in the shadcn convention used by `src/index.css`:
 * `h` is degrees `[0, 360]`, `s` and `l` are percentages `[0, 100]`.
 */
export interface Hsl {
  /** Hue in degrees, normalized into `[0, 360)`. */
  h: number;
  /** Saturation as a percentage in `[0, 100]`. */
  s: number;
  /** Lightness as a percentage in `[0, 100]`. */
  l: number;
}

// ---------------------------------------------------------------------------
// HSL parser
// ---------------------------------------------------------------------------

/**
 * Parses a CSS HSL string and returns its components.
 *
 * Accepted formats (matching how shadcn-style themes declare tokens):
 *
 * ```text
 * "260 40% 10%"            // space-separated triple — used inside  --background: 260 40% 10%
 * "hsl(260 40% 10%)"        // CSS Color Module Level 4 functional notation
 * "hsl(260, 40%, 10%)"      // legacy comma-separated functional notation
 * ```
 *
 * Whitespace around values is permitted. Saturation and lightness must carry
 * the `%` suffix; the hue is unitless degrees.
 *
 * @param input  Raw HSL string. Any other shape (including `null`/`undefined`,
 *               RGB, hex, named colors) is considered invalid.
 * @returns The decoded `{ h, s, l }` triple.
 * @throws  {Error} If `input` is not a string or does not match a supported
 *          HSL shape, or if any component is outside its valid numeric range.
 *
 * @example
 *   parseHsl('260 40% 10%')          // → { h: 260, s: 40, l: 10 }
 *   parseHsl('hsl(43, 74%, 49%)')    // → { h: 43,  s: 74, l: 49 }
 */
export function parseHsl(input: string): Hsl {
  if (typeof input !== 'string') {
    throw new Error(`parseHsl: expected string, received ${typeof input}`);
  }

  // Strip an optional `hsl(...)` / `hsla(...)` wrapper. We only care about the
  // three positional components; alpha (if any) is dropped on purpose.
  let body = input.trim();
  const fnMatch = /^hsla?\(([^)]*)\)$/i.exec(body);
  if (fnMatch) {
    body = fnMatch[1].trim();
  }

  // Normalize separators: commas and slashes (alpha) become spaces, then
  // collapse runs of whitespace.
  const normalized = body.replace(/[,/]/g, ' ').replace(/\s+/g, ' ').trim();
  const parts = normalized.split(' ');

  if (parts.length < 3) {
    throw new Error(`parseHsl: expected 3 components, got ${parts.length} in "${input}"`);
  }

  const [hRaw, sRaw, lRaw] = parts;
  const h = Number.parseFloat(hRaw);
  if (!Number.isFinite(h)) {
    throw new Error(`parseHsl: invalid hue "${hRaw}" in "${input}"`);
  }

  const s = parsePercent(sRaw, 'saturation', input);
  const l = parsePercent(lRaw, 'lightness', input);

  return {
    h: ((h % 360) + 360) % 360,
    s,
    l,
  };
}

/**
 * Parses a `"<number>%"` token used for saturation and lightness components.
 * The `%` suffix is required; the numeric part must be finite and within
 * `[0, 100]`.
 */
function parsePercent(token: string, label: string, source: string): number {
  if (!token.endsWith('%')) {
    throw new Error(`parseHsl: ${label} must end with "%" in "${source}"`);
  }
  const value = Number.parseFloat(token.slice(0, -1));
  if (!Number.isFinite(value) || value < 0 || value > 100) {
    throw new Error(`parseHsl: ${label} out of range in "${source}"`);
  }
  return value;
}

// ---------------------------------------------------------------------------
// WCAG contrast
// ---------------------------------------------------------------------------

/**
 * Computes the WCAG 2.1 contrast ratio between two HSL colors.
 *
 * The colors are converted HSL → sRGB → linearized RGB (gamma 2.4 with the
 * 0.03928 threshold) → relative luminance using the CIE-2 coefficients
 * `0.2126 R + 0.7152 G + 0.0722 B`. The returned ratio follows the WCAG
 * formula `(L1 + 0.05) / (L2 + 0.05)` where `L1 ≥ L2`, so the result is
 * always `≥ 1` and symmetric in its arguments.
 *
 * @param fg  Foreground color components.
 * @param bg  Background color components.
 * @returns   Contrast ratio in `[1, 21]`. Identical colors yield `1`.
 *
 * @example
 *   const fg = parseHsl('40 30% 90%');   // light text
 *   const bg = parseHsl('260 40% 5%');   // deep indigo bg
 *   computeContrast(fg, bg);              // → ~17.4
 */
export function computeContrast(fg: Hsl, bg: Hsl): number {
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Converts HSL to sRGB and returns the WCAG relative luminance of the result.
 * Each sRGB channel is linearized per WCAG: values ≤ 0.03928 are divided by
 * 12.92, otherwise `((c + 0.055) / 1.055) ** 2.4`.
 */
function relativeLuminance(color: Hsl): number {
  const { r, g, b } = hslToSrgb(color);
  const lr = linearize(r);
  const lg = linearize(g);
  const lb = linearize(b);
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
}

function linearize(channel: number): number {
  return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
}

/**
 * Converts an HSL triple (h ∈ [0, 360), s/l ∈ [0, 100]) to sRGB in `[0, 1]`.
 * Implements the standard piecewise formula from CSS Color Module Level 3.
 */
function hslToSrgb({ h, s, l }: Hsl): { r: number; g: number; b: number } {
  const sat = s / 100;
  const lum = l / 100;

  if (sat === 0) {
    return { r: lum, g: lum, b: lum };
  }

  const q = lum < 0.5 ? lum * (1 + sat) : lum + sat - lum * sat;
  const p = 2 * lum - q;
  const hk = h / 360;

  return {
    r: hueToRgb(p, q, hk + 1 / 3),
    g: hueToRgb(p, q, hk),
    b: hueToRgb(p, q, hk - 1 / 3),
  };
}

function hueToRgb(p: number, q: number, t: number): number {
  let tt = t;
  if (tt < 0) tt += 1;
  if (tt > 1) tt -= 1;
  if (tt < 1 / 6) return p + (q - p) * 6 * tt;
  if (tt < 1 / 2) return q;
  if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
  return p;
}

// ---------------------------------------------------------------------------
// Token pair registry
// ---------------------------------------------------------------------------

/**
 * Required minimum contrast ratio for each {@link SizeBucket}, per WCAG 2.1
 * AA. Exposed for tests and lint scripts so they share a single source of
 * truth with this module.
 */
export const CONTRAST_THRESHOLDS: Readonly<Record<SizeBucket, number>> = Object.freeze({
  text: 4.5,
  'large-or-ui': 3,
});

/**
 * Every meaningful semantic foreground/background pair declared in
 * `src/index.css`. Each entry must hold its WCAG threshold under both the
 * `.dark` and `.light` themes — see Property 1 in `design.md`.
 *
 * Only pairs whose tokens are actually defined in the stylesheet appear
 * here; theme-only utility variables (e.g. `--button-outline`) are omitted
 * because they are not semantic foreground/background combinations.
 *
 * The list intentionally excludes redundant duplicates such as
 * `card-foreground` on `background` (already covered by
 * `foreground` on `background`).
 */
export const TOKEN_PAIRS: readonly TokenPair[] = Object.freeze([
  // --- Text on surfaces -----------------------------------------------------
  {
    name: 'foreground on background',
    foreground: 'foreground',
    background: 'background',
    sizeBucket: 'text',
  },
  {
    name: 'card-foreground on card',
    foreground: 'card-foreground',
    background: 'card',
    sizeBucket: 'text',
  },
  {
    name: 'popover-foreground on popover',
    foreground: 'popover-foreground',
    background: 'popover',
    sizeBucket: 'text',
  },
  {
    name: 'primary-foreground on primary',
    foreground: 'primary-foreground',
    background: 'primary',
    sizeBucket: 'text',
  },
  {
    name: 'secondary-foreground on secondary',
    foreground: 'secondary-foreground',
    background: 'secondary',
    sizeBucket: 'text',
  },
  {
    name: 'muted-foreground on muted',
    foreground: 'muted-foreground',
    background: 'muted',
    sizeBucket: 'text',
  },
  {
    // muted-foreground is also rendered directly over the page background
    // (helper text under inputs, captions in cards), so it must clear 4.5:1
    // there as well.
    name: 'muted-foreground on background',
    foreground: 'muted-foreground',
    background: 'background',
    sizeBucket: 'text',
  },
  {
    name: 'accent-foreground on accent',
    foreground: 'accent-foreground',
    background: 'accent',
    sizeBucket: 'text',
  },
  {
    name: 'destructive-foreground on destructive',
    foreground: 'destructive-foreground',
    background: 'destructive',
    sizeBucket: 'text',
  },

  // --- Non-text UI elements (3:1) ------------------------------------------
  {
    name: 'border on background',
    foreground: 'border',
    background: 'background',
    sizeBucket: 'large-or-ui',
  },
  {
    name: 'ring on background',
    foreground: 'ring',
    background: 'background',
    sizeBucket: 'large-or-ui',
  },
  {
    name: 'input on background',
    foreground: 'input',
    background: 'background',
    sizeBucket: 'large-or-ui',
  },
  {
    // primary often appears as iconography or accent text on the page bg
    // (link color, icon strokes); only the 3:1 non-text bar applies here.
    name: 'primary on background',
    foreground: 'primary',
    background: 'background',
    sizeBucket: 'large-or-ui',
  },
]);

/**
 * Returns `true` when the supplied contrast `ratio` clears the WCAG threshold
 * for the pair's {@link SizeBucket}: `≥ 4.5` for `'text'` and `≥ 3` for
 * `'large-or-ui'`.
 *
 * @param pair   Token pair whose threshold should be applied.
 * @param ratio  Contrast ratio, typically produced by {@link computeContrast}.
 */
export function meetsContrast(pair: TokenPair, ratio: number): boolean {
  return ratio >= CONTRAST_THRESHOLDS[pair.sizeBucket];
}
