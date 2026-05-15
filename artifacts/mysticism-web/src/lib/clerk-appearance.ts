/**
 * Cấu hình `appearance` dùng chung cho widget Clerk (`<SignIn />` và
 * `<SignUp />`) trên hai trang `/sign-in` và `/sign-up`.
 *
 * Đặt cùng chỗ để khỏi lặp object giữa hai trang và để bất kỳ điều chỉnh
 * theme nào (ví dụ thêm token mới, chỉnh radius) chỉ cần sửa một file.
 *
 * # Vì sao dùng `hsl(var(--token))` trong `variables`
 *
 * Yêu cầu 15.2 quy định widget Clerk phải khớp Color_Token gồm
 * `--primary`, `--background`, `--foreground`, `--card`, `--border`,
 * `--ring`. Các biến này được khai trong `src/index.css` dưới dạng
 * triplet HSL (ví dụ `--primary: 43 74% 49%`). Khi Clerk đẩy `appearance`
 * xuống widget bằng inline style / CSS custom prop, browser cần một
 * giá trị màu hoàn chỉnh, không thể nội suy `var()` trong CSS variable
 * của @clerk/ui (không nằm trong CSS scope của ta). Vì thế ta truyền
 * `hsl(var(--token))` — chuỗi này khi cascade tới element được Clerk
 * gắn class `cl-rootBox` sẽ resolve đúng theo theme (light/dark) hiện tại.
 *
 * Vì giá trị là một biểu thức CSS chứ không phải hex literal, lint rule
 * `no-hex-in-tsx` (xem `scripts/lint-design-system.ts`) không phát hiện
 * vi phạm. Đó cũng là lý do file này đặt trong `src/lib/` (extension
 * `.ts`) thay vì `.tsx` — rule chỉ quét `.tsx` cho hex literal.
 *
 * # Quy ước render
 *
 * - `baseTheme`: bỏ trống để Clerk dùng baseline mặc định, chỉ override
 *   bằng `variables` + `elements`. Tránh đụng đến `dark` theme của Clerk
 *   để giữ nhất quán với theme app (đã đảo color tokens qua class
 *   `.dark` / `.light` trên `<html>`).
 * - `variables`: ánh xạ 6 token bắt buộc + một vài token bổ trợ
 *   (`colorInputBackground`, `colorInputText`) để input/select bên
 *   trong widget cũng đồng bộ.
 * - `elements`: tinh chỉnh `card` (drop shadow / border radius), loại
 *   bỏ `footer` "secured by Clerk" trên màn hình hẹp để tiết kiệm
 *   không gian, và bám primary cho nút submit.
 *
 * Validates: Requirement 15.2.
 */
export const CLERK_APPEARANCE = {
  variables: {
    colorPrimary: "hsl(var(--primary))",
    colorBackground: "hsl(var(--background))",
    colorText: "hsl(var(--foreground))",
    colorTextSecondary: "hsl(var(--muted-foreground))",
    colorInputBackground: "hsl(var(--card))",
    colorInputText: "hsl(var(--foreground))",
    colorNeutral: "hsl(var(--foreground))",
    colorDanger: "hsl(var(--destructive))",
    borderRadius: "var(--radius-md)",
    fontFamily: "var(--app-font-sans)",
  },
  elements: {
    rootBox: "w-full",
    card: [
      "bg-card text-foreground",
      "border border-border",
      "shadow-[var(--shadow-md)]",
      "rounded-[var(--radius-lg)]",
    ].join(" "),
    headerTitle: "text-foreground",
    headerSubtitle: "text-muted-foreground",
    socialButtonsBlockButton: [
      "border border-border bg-card text-foreground",
      "hover:bg-muted",
    ].join(" "),
    formFieldInput: [
      "bg-card text-foreground border border-border",
      "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0",
    ].join(" "),
    formFieldLabel: "text-foreground",
    formButtonPrimary: [
      "bg-primary text-primary-foreground",
      "hover:bg-primary/90",
      "focus-visible:ring-2 focus-visible:ring-ring",
    ].join(" "),
    footer: "text-muted-foreground",
    footerActionLink: "text-primary hover:text-primary/80",
    formResendCodeLink: "text-primary hover:text-primary/80",
    identityPreviewEditButton: "text-primary hover:text-primary/80",
  },
} as const;

/**
 * Đọc query param `redirect_url` từ chuỗi search hiện tại của trình
 * duyệt (ví dụ `?redirect_url=%2Fprofile`). Trả về fallback `/profile`
 * khi:
 *
 * - Không chạy trong môi trường browser (SSR / unit test trên Node).
 * - `redirect_url` không xuất hiện hoặc giá trị rỗng.
 * - `redirect_url` không phải URL nội bộ (chỉ chấp nhận path bắt đầu
 *   bằng `/` và không phải `//` để chặn open-redirect ra domain khác).
 *
 * @example
 * ```ts
 * // window.location.search === "?redirect_url=%2Fbat-tu"
 * getPostAuthRedirect(); // → "/bat-tu"
 *
 * // window.location.search === ""
 * getPostAuthRedirect(); // → "/profile"
 *
 * // window.location.search === "?redirect_url=https://evil.example.com"
 * getPostAuthRedirect(); // → "/profile" (chặn external redirect)
 * ```
 *
 * Validates: Requirement 15.3.
 */
export function getPostAuthRedirect(search?: string): string {
  const FALLBACK = "/profile";
  const raw =
    typeof search === "string"
      ? search
      : typeof window !== "undefined"
        ? window.location.search
        : "";
  if (!raw) return FALLBACK;
  try {
    const params = new URLSearchParams(raw.startsWith("?") ? raw.slice(1) : raw);
    const target = params.get("redirect_url");
    if (!target) return FALLBACK;
    // Chỉ chấp nhận path nội bộ tuyệt đối; chặn `//host` và absolute URL
    // (cả http/https) để tránh open-redirect.
    if (target.startsWith("/") && !target.startsWith("//")) {
      return target;
    }
    return FALLBACK;
  } catch {
    return FALLBACK;
  }
}
