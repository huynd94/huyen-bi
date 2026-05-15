import { useEffect, useRef } from "react";
import { WifiOff } from "lucide-react";

import { cn } from "@/lib/utils";
import { useNetworkStatus } from "@/lib/network/use-network-status";
import { showToast } from "@/lib/toast";
import { ERROR_MESSAGES } from "@/lib/error-messages";

/**
 * Banner sticky toàn cục báo trạng thái mất kết nối mạng.
 *
 * Hành vi (theo Requirement 18.1, 18.3 và Section 7 "Network status & offline"
 * trong `design.md`):
 *
 * - Tự subscribe trạng thái mạng qua hook {@link useNetworkStatus}; component
 *   không nhận props để có thể "drop-in" ở root tree một lần duy nhất
 *   (xem `App.tsx`).
 * - Khi `status === "offline"`: render banner sticky ở đỉnh viewport với
 *   `role="status"` + `aria-live="polite"` để screen reader đọc nhẹ nhàng,
 *   không cướp focus như `assertive`.
 * - Khi chuyển từ `offline` → `online`: ẩn banner và emit toast
 *   "Đã kết nối lại" (variant `success`, theo task 5.4) qua wrapper
 *   {@link showToast}. Không emit toast khi mount ban đầu vào trạng thái
 *   online — chỉ emit ở chuyển trạng thái thực sự.
 * - Microcopy đọc trực tiếp từ {@link ERROR_MESSAGES} (`network_offline`
 *   và `network_reconnected`) để giữ tiếng Việt sentence case nhất quán
 *   (Requirement 19.1, 19.2).
 *
 * A11y:
 * - `role="status"` + `aria-live="polite"`: thông báo nhẹ nhàng, không cắt
 *   ngang ngữ cảnh hiện tại (Req 18.1).
 * - Icon `WifiOff` đặt `aria-hidden="true"` vì nội dung chữ đã đủ ngữ nghĩa.
 * - Dùng cặp `bg-destructive` / `text-destructive-foreground` là semantic
 *   token đã cân chỉnh tương phản (≥ 4.5:1) trong cả light + dark theme.
 *
 * Vị trí trong DOM:
 * - `position: sticky; top: 0` để banner luôn dính trên cùng khi scroll.
 * - `z-50` đặt trên Navbar nhưng dưới Toaster (sonner mặc định ở viewport
 *   riêng) để toast "Đã kết nối lại" vẫn nổi bên trên khi chuyển trạng thái.
 *
 * @example
 * // Mount một lần ở root.
 * <OfflineBanner />
 */
export function OfflineBanner() {
  const { status } = useNetworkStatus();
  const isOffline = status === "offline";

  /**
   * Trạng thái mạng ở lần render trước. Dùng để phát hiện chuyển tiếp
   * `offline → online` và chỉ emit toast khi thực sự "reconnect", không
   * phải lúc mount lần đầu vào trạng thái online.
   *
   * Khởi tạo bằng status hiện tại (lazy initializer của `useRef` không
   * được hỗ trợ kiểu — đặt qua effect bên dưới sau lần render đầu).
   */
  const prevStatusRef = useRef<typeof status | null>(null);

  useEffect(() => {
    const prev = prevStatusRef.current;
    if (prev === "offline" && status === "online") {
      showToast({
        variant: "success",
        title: ERROR_MESSAGES.network_reconnected,
      });
    }
    prevStatusRef.current = status;
  }, [status]);

  if (!isOffline) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="offline-banner"
      className={cn(
        "sticky top-0 z-50 w-full",
        "bg-destructive text-destructive-foreground",
        "border-b border-destructive-border",
        "shadow-sm",
      )}
    >
      <div
        className={cn(
          "mx-auto flex max-w-7xl items-center justify-center gap-2",
          "px-4 py-2 text-sm font-medium",
        )}
      >
        <WifiOff aria-hidden="true" className="h-4 w-4 shrink-0" />
        <span>{ERROR_MESSAGES.network_offline}</span>
      </div>
    </div>
  );
}

export default OfflineBanner;
