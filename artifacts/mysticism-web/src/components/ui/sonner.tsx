import * as React from "react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

import { useIsMobile } from "@/hooks/use-mobile";
import { useTheme } from "@/contexts/theme";

/**
 * Default toast lifetime. 4 giây — đáp ứng Requirement 5.9
 * ("toast tiếng Việt với icon success trong ≤4 giây"). Override per
 * call qua prop `duration` của `<Toaster>` hoặc per toast qua
 * `showToast` helper trong `@/lib/toast`.
 */
const DEFAULT_DURATION_MS = 4000;

/**
 * Toaster (sonner) — wrapper duy nhất nên mount ở root tree (App.tsx),
 * cấu hình sẵn theo design system Huyền Bí.
 *
 * Mục đích: hiển thị toast tiếng Việt cho mọi flow (đăng nhập thành
 * công, lưu lá số, lỗi mạng,...). Component bám {@link useTheme} của
 * `@/contexts/theme` và {@link useIsMobile} để tự đổi theme + position
 * mà không cần consumer truyền props.
 *
 * Mặc định:
 * - `richColors=true` — bộ màu success/error/warning/info đã bám
 *   `--background`/`--foreground` của theme.
 * - `duration=4000ms` — đáp ứng Requirement 5.9 ("toast tiếng Việt
 *   với icon success trong ≤4 giây").
 * - `position`: `top-center` trên mobile (<768px) để không che CTA ở
 *   đáy form, `bottom-right` trên tablet/desktop để không che navbar.
 * - `theme`: bám {@link useTheme}; khi `isSystem === true`, truyền
 *   `"system"` cho sonner để tự đổi theme khi `prefers-color-scheme`
 *   thay đổi.
 *
 * Props: kế thừa toàn bộ `ToasterProps` của `sonner` — mọi prop
 * truyền vào sẽ override default tương ứng. `toastOptions.classNames`
 * được merge với class default thay vì ghi đè.
 *
 * Lưu ý a11y: sonner tự gắn `role="status"` (info/success) hoặc
 * `role="alert"` (error/warning) cho từng toast và quản lý focus.
 * Toast tự dismiss sau `duration`; đảm bảo nội dung toast là độc lập
 * (không phải hành động bắt buộc) — hành động bắt buộc nên dùng
 * {@link Dialog} thay vì toast.
 *
 * Component này chỉ nên mount **một lần** ở root tree (App.tsx). Mọi
 * consumer hãy gọi `showToast(...)` từ `@/lib/toast` thay vì import
 * trực tiếp `toast` từ `sonner` để giữ wrapper variant nhất quán.
 *
 * @example
 * ```tsx
 * // Trong App.tsx
 * <Toaster />
 *
 * // Trong consumer:
 * import { showToast } from "@/lib/toast";
 * showToast.success("Đã lưu lá số");
 * ```
 */
const Toaster = ({
  duration,
  position,
  richColors,
  theme: themeOverride,
  toastOptions,
  ...props
}: ToasterProps) => {
  const { theme, isSystem } = useTheme();
  const isMobile = useIsMobile();

  const resolvedTheme: ToasterProps["theme"] =
    themeOverride ?? (isSystem ? "system" : theme);
  const resolvedPosition: ToasterProps["position"] =
    position ?? (isMobile ? "top-center" : "bottom-right");

  return (
    <Sonner
      theme={resolvedTheme}
      position={resolvedPosition}
      richColors={richColors ?? true}
      duration={duration ?? DEFAULT_DURATION_MS}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          ...toastOptions?.classNames,
        },
        ...toastOptions,
      }}
      {...props}
    />
  );
};

export { Toaster };
