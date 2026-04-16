# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **AI**: User-provided OpenAI / Gemini keys; or server-side key stored in DB with per-IP rate limiting

## Artifacts

### mysticism-web (React + Vite, `previewPath: /`)
Vietnamese mysticism website "Huyền Bí" with **15 modules**:

**Original 7 modules:**
- `/` — Trang chủ: hero + 15 module cards + features + footer (stat: 15 hệ thống)
- `/than-so-hoc` — Thần Số Học: Life Path, Soul, Destiny, Personality, Maturity numbers; Pentagon radar SVG chart; 4-year Personal Year outlook; export PNG/TXT/PDF
- `/bat-tu` — Bát Tự Tứ Trụ: 4 pillars (Can Chi) + Ngũ Hành SVG donut chart + Đại Vận 8-pillar section + Hợp Cung Đôi; export PNG/TXT/PDF
- `/xem-que` — Kinh Dịch I Ching: 64 hexagrams + SVG line rendering (yang/yin bars) + session history (10 casts); export PNG/TXT/PDF
- `/cat-hung` — Cát Hung: phone/plate analysis + So Sánh 2 Số tab (winner card + suggest better variants); export PNG/TXT/PDF
- `/lich-van-nien` — Lịch Vạn Niên: lunar calendar, Can Chi, Hoàng Đạo/Hắc Đạo
- `/tu-vi` — Tử Vi Đẩu Số: 12 palaces + stars + export PNG/TXT/PDF

**4 new modules (Phase 2):**
- `/hop-tuoi` — Hợp Tuổi & Duyên Số: compatibility analysis via Mệnh Quái, Can Chi Zodiac, Ngũ Hành, Thần Số Đường Đời; animated score ring + detail breakdown bars
- `/xem-ngay-tot` — Xem Ngày Tốt: find auspicious days by purpose (9 purposes); interactive calendar grid + top 5 best days
- `/sao-han` — Sao Hạn Hàng Năm: 12 annual stars forecast for 7 years; star cards with type/strength/advice
- `/lich-su` — Lịch Sử Tra Cứu: browseable query history stored in localStorage; search + filter + delete; stats dashboard

**PWA:** `pwa-install-prompt.tsx` component using `beforeinstallprompt` event; localStorage dismiss state (`huyen-bi-pwa-dismissed`)

**Lib files:**
- `hop-tuoi.ts` — Ming Gua + Can Chi + Ngũ Hành + Numerology compatibility (`analyzeCompatibility`)
- `xem-ngay-tot.ts` — auspicious day finder by purpose (`findGoodDays`, `PURPOSE_LIST`)
- `sao-han.ts` — annual stars forecast (`computeAnnualStars`, `getMultiYearForecast`)
- `dai-van.ts` — 10-year luck pillars computation (`computeDaiVan`)
- `share-utils.ts` — URL encode/decode for shareable links (`buildShareUrl`, `copyShareUrl`, `readShareParams`)

**4 modules (Phase 1 / v2):**
- `/phong-thuy` — Phong Thuỷ Bát Trạch: Ming Gua compass, 4 tốt / 4 xấu directions, AI interpretation
- `/xem-ten` — Xem Tên: Ngũ Cách name analysis grid (Thiên/Nhân/Địa/Ngoại/Tổng Cách), Ngũ Hành name element
- `/lich-ca-nhan` — Lịch Cá Nhân: Personal Year/Month/Day numerology + monthly calendar with energy colors
- `/tu-dien` — Từ Điển Huyền Học: 5-tab reference (Thiên Can, Địa Chi, Ngũ Hành, Bát Quái, Thần Số)

### Key frontend features
- **Light/Dark mode**: ThemeProvider + toggle button in navbar; saves to localStorage (`huyen-bi-theme`)
- **Export PNG/TXT/PDF**: html2canvas + jspdf based export cards; applies to Thần Số Học, Bát Tự, Xem Quẻ, Cát Hung, Tử Vi
- **AI provider selection**: Default Replit / OpenAI GPT-5.4 / Gemini 3.0; key + model stored in localStorage (`huyen-bi-ai-settings`)
- **History system**: `src/lib/history.ts` — localStorage-backed, max 50 entries (`huyen-bi-history`)
- **ResultActions**: Copy/Share/Print/Save component reusable across all pages
- **SEO + PWA**: Full meta tags, Open Graph, manifest.json, theme-color
- **Mobile responsive navbar**: hamburger menu + all nav links
- **UX patterns**: native `<input type="date">` with `[color-scheme:dark]` + icon overlay; `hourToCanChi()` hint; real-time validation with touched/errors state; `formatPhoneDisplay()` for phone inputs

### api-server (Express 5, `previewPath: /api`)
REST API with:
- `/api/healthz` — Health check
- `/api/openai/conversations` — AI chat CRUD
- `/api/openai/conversations/:id/messages` — SSE streaming chat
- `/api/mysticism/ai-interpret` — SSE streaming AI interpretation (numerology/batu/iching/tu-vi/phong-thuy/xem-ten)

## Key Libraries
- `html2canvas` — DOM-to-image capture for export cards (mysticism-web)
- `jspdf` — PDF export wrapping html2canvas output
- AI headers: `x-ai-provider`, `x-ai-key`, `x-ai-model`

## Key lib files
- `src/lib/lunar-calendar.ts` — Solar↔Lunar conversion (Ho Ngoc Duc algorithm, UTC+7)
- `src/lib/tu-vi.ts` — Tử Vi 12 palace calculation with stars
- `src/lib/history.ts` — localStorage history management
- `src/lib/numerology.ts` — `computeMaturityNumber`, `computePersonalYearNumber`, life path, soul, destiny, personality
- `src/lib/batu.ts`, `src/lib/iching.ts`, `src/lib/cat-hung.ts`
- `src/lib/phong-thuy.ts` — Bát Trạch Ming Gua (getGuaInfo, direction grid)
- `src/lib/xem-ten.ts` — Ngũ Cách name analysis (analyzeName)
- `src/lib/lich-ca-nhan.ts` — Personal Year/Month/Day + calendar builder (buildMonthCalendar)
- `src/lib/hop-tuoi.ts` — analyzeCompatibility() via Mệnh Quái + Can Chi + Ngũ Hành + Thần Số
- `src/lib/xem-ngay-tot.ts` — findGoodDays(year, month, purpose) + PURPOSE_LIST
- `src/lib/sao-han.ts` — computeAnnualStars(birthYear, targetYear) + getMultiYearForecast()
- `src/lib/dai-van.ts` — computeDaiVan(dob, gender) → 8 luck pillars
- `src/lib/share-utils.ts` — buildShareUrl(), copyShareUrl(), readShareParams()
- `src/lib/form-utils.ts` — `hourToCanChi`, `dateInputToDisplay`, `displayToDateInput`, `formatPhoneDisplay`, `validateName`, `validateDateDisplay`
- `src/hooks/use-export-image.ts` — html2canvas + jspdf download hook (`downloadAsImage`, `downloadAsPdf`, `downloadAsText`)
- `src/hooks/use-ai-sse-chat.ts` — SSE streaming hook with provider/key/model headers
- `src/contexts/theme.tsx` — ThemeProvider (light/dark)
- `src/contexts/ai-settings.tsx` — AI provider settings context

## Critical patterns
- **NEVER define sub-components inside parent components** — causes remount on every render. Always define at module level.
- All date inputs use `type="date"` with `[color-scheme:dark]` class for dark theme styling.
- `cn()` for conditional border colors: green=valid, red=error.

## OpenAI Integration
Uses Replit AI Integrations (no user API key required). Model: `gpt-5.2`.
- `AI_INTEGRATIONS_OPENAI_BASE_URL` and `AI_INTEGRATIONS_OPENAI_API_KEY` are auto-configured.

## Authentication (Clerk)
- `@clerk/react` (frontend) + `@clerk/express` (backend)
- React 19.1.4 required (peer dep for Clerk 6.3+)
- `ClerkProvider` wraps entire app in `App.tsx` with `routerPush/routerReplace` for wouter routing
- Dev: no proxy needed. Production: proxy at `/api/__clerk` via `clerkProxyMiddleware`
- Pages: `/sign-in/*?`, `/sign-up/*?`, `/profile`
- `UserButton` component in navbar: shows avatar+dropdown when signed in, "Đăng nhập"/"Đăng ký" when signed out
- `SaveReadingBtn` component: saves readings to DB, redirects to sign-in if not authenticated

## Database Tables
- `conversations` — AI chat conversation sessions
- `messages` — individual chat messages (user/assistant)
- `saved_readings` — user-saved readings (user_id, module, title, input_data, result_data, notes)
- `share_tokens` — shareable reading links with expiry (token, reading_id, expires_at)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
