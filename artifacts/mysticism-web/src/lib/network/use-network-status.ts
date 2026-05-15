import { useEffect, useState } from "react";

/** Trạng thái kết nối mạng của trình duyệt. */
export type NetworkStatus = "online" | "offline";

/**
 * Kết quả trả về của {@link useNetworkStatus}.
 *
 * - `status`: `"online"` hoặc `"offline"` theo `navigator.onLine` và sự kiện
 *   `online` / `offline` của `window`.
 * - `offlineSince`: timestamp (ms epoch) khi chuyển sang offline gần nhất;
 *   `null` khi đang online hoặc chưa từng offline.
 */
export interface UseNetworkStatusResult {
  status: NetworkStatus;
  offlineSince: number | null;
}

interface InternalState {
  status: NetworkStatus;
  offlineSince: number | null;
}

/**
 * Trả về giá trị khởi tạo an toàn cho SSR (chưa có `window`/`navigator`).
 * Mặc định coi như online để tránh render banner offline trên server.
 */
function getInitialState(): InternalState {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return { status: "online", offlineSince: null };
  }
  const online = navigator.onLine;
  return {
    status: online ? "online" : "offline",
    offlineSince: online ? null : Date.now(),
  };
}

/**
 * Hook subscribe sự kiện `online` / `offline` của `window` và phơi bày
 * trạng thái mạng dưới dạng `{ status, offlineSince }`.
 *
 * - Khởi tạo từ `navigator.onLine`.
 * - Khi nhận `offline`: set `offlineSince = Date.now()` (chỉ ghi lần đầu
 *   trong một chuỗi offline, để giữ thời điểm bắt đầu mất kết nối).
 * - Khi nhận `online`: reset `offlineSince = null`.
 * - Cleanup listeners khi unmount.
 * - SSR-safe: trả `{ status: "online", offlineSince: null }` khi không có `window`.
 *
 * Validates Requirements 18.1, 18.3.
 */
export function useNetworkStatus(): UseNetworkStatusResult {
  const [state, setState] = useState<InternalState>(getInitialState);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOffline = () => {
      setState((prev) =>
        prev.status === "offline"
          ? prev
          : { status: "offline", offlineSince: Date.now() },
      );
    };

    const handleOnline = () => {
      setState((prev) =>
        prev.status === "online"
          ? prev
          : { status: "online", offlineSince: null },
      );
    };

    // Đồng bộ lại trạng thái khi mount: navigator.onLine có thể đã đổi
    // giữa lúc render và lúc effect chạy.
    if (typeof navigator !== "undefined") {
      if (navigator.onLine) {
        handleOnline();
      } else {
        handleOffline();
      }
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return state;
}
