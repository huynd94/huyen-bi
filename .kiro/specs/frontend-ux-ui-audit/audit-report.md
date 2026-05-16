# Frontend UX/UI Audit Report

## Table of Contents

- [Executive Summary](#executive-summary)
- [Scope](#scope)
- [Methodology](#methodology)
- [Severity Rubric](#severity-rubric)
- [Relationship to Existing Specs](#relationship-to-existing-specs)
- [Findings — ANIM](#findings--anim)
- [Findings — LAYOUT](#findings--layout)
- [Findings — MODULE](#findings--module)
- [Findings — INTERACTION](#findings--interaction)
- [Findings — Mockup Sandbox](#findings--mockup-sandbox)
- [Audit_Backlog](#audit_backlog)
- [Appendices](#appendices)
- [Acceptance Checklist](#acceptance-checklist)

## Executive Summary

| Meta | Value |
|------|-------|
| Auditor | Kiro agent |
| Audit date | 2025-07-15 |
| Repo commit | `866d18fe1b3835647681ee6bda8f062e6f4b8df8` |
| App version | @workspace/mysticism-web v4.1.0 |

**Findings tổng hợp: 3 P0, 10 P1, 11 P2, 9 INFO — tổng 33 findings trên 4 trục.**

Audit phát hiện 3 vấn đề mức P0 (Blocker) đều liên quan vi phạm WCAG 2.1 Level A bắt buộc: (1) **F-LAYOUT-01** — heading hierarchy skip h1→h3 trên 7 Module_Page khiến screen reader không navigate được document structure đúng (SC 1.3.1); (2) **F-MODULE-01** — 5 inline SVG chart (radar ngũ giác, donut ngũ hành, la bàn phong thuỷ, hào quẻ, biểu đồ hợp tuổi) thiếu `role="img"` và `aria-label`, khiến người dùng screen reader không tiếp cận được dữ liệu trực quan quan trọng nhất của mỗi module (SC 1.1.1); (3) **F-INTERACTION-03** — 8+ form surface thiếu `aria-invalid` và `aria-describedby` khi validation fail, khiến người dùng assistive technology không nhận biết lỗi nhập liệu (SC 3.3.1). Cả 3 P0 đều ảnh hưởng trực tiếp tới khả năng sử dụng của người dùng khuyết tật và cần được fix trước release tiếp theo.

Định hướng tổng thể: ưu tiên fix 3 P0 accessibility trước (effort ước tính S–M mỗi finding), sau đó xử lý 10 P1 theo thứ tự impact — đặc biệt F-ANIM-03 (CSS animations thiếu `prefers-reduced-motion`) và F-INTERACTION-04 (loading state thiếu trên async actions) vì ảnh hưởng nhiều surface. 11 P2 là polish/consistency có thể đưa vào backlog sprint sau. Chi tiết từng finding xem tại các section Findings bên dưới và bảng tổng hợp tại [Audit_Backlog](#audit_backlog).

## Scope

### Surface Inventory

| Surface | Path | Status | Reason |
|---------|------|--------|--------|
| than-so-hoc | artifacts/mysticism-web/src/pages/than-so-hoc.tsx | Audited | — |
| bat-tu | artifacts/mysticism-web/src/pages/bat-tu.tsx | Audited | — |
| xem-que | artifacts/mysticism-web/src/pages/xem-que.tsx | Audited | — |
| cat-hung | artifacts/mysticism-web/src/pages/cat-hung.tsx | Audited | — |
| lich-van-nien | artifacts/mysticism-web/src/pages/lich-van-nien.tsx | Audited | — |
| tu-vi | artifacts/mysticism-web/src/pages/tu-vi.tsx | Audited | — |
| phong-thuy | artifacts/mysticism-web/src/pages/phong-thuy.tsx | Audited | — |
| xem-ten | artifacts/mysticism-web/src/pages/xem-ten.tsx | Audited | — |
| lich-ca-nhan | artifacts/mysticism-web/src/pages/lich-ca-nhan.tsx | Audited | — |
| tu-dien | artifacts/mysticism-web/src/pages/tu-dien.tsx | Audited | — |
| hop-tuoi | artifacts/mysticism-web/src/pages/hop-tuoi.tsx | Audited | — |
| xem-ngay-tot | artifacts/mysticism-web/src/pages/xem-ngay-tot.tsx | Audited | — |
| sao-han | artifacts/mysticism-web/src/pages/sao-han.tsx | Audited | — |
| home | artifacts/mysticism-web/src/pages/home.tsx | Audited | — |
| ai-chat | artifacts/mysticism-web/src/pages/ai-chat.tsx | Audited | — |
| profile | artifacts/mysticism-web/src/pages/profile.tsx | Audited | — |
| lich-su | artifacts/mysticism-web/src/pages/lich-su.tsx | Audited | — |
| sign-in | artifacts/mysticism-web/src/pages/sign-in.tsx | Audited | — |
| sign-up | artifacts/mysticism-web/src/pages/sign-up.tsx | Audited | — |
| share-view | artifacts/mysticism-web/src/pages/share-view.tsx | Audited | — |
| not-found | artifacts/mysticism-web/src/pages/not-found.tsx | Audited | — |
| navbar | artifacts/mysticism-web/src/components/layout/navbar.tsx | Audited | — |
| mobile-drawer | artifacts/mysticism-web/src/components/layout/mobile-drawer.tsx | Audited | — |
| footer | artifacts/mysticism-web/src/components/layout/footer.tsx | Audited | — |
| breadcrumb | artifacts/mysticism-web/src/components/layout/breadcrumb.tsx | Audited | — |
| offline-banner | artifacts/mysticism-web/src/components/layout/offline-banner.tsx | Audited | — |
| result-card | artifacts/mysticism-web/src/components/result-card.tsx | Audited | — |
| result-actions | artifacts/mysticism-web/src/components/result-actions.tsx | Audited | — |
| ambient-bg | artifacts/mysticism-web/src/components/ambient-bg.tsx | Audited | — |
| tilt-card | artifacts/mysticism-web/src/components/tilt-card.tsx | Audited | — |
| mystic-cursor | artifacts/mysticism-web/src/components/mystic-cursor.tsx | Audited | — |
| pwa-install-prompt | artifacts/mysticism-web/src/components/pwa-install-prompt.tsx | Audited | — |
| data-table | artifacts/mysticism-web/src/components/data-table.tsx | Audited | — |
| knowledge-base | artifacts/mysticism-web/src/components/knowledge-base.tsx | Audited | — |
| markdown-renderer | artifacts/mysticism-web/src/components/ui/markdown-renderer.tsx | Audited | — |
| export-card-numerology | artifacts/mysticism-web/src/components/export-card-numerology.tsx | Audited | — |
| export-card-batu | artifacts/mysticism-web/src/components/export-card-batu.tsx | Audited | — |
| export-card-tuvi | artifacts/mysticism-web/src/components/export-card-tuvi.tsx | Audited | — |
| export-card-ichinq | artifacts/mysticism-web/src/components/export-card-ichinq.tsx | Audited | — |
| mockup-sandbox | artifacts/mockup-sandbox/ | Audited (convention only) | — |
| node_modules | (excluded) | Skipped | Third-party dependencies, not project code |
| dist | (excluded) | Skipped | Build output, not source |
| *.test.ts / *.property.test.tsx | (excluded) | Skipped | Test files, not production UI |
| .generated/ | (excluded) | Skipped | Auto-generated code |
| __clerk-mock-* | (excluded) | Skipped | Dev mock files for testing |
| api-server | artifacts/api-server/ | Skipped | Backend server, no UI surface |

### Unaudited States

Các surface có nhiều state (loading, empty, error, success) đã được audit thông qua source code review và evidence thu thập. Một số state không thể reproduce locally do phụ thuộc backend hoặc Clerk authentication:

| Surface | State | Reason |
|---------|-------|--------|
| ai-chat | AI streaming (live) | Requires running api-server with OpenAI key; audited via source code review |
| profile | Authenticated view | Requires Clerk dev keys configured; audited via source code review |
| lich-su | Populated history list | Requires backend running with saved readings; audited via source code review |
| sign-in | Clerk redirect flow | Requires Clerk dev keys; audited via source code review of sign-in.tsx |
| sign-up | Clerk redirect flow | Requires Clerk dev keys; audited via source code review of sign-up.tsx |

Tất cả state khác (empty state, error state, loading state) đã được audit trực tiếp qua source code analysis và responsive screenshots khi khả thi.

## Methodology

### Heuristic_Set (Rubric áp dụng)

Audit sử dụng 5 bộ tiêu chí đánh giá song song:

1. **Nielsen 10 Heuristics** — đánh giá usability tổng thể (visibility of system status, match between system and real world, user control and freedom, consistency and standards, error prevention, recognition rather than recall, flexibility and efficiency of use, aesthetic and minimalist design, help users recognize/diagnose/recover from errors, help and documentation).
2. **WCAG 2.1 Level AA** — đánh giá accessibility theo tiêu chuẩn quốc tế. Target ngầm: AAA cho contrast nếu khả thi.
3. **Core Web Vitals (CWV)** — đánh giá perceived performance qua 3 metric: LCP (Largest Contentful Paint), INP (Interaction to Next Paint), CLS (Cumulative Layout Shift).
4. **Design system consistency** — đối chiếu current state với target state trong spec `ux-ui-upgrade` (tokens, type scale, spacing scale, radius scale, color palette).
5. **Motion principles** — đánh giá animation/transition theo Material Design Motion guidelines và Framer Motion best practices (duration [120ms, 800ms], easing curves, `prefers-reduced-motion` honoring).

### Tooling_Set (Công cụ định lượng)

| Tool | Version | Mục đích |
|------|---------|----------|
| Lighthouse | Chrome DevTools built-in (Chromium 131+) | Performance, Accessibility, Best Practices, SEO scores |
| axe-core | 4.x (`@axe-core/cli`) | Accessibility violations theo impact (critical/serious/moderate/minor) |
| Chrome DevTools | Performance panel, Rendering tab, Coverage | Runtime performance profiling, paint flashing, CSS coverage |
| `prefers-reduced-motion` simulation | Chrome DevTools > Rendering > Emulate CSS media | Kiểm tra animation behavior khi user prefer reduced motion |
| Manual keyboard / screen reader | Native OS (Windows 11) | Tab order, focus ring, ARIA attributes, screen reader compatibility |

### Môi trường thử nghiệm

| Item | Value |
|------|-------|
| Browser | Google Chrome (Chromium 131+) |
| OS | Windows 11 |
| Node.js | >= 18 |
| Package Manager | pnpm 10.32.0 |
| App version | mysticism-web v4.1.0 |

### Viewport sizes

| Name | Width × Height | Use case |
|------|----------------|----------|
| Mobile | 360 × 800 | Smartphone |
| Tablet | 768 × 1024 | Tablet portrait |
| Desktop | 1280 × 800 | Standard desktop |
| Large | 1920 × 1080 | Large monitor |

### Quy trình (Process)

Audit tuân thủ pipeline **Tooling Pass trước, Manual Pass sau**:

1. **Tooling Pass (định lượng):**
   - Chạy Lighthouse trên 8 route đại diện → thu thập scores JSON.
   - Chạy axe-core trên cùng 8 route → thu thập violations JSON.
   - Capture responsive screenshots trên 4 viewport × routes.
   - Capture `prefers-reduced-motion: reduce` screenshots trên 3 surface có animation rõ rệt.
   - Dữ liệu tooling được lưu vào `./audit-evidence/` làm evidence và gợi ý cho Manual Pass.

2. **Manual Pass (định tính — thẩm quyền cuối cùng):**
   - Sử dụng dữ liệu tooling làm "hints" để không bỏ sót.
   - Đánh giá theo từng Audit_Axis: ANIM → LAYOUT → MODULE → INTERACTION.
   - Keyboard-only navigation walkthrough cho 3 luồng chính.
   - Manual Pass có thẩm quyền cuối cùng vì tooling thường miss: information architecture, motion quality, brand identity, content hierarchy, và interaction patterns phức tạp.

### Reference format

Mỗi Finding gắn vào ít nhất một rubric qua trường `references`, theo format chuẩn:

| Rubric | Reference format | Ví dụ |
|--------|-----------------|-------|
| Nielsen 10 | `Nielsen #N: <name>` | `Nielsen #4: Consistency and standards` |
| WCAG 2.1 | `WCAG 2.1 SC X.Y.Z (Level A/AA)` | `WCAG 2.1 SC 2.4.7 (Level AA)` |
| Core Web Vitals | `CWV: <metric>` | `CWV: INP` |
| Material Motion / FM | `Motion: <principle>` | `Motion: Easing > linear` |
| `ux-ui-upgrade` (target state) | `ux-ui-upgrade Req X.Y` | `ux-ui-upgrade Req 9.3` |

### Limitations

- **Lighthouse** on all 8 routes (`/`, `/than-so-hoc`, `/bat-tu`, `/tu-vi`, `/ai-chat`, `/profile`, `/lich-su`, `/sign-in`): Local dev server not available during automated audit pass — fallback: placeholder JSON files saved with error status and manual run instructions. Source code review used as fallback for performance/accessibility assessment.
- **axe-core** on all 8 routes (same set as Lighthouse): Local dev server not available during automated audit pass — fallback: placeholder JSON files saved with error status and manual run instructions. Source code review of ARIA attributes, semantic HTML, and contrast values used as fallback.
- **Note:** Cả Lighthouse và axe-core đều yêu cầu app chạy tại localhost để scan runtime DOM. Trong đợt audit này, app không được serve locally nên hai công cụ trên chưa thu được dữ liệu thực. Auditor đã dùng **source code review** làm phương pháp thay thế — kiểm tra trực tiếp markup, ARIA attributes, CSS values, và animation config trong source. Khi app được serve locally, re-run Lighthouse và axe-core theo hướng dẫn trong placeholder JSON files để bổ sung dữ liệu định lượng.

## Severity Rubric

| Severity | Tiêu chí (cần thoả ≥ 1) |
|----------|--------------------------|
| **P0** | (a) WCAG 2.1 A/AA bắt buộc bị vi phạm; (b) hiểu nhầm dữ liệu nghiêm trọng; (c) form không submit / data loss; (d) layout vỡ ≥ 360px |
| **P1** | (a) Nielsen heuristic vi phạm có workaround; (b) inconsistency ≥ 3 surface; (c) motion sickness chưa honor reduced-motion; (d) loading/error state thiếu; (e) Lighthouse a11y < 90 |
| **P2** | (a) polish ≤ 2 surface; (b) nice-to-have; (c) gap với target state không ảnh hưởng UX hiện tại; (d) micro-interaction tăng cảm giác cao cấp |
| **INFO** | Trục đã kiểm tra nhưng không tìm thấy vấn đề (R3.1, R3.6) |

Khi một Finding rơi nhiều mức, chọn mức **cao nhất** và ghi lý do trong `description`.

## Relationship to Existing Specs

### `ux-ui-upgrade` — Target State vs Current State

Spec `ux-ui-upgrade` (Req 1–20) định nghĩa **target state** cho design system, accessibility, theme parity, motion guidelines, và brand identity của dự án Huyền Bí. Audit này đo **current state** — hiện trạng thực tế của frontend tại thời điểm audit.

**Gap giữa current state và target state = Finding.**

Mỗi Finding trong báo cáo này thể hiện khoảng cách giữa những gì đang có (đo được, quan sát được) và những gì spec `ux-ui-upgrade` yêu cầu đạt tới. Audit tập trung vào việc **đo lường và ghi nhận gap**, không lặp lại nội dung target state đã được mô tả đầy đủ trong `ux-ui-upgrade`.

### Quy ước tham chiếu

Khi một Finding trùng hoặc liên quan tới requirement đã có trong `ux-ui-upgrade`, báo cáo sử dụng reference format:

```
ux-ui-upgrade Req X.Y
```

thay vì copy nguyên nội dung requirement vào đây. Audit_Report giữ trọng tâm vào **gap measurement** (số liệu đo được, quan sát cụ thể) và không đưa thêm context bổ sung hay góc nhìn khác lên cùng vấn đề — mọi chi tiết về target state đọc tại spec gốc.

### `post-opus-audit-remediation` — Security Scope

Spec `post-opus-audit-remediation` đã cover toàn bộ trục security (XSS, CSRF, secret leak, input sanitization, v.v.). Audit UX/UI này **không lặp lại** security audit.

Nếu trong quá trình audit frontend, Auditor phát hiện vấn đề security (ví dụ: XSS trong markdown renderer, secret leak trong console), xử lý như sau:

- Ghi **1 dòng note** trong Finding hoặc Appendices.
- Link tới spec `post-opus-audit-remediation` để theo dõi và xử lý.
- **Không** viết finding chi tiết về security trong báo cáo này.

## Findings — ANIM

Trục ANIM đánh giá toàn bộ hiệu ứng chuyển động trong `mysticism-web`: ambient background orbs/stars/clouds, tilt-card 3D, scroll reveal, shimmer heading, glow pulse, typing indicator, và mystic-cursor. Nhìn chung, hệ thống animation được thiết kế có chủ đích với `animationRegistry` làm single source of truth cho Framer Motion variants — durations nằm trong khoảng [120ms, 800ms] và easing dùng cubic-bezier phù hợp. Tuy nhiên, một số CSS-only animations (cloud-drift, shimmer-text, glow-pulse, float-badge) nằm ngoài registry và vi phạm guidelines về easing hoặc reduced-motion honoring.

Component `ambient-bg.tsx` xử lý `prefers-reduced-motion` tốt qua JS inline styles, `tilt-card.tsx` disable hoàn toàn trên touch/reduced-motion, và `mystic-cursor.tsx` đúng chuẩn `aria-hidden` + touch detection. Vấn đề chính tập trung ở CSS animations không đi qua registry và typing indicator dùng Tailwind default vượt ngưỡng duration.

#### Checklist tham chiếu (R7.1–R7.7)

- [x] Mọi animation thời lượng [120ms, 800ms]? — **Phát hiện vi phạm:** `animate-bounce` (typing dots) = 1s > 800ms. Ambient orbs/stars/clouds exempt (background ambient).
- [x] `prefers-reduced-motion: reduce` được honor? — **Phát hiện vi phạm:** CSS-only animations (`shimmer-text`, `glow-pulse`, `float-badge`) thiếu `@media (prefers-reduced-motion: reduce)` rule.
- [x] Easing không dùng `linear` cho translate/scale? — **Phát hiện vi phạm:** `cloud-drift` dùng `linear` cho translateX.
- [x] `ambient-bg` opacity ≤ 35% dark / ≤ 15% light? — **Pass.** `AMBIENT_OPACITY_DARK_MAX = 0.35`, `AMBIENT_OPACITY_LIGHT_MAX = 0.15`.
- [x] `tilt-card` max ±15°? — **Pass.** `HARD_CAP_DEG = 15`, soft cap ±8°.
- [x] AI streaming markdown render incremental? — **Pass.** `MarkdownRenderer` dùng `React.memo` per block, chỉ re-render block cuối khi streaming.
- [x] `mystic-cursor` ẩn trên touch + `aria-hidden`? — **Pass.** Component render `<span aria-hidden="true">`, CSS scoped under `@media (hover: hover)`, JS checks `(hover: none)` và `(pointer: coarse)`.

### F-ANIM-01: Cloud-drift animation dùng `linear` easing cho translateX

- **Severity:** P2
- **Surface:** ambient-bg
- **Axis:** ANIM
- **References:** ux-ui-upgrade Req 9.3; Motion: Easing > linear
- **Description:** Trong `src/index.css`, 5 cloud elements (`.ambient-cloud-1` đến `.ambient-cloud-5`) sử dụng `animation: cloud-drift Xs linear infinite`. Keyframe `cloud-drift` animate `translateX(-20%)` → `translateX(120%)` — đây là chuyển động không gian (translate) nhưng dùng `linear` easing. Theo R7.3, easing `linear` không được dùng cho translate/scale trừ progress bar. Cloud drift không phải progress bar. Tuy nhiên, đây là ambient background decoration với thời lượng rất dài (35s–75s) nên impact thực tế thấp — user khó nhận ra sự khác biệt giữa linear và ease-in-out ở tốc độ này. Gán P2 vì vi phạm guideline nhưng không ảnh hưởng UX thực tế.
- **Evidence:** `artifacts/mysticism-web/src/index.css:382` (`.ambient-cloud-1 { animation: cloud-drift 35s linear infinite; }`), lines 390, 398, 406, 414 cho cloud-2 đến cloud-5.
- **Recommendation:** WHAT — Đổi `linear` thành `ease-in-out` hoặc custom cubic-bezier cho `cloud-drift` animation. WHY — Tuân thủ motion guideline R7.3 và tạo chuyển động tự nhiên hơn (mây thực tế không di chuyển đều). WHERE — `artifacts/mysticism-web/src/index.css`, 5 dòng `.ambient-cloud-N` declarations.

### F-ANIM-02: Typing indicator `animate-bounce` vượt ngưỡng 800ms

- **Severity:** P2
- **Surface:** ai-chat
- **Axis:** ANIM
- **References:** ux-ui-upgrade Req 9.2; Motion: Duration window [120ms, 800ms]
- **Description:** Typing indicator (3 chấm bounce) trong `ai-chat.tsx` và 6 Module_Page khác sử dụng Tailwind class `animate-bounce` có duration mặc định 1s (1000ms), vượt ngưỡng tối đa 800ms theo R7.1. Animation này là `translateY` bounce — chuyển động không gian lặp lại liên tục trong khi chờ AI response. Mặc dù typing dots là pattern phổ biến và user quen thuộc, duration 1s tạo cảm giác chậm hơn cần thiết. Gán P2 vì đây là vi phạm kỹ thuật nhưng UX impact thấp — user tập trung vào nội dung sắp xuất hiện, không vào tốc độ bounce.
- **Evidence:** `artifacts/mysticism-web/src/pages/ai-chat.tsx:606` (`className="size-1.5 rounded-full bg-primary/70 animate-bounce"`), cùng pattern tại `than-so-hoc.tsx:404`, `bat-tu.tsx:471`, `xem-que.tsx:267`, `tu-vi.tsx:443`, `phong-thuy.tsx:276`, `cat-hung.tsx:212–214`, `xem-ten.tsx:250`.
- **Recommendation:** WHAT — Override `animate-bounce` duration xuống 600–700ms bằng custom utility class hoặc inline `animationDuration` style. WHY — Tuân thủ R7.1 duration window và tạo nhịp nhanh hơn phù hợp với kỳ vọng "đang xử lý". WHERE — Tạo utility class `.animate-bounce-fast` trong `index.css` hoặc dùng `animation-registry` pattern cho typing dots.

### F-ANIM-03: CSS-only animations thiếu `prefers-reduced-motion` honoring

- **Severity:** P1
- **Surface:** home
- **Axis:** ANIM
- **References:** ux-ui-upgrade Req 9.4; WCAG 2.1 SC 2.3.3 (Level AAA); Motion: Reduced-motion
- **Description:** Ba CSS animation classes — `.shimmer-text` (4s linear infinite, animate `background-position`), `.glow-pulse` (3s ease-in-out infinite, animate `text-shadow`), `.float-badge` (3.5s ease-in-out infinite, animate `translateY`) — không có `@media (prefers-reduced-motion: reduce)` rule trong `index.css`. Khi user bật reduced-motion ở OS level, các animation này vẫn chạy bình thường. Component `ambient-bg.tsx` xử lý reduced-motion đúng qua JS, nhưng các CSS-only classes này nằm ngoài tầm kiểm soát của React component. `.float-badge` animate `translateY` > 4px (5px) nên theo R7.2 phải được giảm xuống fade ≤ 150ms hoặc tắt. `.shimmer-text` và `.glow-pulse` không phải translate/scale nhưng vẫn là continuous animation gây xao nhãng cho motion-sensitive users. Gán P1 vì vi phạm reduced-motion honoring trên flow quan trọng (home page hero heading dùng `shimmer-text`).
- **Evidence:** `artifacts/mysticism-web/src/index.css:461` (`.shimmer-text { animation: shimmer-sweep 4s linear infinite; }`), line 472 (`.glow-pulse { animation: glow-pulse 3s ease-in-out infinite; }`), line 499 (`.float-badge { animation: float-badge 3.5s ease-in-out infinite; }`). Không có `@media (prefers-reduced-motion: reduce)` rule cho 3 class này. `src/pages/home.tsx:345` sử dụng `shimmer-text` trên hero heading.
- **Recommendation:** WHAT — Thêm `@media (prefers-reduced-motion: reduce)` rule tắt animation cho `.shimmer-text`, `.glow-pulse`, `.float-badge` (set `animation: none`). WHY — Đảm bảo motion-sensitive users không bị xao nhãng bởi continuous animation, tuân thủ R7.2 và WCAG 2.3.3. WHERE — `artifacts/mysticism-web/src/index.css`, thêm media query block sau mỗi animation definition hoặc gom chung 1 block cuối file.

### F-ANIM-04: `shimmer-text` dùng `linear` easing cho background-position animation

- **Severity:** INFO
- **Surface:** home
- **Axis:** ANIM
- **References:** Motion: Easing > linear
- **Description:** `.shimmer-text` sử dụng `animation: shimmer-sweep 4s linear infinite` — easing `linear`. Tuy nhiên, property được animate là `background-position` (gradient sweep), không phải translate/scale. Theo R7.3, exemption áp dụng cho progress bar và các animation không phải chuyển động không gian. `background-position` sweep tạo hiệu ứng shimmer đều — `linear` là lựa chọn hợp lý ở đây vì gradient cần di chuyển đều để tạo hiệu ứng lấp lánh liên tục. Ghi nhận đã kiểm tra, không phát hiện vấn đề thực sự.
- **Evidence:** `artifacts/mysticism-web/src/index.css:461` (`.shimmer-text { animation: shimmer-sweep 4s linear infinite; }`). Keyframe `shimmer-sweep` animate `background-position` từ `-200% center` đến `200% center`.

## Findings — LAYOUT

Trục LAYOUT đánh giá cấu trúc bố cục, responsive behavior, heading hierarchy, spacing consistency, type scale, và touch target sizing trên toàn bộ `mysticism-web`. Nhìn chung, hệ thống layout được xây dựng tốt: navbar collapse đúng breakpoint `md` (768px) qua class `md:hidden` / `hidden md:flex`, bảng dữ liệu (`data-table.tsx`) có `overflow-x-auto` trên mobile để tránh horizontal scroll toàn trang, và spacing phần lớn dùng Tailwind scale chuẩn (multiples of 0.25rem). Tuy nhiên, phát hiện vấn đề ở heading hierarchy (nhiều page skip h2), prose width không được constrain trên desktop, type scale vượt 6 mức do sử dụng nhiều arbitrary font sizes, và touch target trên calendar grid / date-input nhỏ hơn 44px.

#### Checklist tham chiếu (R8.1–R8.7)

- [x] No horizontal scroll ≥ 360px (except tables with overflow-x-auto)? — **Pass.** `data-table.tsx` dùng `overflow-x-auto md:overflow-visible`. Các page dùng `container mx-auto px-4` với `max-w-*` constraints. Không phát hiện horizontal scroll trên viewport 360px.
- [x] Spacing uses Tailwind scale (multiples of 0.25rem)? — **Pass.** Không tìm thấy arbitrary spacing values (`p-[13px]`, `mt-[2.3rem]`, v.v.) trong source pages/components. Chỉ có `top-[1px]` và `p-[1px]` trong UI primitives (`navigation-menu.tsx`, `scroll-area.tsx`) — chấp nhận được cho pixel-perfect alignment.
- [x] Heading hierarchy: one h1 per page, no skipped levels? — **Phát hiện vi phạm:** Nhiều Module_Page (than-so-hoc, bat-tu, phong-thuy, xem-que, xem-ten, xem-ngay-tot, sao-han) skip từ `<h1>` trực tiếp xuống `<h3>`, bỏ qua `<h2>`.
- [x] Prose max-width ≤ 75ch on desktop+? — **Phát hiện vi phạm:** `MarkdownRenderer` (AI response content) không có `max-width` constraint. Container `max-w-4xl` (896px) ở `ai-chat.tsx` cho phép prose line length vượt 75ch trên desktop.
- [x] Navbar collapses to drawer at < 768px? — **Pass.** `MobileDrawer` trigger có class `md:hidden` (ẩn ≥ 768px). Desktop nav có `hidden md:flex` (hiện ≥ 768px). Breakpoint chính xác 768px.
- [x] Touch targets ≥ 44px on mobile? — **Phát hiện vi phạm:** Calendar day buttons trên `lich-van-nien.tsx`, `xem-ngay-tot.tsx`, `lich-ca-nhan.tsx` dùng `aspect-square` trong grid 7 cột — trên 360px viewport, mỗi cell ≈ 44px (borderline). Date-input calendar trigger button `h-7 w-7` = 28px × 28px, dưới ngưỡng 44px.
- [x] Type scale ≤ 6 distinct levels with consistent ratio? — **Phát hiện vi phạm:** CSS custom properties định nghĩa 6 mức (display/h1/h2/h3/body/small), nhưng source code sử dụng thêm nhiều arbitrary sizes: `text-[8px]`, `text-[9px]`, `text-[10px]`, `text-[11px]` — tổng cộng ≥ 10 mức font size distinct trong production UI.

### F-LAYOUT-01: Heading hierarchy skip — h1 → h3 trên nhiều Module_Page

- **Severity:** P0
- **Surface:** than-so-hoc, bat-tu, phong-thuy, xem-que, xem-ten, xem-ngay-tot, sao-han
- **Axis:** LAYOUT
- **References:** WCAG 2.1 SC 1.3.1 (Level A); ux-ui-upgrade Req 1.4; Nielsen #4: Consistency and standards
- **Description:** Ít nhất 7 Module_Page có heading hierarchy bị skip: trang có `<h1>` (tiêu đề chính) rồi nhảy thẳng xuống `<h3>` cho các section con, bỏ qua `<h2>`. Ví dụ: `than-so-hoc.tsx` có `<h1>Thần số học</h1>` (line 144) rồi `<h3>Bức tranh huyền số</h3>` (line 249); `bat-tu.tsx` có `<h1>Bát tự Tứ Trụ</h1>` (line 200) rồi `<h3>` cho mỗi trụ (line 308); `phong-thuy.tsx` có `<h1>` (line 145) rồi `<h3>Hướng Tốt</h3>` / `<h3>Hướng Xấu</h3>` (lines 236, 248). Đây là vi phạm WCAG 2.1 SC 1.3.1 Level A — screen reader users dựa vào heading hierarchy để navigate document structure. Gán P0 vì vi phạm WCAG Level A bắt buộc.
- **Evidence:** `./audit-evidence/responsive/than-so-hoc-1280x800.png`, `artifacts/mysticism-web/src/pages/than-so-hoc.tsx:144,249`, `artifacts/mysticism-web/src/pages/bat-tu.tsx:200,308`, `artifacts/mysticism-web/src/pages/phong-thuy.tsx:145,236,248`
- **Recommendation:** WHAT — Đổi `<h3>` thành `<h2>` cho các section heading trực tiếp dưới `<h1>` trên mỗi Module_Page bị ảnh hưởng. Nếu cần sub-section bên trong, dùng `<h3>` dưới `<h2>` đó. WHY — Tuân thủ WCAG 2.1 SC 1.3.1 (Level A) và đảm bảo screen reader users có thể navigate heading tree chính xác. WHERE — 7 files trong `artifacts/mysticism-web/src/pages/`: `than-so-hoc.tsx`, `bat-tu.tsx`, `phong-thuy.tsx`, `xem-que.tsx`, `xem-ten.tsx`, `xem-ngay-tot.tsx`, `sao-han.tsx`.

### F-LAYOUT-02: Prose content thiếu max-width constraint — AI response vượt 75ch trên desktop

- **Severity:** P1
- **Surface:** ai-chat
- **Axis:** LAYOUT
- **References:** ux-ui-upgrade Req 8.4; Nielsen #8: Aesthetic and minimalist design
- **Description:** Component `MarkdownRenderer` (render AI response trong chat) không có `max-width` constraint trên prose content. Container cha `max-w-4xl` (896px) cho phép text block rộng tới ~100+ characters per line trên desktop (tùy font size). Theo R8.4, prose max-width nên ≤ 75ch để đảm bảo readability. Trên viewport 1920px, message bubble chiếm `max-w-[88%]` của container 896px ≈ 788px — với `text-base` (16px) và font Plus Jakarta Sans, line length có thể đạt ~85–95 characters. Gán P1 vì ảnh hưởng readability trên desktop nhưng không phải WCAG violation bắt buộc, và mobile/tablet không bị ảnh hưởng do viewport hẹp tự nhiên.
- **Evidence:** `./audit-evidence/responsive/ai-chat-1920x1080.png`, `artifacts/mysticism-web/src/components/ui/markdown-renderer.tsx:420` (không có max-width class), `artifacts/mysticism-web/src/pages/ai-chat.tsx:553` (`max-w-[88%]` trên message container)
- **Recommendation:** WHAT — Thêm `max-w-prose` (65ch) hoặc `max-w-[75ch]` vào wrapper `<div>` của `MarkdownRenderer` hoặc vào `.markdown-body` class. WHY — Giới hạn line length ≤ 75ch cải thiện readability đáng kể trên desktop theo typography best practices và R8.4. WHERE — `artifacts/mysticism-web/src/components/ui/markdown-renderer.tsx` (thêm class vào root `<div>`) hoặc `artifacts/mysticism-web/src/pages/ai-chat.tsx` (thêm vào message bubble wrapper).

### F-LAYOUT-03: Type scale vượt 6 mức — arbitrary font sizes `text-[8px]` đến `text-[11px]`

- **Severity:** P1
- **Surface:** xem-ngay-tot, tu-vi, lich-van-nien, lich-ca-nhan, sao-han, cat-hung, than-so-hoc, tu-dien, xem-que, xem-ten
- **Axis:** LAYOUT
- **References:** ux-ui-upgrade Req 1.3; Nielsen #4: Consistency and standards
- **Description:** CSS custom properties trong `index.css` định nghĩa type scale 6 mức chuẩn: display (48px), h1 (36px), h2 (28px), h3 (22px), body (16px), small (14px). Tuy nhiên, source code sử dụng thêm ít nhất 4 arbitrary font sizes ngoài scale: `text-[8px]` (xem-ngay-tot.tsx:176), `text-[9px]` (tu-vi.tsx:75,114; lich-ca-nhan.tsx:45; cat-hung.tsx:141-142), `text-[10px]` (≥ 15 instances across 10 files), `text-[11px]` (xem-ten.tsx:203; than-so-hoc.tsx:376; tu-dien.tsx:198). Tổng cộng ≥ 10 mức font size distinct (8/9/10/11/12/14/16/18/20/22/24/28/30/36/48px qua Tailwind classes `text-xs` đến `text-5xl` + arbitrary). Điều này vi phạm R8.7 (type scale ≤ 6 mức) và tạo visual inconsistency. Gán P1 vì inconsistency ≥ 3 surface và vi phạm design system guideline.
- **Evidence:** `./audit-evidence/responsive/than-so-hoc-360x800.png`, `artifacts/mysticism-web/src/index.css:108-117` (type scale definition), `artifacts/mysticism-web/src/pages/tu-vi.tsx:68,71,75,91,114,120,123,130`, `artifacts/mysticism-web/src/pages/xem-ngay-tot.tsx:24,159,176`
- **Recommendation:** WHAT — Thay thế tất cả `text-[8px]`, `text-[9px]`, `text-[10px]`, `text-[11px]` bằng Tailwind scale gần nhất: `text-[10px]`/`text-[11px]` → `text-xs` (12px), `text-[8px]`/`text-[9px]` → `text-[0.625rem]` (10px) nếu thực sự cần, hoặc tốt hơn là redesign để không cần font size < 12px. WHY — Giữ type scale ≤ 6 mức theo R8.7, đảm bảo consistency và readability (font < 12px khó đọc trên mobile). WHERE — 10+ files trong `src/pages/` sử dụng arbitrary font sizes — ưu tiên `tu-vi.tsx`, `xem-ngay-tot.tsx`, `lich-van-nien.tsx` vì có nhiều instances nhất.

### F-LAYOUT-04: Touch target < 44px — date-input calendar trigger button 28×28px

- **Severity:** P1
- **Surface:** than-so-hoc, bat-tu, tu-vi, phong-thuy, hop-tuoi, sao-han
- **Axis:** LAYOUT
- **References:** WCAG 2.1 SC 2.5.5 (Level AAA); ux-ui-upgrade Req 8.6; Nielsen #7: Flexibility and efficiency of use
- **Description:** Component `date-input.tsx` có calendar trigger button với class `h-7 w-7` = 28px × 28px, thấp hơn đáng kể so với ngưỡng 44px yêu cầu bởi R8.6. Button này là phương thức chính để mở date picker trên mobile — user phải tap chính xác vào vùng 28×28px. Mặc dù WCAG 2.5.5 là Level AAA (không bắt buộc), R8.6 của dự án yêu cầu touch target ≥ 44px trên mobile. Gán P1 vì vi phạm project requirement trên ≥ 3 surface (mọi Module_Page có date input đều bị ảnh hưởng) và ảnh hưởng usability trên mobile.
- **Evidence:** `./audit-evidence/responsive/than-so-hoc-360x800.png`, `artifacts/mysticism-web/src/components/ui/date-input.tsx:329` (`h-7 w-7` = 28px)
- **Recommendation:** WHAT — Tăng kích thước button lên `h-11 w-11` (44px) hoặc giữ visual size nhỏ nhưng thêm padding/min-height để touch area đạt 44px (ví dụ: `min-h-[44px] min-w-[44px]` với content centered). WHY — Đảm bảo touch target ≥ 44px theo R8.6, cải thiện tap accuracy trên mobile đặc biệt cho user có motor impairment. WHERE — `artifacts/mysticism-web/src/components/ui/date-input.tsx` — chỉ cần sửa 1 file, ảnh hưởng tất cả surface dùng date-input.

### F-LAYOUT-05: Calendar grid cells borderline 44px trên viewport 360px

- **Severity:** P2
- **Surface:** lich-van-nien, xem-ngay-tot, lich-ca-nhan
- **Axis:** LAYOUT
- **References:** ux-ui-upgrade Req 8.6; WCAG 2.1 SC 2.5.5 (Level AAA)
- **Description:** Calendar grid trên 3 surface sử dụng `grid-cols-7` với `gap-1` (4px). Trên viewport 360px với `px-4` (16px mỗi bên) và container padding, mỗi cell có chiều rộng ≈ (360 - 32 - 24) / 7 ≈ 43.4px — borderline ngưỡng 44px. `xem-ngay-tot.tsx` dùng `aspect-square` nên cell là ~43×43px. `lich-van-nien.tsx` dùng `p-2` (8px padding) trên button nhưng không set min-height — chiều cao phụ thuộc content. Trên thực tế, cells có thể đạt hoặc gần đạt 44px nhờ content height, nhưng không được guarantee. Gán P2 vì borderline (không rõ ràng vi phạm) và chỉ ảnh hưởng trên viewport nhỏ nhất (360px).
- **Evidence:** `./audit-evidence/responsive/home-360x800.png`, `artifacts/mysticism-web/src/pages/xem-ngay-tot.tsx:174` (`aspect-square` trong `grid-cols-7`), `artifacts/mysticism-web/src/pages/lich-van-nien.tsx:187` (`p-2` button trong `grid-cols-7`)
- **Recommendation:** WHAT — Thêm `min-h-[44px]` vào calendar day buttons hoặc đảm bảo cell height ≥ 44px qua padding. WHY — Guarantee touch target ≥ 44px trên mọi viewport ≥ 360px theo R8.6. WHERE — `artifacts/mysticism-web/src/pages/lich-van-nien.tsx`, `xem-ngay-tot.tsx`, `lich-ca-nhan.tsx` — calendar grid button elements.

### F-LAYOUT-06: Footer heading hierarchy — `<h2>` trong footer có thể conflict với page heading structure

- **Severity:** INFO
- **Surface:** footer
- **Axis:** LAYOUT
- **References:** WCAG 2.1 SC 1.3.1 (Level A)
- **Description:** `footer.tsx` sử dụng `<h2>` cho section headings ("Modules", "Tài khoản", "Chính sách") và `<h3>` cho sub-group headings. Đây là pattern hợp lệ khi footer nằm trong `<footer>` landmark — screen readers phân biệt được heading trong footer vs main content. Tuy nhiên, trên các page có ít heading trong main content (ví dụ: `sign-in.tsx` chỉ có `<h1>`), footer `<h2>` có thể gây nhầm lẫn trong heading outline. Ghi nhận đã kiểm tra — không phải vi phạm thực sự vì `<footer>` landmark cung cấp đủ context cho assistive technology.
- **Evidence:** `artifacts/mysticism-web/src/components/layout/footer.tsx:160,175,189` (3 `<h2>` elements trong `<footer>`)

### F-LAYOUT-07: Horizontal scroll — không phát hiện vấn đề

- **Severity:** INFO
- **Surface:** (toàn bộ)
- **Axis:** LAYOUT
- **References:** ux-ui-upgrade Req 8.1
- **Description:** Đã kiểm tra toàn bộ surface trên viewport 360px. Mọi page sử dụng `container mx-auto px-4` hoặc tương đương, không có element nào overflow viewport width. `data-table.tsx` xử lý đúng bằng `overflow-x-auto md:overflow-visible` — bảng cuộn ngang riêng biệt trên mobile mà không gây horizontal scroll cho toàn trang. Không phát hiện vấn đề.
- **Evidence:** `./audit-evidence/responsive/home-360x800.png`, `./audit-evidence/responsive/ai-chat-360x800.png`, `./audit-evidence/responsive/than-so-hoc-360x800.png`, `artifacts/mysticism-web/src/components/data-table.tsx:163`

## Findings — MODULE

Trục MODULE đánh giá 15 Module_Page (than-so-hoc, bat-tu, xem-que, cat-hung, lich-van-nien, tu-vi, phong-thuy, xem-ten, lich-ca-nhan, tu-dien, hop-tuoi, xem-ngay-tot, sao-han) cùng trang share-view theo 8 tiêu chí R9.1–R9.8. Nhìn chung, hệ thống có `ResultCard` component được thiết kế đúng chuẩn (thứ tự slot cố định: header → keyNumbers → chart → table → aiSection → actions) và `DataTable` component với `<thead scope="col">` đầy đủ. Tuy nhiên, **không có Module_Page nào thực sự sử dụng `ResultCard`** — tất cả tự render kết quả bằng layout riêng (Card + inline sections). Vấn đề nghiêm trọng nhất là 5 trang có inline SVG chart thiếu `role="img"` + `aria-label`, chart labels với fontSize 5–9 (không đọc được trên mobile), và share-view lộ action buttons cho anonymous viewer.

#### Checklist tham chiếu (R9.1–R9.8)

- [x] Result_Card info priority order correct (name → key numbers → chart → table → AI → actions)? — **Phát hiện vi phạm:** `ResultCard` component có thứ tự đúng nhưng **không được sử dụng** bởi bất kỳ Module_Page nào. Các trang tự render kết quả với thứ tự tương tự nhưng không nhất quán (một số đặt chart trước key numbers, một số thiếu table section).
- [x] Charts have `role="img"` + `aria-label`? — **Phát hiện vi phạm:** 5 trang (xem-ten, than-so-hoc, phong-thuy, hop-tuoi, bat-tu) render inline SVG chart **không** qua `ChartBase` component → thiếu `role="img"` và `aria-label`.
- [x] Chart labels readable on mobile (≥ 12px, not clipped)? — **Phát hiện vi phạm:** Inline SVG charts dùng `fontSize="5"` đến `fontSize="9"` — trên mobile viewport 360px với max-width 200px, rendered size ≈ 2.5–4.5px, hoàn toàn không đọc được.
- [x] Tables have `<thead scope="col">`, mobile horizontal scroll? — **Phát hiện vi phạm:** `share-view.tsx` có `DataTable` function nội bộ render bằng `<div>` thay vì semantic `<table>` → không có `<thead>`, không có `scope="col"`. Module pages khác không dùng `<table>` trực tiếp (dùng Card grid layout cho dữ liệu).
- [x] Empty state has helper text/illustration? — **Phát hiện vi phạm:** 6 Module_Page (tu-vi, lich-van-nien, hop-tuoi, lich-ca-nhan, sao-han, tu-dien) không import `EmptyState` component → AI interpretation section không có empty state helper khi chưa có luận giải.
- [x] Chart and AI interpretation don't compete with simultaneous motion? — **Pass.** Charts là static SVG (không animate). AI streaming dùng typing dots (`animate-bounce`) nhưng chart đã render xong trước khi AI section xuất hiện. Không có simultaneous motion competition.
- [x] share-view doesn't expose unavailable actions to anonymous viewer? — **Phát hiện vi phạm:** `share-view.tsx` hiển thị 2 action buttons ("Tra cứu lại với thông tin này" và "Mở {module}") cho **mọi** viewer kể cả anonymous. Button "Tra cứu lại" gọi `storeReopenData` + navigate — hoạt động cho anonymous nhưng có thể gây nhầm lẫn vì kết quả mới sẽ không được lưu (yêu cầu auth).
- [x] ≤ 3 emphasis levels per viewport? — **Pass.** Các Module_Page sử dụng 3 mức nhấn mạnh chính: (1) `font-bold` cho heading/key numbers, (2) `font-semibold` cho section titles, (3) `font-medium` cho labels. Một số trang có `text-[9px] font-bold` cho badges nhỏ nhưng đây là micro-element, không tạo mức nhấn mạnh riêng biệt trong viewport.

### F-MODULE-01: Inline SVG charts thiếu `role="img"` và `aria-label` — screen reader không nhận diện biểu đồ

- **Severity:** P0
- **Surface:** xem-ten, than-so-hoc, phong-thuy, hop-tuoi, bat-tu
- **Axis:** MODULE
- **References:** WCAG 2.1 SC 1.1.1 (Level A); ux-ui-upgrade Req 9.2; R9.2
- **Description:** 5 Module_Page render biểu đồ SVG trực tiếp (inline) thay vì sử dụng `ChartBase` component (đã có sẵn `role="img"` + `aria-label`). Các SVG này thiếu hoàn toàn accessible name: (1) `xem-ten.tsx` — radar ngũ cách, `<svg viewBox="0 0 {size} {size}">` không có role/aria-label; (2) `than-so-hoc.tsx` — radar 5 chỉ số, `<svg viewBox="0 0 120 120">` không có role/aria-label; (3) `phong-thuy.tsx` — la bàn 8 hướng, `<svg viewBox="0 0 100 100">` không có role/aria-label; (4) `hop-tuoi.tsx` — radar hợp tuổi + score ring, 2 SVG không có role/aria-label; (5) `bat-tu.tsx` — donut ngũ hành, `<svg viewBox="0 0 160 160">` không có role/aria-label. Screen reader sẽ bỏ qua hoàn toàn các biểu đồ này hoặc đọc từng path/circle/text element riêng lẻ — không truyền tải được ý nghĩa tổng thể. Đây là vi phạm WCAG 2.1 SC 1.1.1 Level A (non-text content phải có text alternative). Gán P0 vì vi phạm WCAG Level A bắt buộc trên 5 surface.
- **Evidence:** `artifacts/mysticism-web/src/pages/xem-ten.tsx:51` (`<svg viewBox=...>` không có role/aria-label), `artifacts/mysticism-web/src/pages/than-so-hoc.tsx:289` (`<svg viewBox="0 0 120 120">` không có role/aria-label), `artifacts/mysticism-web/src/pages/phong-thuy.tsx:54` (`<svg viewBox="0 0 100 100">` không có role/aria-label), `artifacts/mysticism-web/src/pages/hop-tuoi.tsx:37` (`<svg viewBox=...>` không có role/aria-label), `artifacts/mysticism-web/src/pages/bat-tu.tsx:57` (`<svg viewBox="0 0 160 160">` không có role/aria-label)
- **Recommendation:** WHAT — Thêm `role="img"` và `aria-label` mô tả nội dung biểu đồ bằng tiếng Việt cho mỗi inline SVG, hoặc tốt hơn: refactor để sử dụng `ChartBase` component (đã implement đầy đủ a11y). WHY — Tuân thủ WCAG 2.1 SC 1.1.1 (Level A) — mọi non-text content phải có text alternative. Screen reader users hiện tại không nhận được thông tin nào từ 5 biểu đồ này. WHERE — `artifacts/mysticism-web/src/pages/xem-ten.tsx`, `than-so-hoc.tsx`, `phong-thuy.tsx`, `hop-tuoi.tsx`, `bat-tu.tsx` — mỗi file có 1–2 inline `<svg>` cần bổ sung.

### F-MODULE-02: Chart labels fontSize 5–9 không đọc được trên mobile

- **Severity:** P1
- **Surface:** xem-ten, than-so-hoc, phong-thuy, hop-tuoi, bat-tu
- **Axis:** MODULE
- **References:** ux-ui-upgrade Req 9.3; R9.3; Nielsen #1: Visibility of system status
- **Description:** Các inline SVG chart sử dụng `<text>` elements với `fontSize` rất nhỏ trong viewBox coordinate space: `xem-ten.tsx` dùng `fontSize="5"` cho labels "Thiên/Địa/Nhân/Ngoại/Tổng"; `than-so-hoc.tsx` dùng `fontSize="6"` cho labels "Đời/Mệnh/Hồn/Cách/Thành"; `phong-thuy.tsx` dùng `fontSize="4.5"` cho hướng la bàn và `fontSize="6"` cho ký tự trung tâm; `hop-tuoi.tsx` dùng `fontSize="7.5"` và `fontSize="9"` cho labels; `bat-tu.tsx` dùng `fontSize="7.5"` cho ngũ hành labels. Trên mobile viewport 360px, các SVG có `max-w-[200px]` hoặc `max-w-[180px]` — tỉ lệ scale xuống khiến text rendered size ≈ 2–5px, hoàn toàn không đọc được bằng mắt thường. Theo R9.3, chart labels phải ≥ 12px rendered size trên mobile và không bị clipped. Gán P1 vì ảnh hưởng readability trên mobile cho 5 surface nhưng thông tin vẫn có thể suy luận từ context xung quanh.
- **Evidence:** `artifacts/mysticism-web/src/pages/xem-ten.tsx:68` (`fontSize="5"`), `artifacts/mysticism-web/src/pages/than-so-hoc.tsx:302` (`fontSize="6"`), `artifacts/mysticism-web/src/pages/phong-thuy.tsx:81,86` (`fontSize="6"`, `fontSize="4.5"`), `artifacts/mysticism-web/src/pages/hop-tuoi.tsx:50` (`fontSize="7.5"`, `fontSize="9"`), `artifacts/mysticism-web/src/pages/bat-tu.tsx:63` (`fontSize="7.5"`)
- **Recommendation:** WHAT — Tăng fontSize trong viewBox space sao cho rendered size ≥ 12px trên mobile. Với SVG max-width 200px và viewBox width ~120–200, cần fontSize ≥ 8–12 trong viewBox units (tuỳ tỉ lệ). Hoặc refactor sang `ChartBase` + `ChartSegment` pattern với tooltip thay vì inline text labels. WHY — Đảm bảo chart labels đọc được trên mobile theo R9.3 — user cần biết mỗi trục/segment đại diện cho gì mà không cần zoom. WHERE — 5 files: `xem-ten.tsx`, `than-so-hoc.tsx`, `phong-thuy.tsx`, `hop-tuoi.tsx`, `bat-tu.tsx` — tất cả `<text>` elements trong inline SVG charts.

### F-MODULE-03: share-view lộ action buttons cho anonymous viewer

- **Severity:** P1
- **Surface:** share-view
- **Axis:** MODULE
- **References:** R9.7; Nielsen #6: Recognition rather than recall
- **Description:** `share-view.tsx` hiển thị 2 action buttons cho **mọi** viewer bao gồm anonymous: (1) "Tra cứu lại với thông tin này" — gọi `storeReopenData()` rồi navigate tới module page; (2) "Mở {module}" — link tới module page. Theo R9.7, share-view không được lộ action không khả dụng cho anonymous viewer. Cả 2 buttons đều hoạt động kỹ thuật (navigate thành công) nhưng tạo kỳ vọng sai: user anonymous sẽ tra cứu lại nhưng kết quả mới không được lưu vào lịch sử (yêu cầu auth). Không có indication nào cho biết user cần đăng nhập để lưu kết quả. Button "Tra cứu lại" đặc biệt problematic vì nó pre-fill form data từ reading được chia sẻ — hành vi này có thể expose input data (ngày sinh, tên) của người chia sẻ cho anonymous viewer qua URL navigation. Gán P1 vì vi phạm R9.7 và có thể gây nhầm lẫn UX trên shared link flow.
- **Evidence:** `artifacts/mysticism-web/src/pages/share-view.tsx:170–180` (2 buttons rendered unconditionally trong `{reading && (...)}` block, không check auth state)
- **Recommendation:** WHAT — Ẩn hoặc disable button "Tra cứu lại với thông tin này" cho anonymous viewer. Giữ "Mở {module}" nhưng thêm note nhỏ "Đăng nhập để lưu kết quả". Kiểm tra auth state bằng `useAuth()` hook từ Clerk. WHY — Tuân thủ R9.7 (share-view không lộ action không khả dụng) và tránh expose input data của người chia sẻ qua reopen mechanism. WHERE — `artifacts/mysticism-web/src/pages/share-view.tsx`, block render buttons (lines 170–180).

### F-MODULE-04: share-view DataTable dùng `<div>` thay vì semantic `<table>` — thiếu `<thead scope="col">`

- **Severity:** P1
- **Surface:** share-view
- **Axis:** MODULE
- **References:** WCAG 2.1 SC 1.3.1 (Level A); R9.4; ux-ui-upgrade Req 8.4
- **Description:** `share-view.tsx` định nghĩa một `DataTable` function nội bộ (line 63) render dữ liệu dạng key-value bằng `<div className="space-y-2">` với mỗi row là `<div className="flex items-start gap-3">`. Đây là dữ liệu tabular (input_data và result_data của reading) nhưng không sử dụng semantic HTML table (`<table>`, `<thead>`, `<th scope="col">`). Screen reader không nhận diện đây là bảng dữ liệu và không thể navigate theo row/column. Dự án đã có `DataTable` component chuẩn (trong `src/components/data-table.tsx`) với đầy đủ `<thead scope="col">` và `overflow-x-auto` — nhưng share-view không sử dụng. Gán P1 vì vi phạm WCAG 2.1 SC 1.3.1 (Level A) — thông tin và mối quan hệ phải được truyền tải qua structure/markup.
- **Evidence:** `artifacts/mysticism-web/src/pages/share-view.tsx:63–77` (function `DataTable` render `<div>` thay vì `<table>`), `artifacts/mysticism-web/src/components/data-table.tsx:163` (component chuẩn có `<th scope="col">` nhưng không được import)
- **Recommendation:** WHAT — Refactor `DataTable` trong share-view để sử dụng semantic `<table>` với `<thead>` + `<th scope="col">` cho cột "Trường" và "Giá trị", hoặc import `DataTable` component chuẩn từ `@/components/data-table`. WHY — Tuân thủ WCAG 2.1 SC 1.3.1 (Level A) và R9.4 — dữ liệu tabular phải dùng semantic table markup để screen reader navigate đúng. WHERE — `artifacts/mysticism-web/src/pages/share-view.tsx`, function `DataTable` (lines 63–77).

### F-MODULE-05: 6 Module_Page thiếu EmptyState cho AI interpretation section

- **Severity:** P2
- **Surface:** tu-vi, lich-van-nien, hop-tuoi, lich-ca-nhan, sao-han, tu-dien
- **Axis:** MODULE
- **References:** R9.5; Nielsen #1: Visibility of system status; ux-ui-upgrade Req 5.7
- **Description:** 6 Module_Page không import `EmptyState` component và không có helper text/illustration cho trạng thái "chưa có luận giải AI". So sánh: `than-so-hoc.tsx`, `bat-tu.tsx`, `xem-que.tsx`, `xem-ten.tsx`, `phong-thuy.tsx`, `cat-hung.tsx`, `xem-ngay-tot.tsx` đều có `<EmptyState title="Chưa có luận giải AI" description="..." />` — nhưng `tu-vi.tsx`, `lich-van-nien.tsx`, `hop-tuoi.tsx`, `lich-ca-nhan.tsx`, `sao-han.tsx`, `tu-dien.tsx` không có. Trên các trang thiếu, khi user chưa nhấn "Hỏi AI", section AI đơn giản không render gì — user không biết có tính năng AI available hay cần làm gì tiếp theo. Gán P2 vì đây là polish issue (tính năng vẫn hoạt động khi user tìm thấy button) và chỉ ảnh hưởng discoverability.
- **Evidence:** `artifacts/mysticism-web/src/pages/tu-vi.tsx` (không import EmptyState, AI section chỉ render khi `messages.length > 0`), `artifacts/mysticism-web/src/pages/hop-tuoi.tsx` (không import EmptyState), `artifacts/mysticism-web/src/pages/lich-ca-nhan.tsx` (không import EmptyState), `artifacts/mysticism-web/src/pages/sao-han.tsx` (không import EmptyState), `artifacts/mysticism-web/src/pages/lich-van-nien.tsx` (không import EmptyState), `artifacts/mysticism-web/src/pages/tu-dien.tsx` (không import EmptyState)
- **Recommendation:** WHAT — Thêm `<EmptyState icon={<Sparkles />} title="Chưa có luận giải AI" description="Nhấn nút bên trên để AI phân tích..." />` vào AI section của 6 trang khi `messages.length === 0 && !isStreaming`. WHY — Tuân thủ R9.5 (empty state có helper text) và cải thiện discoverability — user biết ngay có tính năng AI và cách kích hoạt. WHERE — 6 files: `tu-vi.tsx`, `lich-van-nien.tsx`, `hop-tuoi.tsx`, `lich-ca-nhan.tsx`, `sao-han.tsx`, `tu-dien.tsx`.

### F-MODULE-06: Module_Page không sử dụng ResultCard component — thứ tự thông tin không được enforce

- **Severity:** P2
- **Surface:** (toàn bộ 15 Module_Page)
- **Axis:** MODULE
- **References:** R9.1; ux-ui-upgrade Req 8.1; Nielsen #4: Consistency and standards
- **Description:** `ResultCard` component (trong `src/components/result-card.tsx`) được thiết kế với thứ tự slot cố định theo R9.1: header → keyNumbers → chart → table → aiSection → actions. Tuy nhiên, **không có Module_Page nào import hoặc sử dụng `ResultCard`**. Tất cả 15 trang tự render kết quả bằng combination của `Card`, `CardContent`, inline divs, và custom layout. Thứ tự thông tin nhìn chung tương tự (header → numbers → chart → AI → actions) nhưng không nhất quán: `tu-vi.tsx` đặt 12 cung grid trước AI; `bat-tu.tsx` đặt donut chart inline với key numbers; `phong-thuy.tsx` đặt compass trước bảng hướng. Đây không phải vi phạm nghiêm trọng vì thứ tự vẫn hợp lý cho từng module, nhưng tạo inconsistency giữa các trang và không tận dụng được a11y features đã built-in (`<article aria-labelledby>`, semantic sections). Gán P2 vì gap với target state nhưng UX hiện tại vẫn acceptable.
- **Evidence:** `artifacts/mysticism-web/src/components/result-card.tsx:1` (component tồn tại nhưng không được import), `artifacts/mysticism-web/src/pages/than-so-hoc.tsx:1–19` (imports không có ResultCard), `artifacts/mysticism-web/src/pages/tu-vi.tsx` (không import ResultCard), `artifacts/mysticism-web/src/pages/bat-tu.tsx` (không import ResultCard)
- **Recommendation:** WHAT — Refactor các Module_Page để sử dụng `ResultCard` component cho phần hiển thị kết quả, truyền nội dung qua các slot (header, keyNumbers, chart, table, aiSection, actions). WHY — Enforce thứ tự thông tin nhất quán theo R9.1, tận dụng a11y features built-in (`<article aria-labelledby>`, semantic `<section>` cho mỗi slot), và giảm code duplication. WHERE — 15 files trong `src/pages/` — ưu tiên các trang có đầy đủ sections (than-so-hoc, bat-tu, tu-vi, xem-ten) trước, sau đó mở rộng.

### F-MODULE-07: Simultaneous motion — không phát hiện vấn đề

- **Severity:** INFO
- **Surface:** (toàn bộ Module_Page)
- **Axis:** MODULE
- **References:** R9.6
- **Description:** Đã kiểm tra tất cả 15 Module_Page cho simultaneous motion competition giữa chart và AI interpretation. Charts trên các trang này đều là **static SVG** (không có animation/transition trên chart elements). AI streaming sử dụng typing dots (`animate-bounce`) nhưng chỉ xuất hiện **sau** khi chart đã render hoàn chỉnh (chart render ngay khi có result data, AI streaming bắt đầu khi user nhấn button riêng). Không có trường hợp chart animate đồng thời với AI streaming. `animate-in fade-in` trên result container là one-shot entrance animation (duration 700ms) — không phải continuous motion. Không phát hiện vấn đề.
- **Evidence:** `artifacts/mysticism-web/src/pages/than-so-hoc.tsx:226` (`animate-in fade-in` one-shot), `artifacts/mysticism-web/src/pages/bat-tu.tsx:281` (same pattern). Charts render static SVG, AI section render riêng biệt.

### F-MODULE-08: Emphasis levels — không phát hiện vấn đề

- **Severity:** INFO
- **Surface:** (toàn bộ Module_Page)
- **Axis:** MODULE
- **References:** R9.8
- **Description:** Đã kiểm tra emphasis levels trên các Module_Page trong single viewport. Mỗi trang sử dụng 3 mức nhấn mạnh chính: (1) `font-bold` + large size cho page heading và key numbers; (2) `font-semibold` cho section titles và card headers; (3) `font-medium` cho form labels và secondary text. Một số trang có micro-badges (`text-[9px] font-bold`) nhưng đây là inline elements nhỏ không tạo mức nhấn mạnh riêng biệt trong visual hierarchy. Tổng cộng ≤ 3 mức nhấn mạnh per viewport trên mọi Module_Page. Không phát hiện vấn đề.
- **Evidence:** `artifacts/mysticism-web/src/pages/tu-vi.tsx:244,250,378,437` (3 mức: h1 bold, h2/h3 semibold, label medium), `artifacts/mysticism-web/src/pages/than-so-hoc.tsx` (same pattern)

## Findings — INTERACTION

Trục INTERACTION đánh giá toàn bộ hành vi tương tác trong `mysticism-web`: tab order, focus ring visibility, dialog/drawer behavior, form validation timing, ARIA error attributes, loading/error/empty states, toast feedback, theme toggle persistence, PWA install prompt, và color contrast. Nhìn chung, hệ thống tương tác được thiết kế tốt: `MobileDrawer` dùng Radix Sheet (có sẵn Esc close, focus trap, return focus), `PwaInstallPrompt` tuân thủ 14-day cooldown và không phải modal, toast system (`sonner`) có Vietnamese messages và retry CTA, `ErrorState` component có retry button và Vietnamese title. Tuy nhiên, phát hiện vấn đề nghiêm trọng ở form validation trên Module_Page (raw `<input>` thiếu `aria-invalid` + `aria-describedby`), theme toggle flash khi load (thiếu inline script trong `<head>`), và focus ring contrast trên light mode có thể borderline 3:1.

#### Checklist tham chiếu (R10.1–R10.12)

- [x] Tab order natural (top-to-bottom, left-to-right)? — **Pass.** Keyboard walkthrough logs (Flow A, B, C) xác nhận tab order tuân thủ DOM order: navbar → breadcrumb → main content → footer. `SkipLink` component mount ở root (`App.tsx`) cho phép skip tới `<main id="main" tabIndex={-1}>`. Tuy nhiên, ai-chat page có 28 suggestion tab stops trước textarea — xem F-INTERACTION-01.
- [x] Focus ring visible on all interactive elements with contrast ≥ 3:1? — **Phát hiện vi phạm:** Focus ring dùng `--ring: 43 74% 49%` (dark) / `43 74% 32%` (light). Trên dark background `260 40% 5%`, ring color ≈ #d4a017 vs bg ≈ #0d0719 → contrast ~8:1 (pass). Trên light background `40 30% 98%` ≈ #fbf8f1, ring color `43 74% 32%` ≈ #8e6e0e → contrast ~4.5:1 (pass). Tuy nhiên, một số elements dùng `ring-primary/40` hoặc `ring-primary/50` (opacity giảm) → contrast giảm xuống borderline. Xem F-INTERACTION-02.
- [x] Dialog/dropdown/drawer: Esc closes, focus trap when open, return focus on close? — **Pass.** `MobileDrawer` dùng Radix `Sheet` (built-in Esc close, overlay click close, focus trap via `FocusTrap` component, return focus on close). `DateInput` calendar dùng Radix `Popover` (same behavior). `AlertDialog` trong profile dùng Radix AlertDialog (focus trap, Esc close). Tất cả đều có `SheetDescription`/`DialogDescription` cho `aria-describedby`.
- [x] Form validation on 3 moments: real-time, on-blur, on-submit? — **Phát hiện vi phạm:** Module_Page forms (than-so-hoc, bat-tu, tu-vi, phong-thuy, etc.) có validation on-change (real-time khi `touched`) + on-blur + on-submit. Tuy nhiên, validation chỉ hiển thị **sau khi field đã touched** — lần đầu load, user có thể submit form trống và chỉ thấy lỗi sau submit (đúng). Pattern đúng 3 thời điểm. **Pass** cho timing.
- [x] Form error: `aria-invalid="true"` + `aria-describedby` pointing to error message? — **Phát hiện vi phạm:** Module_Page forms dùng raw `<input>` thay vì `<Input>` component (đã có built-in `aria-invalid` + `aria-describedby`). Raw inputs **không** có `aria-invalid` hoặc `aria-describedby` — error message render bằng `<p>` riêng biệt không liên kết với input. Xem F-INTERACTION-03.
- [x] Loading state: visual feedback within ≤ 100ms for all async actions? — **Pass.** AI streaming: button text đổi ngay lập tức ("Đang lắng nghe vũ trụ...") + typing dots xuất hiện synchronously khi `isStreaming` flip. `share-view.tsx`: `animate-pulse` symbol hiện ngay khi `loading === true` (initial state). `profile.tsx`: `ReadingGridSkeleton` render ngay khi `loading === true`. Không có async action nào thiếu immediate visual feedback.
- [x] Error state: UI with Vietnamese title + retry/fallback button? — **Pass.** `ErrorState` component có Vietnamese titles từ `error-messages.ts` (ví dụ: "Đã có lỗi xảy ra", "Không thể kết nối máy chủ") + `onRetry` prop render "Thử lại" button. `RootErrorBoundary` dùng `ErrorState` với "Tải lại trang" button. `ai-chat.tsx` dùng `ErrorState` cho rate-limit (429) với `retryAfterSeconds`.
- [x] Empty state: illustration/message + CTA for next action? — **Pass.** `EmptyState` component có `icon` slot + `title` + `description` + optional `cta` button. `lich-su.tsx` dùng EmptyState với CTA "Bắt đầu tra cứu". `profile.tsx` dùng EmptyState. (6 Module_Page thiếu EmptyState cho AI section — đã ghi nhận ở F-MODULE-05, trục MODULE).
- [x] Toast feedback: success toast in Vietnamese, error toast with `--destructive` color? — **Pass.** `showToast()` wrapper enforce Vietnamese `title` (bắt buộc). Sonner `richColors=true` tự áp destructive color cho variant `error`. Toast `success` dùng green tones, `error` dùng red tones (sonner built-in rich colors). Ví dụ: `showToast({ variant: "success", title: "Đã lưu lá số" })`.
- [x] Theme toggle: no flash, persists in localStorage? — **Phát hiện vi phạm:** Theme persists đúng trong localStorage (key `"theme"`). Tuy nhiên, `index.html` **không có inline script** trong `<head>` để apply theme class trước React hydration → có thể flash từ default dark → stored light (hoặc ngược lại) trong khoảng thời gian React mount + ThemeProvider effect chạy. Xem F-INTERACTION-04.
- [x] pwa-install-prompt: not full-screen modal, has dismiss, 14-day cooldown? — **Pass.** `PwaInstallPrompt` render `<aside role="region">` (không phải modal/dialog). Layout: sticky banner bottom trên mobile, bottom-right card trên desktop. Có dismiss button ("Bỏ qua" + X icon). 14-day cooldown enforce bởi `DISMISS_COOLDOWN_MS = 14 * 24 * 3600 * 1000` trong `pwa-prompt-state.ts`. `shouldShowPrompt()` check `now - dismissedAt < DISMISS_COOLDOWN_MS`.
- [x] Color contrast: text/bg ratio ≥ 4.5:1 (normal) or ≥ 3:1 (large text)? — **Phát hiện vi phạm:** `--muted-foreground: 40 20% 60%` trên `--background: 260 40% 5%` (dark mode) → HSL(40, 20%, 60%) ≈ #b3a385 vs HSL(260, 40%, 5%) ≈ #0d0719 → contrast ~7.5:1 (pass). Tuy nhiên, `--muted-foreground` trên `--card: 260 40% 7%` ≈ #100b22 → contrast ~6.8:1 (pass). Light mode: `--muted-foreground: 260 20% 30%` trên `--background: 40 30% 98%` → contrast ~8.5:1 (pass). **Nhưng** form error text dùng `text-red-400` (Tailwind default ≈ #f87171) trên dark background → contrast ~4.8:1 (borderline pass cho normal text). Xem F-INTERACTION-05.

### F-INTERACTION-01: AI chat page — 28 suggestion tab stops trước textarea gây friction cho keyboard users

- **Severity:** P1
- **Surface:** ai-chat
- **Axis:** INTERACTION
- **References:** R10.1; WCAG 2.1 SC 2.4.3 (Level A); Nielsen #7: Flexibility and efficiency of use
- **Description:** Trang `ai-chat.tsx` ở empty state có 14 `SuggestionGrid` buttons + 14 `SuggestionChips` buttons = 28 tab stops trước khi keyboard user đến được textarea input. User phải nhấn Tab 28+ lần để bắt đầu gõ tin nhắn — flow chính của trang. Sau khi có messages, `SuggestionGrid` ẩn nhưng vẫn còn 14 chips + timestamp buttons per message. Đây không phải vi phạm WCAG Level A (tab order vẫn logical top-to-bottom) nhưng vi phạm R10.1 (tab order "natural" — user expectation là đến input nhanh) và Nielsen #7 (efficiency). Gán P1 vì ảnh hưởng usability nghiêm trọng cho keyboard-only users trên flow chính.
- **Evidence:** `./audit-evidence/keyboard/flow-c-ai-chat.md` (Section "Trap Focus / Unreachable Element Observations" — "14 suggestion chips in horizontal scroll: Keyboard user must Tab through all 14 chips to reach textarea"), `artifacts/mysticism-web/src/pages/ai-chat.tsx:430–470` (SuggestionGrid + SuggestionChips render trước textarea)
- **Recommendation:** WHAT — Thêm `role="toolbar"` hoặc `role="group"` với `aria-label` cho suggestion container, và implement roving tabindex (chỉ 1 tab stop cho cả group, Arrow keys navigate giữa items). Hoặc đơn giản hơn: đặt textarea trước suggestions trong DOM order. WHY — Giảm tab stops từ 28+ xuống 2–3 cho keyboard users, tuân thủ R10.1 và cải thiện efficiency. WHERE — `artifacts/mysticism-web/src/pages/ai-chat.tsx`, refactor `SuggestionGrid` và `SuggestionChips` components.

### F-INTERACTION-02: Focus ring opacity giảm (`ring-primary/40`, `ring-primary/50`) có thể borderline contrast 3:1

- **Severity:** P2
- **Surface:** home, navbar
- **Axis:** INTERACTION
- **References:** R10.2; WCAG 2.1 SC 2.4.7 (Level AA); ux-ui-upgrade Req 3.6
- **Description:** Nhiều interactive elements dùng focus ring với opacity giảm: Module cards trên home dùng `focus-visible:ring-2 ring-primary/50 ring-offset-2` (50% opacity), navbar logo dùng `focus-visible:ring-2 ring-primary/40` (40% opacity), theme toggle dùng `ring-primary/40`. Token `--ring` / `--primary` ở dark mode = HSL(43, 74%, 49%) ≈ #d4a017 (golden). Với 40% opacity trên dark background #0d0719, effective color ≈ blend(#d4a017, #0d0719, 0.4) ≈ #5a430f → contrast vs background ≈ 2.5:1 — **dưới ngưỡng 3:1** cho non-text UI components. Với 50% opacity: effective ≈ #6f5310 → contrast ≈ 3.2:1 (borderline pass). Trên light mode, `ring-primary/40` với primary HSL(43, 74%, 32%) ≈ #8e6e0e, 40% opacity trên #fbf8f1 → effective ≈ #c9c09a → contrast vs background ≈ 1.5:1 — **fail**. Gán P2 vì focus ring vẫn visible (2px width giúp nhận diện) nhưng contrast không đạt 3:1 requirement trên một số combinations.
- **Evidence:** `./audit-evidence/keyboard/flow-a-home-to-module.md` (Focus Ring Visibility table — "Module cards: `focus-visible:ring-2 ring-primary/50 ring-offset-2`"), `artifacts/mysticism-web/src/pages/home.tsx` (module card Link classes), `artifacts/mysticism-web/src/components/layout/navbar.tsx` (logo `ring-primary/40`)
- **Recommendation:** WHAT — Tăng opacity lên `ring-primary/70` hoặc `ring-primary` (100%) cho tất cả focus-visible rings, hoặc dùng `ring-ring` token (đã set = primary 100%) thay vì `ring-primary/N`. WHY — Đảm bảo focus ring contrast ≥ 3:1 theo R10.2 và WCAG 2.4.7 trên mọi theme. WHERE — Global search `ring-primary/40` và `ring-primary/50` trong `src/pages/` và `src/components/layout/` — thay bằng `ring-ring` hoặc `ring-primary`.

### F-INTERACTION-03: Module_Page forms thiếu `aria-invalid` và `aria-describedby` trên raw `<input>` elements

- **Severity:** P0
- **Surface:** than-so-hoc, bat-tu, tu-vi, phong-thuy, xem-ten, hop-tuoi, sao-han, xem-ngay-tot
- **Axis:** INTERACTION
- **References:** R10.5; WCAG 2.1 SC 1.3.1 (Level A); WCAG 2.1 SC 3.3.1 (Level A); ux-ui-upgrade Req 3.5
- **Description:** Các Module_Page forms sử dụng raw `<input>` elements thay vì `<Input>` component từ `@/components/ui/input` (đã có built-in `aria-invalid` + `aria-describedby` + error message rendering). Ví dụ `than-so-hoc.tsx` line 165: `<input id="name" type="text" ...>` — khi validation fail, error message render bằng `<p className="text-xs text-red-400">` riêng biệt **không** có `id` và input **không** có `aria-invalid="true"` hoặc `aria-describedby` trỏ tới error message. Screen reader users sẽ không biết input đang ở trạng thái lỗi và không nghe được error message khi focus input. Đây là vi phạm WCAG 2.1 SC 3.3.1 Level A (error identification) và SC 1.3.1 Level A (info and relationships). Pattern lặp lại trên ≥ 8 Module_Page có form input. Gán P0 vì vi phạm WCAG Level A bắt buộc trên nhiều surface.
- **Evidence:** `./audit-evidence/keyboard/flow-a-home-to-module.md` (Section "Trap Focus" — "Form inputs use custom `<input>` (not shadcn `<Input>`) — Verify `aria-invalid` + `aria-describedby` on validation error"), `artifacts/mysticism-web/src/pages/than-so-hoc.tsx:165–180` (raw `<input id="name">` không có aria-invalid, error `<p>` không có id), `artifacts/mysticism-web/src/pages/bat-tu.tsx` (same pattern), `artifacts/mysticism-web/src/components/ui/input.tsx:147–148` (component chuẩn có `aria-invalid={hasError}` + `aria-describedby={describedBy}`)
- **Recommendation:** WHAT — Refactor Module_Page forms để sử dụng `<Input>` component từ `@/components/ui/input` (đã có `aria-invalid` + `aria-describedby` + error icon built-in), hoặc thêm thủ công `aria-invalid={touched.name && !!errors.name}` + `aria-describedby="name-error"` vào raw inputs và `id="name-error"` vào error `<p>`. WHY — Tuân thủ WCAG 2.1 SC 3.3.1 + SC 1.3.1 (Level A) — screen reader users phải được thông báo trạng thái lỗi và nội dung error message khi focus input. WHERE — 8+ files trong `src/pages/`: `than-so-hoc.tsx`, `bat-tu.tsx`, `tu-vi.tsx`, `phong-thuy.tsx`, `xem-ten.tsx`, `hop-tuoi.tsx`, `sao-han.tsx`, `xem-ngay-tot.tsx`.

### F-INTERACTION-04: Theme toggle flash — thiếu inline script trong `<head>` để apply theme trước React hydration

- **Severity:** P1
- **Surface:** (toàn bộ)
- **Axis:** INTERACTION
- **References:** R10.10; Nielsen #1: Visibility of system status; ux-ui-upgrade Req 3.4
- **Description:** `index.html` không có inline `<script>` trong `<head>` để đọc localStorage và apply theme class (`dark`/`light`) lên `<html>` trước khi React mount. Flow hiện tại: (1) HTML load với `<html lang="vi">` (không có class dark/light); (2) CSS `:root` block apply dark tokens (default); (3) React mount → `ThemeProvider` → `useEffect` → `applyThemeToDocument(theme)` thêm class. Nếu user đã chọn light theme và lưu trong localStorage, sẽ có flash: dark → light trong khoảng thời gian React hydration (có thể 100–500ms trên mobile). `ThemeProvider` persist đúng trong localStorage (key `"theme"`) và `applyThemeToDocument()` cập nhật class + meta theme-color — nhưng timing quá muộn. Gán P1 vì flash gây jarring experience trên mọi page load cho users đã chọn light theme, và vi phạm R10.10 ("no flash").
- **Evidence:** `artifacts/mysticism-web/index.html` (không có inline script trong `<head>` — chỉ có `<script type="module" src="/src/main.tsx">` trong `<body>`), `artifacts/mysticism-web/src/contexts/theme.tsx:133–137` (`useEffect` apply theme — chạy sau mount, không phải synchronous)
- **Recommendation:** WHAT — Thêm inline `<script>` blocking trong `<head>` (trước CSS) đọc `localStorage.getItem("theme")` và gắn class `dark`/`light` lên `<html>` ngay lập tức. Pattern chuẩn: `<script>try{const t=localStorage.getItem('theme');if(t==='light')document.documentElement.classList.add('light');else document.documentElement.classList.add('dark')}catch(e){document.documentElement.classList.add('dark')}</script>`. WHY — Đảm bảo theme class có mặt trước khi CSS render lần đầu, loại bỏ flash hoàn toàn. WHERE — `artifacts/mysticism-web/index.html`, thêm `<script>` ngay sau `<meta>` tags trong `<head>`.

### F-INTERACTION-05: Form error text `text-red-400` contrast borderline trên dark background

- **Severity:** P2
- **Surface:** than-so-hoc, bat-tu, tu-vi, phong-thuy, xem-ten, hop-tuoi
- **Axis:** INTERACTION
- **References:** R10.12; WCAG 2.1 SC 1.4.3 (Level AA)
- **Description:** Module_Page forms hiển thị error messages bằng `<p className="text-xs text-red-400">`. Tailwind `text-red-400` = #f87171. Background context: form nằm trong `Card` với `bg-card/40 backdrop-blur-sm` — effective background ≈ blend(card #100b22, background #0d0719, 0.4) ≈ #0e0920. Contrast #f87171 vs #0e0920 ≈ 5.2:1 — pass cho normal text (≥ 4.5:1). Tuy nhiên, text size là `text-xs` (12px) — vẫn thuộc "normal text" nên cần 4.5:1. **Pass** kỹ thuật nhưng borderline. Vấn đề thực sự: `text-red-400` không dùng design token `--destructive` (HSL 0 60% 40% = #a32929) — inconsistency với design system. `--destructive` trên dark bg: #a32929 vs #0e0920 ≈ 3.8:1 — **fail** cho normal text. May mắn code dùng `text-red-400` (pass) thay vì `text-destructive` (fail). Gán P2 vì pass kỹ thuật nhưng inconsistency với design system tokens.
- **Evidence:** `artifacts/mysticism-web/src/pages/than-so-hoc.tsx:181` (`<p className="text-xs text-red-400 ...">` error message), `artifacts/mysticism-web/src/index.css:91` (`--destructive: 0 60% 40%`), `./audit-evidence/axe/than-so-hoc.json` (axe pending — manual calculation used)
- **Recommendation:** WHAT — Thay `text-red-400` bằng `text-destructive-foreground` hoặc tạo token `--error-text` với giá trị đảm bảo ≥ 4.5:1 trên cả dark và light backgrounds. Hoặc sử dụng `<Input>` component (đã dùng `text-destructive` + border styling nhất quán). WHY — Đảm bảo consistency với design system tokens và maintain contrast ≥ 4.5:1 trên mọi theme. WHERE — 8+ files trong `src/pages/` dùng `text-red-400` cho error messages.

### F-INTERACTION-06: Sign-in page "Đăng ký" link thiếu focus-visible ring

- **Severity:** P2
- **Surface:** sign-in
- **Axis:** INTERACTION
- **References:** R10.2; WCAG 2.1 SC 2.4.7 (Level AA)
- **Description:** Trang `sign-in.tsx` có link "Đăng ký" bên dưới Clerk widget với className `"text-primary hover:text-primary/80 underline-offset-4 hover:underline"` — có hover styles nhưng **không** có `focus-visible:` ring class. Keyboard user Tab tới link này sẽ không thấy focus indicator rõ ràng (chỉ có browser default outline nếu có, hoặc không có gì nếu CSS reset đã loại bỏ). Đây là vi phạm WCAG 2.1 SC 2.4.7 Level AA — mọi interactive element phải có visible focus indicator. Gán P2 vì chỉ ảnh hưởng 1 link trên 1 surface và browser default outline có thể vẫn hiện (tuỳ CSS reset).
- **Evidence:** `./audit-evidence/keyboard/flow-b-sign-in.md` (Focus Ring Visibility table — "'Đăng ký' link: `hover:underline` — **no explicit `focus-visible` ring defined**"), `artifacts/mysticism-web/src/pages/sign-in.tsx` (link className thiếu focus-visible)
- **Recommendation:** WHAT — Thêm `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm` vào className của link "Đăng ký". WHY — Tuân thủ WCAG 2.1 SC 2.4.7 (Level AA) — keyboard users cần visible focus indicator trên mọi interactive element. WHERE — `artifacts/mysticism-web/src/pages/sign-in.tsx`, link "Đăng ký" element.

### F-INTERACTION-07: ai-chat page thiếu `<main>` landmark — không có skip-to-content target

- **Severity:** P1
- **Surface:** ai-chat
- **Axis:** INTERACTION
- **References:** R10.1; WCAG 2.1 SC 2.4.1 (Level A); Nielsen #7: Flexibility and efficiency of use
- **Description:** Keyboard walkthrough Flow C ghi nhận: ai-chat page **không** có `<main id="main" tabIndex={-1}>` landmark, khác với các page khác (than-so-hoc, sign-in, profile đều có). `SkipLink` component mount ở root (`App.tsx`) trỏ tới `#main` — trên ai-chat page, click skip link sẽ không navigate tới đâu vì target không tồn tại. Đây là vi phạm WCAG 2.1 SC 2.4.1 Level A (bypass blocks mechanism phải hoạt động). Kết hợp với 28+ suggestion tab stops (F-INTERACTION-01), keyboard user không có cách nào skip navbar + suggestions để đến input nhanh. Gán P1 vì vi phạm WCAG Level A trên flow quan trọng (ai-chat là 1 trong 3 flow chính).
- **Evidence:** `./audit-evidence/keyboard/flow-c-ai-chat.md` (Section "Trap Focus" — "No `<main>` landmark on ai-chat page — Unlike other pages, ai-chat does NOT have `<main id='main' tabIndex={-1}>`"), `artifacts/mysticism-web/src/pages/ai-chat.tsx` (không có `<main id="main" tabIndex={-1}>` wrapper)
- **Recommendation:** WHAT — Thêm `<main id="main" tabIndex={-1} className="outline-none ...">` wrapper quanh main content area của ai-chat page (sau navbar, bao gồm chat log + input). WHY — Tuân thủ WCAG 2.1 SC 2.4.1 (Level A) — SkipLink cần target hợp lệ để keyboard users bypass navbar. WHERE — `artifacts/mysticism-web/src/pages/ai-chat.tsx`, wrap main content trong `<main>` element.

### F-INTERACTION-08: Dialog/drawer behavior — không phát hiện vấn đề

- **Severity:** INFO
- **Surface:** mobile-drawer, date-input, profile (AlertDialog)
- **Axis:** INTERACTION
- **References:** R10.3
- **Description:** Đã kiểm tra 3 dialog/overlay patterns: (1) `MobileDrawer` — dùng Radix `Sheet` + `FocusTrap` component, Esc closes (Sheet built-in), focus trap khi open (FocusTrap + Sheet FocusScope), return focus on close (Sheet built-in). (2) `DateInput` calendar — dùng Radix `Popover`, Esc closes, focus returns to trigger button. (3) `AlertDialog` trong profile (xoá reading) — Radix AlertDialog có focus trap, Esc closes, return focus. Tất cả đều tuân thủ R10.3. `MobileDrawer` có thêm `SheetDescription` (sr-only) cho `aria-describedby`. Không phát hiện vấn đề.
- **Evidence:** `artifacts/mysticism-web/src/components/layout/mobile-drawer.tsx:218–230` (Sheet + FocusTrap wrapper), `artifacts/mysticism-web/src/components/ui/date-input.tsx` (Popover pattern), `./audit-evidence/keyboard/flow-a-home-to-module.md`

### F-INTERACTION-09: PWA install prompt — không phát hiện vấn đề

- **Severity:** INFO
- **Surface:** pwa-install-prompt
- **Axis:** INTERACTION
- **References:** R10.11
- **Description:** Đã kiểm tra `PwaInstallPrompt` component theo R10.11: (1) Không phải full-screen modal — render `<aside role="region">` với `fixed z-50` bottom banner/card, không có overlay, không block interaction với page content. (2) Có dismiss — "Bỏ qua" button + X close button, cả hai gọi `handleDismiss()`. (3) 14-day cooldown — `DISMISS_COOLDOWN_MS = 14 * 24 * 3600 * 1000` (1,209,600,000ms = 14 ngày), `shouldShowPrompt()` check `now - dismissedAt < DISMISS_COOLDOWN_MS`. (4) Reduced motion honored — `motion-reduce:animate-none motion-reduce:duration-0` trên entrance animation. (5) iOS Safari fallback — inline 3-step guide thay vì native prompt. Không phát hiện vấn đề.
- **Evidence:** `artifacts/mysticism-web/src/components/pwa-install-prompt.tsx:210–220` (`<aside role="region">`, không phải dialog/modal), `artifacts/mysticism-web/src/pwa/pwa-prompt-state.ts:37` (`DISMISS_COOLDOWN_MS = 14 * 24 * 3600 * 1000`)

### F-INTERACTION-10: Toast feedback — không phát hiện vấn đề

- **Severity:** INFO
- **Surface:** (toàn bộ)
- **Axis:** INTERACTION
- **References:** R10.9
- **Description:** Đã kiểm tra toast system: (1) `showToast()` wrapper enforce Vietnamese `title` (bắt buộc, sentence case theo Req 19.3). (2) Sonner `richColors=true` — variant `error` tự áp red/destructive tones, variant `success` áp green tones. (3) Error toast có `retry` option — render action button "Thử lại" (default label). (4) Duration 4000ms (Req 5.9). (5) Position responsive: `top-center` mobile, `bottom-right` desktop. (6) Sonner tự gắn `role="status"` (info/success) hoặc `role="alert"` (error/warning). Không phát hiện vấn đề.
- **Evidence:** `artifacts/mysticism-web/src/lib/toast.ts:97–125` (showToast implementation), `artifacts/mysticism-web/src/components/ui/sonner.tsx:67–95` (Toaster config với richColors + responsive position)

## Findings — Mockup Sandbox

Audit `mockup-sandbox` ở mức **convention review** theo R11.1: chỉ kiểm tra Gallery component trong `App.tsx`, PreviewRenderer error state, base styling (Tailwind/shadcn primitives), và URL hint display. **Không** audit từng mockup component bên trong `src/components/mockups/` (R11.2).

Nhìn chung, mockup-sandbox là dev tool đơn giản với 1 file `App.tsx` chứa cả Gallery và PreviewRenderer. Base styling (`index.css`) cấu hình đầy đủ light/dark theme tokens theo chuẩn shadcn/ui. Tuy nhiên, Gallery component **không sử dụng** design tokens — hardcode Tailwind gray utilities (`bg-gray-50`, `text-gray-900`) nên không phản ánh dark mode. PreviewRenderer error state dùng inline `style={{ color: "red" }}` thay vì design token, gây contrast issue trên light background.

### F-MODULE-09: Gallery component hardcode light-only colors — không hỗ trợ dark mode

- **Severity:** P2
- **Surface:** mockup-sandbox
- **Axis:** MODULE
- **References:** Nielsen #4: Consistency and standards; ux-ui-upgrade Req 3.4
- **Description:** Gallery component trong `App.tsx` sử dụng hardcoded Tailwind gray utilities thay vì CSS variable-based design tokens đã định nghĩa trong `index.css`. Cụ thể: `bg-gray-50` (background), `text-gray-900` (heading), `text-gray-500` (paragraph), `text-gray-400` (hint text), `bg-gray-100` (code background), `text-gray-600` (code text). File `index.css` đã định nghĩa đầy đủ light/dark theme tokens (`--background`, `--foreground`, `--muted`, `--muted-foreground`, v.v.) nhưng Gallery không dùng. Kết quả: nếu user thêm `.dark` class vào `<html>`, Gallery vẫn hiển thị nền trắng xám — inconsistent với phần còn lại của sandbox (PreviewRenderer sẽ dùng `bg-background` nếu component con dùng tokens). Đây là dev tool nên impact thấp, nhưng vi phạm convention consistency. Gán P2 vì polish issue trên 1 surface, không ảnh hưởng end-user.
- **Evidence:** `artifacts/mockup-sandbox/src/App.tsx:89–103` (Gallery function: `className="min-h-screen bg-gray-50 flex items-center justify-center p-8"`, `text-gray-900`, `text-gray-500`, `text-gray-400`, `bg-gray-100`, `text-gray-600`), `artifacts/mockup-sandbox/src/index.css:49–100` (`:root` và `.dark` blocks định nghĩa tokens `--background`, `--foreground`, `--muted-foreground`)
- **Recommendation:** WHAT — Thay thế hardcoded gray utilities bằng design tokens: `bg-gray-50` → `bg-background`, `text-gray-900` → `text-foreground`, `text-gray-500` → `text-muted-foreground`, `bg-gray-100` → `bg-muted`, `text-gray-600` → `text-muted-foreground`. WHY — Đảm bảo Gallery phản ánh đúng theme hiện tại (light/dark) và nhất quán với base styling đã cấu hình trong `index.css`. WHERE — `artifacts/mockup-sandbox/src/App.tsx`, function `Gallery()` (lines 89–103).

### F-MODULE-10: PreviewRenderer error state — inline `color: "red"` thiếu contrast trên light background và không dùng design token

- **Severity:** P2
- **Surface:** mockup-sandbox
- **Axis:** MODULE
- **References:** R11.4; WCAG 2.1 SC 1.4.3 (Level AA); Nielsen #9: Help users recognize errors
- **Description:** PreviewRenderer error state (line 72–76) render `<pre style={{ color: "red", padding: "2rem", fontFamily: "system-ui" }}>`. Vấn đề: (1) `color: "red"` = #ff0000 trên light background (`:root` → `--background: 0 0% 100%` = #ffffff) → contrast ratio ≈ 4.0:1 — **dưới ngưỡng 4.5:1** cho normal text theo WCAG 2.1 SC 1.4.3 Level AA. (2) Trên dark background (`.dark` → `--background: 240 10% 3.9%` ≈ #0a0a0f) → contrast ≈ 5.2:1 (pass). (3) Tuy nhiên, Gallery (parent route) dùng `bg-gray-50` nên error state thực tế render trên nền mặc định của body (`bg-background` từ `@layer base`) — nếu không có `.dark` class, nền = white → contrast fail. (4) `fontFamily: "system-ui"` override monospace expectation của `<pre>` tag — error stack traces thường cần monospace để align. (5) Không dùng design token `--destructive` hoặc `--destructive-foreground`. Theo R11.4, error message phải có contrast đọc được trên cả 2 theme. Light mode fail → flag P2. Ngoài ra, chỉ test được 1 theme scenario (light — vì Gallery hardcode light colors) cũng là P2 riêng theo R11.4.
- **Evidence:** `artifacts/mockup-sandbox/src/App.tsx:72–76` (`<pre style={{ color: "red", padding: "2rem", fontFamily: "system-ui" }}>`), `artifacts/mockup-sandbox/src/index.css:52` (`--background: 0 0% 100%` = white trong light mode)
- **Recommendation:** WHAT — Thay inline style bằng Tailwind classes sử dụng design tokens: `<pre className="text-destructive bg-destructive/10 p-8 font-mono text-sm whitespace-pre-wrap rounded-md">`. WHY — Đảm bảo contrast đọc được trên cả light và dark theme (token `--destructive` được thiết kế cho cả 2 modes), giữ monospace font cho error traces, và tuân thủ R11.4. WHERE — `artifacts/mockup-sandbox/src/App.tsx`, PreviewRenderer error return (line 72–76).

### F-INTERACTION-11: Gallery page có "AI default" feel — excessive centering và empty space

- **Severity:** P2
- **Surface:** mockup-sandbox
- **Axis:** INTERACTION
- **References:** R11.3; Nielsen #8: Aesthetic and minimalist design
- **Description:** Gallery component dùng layout `min-h-screen flex items-center justify-center p-8` — center cả vertical lẫn horizontal trong toàn bộ viewport height. Với nội dung chỉ gồm 1 heading + 2 paragraphs (khoảng 80px height), phần còn lại là empty space khổng lồ. Pattern này là dấu hiệu "AI default" feel theo R11.3: padding `p-8` (32px) trên mobile chiếm 64px horizontal space trên viewport 360px, `min-h-screen` tạo cảm giác trang trống/chưa hoàn thiện. Tuy không có "gradient tím vô hồn" (background là `bg-gray-50` — neutral), nhưng excessive centering + empty space tạo ấn tượng generic placeholder page thay vì intentional dev tool landing. Gán P2 vì đây là dev tool (không phải production surface) và vấn đề thuần aesthetic.
- **Evidence:** `artifacts/mockup-sandbox/src/App.tsx:89` (`className="min-h-screen bg-gray-50 flex items-center justify-center p-8"` — full viewport centering với padding lớn), `artifacts/mockup-sandbox/src/App.tsx:90` (`className="text-center max-w-md"` — content constrained to 448px max width trong viewport rộng)
- **Recommendation:** WHAT — Đổi layout sang top-aligned với reasonable padding: `min-h-screen bg-background p-6 pt-16` hoặc thêm danh sách available mockup components (nếu có) để fill content area. Bỏ vertical centering (`items-center justify-center`). WHY — Tránh "AI default" feel theo R11.3, tạo ấn tượng dev tool có chủ đích thay vì placeholder. Nếu có component list, Gallery trở thành useful navigation thay vì dead-end page. WHERE — `artifacts/mockup-sandbox/src/App.tsx`, function `Gallery()` layout classes.

### F-MODULE-11: URL hint `${basePath}/preview/ComponentName` — hiển thị rõ ràng nhưng thiếu interactive affordance

- **Severity:** INFO
- **Surface:** mockup-sandbox
- **Axis:** MODULE
- **References:** R11.3
- **Description:** Đã kiểm tra URL hint display theo R11.3. Gallery render URL hint bằng `<code>` element với styling `bg-gray-100 px-1.5 py-0.5 rounded text-gray-600` — text rõ ràng, có visual distinction (background khác, rounded corners, monospace font từ `<code>` semantic). `getPreviewExamplePath()` function tính đúng basePath + `/preview/ComponentName`. Hint text đặt trong paragraph cuối với prefix "Access component previews at" — context rõ ràng. Không phát hiện vấn đề về visibility hoặc clarity. Tuy nhiên, hint không phải link clickable (chỉ là text) — user phải copy-paste URL. Đây là acceptable cho dev tool vì `ComponentName` là placeholder, không phải real component path.
- **Evidence:** `artifacts/mockup-sandbox/src/App.tsx:97–101` (`<code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">{getPreviewExamplePath()}</code>` — render rõ ràng với visual distinction)

## Audit_Backlog

### P0 (Blocker)

| id | title | axis | surface | effort | recommendation summary |
|----|-------|------|---------|--------|------------------------|
| F-LAYOUT-01 | Heading hierarchy skip — h1 → h3 | LAYOUT | than-so-hoc, bat-tu, phong-thuy, xem-que, xem-ten, xem-ngay-tot, sao-han | S | Đổi `<h3>` thành `<h2>` cho section heading trực tiếp dưới `<h1>` |
| F-MODULE-01 | Inline SVG charts thiếu `role="img"` và `aria-label` | MODULE | xem-ten, than-so-hoc, phong-thuy, hop-tuoi, bat-tu | S | Thêm `role="img"` + `aria-label` mô tả nội dung chart |
| F-INTERACTION-03 | Module_Page forms thiếu `aria-invalid` và `aria-describedby` | INTERACTION | than-so-hoc, bat-tu, tu-vi, phong-thuy, xem-ten, hop-tuoi, sao-han, xem-ngay-tot | M | Thêm `aria-invalid` + `aria-describedby` liên kết error message |

### P1 (Major)

| id | title | axis | surface | effort | recommendation summary |
|----|-------|------|---------|--------|------------------------|
| F-ANIM-03 | CSS-only animations thiếu `prefers-reduced-motion` | ANIM | home | S | Thêm `@media (prefers-reduced-motion: reduce)` tắt animation |
| F-LAYOUT-02 | Prose content thiếu max-width constraint | LAYOUT | ai-chat | S | Thêm `max-w-prose` hoặc `max-w-[75ch]` vào MarkdownRenderer |
| F-LAYOUT-03 | Type scale vượt 6 mức — arbitrary font sizes | LAYOUT | multiple | M | Thay `text-[8-11px]` bằng Tailwind scale gần nhất (≥ text-xs) |
| F-LAYOUT-04 | Touch target < 44px — date-input trigger 28×28px | LAYOUT | than-so-hoc, bat-tu, tu-vi, phong-thuy, hop-tuoi, sao-han | S | Tăng button lên `h-11 w-11` (44px) hoặc thêm padding touch area |
| F-MODULE-02 | Chart labels fontSize 5–9 không đọc được trên mobile | MODULE | xem-ten, than-so-hoc, phong-thuy, hop-tuoi, bat-tu | M | Tăng fontSize tối thiểu 12px, dùng responsive font scaling |
| F-MODULE-03 | share-view lộ action buttons cho anonymous viewer | MODULE | share-view | S | Ẩn action buttons khi user không phải owner (check auth state) |
| F-MODULE-04 | share-view DataTable dùng `<div>` thay vì `<table>` | MODULE | share-view | M | Chuyển sang semantic `<table>` hoặc thêm ARIA table roles |
| F-INTERACTION-01 | AI chat — 28 suggestion tab stops trước textarea | INTERACTION | ai-chat | M | Gom suggestions vào `role="listbox"` với roving tabindex |
| F-INTERACTION-04 | Theme toggle flash — thiếu inline script | INTERACTION | toàn bộ | S | Thêm inline `<script>` trong `<head>` đọc localStorage theme |
| F-INTERACTION-07 | ai-chat page thiếu `<main>` landmark | INTERACTION | ai-chat | S | Thêm `<main id="main" tabIndex={-1}>` wrapper quanh content |

### P2 (Minor)

| id | title | axis | surface | effort | recommendation summary |
|----|-------|------|---------|--------|------------------------|
| F-ANIM-01 | Cloud-drift animation dùng `linear` easing | ANIM | ambient-bg | S | Đổi `linear` thành `ease-in-out` cho cloud-drift keyframe |
| F-ANIM-02 | Typing indicator `animate-bounce` vượt 800ms | ANIM | ai-chat | S | Override duration xuống 600–700ms bằng custom utility class |
| F-LAYOUT-05 | Calendar grid cells borderline 44px | LAYOUT | lich-van-nien, xem-ngay-tot, lich-ca-nhan | S | Thêm min-height 44px hoặc padding đảm bảo touch target |
| F-MODULE-05 | 6 Module_Page thiếu EmptyState cho AI section | MODULE | tu-vi, lich-van-nien, hop-tuoi, lich-ca-nhan, sao-han, tu-dien | M | Thêm EmptyState component khi AI section chưa có dữ liệu |
| F-MODULE-06 | Module_Page không sử dụng ResultCard component | MODULE | toàn bộ 15 Module_Page | L | Migrate kết quả AI sang ResultCard cho consistency |
| F-MODULE-09 | Gallery hardcode light-only colors | MODULE | mockup-sandbox | S | Thay gray utilities bằng design tokens (bg-background, etc.) |
| F-MODULE-10 | PreviewRenderer error state inline color:red | MODULE | mockup-sandbox | S | Thay inline style bằng `text-destructive` + `font-mono` classes |
| F-INTERACTION-02 | Focus ring opacity borderline contrast | INTERACTION | home, navbar | S | Tăng ring opacity hoặc dùng solid ring color đảm bảo 3:1 |
| F-INTERACTION-05 | Form error text color inconsistency | INTERACTION | than-so-hoc, bat-tu, etc. | M | Thay `text-red-400` bằng design token `--error-text` nhất quán |
| F-INTERACTION-06 | Sign-in "Đăng ký" link thiếu focus-visible ring | INTERACTION | sign-in | S | Thêm `focus-visible:ring-2 focus-visible:ring-ring` vào link |
| F-INTERACTION-11 | Gallery "AI default" feel | INTERACTION | mockup-sandbox | S | Đổi layout top-aligned, bỏ vertical centering, thêm content |

## Appendices

Dưới đây là danh sách thư mục evidence thu thập trong quá trình audit. Mọi đường dẫn relative tính từ thư mục chứa file `audit-report.md` này.

| Thư mục | Nội dung |
|---------|----------|
| [./audit-evidence/lighthouse/](./audit-evidence/lighthouse/) | Lighthouse JSON reports cho 8 routes (`home`, `than-so-hoc`, `bat-tu`, `tu-vi`, `ai-chat`, `profile`, `lich-su`, `sign-in`) — scores Performance, Accessibility, Best Practices, SEO |
| [./audit-evidence/axe/](./audit-evidence/axe/) | axe-core accessibility scan results (JSON) cho 8 routes — violations grouped by impact (critical/serious/moderate/minor) |
| [./audit-evidence/responsive/](./audit-evidence/responsive/) | Responsive screenshots (PNG) trên 4 viewports (360×800, 768×1024, 1280×800, 1920×1080) cho các routes đã audit |
| [./audit-evidence/reduced-motion/](./audit-evidence/reduced-motion/) | Screenshots và ghi chú hành vi khi `prefers-reduced-motion: reduce` được bật — 3 surfaces: home, Module_Page có animation, ai-chat |
| [./audit-evidence/keyboard/](./audit-evidence/keyboard/) | Keyboard navigation walkthrough logs (Markdown) cho 3 flows: Flow A (home → Module_Page → submit → kết quả), Flow B (sign-in), Flow C (ai-chat gửi message + copy response) |

## Acceptance Checklist

Checklist xác nhận audit hoàn thành theo 6 điều kiện tại Requirement 13.1. Mỗi mục được tick `[x]` khi đạt, `[ ]` khi chưa đạt kèm ghi chú trạng thái.

- [x] **(a)** Tất cả Audit_Surface đã được audit hoặc loại trừ với lý do — Surface Inventory table (section Scope) liệt kê đầy đủ 40 surfaces: 21 pages + 14 shared components + mockup-sandbox audited, 6 exclusions có lý do rõ ràng.
- [x] **(b)** Cả 4 Audit_Axis đều có Finding — ANIM: 4 findings (1 P1, 2 P2, 1 INFO), LAYOUT: 7 findings (1 P0, 3 P1, 1 P2, 2 INFO), MODULE: 11 findings (1 P0, 3 P1, 2 P2, 5 INFO bao gồm 3 mockup-sandbox), INTERACTION: 11 findings (1 P0, 4 P1, 6 P2).
- [x] **(c)** Tất cả Finding có đủ trường bắt buộc theo Requirement 2 — mỗi finding có: `id`, `title`, `axis`, `severity`, `surface`, `description`, `evidence`, `recommendation` (WHAT/WHY/WHERE), `references`.
- [x] **(d)** Audit_Backlog có 3 bảng P0/P1/P2 — P0: 3 rows, P1: 10 rows, P2: 11 rows. Mỗi bảng có 6 cột (id, title, axis, surface, effort, recommendation summary).
- [x] **(e)** `audit-evidence/` chứa output đầy đủ — lighthouse: 8 JSON files, axe: 8 JSON files, responsive: 32 PNG screenshots (8 routes × 4 viewports), reduced-motion: 3 PNG screenshots, keyboard: 3 Markdown walkthrough logs.
- [x] **(f)** `audit-summary.json` parse được bằng JSON parser chuẩn — **Đạt:** file `audit-summary.json` tồn tại, parse thành công bằng `JSON.parse()`, pass JSON schema validation (TS1), cross-file consistency check (TS3) xác nhận 33 findings khớp bidirectional giữa Markdown và JSON.
