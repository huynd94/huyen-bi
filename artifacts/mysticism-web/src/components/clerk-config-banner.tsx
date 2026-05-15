import * as React from "react";
import { Info } from "lucide-react";

import { cn } from "@/lib/utils";
import { isClerkEnabled } from "@/lib/auth-config";

/**
 * Microcopy tiếng Việt hiển thị khi `VITE_CLERK_PUBLISHABLE_KEY` không được
 * cấu hình. Tách ra hằng số export để các test / docs có thể tham chiếu mà
 * không cần lặp chuỗi.
 *
 * Voice & tone (Requirement 19.1, 19.2): tiếng Việt sentence case, có dấu,
 * formal-warm, ngôi xưng "bạn". Bám đúng nguyên văn ở mục "Failure modes &
 * fallbacks" trong `design.md` (`<ClerkConfigBanner>` row).
 */
export const CLERK_CONFIG_BANNER_MESSAGE =
  "Tài khoản tạm thời chưa khả dụng. Bạn vẫn có thể sử dụng 15 mô-đun mà không cần đăng nhập." as const;

/**
 * Props for {@link ClerkConfigBanner}.
 *
 * Component không nhận `style` / màu tuỳ ý — toàn bộ giao diện neo vào
 * design tokens (Requirement 1.1, 1.2). Nếu cần override layout (margin,
 * max-width), truyền qua `className`.
 */
export interface ClerkConfigBannerProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "role" | "children"> {
  /**
   * Khi `true`, banner sẽ render ngay cả khi Clerk đã được cấu hình. Mặc
   * định component tự ẩn nếu {@link isClerkEnabled} trả về `true`. Cờ này
   * dùng cho trang dev (`/dev/design-tokens`) hoặc Storybook để xem trước
   * giao diện mà không cần xoá biến môi trường.
   */
  forceShow?: boolean;
}

/**
 * Banner cảnh báo cấu hình Clerk thiếu, dùng cho `/sign-in`, `/sign-up` và
 * (tuỳ chọn) các trang khác cần thông báo "tài khoản chưa khả dụng".
 *
 * Hành vi (Requirement 15.4):
 *
 * - Đọc trạng thái Clerk qua hằng số {@link isClerkEnabled} (chính nó kiểm
 *   tra `import.meta.env.VITE_CLERK_PUBLISHABLE_KEY` và `process.env` cho
 *   môi trường tsx test). Nếu Clerk đã bật, component trả về `null` để
 *   tránh thêm noise vào DOM.
 * - Khi Clerk chưa bật (hoặc `forceShow={true}`): render một khối tĩnh có
 *   `role="status"` và `aria-live="polite"` để screen reader thông báo nhẹ
 *   nhàng, không cướp focus như `assertive`.
 * - Microcopy lấy từ {@link CLERK_CONFIG_BANNER_MESSAGE} (đúng nguyên văn
 *   trong design doc). Không truyền `children` — banner chủ ý cố định
 *   thông điệp để giữ nhất quán giữa các trang.
 *
 * Style:
 *
 * - Nền `bg-muted` + chữ `text-muted-foreground` (cặp đã đăng ký trong
 *   `design-tokens.ts`, đạt contrast ≥ 4.5:1) cho cảm giác "thông báo
 *   nhẹ", phân biệt rõ với `bg-destructive` của {@link OfflineBanner}.
 * - Viền `border-border` mỏng + `rounded-[var(--radius-md)]` (6px) bám
 *   đúng yêu cầu task ("use --radius-md") và radius scale ở `index.css`.
 * - Padding `px-4 py-3` thuộc 4px scale (Requirement 1.2, kiểm bởi
 *   `lint-design-system.ts` rule `no-arbitrary-spacing`).
 *
 * Vị trí dùng:
 *
 * - `src/pages/sign-in.tsx` và `src/pages/sign-up.tsx`: render trên cùng
 *   khối form Clerk. Hiện tại 2 trang đang `<Redirect to="/" />` khi
 *   `!isClerkEnabled`; khi tích hợp banner, các trang nên giữ layout và
 *   thay redirect bằng banner + hướng dẫn dùng 15 mô-đun không đăng nhập.
 * - Có thể tái sử dụng ở `Profile`, `Lich-Su` nếu thêm nút "Đăng nhập" mà
 *   Clerk lại không khả dụng.
 *
 * A11y:
 *
 * - `role="status"` + `aria-live="polite"`: thông báo trạng thái không cắt
 *   ngang ngữ cảnh (Requirement 3.4 không bắt buộc, nhưng nhất quán với
 *   {@link OfflineBanner}).
 * - Icon `Info` từ `lucide-react` đặt `aria-hidden="true"` — nội dung chữ
 *   đã đủ ngữ nghĩa cho screen reader.
 *
 * @example
 * ```tsx
 * // src/pages/sign-in.tsx
 * import { ClerkConfigBanner } from "@/components/clerk-config-banner";
 *
 * export default function SignInPage() {
 *   return (
 *     <div className="min-h-screen flex flex-col bg-background">
 *       <Navbar />
 *       <div className="flex-1 flex items-center justify-center px-4 pt-20">
 *         <div className="w-full max-w-md space-y-4">
 *           <ClerkConfigBanner />
 *           {isClerkEnabled ? <SignIn ... /> : null}
 *         </div>
 *       </div>
 *     </div>
 *   );
 * }
 * ```
 *
 * Validates: Requirement 15.4.
 */
export function ClerkConfigBanner({
  className,
  forceShow = false,
  ...rest
}: ClerkConfigBannerProps) {
  if (!forceShow && isClerkEnabled) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="clerk-config-banner"
      className={cn(
        "flex items-start gap-2 border border-border bg-muted text-muted-foreground",
        "px-4 py-3 text-sm leading-relaxed",
        "rounded-[var(--radius-md)]",
        className,
      )}
      {...rest}
    >
      <Info aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{CLERK_CONFIG_BANNER_MESSAGE}</span>
    </div>
  );
}

export default ClerkConfigBanner;
