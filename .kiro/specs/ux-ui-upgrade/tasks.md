# Implementation Plan: UX/UI Upgrade

## Overview

Triển khai bản nâng cấp UX/UI của Huyền Bí trên frontend `artifacts/mysticism-web/` theo từng lát mỏng: token & theme nền tảng → primitive UI → layout & shared components → form & network → animation & motion → 15 module pages → trang đặc biệt (home, profile, lich-su, ai-chat, sign-in/up) → PWA & cursor → tài liệu & lint. Mỗi block đặt code và test cạnh nhau, kết thúc bằng checkpoint trước khi chuyển sang phần tiếp theo. Property-based tests sử dụng `fast-check` (đã có) và viết theo file pattern `*.property.test.ts` chạy bằng `vitest`.

Ngôn ngữ: TypeScript + React (đã có trong dự án).

## Tasks

- [x] 1. Thiết lập nền tảng test runner và token registry
  - [x] 1.1 Thêm `vitest` và scripts test
    - Thêm `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `happy-dom` vào `artifacts/mysticism-web/package.json` devDependencies
    - Tạo `artifacts/mysticism-web/vitest.config.ts` với environment `happy-dom`, alias `@` trỏ tới `src`
    - Bổ sung scripts `test`, `test:property`, `test:a11y`, `lint:design` vào `package.json`
    - Tạo `src/test/setup.ts` cấu hình `@testing-library/jest-dom`
    - _Requirements: 20.1, 20.2_

  - [x] 1.2 Tạo registry design tokens và helper contrast
    - Tạo `src/components/ui/design-tokens.ts` export `TOKEN_PAIRS`, `parseHsl`, `computeContrast` (WCAG luminance)
    - Đăng ký mọi cặp `(foreground, background)` semantic + size bucket (`text` / `large-or-ui`)
    - _Requirements: 1.1, 2.1, 3.2, 3.8_

  - [ ]* 1.3 Property test cho contrast invariant
    - **Property 1: Contrast invariant for token pairs**
    - **Validates: Requirements 2.1, 3.2, 3.8**
    - File `src/components/ui/contrast.property.test.ts`, `numRuns: 100` mỗi theme

  - [x] 1.4 Tạo generators dùng chung cho property tests
    - File `src/test/generators.ts` export `arbForm`, `arbConversation`, `arbReadingList`, `arbBreakpoint`, `arbHttpStatus`, `arbRetryAfterHeader`, `arbMousePosition`
    - _Requirements: 6.1, 5.4, 13.8, 9.6_

- [x] 2. Hoàn thiện design tokens trong CSS và theme provider
  - [x] 2.1 Bổ sung token `light` và radius/shadow/type scale vào `src/index.css`
    - Thêm block `.light { ... }` đầy đủ với HSL đạt 4.5:1
    - Thêm `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-xl`
    - Thêm `--shadow-sm`, `--shadow-md` (giới hạn 2 mức)
    - Thêm biến `--font-size-display/h1/h2/h3/body/small` và line-height tương ứng
    - Thêm `font-display: swap` và `<link rel="preload">` cho Playfair Display, Plus Jakarta Sans trong `index.html`
    - _Requirements: 1.1, 1.3, 1.6, 10.1, 10.6, 11.4_

  - [x] 2.2 Cập nhật `src/contexts/theme.tsx` đọc `prefers-color-scheme`, persist localStorage, đồng bộ `<meta name="theme-color">`
    - Bổ sung `isSystem` flag, đọc `matchMedia('(prefers-color-scheme: dark)')` khi `localStorage["theme"]` null
    - Cập nhật class trên `<html>` mỗi khi theme đổi
    - _Requirements: 2.3, 2.4_

  - [ ]* 2.3 Property tests cho theme provider
    - **Property 2: Theme round-trip qua localStorage**
    - **Property 3: Theme bám prefers-color-scheme khi chưa override**
    - **Validates: Requirements 2.3, 2.4**
    - File `src/contexts/theme.property.test.ts`

  - [x] 2.4 Set `lang="vi"` trên `<html>` và đảm bảo tất cả page mặc định dùng tiếng Việt
    - Cập nhật `index.html` và bất kỳ runtime override nếu có
    - _Requirements: 3.11, 19.1_

- [x] 3. Primitive UI mới và nâng cấp
  - [x] 3.1 Tạo `src/components/ui/skeleton.tsx` với biến thể `card`, `chart`, `list-row`, gắn `aria-busy`
    - _Requirements: 5.1, 5.8_

  - [x] 3.2 Tạo `src/components/ui/empty-state.tsx`
    - Props: `icon`, `title`, `description`, `cta`; `role="status"`
    - _Requirements: 5.7, 5.8_

  - [x] 3.3 Tạo `src/components/ui/error-state.tsx`
    - Props: `status` (4xx/5xx/429/network), `title`, `description`, `onRetry`, `homeHref`, `retryAfterSeconds`
    - Variant `rate-limit` hiển thị "Đã đạt giới hạn lượt gọi AI. Vui lòng thử lại sau X phút."
    - `role="alert"`, nút "Thử lại" và link về trang chủ
    - _Requirements: 5.4, 5.5, 5.8_

  - [ ]* 3.4 Property test cho ErrorState
    - **Property 15: ErrorState chuẩn cho mọi mã 4xx/5xx**
    - **Validates: Requirements 5.4, 5.5**
    - File `src/components/ui/error-state.property.test.ts`

  - [x] 3.5 Tạo `src/components/ui/skip-link.tsx`
    - Hiện khi `:focus`, dẫn tới `#main`
    - _Requirements: 3.10_

  - [x] 3.6 Tạo `src/components/ui/focus-trap.tsx` (wrapper Radix Focus Scope)
    - Bẫy focus và trả focus về trigger khi đóng
    - _Requirements: 3.6, 3.7_

  - [ ]* 3.7 Property test cho FocusTrap
    - **Property 6: Focus trap và khôi phục focus**
    - **Validates: Requirements 3.6, 3.7**
    - File `src/components/ui/focus-trap.property.test.ts`

  - [x] 3.8 Nâng cấp `src/components/ui/button.tsx`
    - Thêm `loadingText`, spinner inline, `aria-busy` khi loading
    - Min-height 44px ở variant default cho mobile target tap
    - _Requirements: 4.3, 5.2_

  - [x] 3.9 Nâng cấp `src/components/ui/input.tsx`
    - Hỗ trợ `error`, `helperText`, `aria-invalid`, `aria-describedby`
    - Áp `border-destructive` khi error, icon cảnh báo bên phải
    - Liên kết tự động `<label htmlFor>` qua context provider hoặc prop
    - _Requirements: 3.4, 3.5, 6.1, 6.2, 6.3, 6.7_

  - [ ]* 3.10 Component tests cho Input ARIA hygiene
    - **Property 7: ARIA hygiene cho form và trạng thái** (phần Form_Input)
    - **Validates: Requirements 3.4, 3.5, 6.3, 5.8**
    - File `src/components/ui/input.property.test.ts`

  - [x] 3.11 Tạo `src/components/ui/date-input.tsx`
    - Wrap `react-day-picker` + text input `dd/MM/yyyy`
    - _Requirements: 6.6, 6.7_

  - [x] 3.12 Cấu hình `sonner` Toaster trong root
    - `richColors`, `duration: 4000`, position responsive
    - Wrapper `src/lib/toast.ts` với `showToast({ variant, title, description, retry })`
    - _Requirements: 5.9_

- [x] 4. Form utilities và validators
  - [x] 4.1 Tạo `src/lib/form-utils.ts`
    - `parseVietnameseDate(input: string): Date | null`
    - `formatVietnameseDate(d: Date): string`
    - `formatPhoneVN(raw: string): string`
    - `formatLicensePlate(raw: string): string`
    - `validateBirthDate(date: Date): { ok: true } | { ok: false; reason: string }`
    - Validators kiểm tra ràng buộc `day [1,31]`, `month [1,12]`, `year [1900,2100]`, `hour [0,23]`, `phoneDigits.length ≥ 10`
    - _Requirements: 6.1, 6.2, 6.4, 6.6, 6.8_

  - [ ]* 4.2 Property tests cho form-utils
    - **Property 11: Validation purity và live-revalidation**
    - **Property 12: Round-trip parser dd/MM/yyyy**
    - **Property 13: Formatter idempotence và bảo toàn raw**
    - **Validates: Requirements 6.1, 6.2, 6.4, 6.6, 6.8**
    - File `src/lib/form-utils.property.test.ts`

  - [x] 4.3 Tạo `src/lib/error-messages.ts`
    - Object `ERROR_MESSAGES` chứa thông điệp tiếng Việt chuẩn (network, rate_limit, validation, …)
    - _Requirements: 5.4, 5.5, 6.1, 6.2, 18.1, 19.1, 19.2_

  - [x] 4.4 Helper submit-with-errors
    - Hàm `focusFirstError(errorRefs: Record<string, HTMLElement | null>, order: string[])` focus + scrollIntoView
    - _Requirements: 6.5_

  - [ ]* 4.5 Property test cho focus-first-error
    - **Property 14: Submit form lỗi focus phần tử lỗi đầu tiên**
    - **Validates: Requirements 6.5**
    - File `src/lib/focus-first-error.property.test.ts`

- [x] 5. Network status, retry-after và offline banner
  - [x] 5.1 Tạo `src/lib/network/retry-after.ts`
    - `parseRetryAfter(header: string | null, now?: number): number`
    - Hỗ trợ giây nguyên `[0, 86400]` và HTTP-date
    - _Requirements: 5.5, 18.4_

  - [ ]* 5.2 Property test cho parseRetryAfter
    - **Property 16: Parser Retry-After**
    - **Validates: Requirements 5.5**
    - File `src/lib/network/retry-after.property.test.ts`

  - [x] 5.3 Tạo `src/lib/network/use-network-status.ts`
    - Hook subscribe `online`/`offline`, trả `{ status, offlineSince }`
    - _Requirements: 18.1, 18.3_

  - [x] 5.4 Tạo `src/components/layout/offline-banner.tsx`
    - Banner sticky đỉnh, `role="status"`, hiện khi offline, ẩn khi reconnect + emit toast "Đã kết nối lại"
    - _Requirements: 18.1, 18.3_

  - [x] 5.5 Tạo `fetchWithTimeout` helper
    - 30s timeout dùng `AbortController`, await abort hoàn tất trước khi trả lỗi
    - _Requirements: 18.4_

- [x] 6. Checkpoint - Đảm bảo tokens, primitives, form & network ổn định
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Animation language và motion config
  - [x] 7.1 Tạo `src/components/ui/animation-registry.ts`
    - Object variants: `hover`, `dropdownEnter`, `dropdownExit`, `dialogEnter`, `dialogExit`, `tabSwitch`, `scrollReveal`, `toast`, `tilt`
    - Mỗi variant có `duration`, `easing`, `properties`
    - Dùng easing `cubic-bezier(0.22, 0.61, 0.36, 1)` enter, `cubic-bezier(0.4, 0, 1, 1)` exit
    - _Requirements: 9.1, 9.2, 9.3_

  - [x] 7.2 Wrap app bằng `<LazyMotion features={domAnimation}>` và `<MotionConfig reducedMotion="user">`
    - Hook `useReducedMotion()` chuyển variants sang fade ≤ 150ms
    - _Requirements: 9.4_

  - [ ]* 7.3 Property test cho animation registry
    - **Property 17: Cấu hình motion bám duration / easing / reduced-motion**
    - **Validates: Requirements 9.2, 9.3, 9.4**
    - File `src/components/ui/animation-registry.property.test.ts`

  - [x] 7.4 Cập nhật `src/components/tilt-card.tsx`
    - Tính rotateX/rotateY theo vị trí chuột; clamp `|angle| ≤ 8`, hard cap `±15`
    - Tắt khi reduced-motion hoặc cảm ứng
    - _Requirements: 9.6_

  - [ ]* 7.5 Property test cho tilt-card angle clamp
    - **Property 18: Tilt-card giới hạn độ nghiêng**
    - **Validates: Requirements 9.6**
    - File `src/components/tilt-card.property.test.ts`

  - [x] 7.6 Cập nhật `src/components/ambient-bg.tsx`
    - Đọc theme + reduced-motion; opacity dark ≤ 0.35, light ≤ 0.15 và light ≤ 0.6 × dark
    - Chỉ mount trên `home` và 15 Module_Page (lift mount lên router)
    - _Requirements: 2.6, 10.8_

  - [ ]* 7.7 Property test cho ambient-bg opacity invariant
    - **Property 4: Ambient_Background giảm opacity ở light mode**
    - **Validates: Requirements 2.6, 10.8**
    - File `src/components/ambient-bg.property.test.ts`

- [x] 8. Layout: Navbar, Drawer mobile, Footer, Breadcrumb
  - [x] 8.1 Refactor `src/components/layout/navbar.tsx`
    - Desktop: Radix `NavigationMenu` 5 nhóm (Số Học, Mệnh Lý, Tiên Tri, Tra Cứu, Trợ Lý AI)
    - Logo "Huyền Bí" link `/`
    - Sticky + `backdrop-filter: blur(12px)`
    - Highlight active route: `text-primary` + `aria-current="page"`
    - Avatar dropdown cho user đã đăng nhập (Hồ sơ, Lịch sử, Đăng xuất)
    - _Requirements: 7.1, 7.3, 7.5, 7.7, 7.8_

  - [x] 8.2 Tạo `src/components/layout/mobile-drawer.tsx`
    - Drawer trượt từ trái với 5 nhóm + tài khoản, FocusTrap
    - Tự đóng khi click một liên kết
    - Hamburger trigger có `aria-label`
    - _Requirements: 4.2, 7.2_

  - [ ]* 8.3 Property test cho mobile drawer
    - **Property 9: Drawer mobile đóng sau khi click link**
    - **Validates: Requirements 4.2**
    - File `src/components/layout/mobile-drawer.property.test.tsx`

  - [x] 8.4 Tạo `src/components/layout/breadcrumb.tsx`
    - Render `Trang chủ → [Nhóm] → [Mô-đun]`, separator `aria-hidden="true"`
    - Map `route → group → label`
    - Mục cuối có `aria-current="page"`
    - _Requirements: 7.4_

  - [x] 8.5 Refactor `src/components/layout/footer.tsx`
    - Grid 4 cột (≥1024px) / 2 cột (tablet) / 1 cột (mobile)
    - Cột nhóm modules + cột tài khoản + chính sách + version từ Vite define
    - _Requirements: 12.6_

  - [x] 8.6 Thêm SkipLink vào root layout
    - Dẫn tới `#main` trên mọi trang; main element có `id="main"` và `tabIndex={-1}`
    - _Requirements: 3.10_

- [x] 9. Markdown renderer và result actions
  - [x] 9.1 Cập nhật `src/components/ui/markdown-renderer.tsx`
    - Style heading, list, blockquote, code, pre, table, link theo Color_Token và Type_Scale
    - Link ngoài tự động `target="_blank" rel="noopener noreferrer"` (so sánh `URL.host`)
    - Render incremental: chia block-level `\n\n`, memo bằng key index
    - _Requirements: 2.7, 8.5, 11.6_

  - [x] 9.2 Refactor `src/components/result-actions.tsx`
    - 3 nút chính: Lưu, Chia sẻ, Xuất; trên mobile gộp Xuất thành dropdown PNG/PDF/TXT
    - Lazy import `export-card-*`, `html2canvas`, `jsPDF` qua `React.lazy` + `Suspense`
    - _Requirements: 8.6, 11.1_

  - [x] 9.3 Cập nhật `src/components/save-reading-btn.tsx`
    - Khi unauth, mở dialog tiếng Việt với 2 nút "Đăng nhập" / "Để sau"
    - Optimistic update khi auth, rollback toast nếu API fail
    - _Requirements: 8.7, 11.3_

- [ ] 10. Kết quả tra cứu và biểu đồ chuẩn cho 15 Module_Page
  - [x] 10.1 Tạo `src/components/result-card.tsx`
    - Layout cố định: header chủ thể → key numbers → SVG chart → table → AI section → action group
    - _Requirements: 8.1_

  - [x] 10.2 Tạo helpers SVG biểu đồ chuẩn
    - `viewBox`, `preserveAspectRatio`, `fill="currentColor"`, `width="100%"`, `role="img"`, `aria-label`
    - Tooltip Radix + `tabIndex={0}` cho mỗi segment để keyboard truy cập
    - File `src/components/charts/chart-base.tsx`
    - _Requirements: 4.4, 8.2, 8.3, 3.9_

  - [x] 10.3 Helper bảng dữ liệu mobile-scroll
    - Wrapper `<div class="md:overflow-visible overflow-x-auto">` với `<thead>`, `scope="col"`
    - File `src/components/data-table.tsx`
    - _Requirements: 4.1, 8.4_

  - [x] 10.4 Refactor 15 trang module áp dụng `ResultCard`, `ChartBase`, `DataTable`, `ResultActions`, `Skeleton`, `EmptyState`, `ErrorState`
    - Các file dưới `src/pages/`: `than-so-hoc.tsx`, `bat-tu.tsx`, `xem-que.tsx`, `cat-hung.tsx`, `lich-van-nien.tsx`, `tu-vi.tsx`, `phong-thuy.tsx`, `xem-ten.tsx`, `lich-ca-nhan.tsx`, `tu-dien.tsx`, `hop-tuoi.tsx`, `xem-ngay-tot.tsx`, `sao-han.tsx`
    - Thêm Breadcrumb đầu trang, `<h1>` duy nhất, không bỏ cấp tiêu đề
    - Form dùng `react-hook-form` + zod, `Input` mới, `DateInput`
    - Loading: Skeleton, Error: ErrorState, Empty: EmptyState
    - _Requirements: 1.4, 4.4, 4.6, 4.7, 5.1, 5.2, 5.4, 6.9, 7.4, 8.1, 8.2, 8.4, 8.6_

  - [ ]* 10.5 Cross-page property tests
    - **Property 5: Tab traversal phủ toàn bộ phần tử tương tác**
    - **Property 8: Không tràn ngang ở mọi breakpoint**
    - **Property 10: Form input chiều cao chạm tối thiểu 44px trên mobile**
    - **Validates: Requirements 3.1, 4.1, 4.3, 4.7**
    - File `src/test/cross-page.property.test.tsx` chạy trên 19 routes × 4 breakpoints

  - [x] 10.6 Đảm bảo form giữ giá trị sau submit thành công
    - Không reset form, cho phép tinh chỉnh và tra cứu lại
    - _Requirements: 6.9_

- [ ] 11. Checkpoint - Verify 15 modules render đúng theo Result_Card chuẩn
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 12. Trang chủ Home
  - [x] 12.1 Refactor `src/pages/home.tsx`
    - Hero ≤ 70vh: `<h1>` thương hiệu, mô tả ≤ 120 ký tự, 2 CTA
    - Grid 15 modules nhóm theo 5 nhóm, mỗi nhóm có `<h2>`
    - Card module: icon `lucide`, `<h3>` tên, mô tả ≤ 90 ký tự, vùng click toàn card
    - Grid responsive 1/2/3/4-5 cột
    - Scroll reveal nhẹ ≤ 28px / ≤ 700ms một lần per section
    - _Requirements: 4.4, 9.5, 10.1, 10.4, 10.7, 12.1, 12.2, 12.3, 12.4, 12.5_

- [x] 13. AI Chat (`/ai-chat`)
  - [x] 13.1 Refactor `src/pages/ai-chat.tsx`
    - `<ul role="log" aria-live="polite">` chứa bubble `<li role="listitem">`
    - Bubble user phải nền `--secondary`, AI trái nền `--card`
    - Timestamp tương đối + tooltip ngày-giờ đầy đủ
    - Typing indicator (3 chấm pulse) đến khi token đầu tiên đến
    - Auto-scroll-to-bottom có guard 100px; nút "Tin nhắn mới ↓" khi user đã cuộn lên
    - 14 suggestion chips trên ô input
    - Enter gửi, Shift+Enter xuống dòng
    - Nút "Dừng" dùng `AbortController`
    - _Requirements: 5.3, 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7_

  - [x] 13.2 Tạo `src/lib/ai-chat-store.ts`
    - `loadMessages()`, `saveMessages(messages)` qua `localStorage["ai-chat-messages"]`
    - Hook đồng bộ qua API khi user đã đăng nhập
    - _Requirements: 13.8_

  - [ ]* 13.3 Property test persist hội thoại
    - **Property 19: Persist hội thoại AI round-trip**
    - **Validates: Requirements 13.8**
    - File `src/lib/ai-chat-store.property.test.ts`

  - [x] 13.4 Hook AI streaming xử lý mất kết nối
    - Giữ text đã stream, banner "Mất kết nối — đang thử lại…", retry tối đa 2 lần (1s, 2s)
    - _Requirements: 5.6_

  - [x] 13.5 Hiển thị ErrorState 429 trên `/ai-chat` dùng `parseRetryAfter`
    - _Requirements: 5.5_

- [x] 14. Profile và Lịch sử
  - [x] 14.1 Refactor `src/pages/profile.tsx`
    - Grid card 1/2/3/4 cột; mỗi card: tên, mô-đun, ngày lưu, ghi chú
    - Filter theo mô-đun (15) + ô tìm kiếm debounce 300ms
    - Checkbox 2 lá số → enable nút "So sánh" → Dialog 2 cột (md+) hoặc xếp chồng (mobile)
    - Xoá: Dialog xác nhận, yêu cầu nhấn "Xoá" lần thứ hai trong dialog
    - Optimistic remove + rollback toast
    - Widget thống kê: tổng số lá số, mô-đun dùng nhiều nhất, lần tra cứu gần nhất
    - "Chia sẻ" tạo link, copy clipboard, toast "Đã sao chép link" + thông tin hết hạn 30 ngày
    - _Requirements: 11.3, 14.1, 14.2, 14.3, 14.4, 14.5, 14.6_

  - [x] 14.2 Refactor `src/pages/lich-su.tsx`
    - Bảng có sắp xếp theo cột (ngày, mô-đun, tiêu đề), bộ lọc mô-đun
    - Xoá hàng / xoá toàn bộ với dialog xác nhận
    - _Requirements: 14.7_

- [x] 15. Sign-in / Sign-up và Clerk integration
  - [x] 15.1 Cập nhật `src/pages/sign-in.tsx` và `src/pages/sign-up.tsx`
    - Dùng widget Clerk với `localizations` tiếng Việt
    - Tuỳ biến theme khớp Color_Token
    - Redirect query param `redirect_url`, fallback `/profile`
    - Liên kết "Quên mật khẩu", "Đã có tài khoản?" / "Chưa có tài khoản?"
    - _Requirements: 15.1, 15.2, 15.3, 15.5_

  - [x] 15.2 Tạo `src/components/clerk-config-banner.tsx`
    - Hiển thị khi thiếu `VITE_CLERK_PUBLISHABLE_KEY`: "Tài khoản tạm thời chưa khả dụng…"
    - _Requirements: 15.4_

- [x] 16. PWA install prompt và Mystic Cursor
  - [x] 16.1 Tạo `src/pwa/pwa-prompt-state.ts`
    - State machine `shouldShowPrompt(state)` thoả: ≥1 reading, dismissed cooldown 14 ngày, đã install ⇒ false vĩnh viễn
    - Persist `localStorage["pwa-prompt-state"]`
    - _Requirements: 16.1, 16.2_

  - [ ]* 16.2 Property test cho PWA prompt FSM
    - **Property 20: Trạng thái máy hữu hạn của PWA install prompt**
    - **Validates: Requirements 16.1, 16.2**
    - File `src/pwa/pwa-prompt-state.property.test.ts`

  - [x] 16.3 Cập nhật `src/components/pwa-install-prompt.tsx`
    - Banner mảnh đáy (mobile) / card góc dưới phải (desktop), không dialog modal
    - Detect `beforeinstallprompt`; iOS Safari fallback hướng dẫn 3 bước tiếng Việt
    - _Requirements: 16.3, 16.4_

  - [x] 16.4 Cập nhật `src/components/mystic-cursor.tsx`
    - Chỉ kích hoạt `(hover: hover)`; chuyển `text` trên input/textarea/contenteditable; `pointer` trên a/button/role=button/select/label[for]
    - Reduced-motion: bỏ trail, dùng cursor hệ thống
    - Toggle qua dropdown user (Preferences); persist `localStorage["mystic-cursor-enabled"]`
    - `aria-hidden="true"`, `pointer-events: none`
    - _Requirements: 3.12, 17.1, 17.2, 17.3, 17.4, 17.5_

- [x] 17. Static analysis và lint design system
  - [x] 17.1 Tạo `scripts/lint-design-system.ts`
    - Rule `no-hex-in-tsx` (allowlist `index.css`, `export-card-*.tsx`)
    - Rule `no-arbitrary-spacing` (regex `(?:p|m|gap|px|py|mx|my)-\[\d+(?:\.\d+)?(?:px|rem)\]`)
    - Rule `no-banned-shadow` (`shadow-(2xl|xl)`)
    - Rule `no-purple-pink-indigo-gradient`
    - Rule `no-emoji-in-jsx` (whitelist `<span aria-label>`)
    - Rule `lang-attr` assert `<html lang="vi">`
    - Rule TSDoc presence cho `src/components/ui/*.tsx`
    - Build assertion: production bundle không chứa `design-tokens`
    - _Requirements: 1.1, 1.2, 1.5, 10.2, 10.3, 10.6, 10.7, 19.x, 20.4_

- [x] 18. Tài liệu và trang dev
  - [x] 18.1 Tạo `src/components/ui/README.md`
    - Mô tả spacing scale, type scale, color tokens, border radius, animation durations, breakpoints, primitive usage
    - _Requirements: 1.7, 20.1_

  - [x] 18.2 Tạo `docs/ux-guidelines.md`
    - Voice & tone tiếng Việt, microcopy rules, danh sách thông báo lỗi chuẩn, hướng dẫn empty/error/loading state, manual a11y checklist
    - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5, 20.2_

  - [x] 18.3 Tạo `src/pages/dev/design-tokens.tsx` và route guard
    - Bảng color tokens (light + dark), type scale, spacing 1–16, border radius 4 mức, button/badge variants, shadows
    - Route đăng ký trong `App.tsx` với `import.meta.env.DEV` guard
    - _Requirements: 20.3_

  - [x] 18.4 Bổ sung TSDoc cho mọi component primitive
    - File `src/components/ui/*.tsx` mỗi `export` có JSDoc: mục đích, props, ví dụ, lưu ý a11y
    - _Requirements: 20.4_

- [x] 19. Tích hợp cuối cùng và root error boundary
  - [x] 19.1 Tạo `src/components/root-error-boundary.tsx`
    - Wrap toàn cây React, fallback `ErrorState` toàn trang với nút "Tải lại trang"; dev mode hiển thị stack
    - Wrap `<Suspense>` quanh lazy chunks (export-card, recharts) bằng error boundary local
    - _Requirements: 5.4_

  - [x] 19.2 Lazy ảnh tĩnh
    - Thêm `loading="lazy"` `decoding="async"` cho mọi `<img>` ngoài viewport đầu tiên
    - _Requirements: 11.5_

  - [x] 19.3 Đảm bảo `<Toaster />` đặt sau PWA prompt và Mystic Cursor trong cây React
    - _Requirements: 5.9_

  - [x] 19.4 Cập nhật `App.tsx` lazy-load 15 trang + Suspense fallback Skeleton
    - _Requirements: 11.1_

  - [ ]* 19.5 Integration tests cho navigation và state preservation
    - Test scroll position khi back qua các module
    - Test active link highlight trong navbar
    - Test breadcrumb cho mỗi route
    - _Requirements: 7.3, 7.4, 7.6_

- [x] 20. Final checkpoint - Đảm bảo toàn bộ tests pass và build production sạch
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` là optional (chủ yếu test) và có thể tạm bỏ qua cho MVP, nhưng nên chạy trước khi merge.
- Mỗi property test reference đúng số Property trong design (Property 1–20) và requirements clause được kiểm.
- Các tiêu chí style/lint được cover bằng `scripts/lint-design-system.ts` ở task 17.1 thay vì test riêng.
- Backend, schema DB, logic huyền học không nằm trong scope — không sửa.
- Đảm bảo property tests dùng `numRuns: 100` mặc định (200 cho date round-trip) như thiết kế đã quy định.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.4", "2.1", "2.4"] },
    { "id": 1, "tasks": ["1.3", "2.2", "4.1", "4.3", "5.1", "5.3", "5.5"] },
    { "id": 2, "tasks": ["2.3", "3.1", "3.2", "3.3", "3.5", "3.6", "3.8", "3.9", "3.11", "3.12", "4.2", "4.4", "5.2", "5.4", "7.1"] },
    { "id": 3, "tasks": ["3.4", "3.7", "3.10", "4.5", "7.2", "7.4", "7.6", "8.1", "8.4", "8.5", "8.6", "9.1", "16.1", "17.1", "18.1", "18.2", "18.4"] },
    { "id": 4, "tasks": ["7.3", "7.5", "7.7", "8.2", "9.2", "9.3", "10.1", "10.2", "10.3", "13.2", "16.2", "16.3", "16.4", "18.3"] },
    { "id": 5, "tasks": ["8.3", "10.4", "13.1", "13.4", "13.5", "14.1", "14.2", "15.1", "15.2", "19.1", "19.2", "19.3"] },
    { "id": 6, "tasks": ["10.5", "10.6", "12.1", "13.3", "19.4"] },
    { "id": 7, "tasks": ["19.5"] }
  ]
}
```

