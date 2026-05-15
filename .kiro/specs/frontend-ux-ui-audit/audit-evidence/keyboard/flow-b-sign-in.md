# Keyboard Walkthrough — Flow B: Sign-In Flow

## Flow Description

User navigates to the sign-in page (`/sign-in`) and completes authentication using the Clerk widget. This flow tests keyboard accessibility of the authentication experience, including the third-party Clerk `<SignIn>` component and surrounding page elements.

**Browser:** Chrome 125 (Chromium)
**OS:** Windows 11
**Status:** Pending manual verification

---

## Expected Tab Order (based on DOM structure)

### Step 1: Sign-In Page (`/sign-in`)

| # | Element | Component | Notes |
|---|---------|-----------|-------|
| 1 | Logo link "HUYỀN BÍ" (`<a href="/">`) | `Navbar` | `aria-label="Huyền Bí — Về trang chủ"` |
| 2 | Mystic cursor toggle button | `Navbar` | `role="switch"`, hidden on `<md` |
| 3 | Theme toggle button | `Navbar` | `aria-label` dynamic |
| 4 | AI settings badge button | `Navbar` | Hidden on `<sm` |
| 5 | Sign-in link (active page) | `Navbar` | May have `aria-current="page"` |
| 6 | MobileDrawer trigger | `MobileDrawer` | Visible only on `<md` |
| 7 | `<main id="main" tabIndex={-1}>` | Page layout | Skip target, `outline-none` |
| 8 | Breadcrumb links | `Breadcrumb` | Path: Trang chủ → Đăng nhập |
| 9–N | **Clerk `<SignIn>` widget** (internal tab order) | `@clerk/react` | See Clerk widget section below |
| N+1 | "Đăng ký" link (below widget) | Page | `<Link href="/sign-up?redirect_url=...">` with `hover:underline` |
| N+2+ | Footer links | `Footer` | Standard footer navigation |

### Step 2: Clerk `<SignIn>` Widget (internal elements)

The Clerk widget renders its own DOM with internal keyboard navigation. Expected internal tab order (based on standard Clerk widget structure):

| # | Element | Notes |
|---|---------|-------|
| 1 | Email/username input field | Primary identifier input |
| 2 | "Tiếp tục" / Continue button | Proceeds to password step |
| 3 | Social login buttons (if configured) | Google, GitHub, etc. |
| 4 | "Chưa có tài khoản? Đăng ký" link | Clerk-rendered, localized to Vietnamese |

**After entering email (step 2 of Clerk flow):**

| # | Element | Notes |
|---|---------|-------|
| 1 | Password input field | `type="password"` |
| 2 | "Quên mật khẩu?" link | Clerk-rendered |
| 3 | "Đăng nhập" / Sign-in button | Submit authentication |
| 4 | Back/Cancel link | Return to email step |

### Step 3: Fallback — Clerk Not Configured (`!isClerkEnabled`)

When Clerk publishable key is missing, `<ClerkConfigBanner>` replaces the widget:

| # | Element | Component | Notes |
|---|---------|-----------|-------|
| 9 | ClerkConfigBanner | `ClerkConfigBanner` | `role="status"`, `aria-live="polite"` — informational, no interactive elements inside |

---

## Focus Ring Visibility

| Element | Expected Behavior | Status |
|---------|-------------------|--------|
| Navbar logo | `focus-visible:ring-2 ring-primary/40 rounded-md` | ⏳ Pending verification |
| Theme toggle | `focus-visible:ring-2 ring-primary/40` | ⏳ Pending verification |
| Breadcrumb links | Inherits default link focus styles | ⏳ Pending verification |
| Clerk widget inputs | Clerk applies its own focus styles via `appearance` prop | ⏳ Pending verification |
| Clerk widget buttons | Clerk-managed focus ring | ⏳ Pending verification |
| "Đăng ký" link (page-level) | `hover:underline` — **no explicit `focus-visible` ring defined** | ⚠️ Potential issue |
| Footer links | Standard focus styles | ⏳ Pending verification |

**Observation (source code):** The page-level "Đăng ký" link uses `className="text-primary hover:text-primary/80 underline-offset-4 hover:underline"` but does NOT include a `focus-visible:` ring class. This may result in no visible focus indicator for keyboard users on this link.

---

## Trap Focus / Unreachable Element Observations

| Issue | Element | Severity | Status |
|-------|---------|----------|--------|
| Clerk widget focus management | `<SignIn>` component | INFO | Clerk manages its own focus trap during multi-step auth — verify Escape key behavior |
| `<main tabIndex={-1}>` with `outline-none` | Main content area | INFO | Programmatic focus target, not in natural tab order — correct pattern |
| "Đăng ký" link missing focus-visible ring | `<Link href="/sign-up...">` | P2 | Link has hover styles but no keyboard focus indicator |
| Clerk appearance customization | `CLERK_APPEARANCE` object | INFO | Custom theme uses `hsl(var(--token))` — verify focus rings still meet 3:1 contrast |
| Post-auth redirect | `getPostAuthRedirect()` | INFO | Not a keyboard issue, but verify focus lands on meaningful content after redirect |

---

## Keyboard Shortcuts

| Key | Context | Expected Behavior |
|-----|---------|-------------------|
| Tab | Page elements | Move through navbar → breadcrumb → Clerk widget → page link → footer |
| Enter | On Clerk "Continue" button | Proceed to password step |
| Enter | On Clerk "Sign in" button | Submit credentials |
| Escape | Inside Clerk widget | Behavior depends on Clerk implementation — may close dropdown/popover |
| Tab | Inside Clerk widget | Navigate between Clerk's internal form fields |

---

## Clerk Widget Accessibility Notes

The `<SignIn>` component from `@clerk/react` is a third-party widget. Key observations from source:

1. **Localization:** Vietnamese (`viVN`) applied at `<ClerkProvider>` level in `App.tsx` — widget labels should be in Vietnamese
2. **Appearance:** Custom theme via `CLERK_APPEARANCE` constant from `src/lib/clerk-appearance.ts` — uses CSS custom properties (`hsl(var(--token))`)
3. **Routing:** `routing="path"` with `path="/sign-in"` — Clerk manages its own internal navigation
4. **Redirect:** `fallbackRedirectUrl` and `forceRedirectUrl` set to profile page — after sign-in, focus should land on the redirected page's `<main>`

---

## Summary

- **Total page-level focusable elements:** ~8–10 (navbar + breadcrumb + page link + footer), plus Clerk widget internals
- **Known concerns from source analysis:**
  1. "Đăng ký" link below Clerk widget lacks `focus-visible` ring — keyboard users may lose track of focus
  2. Clerk widget is a black box for focus management — must verify in running app that Tab order is logical and Escape doesn't trap
  3. After successful sign-in redirect, verify focus is placed on meaningful content (not lost at top of page)
  4. `CLERK_APPEARANCE` custom colors need contrast verification for focus indicators within the widget

**Status:** Pending manual verification — Clerk widget internal keyboard behavior cannot be assessed from source code alone.
