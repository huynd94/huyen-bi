import { useEffect, useRef } from "react";
import { saveToHistory, type HistoryEntry } from "./history";

/**
 * Hook tự động lưu vào lịch sử localStorage khi kết quả thay đổi.
 * Chỉ lưu lần đầu tiên kết quả xuất hiện (tránh duplicate khi re-render).
 * entry = null khi chưa có kết quả.
 */
export function useAutoHistory(
  entry: Omit<HistoryEntry, "id" | "timestamp"> | null,
): void {
  const lastKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!entry || !entry.result) return;
    const key = `${entry.module}::${entry.title}`;
    if (lastKeyRef.current === key) return;
    lastKeyRef.current = key;
    saveToHistory(entry);
  }, [entry?.module, entry?.title, entry?.result]);
}
