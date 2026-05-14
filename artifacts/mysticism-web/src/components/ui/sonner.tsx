import * as React from "react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

import { useIsMobile } from "@/hooks/use-mobile";
import { useTheme } from "@/contexts/theme";

/**
 * Cấu hình mặc định của Toaster cho ứng dụng Huyền Bí.
 *
 * - `richColors`: dùng bộ màu success/error/warning/info có sẵn của
 *   sonner, tự bám theo `--background`/`--foreground` của theme.
 * - `duration`: 4 giây — đáp ứng Requirement 5.9 ("hiển thị toast tiếng
 *   Việt với icon success trong ≤4 giây").
 * - `position`: responsive theo breakpoint:
 *   - `top-center` trên mobile (<768px) để không che CTA ở đáy form.
 *   - `bottom-right` trên tablet/desktop để không che navbar sticky.
 *
 * Theme bám `ThemeProvider` dự án (`@/contexts/theme`). Khi user chưa
 * override (`isSystem === true`), truyền `"system"` cho sonner để lib
 * tự đổi theme khi `prefers-color-scheme` thay đổi.
 *
 * Component này chỉ nên mount **một lần** ở root tree (App.tsx). Mọi
 * consumer hãy gọi `showToast(...)` từ `@/lib/toast` thay vì import
 * trực tiếp `toast` từ `sonner` để giữ wrapper variant nhất quán.
 *
 * @example
 * // Trong App.tsx
 * <Toaster />
 */
const DEFAULT_DURATION_MS = 4000;

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
