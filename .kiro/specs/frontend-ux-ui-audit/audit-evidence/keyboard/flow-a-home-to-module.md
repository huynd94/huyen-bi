# Keyboard Walkthrough — Flow A: Home → Module_Page → Submit → Results

## Flow Description

User navigates from the home page (`/`) to a Module_Page (`/than-so-hoc`), fills in the form, submits, and views the results. This flow tests the primary user journey through the app's core functionality.

**Browser:** Chrome 125 (Chromium)
**OS:** Windows 11
**Status:** Pending manual verification

---

## Expected Tab Order (based on DOM structure)

### Step 1: Home Page (`/`)

| # | Element | Component | Notes |
|---|---------|-----------|-------|
| 1 | Skip-to-content link (if present) | — | `<main id="main" tabIndex={-1}>` exists on Module pages; home page uses `<Navbar>` as first focusable |
| 2 | Logo link "HUYỀN BÍ" (`<a href="/">`) | `Navbar` | `aria-label="Huyền Bí — Về trang chủ"`, has `focus-visible:ring-2` |
| 3 | Mystic cursor toggle button | `Navbar` | `role="switch"`, `aria-checked`, hidden on `<md` |
| 4 | Theme toggle button (dark/light) | `Navbar` | `aria-label` changes based on current theme |
| 5 | AI settings badge button | `Navbar` | Hidden on `<sm`, `aria-label="Mở cài đặt AI"` |
| 6 | Sign-in link / UserButton | `Navbar` | Conditional on Clerk auth state; hidden on `<md` |
| 7 | MobileDrawer trigger | `MobileDrawer` | Visible only on `<md` |
| 8 | Hero CTA "Bắt đầu khám phá" (`<a href="/than-so-hoc">`) | `Home` | `<Button asChild>` wrapping `<Link>` |
| 9 | Hero CTA "Hỏi Trợ Lý AI" (`<a href="/ai-chat">`) | `Home` | `<Button asChild variant="outline">` |
| 10–24 | Module cards (15 total, grouped in 5 sections) | `ModuleCardItem` | Each is a `<Link>` with `focus-visible:ring-2 ring-primary/50 ring-offset-2` |
| 25 | CTA "Xem Lịch Hôm Nay" | `Home` | Bottom CTA section |
| 26 | CTA "Chat với AI" | `Home` | Bottom CTA section |
| 27+ | Footer links | `Footer` | Navigation links in footer |

**Action:** User presses Tab to reach Module card "Thần Số Học" (card #10), then presses Enter.

### Step 2: Module_Page — Thần Số Học (`/than-so-hoc`)

| # | Element | Component | Notes |
|---|---------|-----------|-------|
| 1 | Logo link "HUYỀN BÍ" | `Navbar` | Same as home |
| 2 | Mystic cursor toggle | `Navbar` | |
| 3 | Theme toggle | `Navbar` | |
| 4 | AI settings badge | `Navbar` | |
| 5 | Auth link/button | `Navbar` | |
| 6 | Breadcrumb links | `Breadcrumb` | Navigational breadcrumb trail |
| 7 | Input "Họ và tên đầy đủ" (`#name`) | Form | `<input type="text">` with `<Label htmlFor="name">` |
| 8 | Input "Ngày sinh" (`#dob`) | Form | `<input type="date">` with `<Label htmlFor="dob">` |
| 9 | Submit button "LUẬN GIẢI" | Form | `<Button type="submit">`, disabled until both fields filled |

**Action:** User fills in name (Tab → type), fills in date (Tab → select), then Tab to submit button and presses Enter.

### Step 3: Results Section (appears after submit)

| # | Element | Component | Notes |
|---|---------|-----------|-------|
| 10 | ExportDownloadBar buttons (Image/Text/PDF) | `ExportDownloadBar` | 3 download action buttons |
| 11 | SaveReadingBtn "Lưu lá số" | `SaveReadingBtn` | Requires auth |
| 12 | Result cards (5 numerology numbers) | `Card` | Non-interactive display cards |
| 13 | Personal Year cards (4 years) | `Card` | Non-interactive display |
| 14 | "Nhận thông điệp" AI button | `Button` | Triggers AI interpretation |
| 15 | NumerologyKnowledge section | `NumerologyKnowledge` | Expandable knowledge base |

---

## Focus Ring Visibility

| Element | Expected Behavior | Status |
|---------|-------------------|--------|
| Navbar logo | `focus-visible:ring-2 ring-primary/40 rounded-md` | ⏳ Pending verification |
| Module cards on home | `focus-visible:ring-2 ring-primary/50 ring-offset-2 ring-offset-background` | ⏳ Pending verification |
| Form inputs | Custom focus styles: `focus:ring-1 focus:ring-primary/20` (or error/success variants) | ⏳ Pending verification |
| Submit button | Inherits shadcn/ui Button focus ring | ⏳ Pending verification |
| Theme toggle | `focus-visible:ring-2 ring-primary/40` | ⏳ Pending verification |
| AI settings badge | `focus-visible:ring-2 ring-primary/40` | ⏳ Pending verification |

**Observation (source code):** Focus rings use `focus-visible:` prefix (not `focus:`), meaning they only appear on keyboard navigation, not mouse clicks. This is correct behavior per WCAG 2.4.7.

---

## Trap Focus / Unreachable Element Observations

| Issue | Element | Severity | Status |
|-------|---------|----------|--------|
| No skip-to-content link on home page | `<main>` has no `tabIndex={-1}` on home (unlike Module pages) | P1 | ⏳ Pending verification |
| Form inputs use custom `<input>` (not shadcn `<Input>`) | `#name`, `#dob` | INFO | Verify `aria-invalid` + `aria-describedby` on validation error |
| SVG radar chart in results | Pentagon SVG | INFO | Non-interactive, no focus trap expected |
| `data-reveal` scroll animations | Section containers | INFO | Verify elements are not hidden from tab order before reveal |
| Disabled submit button | "LUẬN GIẢI" when fields empty | INFO | `disabled` attribute prevents focus — verify this is intentional |

---

## Keyboard Shortcuts

| Key | Context | Expected Behavior |
|-----|---------|-------------------|
| Enter | On Module card link | Navigate to Module_Page |
| Enter | On submit button | Submit form |
| Tab | Throughout | Move to next focusable element in DOM order |
| Shift+Tab | Throughout | Move to previous focusable element |

---

## Summary

- **Total focusable elements (home):** ~27+ (navbar + hero CTAs + 15 module cards + bottom CTAs + footer)
- **Total focusable elements (module page form):** ~9 before submit, ~15 after results appear
- **Known concerns from source analysis:**
  1. Home page `<main>` does not have `tabIndex={-1}` — no skip-to-content target
  2. Form inputs use raw `<input>` with custom classes rather than shadcn `<Input>` — need to verify ARIA attributes on validation
  3. Module cards use `<Link>` wrapper (entire card clickable) — good for keyboard, single tab stop per card

**Status:** Pending manual verification — Tab order and focus ring visibility must be confirmed in a running browser instance.
