# `src/components/ui/` — Hệ thống thiết kế Huyền Bí

Tài liệu này mô tả các quy ước thiết kế dùng chung cho toàn bộ ứng dụng Huyền Bí: spacing, type scale, color tokens, border radius, animation, breakpoints, và bảng tra cứu nhanh các primitive đã có.

Mọi `Color_Token` đều được khai báo trong [`src/index.css`](../../index.css). Các giá trị dưới đây là nguồn duy nhất. Đừng hard-code hex/rgb trong file `.tsx`, đừng dùng giá trị Tailwind tuỳ ý dạng `p-[13px]` hay `mt-[2.3rem]`.

> Validates: Requirements 1.7, 20.1.

---

## 1. Spacing scale

Dùng đúng thang Tailwind chuẩn — bội số của `0.25rem` (4px). Tuyệt đối không dùng giá trị tuỳ ý kiểu `gap-[18px]`.

| Class | rem | px | Khi dùng |
| --- | --- | --- | --- |
| `gap-1` / `p-1` / `m-1` | `0.25rem` | 4 | Khoảng cách giữa icon và text trong cùng một nút, chip, badge. |
| `gap-2` / `p-2` | `0.5rem` | 8 | Khoảng cách giữa các phần tử nội dòng (label + helper text, icon + label trong list). |
| `gap-3` / `p-3` | `0.75rem` | 12 | Padding nội dung của input nhỏ, gap giữa các action button cùng nhóm. |
| `gap-4` / `p-4` | `1rem` | 16 | **Mặc định** cho gap giữa các trường trong form, padding card cỡ vừa, gap giữa các item trong list. |
| `gap-5` / `p-5` | `1.25rem` | 20 | Gap giữa các block phụ trong một section (heading + paragraph + CTA). |
| `gap-6` / `p-6` | `1.5rem` | 24 | Padding `<Card>` desktop, gap giữa các sub-section của cùng một Module_Page. |
| `gap-8` / `p-8` | `2rem` | 32 | Gap giữa các `<section>` chính của một trang trên desktop. |
| `gap-10` / `p-10` | `2.5rem` | 40 | Padding của hero/banner trên desktop, gap giữa header và body của Result_Card. |
| `gap-12` / `p-12` | `3rem` | 48 | Padding dọc của section landing trên desktop. |
| `gap-16` / `p-16` | `4rem` | 64 | Khoảng cách rất lớn giữa hai khu vực nội dung khác chủ đề (ví dụ giữa hero và bảng module). |

Trên mobile, mặc định giảm một mức (ví dụ `p-8 md:p-12`). Không nhảy hai mức để tránh giật bố cục khi chuyển breakpoint.

> Validates: Requirements 1.2.

---

## 2. Type scale

Sáu mức được khai báo qua biến `--font-size-*` và `--line-height-*` trong `src/index.css`. Heading dùng line-height ngắn (1.1), body 1.5, small 1.4.

| Mức | Token CSS | rem | px | Line-height | Khi dùng |
| --- | --- | --- | --- | --- | --- |
| `display` | `--font-size-display` | `3rem` | 48 | 1.1 | Tiêu đề hero ở trang chủ, splash screen. Một lần duy nhất trên mỗi trang. |
| `h1` | `--font-size-h1` | `2.25rem` | 36 | 1.1 | Tiêu đề chính của một Module_Page. **Đúng một `<h1>` mỗi trang.** |
| `h2` | `--font-size-h2` | `1.75rem` | 28 | 1.1 | Tiêu đề section trong cùng trang (ví dụ "Lá số tháng", "Phân tích chi tiết"). |
| `h3` | `--font-size-h3` | `1.375rem` | 22 | 1.1 | Tiêu đề sub-section, tiêu đề `<Card>` lớn. |
| `body` | `--font-size-body` | `1rem` | 16 | 1.5 | Văn bản đoạn, mô tả, nội dung kết quả AI. **Mặc định.** |
| `small` | `--font-size-small` | `0.875rem` | 14 | 1.4 | Caption, helper text, metadata, microcopy phụ. |

Không bỏ cấp tiêu đề: từ `h1` chỉ xuống `h2`, không nhảy thẳng sang `h3`.

> Validates: Requirements 1.3, 1.4.

---

## 3. Color tokens (semantic)

Mọi giá trị màu trong `.tsx` phải tham chiếu một trong các token sau qua util Tailwind (`bg-primary`, `text-foreground`, …) hoặc CSS var (`hsl(var(--primary))`). Hex và `rgb()` chỉ được phép trong `src/index.css` và file định nghĩa SVG export card (html2canvas).

| Token | Util Tailwind | Khi dùng |
| --- | --- | --- |
| `--background` | `bg-background` | Nền trang gốc. Mọi nội dung mặc định nằm trên token này. |
| `--foreground` | `text-foreground` | Màu chữ mặc định. Dùng cho body text, heading, label trên `--background` hoặc `--card`. |
| `--card` | `bg-card`, `text-card-foreground` | Nền của `<Card>`, panel, popover surface lớn. Đi kèm `--card-foreground`. |
| `--muted` | `bg-muted`, `text-muted-foreground` | Background phụ (skeleton, ô input disabled, divider area). `--muted-foreground` dùng cho helper text, caption, metadata. |
| `--primary` | `bg-primary`, `text-primary-foreground`, `text-primary` | Màu thương hiệu — vàng huyền bí. Dùng cho CTA chính, link, icon nhấn, focus accent. |
| `--accent` | `bg-accent`, `text-accent-foreground` | Highlight phụ (hover state của navigation, badge "mới", chip filter active). |
| `--destructive` | `bg-destructive`, `text-destructive-foreground` | Cảnh báo / lỗi / hành động phá huỷ (xoá, huỷ). Dùng kèm icon, không chỉ dựa vào màu. |
| `--border` | `border-border` | Đường viền mặc định cho card, input, divider. |
| `--ring` | `ring-ring`, `outline-ring` | Vòng focus bàn phím (≥ 2px). Bắt buộc xuất hiện trên mọi phần tử tương tác khi nhận focus. |

Các token bổ sung (`--popover`, `--secondary`, `--sidebar`, `--input`) có vai trò chuyên biệt và đã được wired sẵn vào primitive tương ứng — không cần tham chiếu trực tiếp ngoài primitive trừ khi thật sự cần.

Cả `light` và `dark` mode đều phải đạt WCAG 2.1 AA: 4.5:1 cho text thường, 3:1 cho text lớn / phần tử UI không phải text. Test contrast nằm tại [`design-tokens.ts`](./design-tokens.ts).

> Validates: Requirements 1.1, 2.1, 3.2, 3.8.

---

## 4. Border radius

Bốn mức tách rời. Không bo `rounded-2xl` đồng nhất khắp nơi — đó là một "AI trope".

| Token | Util Tailwind | rem | px | Mapping component |
| --- | --- | --- | --- | --- |
| `--radius-sm` | `rounded-sm` | `0.25rem` | 4 | `<Input>`, `<Badge>`, ô tag, chip filter. |
| `--radius-md` | `rounded-md` | `0.375rem` | 6 | `<Button>` mọi variant, `<Toggle>`, `<Switch>` thumb. |
| `--radius-lg` | `rounded-lg` | `0.75rem` | 12 | `<Card>`, `<Popover>`, `<DropdownMenu>` content. |
| `--radius-xl` | `rounded-xl` | `1.25rem` | 20 | Hero, `<Dialog>` lớn, `<Sheet>`, splash card đặc biệt. |

Khi cần bo tròn nửa (avatar, FAB tròn) dùng `rounded-full`, không tạo mức mới.

> Validates: Requirements 1.6.

---

## 5. Animation durations

Khai báo tập trung trong [`./animation-registry.ts`](./animation-registry.ts). Mọi component cần motion phải import variant từ registry — đừng hard-code `transition-duration` hoặc cubic-bezier inline.

Tóm tắt range:

- **Tương tác (button hover, dropdown enter/exit, dialog enter/exit, tab switch, toast):** `duration ∈ [120ms, 400ms]`.
- **Reveal / chuyển trang lớn (scroll reveal, page transition):** `duration ∈ [400ms, 800ms]`.
- **Easing enter:** `cubic-bezier(0.22, 0.61, 0.36, 1)` (ease-out).
- **Easing exit:** `cubic-bezier(0.4, 0, 1, 1)` (ease-in).
- **Không** dùng `linear` cho chuyển động không gian.
- Khi `prefers-reduced-motion: reduce`, registry resolve mọi variant về fade ≤ 150ms hoặc tắt hẳn (orb drift, tilt 3D, glow-pulse, shimmer-text).

> Validates: Requirements 9.2, 9.3, 9.4.

---

## 6. Breakpoints

App được kiểm thử ở **4 breakpoint chuẩn**: 320, 768, 1024, 1440. Tên Tailwind tương ứng:

| Tên Tailwind | min-width | Thiết bị tham chiếu |
| --- | --- | --- |
| (mặc định, mobile-first) | 0 | Mobile nhỏ (320px là lower bound được test). |
| `sm:` | 640px | Mobile lớn / phablet. |
| `md:` | 768px | Tablet portrait. |
| `lg:` | 1024px | Tablet landscape / laptop nhỏ. |
| `xl:` | 1280px | Desktop chuẩn (1440 vẫn rơi vào range này). |
| `2xl:` | 1536px | Desktop rộng. |

Các property test (Property 8 — không tràn ngang) chốt giá trị trên `{320, 768, 1024, 1440}`. Khi viết layout responsive mới, kiểm tra ít nhất 4 mốc này. Hằng số `STANDARD_BREAKPOINTS` nằm tại `src/test/generators.ts`.

Mobile-first: mặc định không prefix, các prefix `md:` / `lg:` chỉ override để đi lên kích thước lớn hơn.

> Validates: Requirements 4.1, 4.7.

---

## 7. Bảng tra cứu primitive

Khi thêm component mới dưới `src/components/`, **tái sử dụng** các primitive sau thay vì tạo lại. Chỉ tạo mới nếu không primitive nào phù hợp — và khi đó phải đặt trong `src/components/ui/` để các tính năng khác cùng dùng.

| Primitive | Mục đích | File |
| --- | --- | --- |
| `Button` | Nút hành động chính/phụ; mọi variant (default, secondary, outline, ghost, destructive, link) đều ở variant prop. | [`button.tsx`](./button.tsx) |
| `Card` | Container có border + radius `lg` + padding chuẩn cho block nội dung độc lập (lá số, kết quả mô-đun). | [`card.tsx`](./card.tsx) |
| `Input` | Ô nhập text/number với hỗ trợ `error`, `aria-invalid`, helper text. | [`input.tsx`](./input.tsx) |
| `Dialog` | Modal có FocusTrap, ESC đóng, overlay mờ; dùng cho confirm, share, so sánh. | [`dialog.tsx`](./dialog.tsx) |
| `DropdownMenu` | Menu nổi từ trigger; dùng cho user menu, action overflow, sub-navigation. | [`dropdown-menu.tsx`](./dropdown-menu.tsx) |
| `Badge` | Pill nhỏ cho trạng thái, tag, đếm số. Variant default / secondary / destructive / outline. | [`badge.tsx`](./badge.tsx) |
| `Tabs` | Chuyển panel cùng cấp trong một trang; ARIA tabs đầy đủ qua Radix. | [`tabs.tsx`](./tabs.tsx) |
| `Tooltip` | Gợi ý ngắn khi hover/focus icon-only button hoặc dữ liệu biểu đồ. | [`tooltip.tsx`](./tooltip.tsx) |
| `Skeleton` | Placeholder loading có shimmer; biến thể `SkeletonCard`, `SkeletonChart`, `SkeletonListRow`. | [`skeleton.tsx`](./skeleton.tsx) |
| `EmptyState` | Khi không có dữ liệu: icon + title + description + CTA. Dùng tiếng Việt, tránh từ mơ hồ. | [`empty-state.tsx`](./empty-state.tsx) |
| `ErrorState` | Khi request lỗi/network/4xx/5xx/429: status, message chuẩn, nút "Thử lại". | [`error-state.tsx`](./error-state.tsx) |
| `FocusTrap` | Bẫy Tab focus bên trong region (dialog, drawer, sheet); ESC trả focus về trigger. | [`focus-trap.tsx`](./focus-trap.tsx) |
| `SkipLink` | Link "Bỏ qua tới nội dung chính" hiện khi focus đầu tiên; gắn ở đầu mọi layout. | [`skip-link.tsx`](./skip-link.tsx) |
| `DateInput` | Nhập ngày `dd/MM/yyyy` có validate, không phụ thuộc locale của browser. | [`date-input.tsx`](./date-input.tsx) |

Nếu cần một primitive chưa có (ví dụ `Stepper`, `Combobox`), hãy đề xuất trong design doc trước khi tạo — tránh sinh ra biến thể chỉ dùng một lần.

> Validates: Requirements 1.5, 5.7, 5.4, 3.6, 3.7, 3.10.

---

## Cập nhật tài liệu này

Bất kỳ thay đổi token, primitive, hoặc breakpoint mới nào đều phải:

1. Cập nhật `src/index.css` (nếu là token CSS).
2. Cập nhật bảng tương ứng ở đây.
3. Cập nhật `docs/ux-guidelines.md` nếu thay đổi ảnh hưởng đến voice & tone hoặc microcopy.
4. Bổ sung TSDoc cho primitive mới (Requirement 20.4).
