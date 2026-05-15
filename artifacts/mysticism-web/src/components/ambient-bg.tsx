import { useEffect, useState, type CSSProperties } from "react";
import { useTheme, type Theme } from "@/contexts/theme";

/**
 * Mức opacity tối đa (mặc định) của `Ambient_Background` ở dark mode.
 *
 * Ràng buộc đến từ Requirement 10.8: nền orb không được vượt 35% để vẫn
 * giữ độ đọc của bảng và biểu đồ trên Module_Page.
 */
export const AMBIENT_OPACITY_DARK_MAX = 0.35 as const;

/**
 * Mức opacity tối đa của `Ambient_Background` ở light mode.
 *
 * Ràng buộc đến từ Requirement 2.6 ("≥ 40% giảm so với dark mode") và
 * Requirement 10.8 ("≤ 15% trong light mode"). Giá trị 0.15 thoả cả hai
 * (0.15 ≤ 0.6 × 0.35 = 0.21).
 */
export const AMBIENT_OPACITY_LIGHT_MAX = 0.15 as const;

/**
 * Tỷ lệ tối đa giữa opacity light vs dark mà Property 4 yêu cầu (Requirement
 * 2.6). Light phải ≤ 0.6 × dark — tức giảm tối thiểu 40%.
 */
export const AMBIENT_LIGHT_TO_DARK_RATIO_MAX = 0.6 as const;

// ─── Star & Cloud Configuration Constants ────────────────────────────────────

/** Number of star points in the star field CSS background */
export const STAR_FIELD_COUNT = 60;

/** Twinkle animation duration range in seconds */
export const STAR_TWINKLE_DURATION_RANGE = [4, 8] as const;

/** Drift animation duration for star field in seconds */
export const STAR_DRIFT_DURATION = 90;

/** Number of cloud elements */
export const CLOUD_COUNT = 5;

/** Cloud drift animation duration range in seconds */
export const CLOUD_DRIFT_DURATION_RANGE = [30, 80] as const;

/** Cloud opacity range */
export const CLOUD_OPACITY_RANGE = [0.4, 0.8] as const;

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Tính opacity wrapper của `Ambient_Background` theo theme hiện tại.
 *
 * Hàm pure để có thể được kiểm tra bằng property test riêng (Property 4)
 * mà không cần render component.
 *
 * Đảm bảo các bất biến:
 *
 * - `compute("dark") ≤ 0.35`
 * - `compute("light") ≤ 0.15`
 * - `compute("light") ≤ 0.6 × compute("dark")`
 *
 * @example
 *   computeAmbientOpacity("dark");  // => 0.35
 *   computeAmbientOpacity("light"); // => 0.15
 */
export function computeAmbientOpacity(theme: Theme): number {
  return theme === "light" ? AMBIENT_OPACITY_LIGHT_MAX : AMBIENT_OPACITY_DARK_MAX;
}

/**
 * Đọc preference `prefers-reduced-motion: reduce` an toàn cho SSR và các
 * môi trường test thiếu `matchMedia` (happy-dom phiên bản cũ).
 */
function readReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

/**
 * Style áp lên từng orb / star layer khi `Reduced_Motion_User` truy cập:
 * tắt mọi keyframe (orb-appear, orb-drift-*, stars-twinkle) và đặt
 * opacity về 1 để orb vẫn nhìn thấy được dưới dạng tĩnh thay vì biến mất
 * (CSS gốc khởi tạo `opacity: 0` rồi animate lên 1).
 *
 * Inline style ghi đè CSS rule không có `!important`, nên đây là cách
 * gọn nhất để vô hiệu hoá animation mà không cần lớp utility riêng.
 */
const STATIC_LAYER_STYLE: CSSProperties = {
  animation: "none",
  opacity: 1,
};

/**
 * Lớp nền trang trí gồm 4 orb mờ và star field.
 *
 * Hành vi (Requirements 2.6, 9.4, 10.8):
 *
 * 1. Đọc theme qua {@link useTheme} và clamp opacity wrapper bằng
 *    {@link computeAmbientOpacity} — dark ≤ 0.35, light ≤ 0.15, và
 *    light ≤ 0.6 × dark (giảm tối thiểu 40% so với dark mode).
 * 2. Khi user có `prefers-reduced-motion: reduce`, mọi orb và star field
 *    được render tĩnh (animation tắt, opacity giữ ở 1) thay vì drift /
 *    twinkle, đáp ứng Requirement 9.4.
 * 3. Bản thân component không quyết định route mount — việc lift mount
 *    chỉ trên trang chủ và 15 Module_Page được xử lý ở `App.tsx`.
 *
 * Component được đánh `aria-hidden` và `pointer-events-none`: nó là lớp
 * trang trí không tham gia thứ tự đọc cũng như không chặn tương tác.
 */
export function AmbientBg() {
  const { theme } = useTheme();
  const [reducedMotion, setReducedMotion] = useState<boolean>(() => readReducedMotion());

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }

    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (event: MediaQueryListEvent) => setReducedMotion(event.matches);

    // Đồng bộ ngay sau mount, đề phòng giá trị thay đổi giữa lúc khởi tạo
    // state và thời điểm `useEffect` chạy.
    setReducedMotion(mql.matches);

    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", handler);
      return () => mql.removeEventListener("change", handler);
    }
    // Safari < 14 fallback.
    const legacy = mql as MediaQueryList & {
      addListener?: (listener: (event: MediaQueryListEvent) => void) => void;
      removeListener?: (listener: (event: MediaQueryListEvent) => void) => void;
    };
    legacy.addListener?.(handler);
    return () => legacy.removeListener?.(handler);
  }, []);

  const wrapperOpacity = computeAmbientOpacity(theme);
  const layerStyle: CSSProperties | undefined = reducedMotion ? STATIC_LAYER_STYLE : undefined;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden no-print"
      aria-hidden
      data-theme={theme}
      data-reduced-motion={reducedMotion ? "true" : "false"}
      style={{ opacity: wrapperOpacity }}
    >
      {/* Star field layer — rendered only in dark mode */}
      {theme === "dark" && (
        <div
          className="ambient-star-field"
          style={reducedMotion ? STATIC_LAYER_STYLE : undefined}
        />
      )}

      {/* Cloud field layer — rendered only in light mode */}
      {theme === "light" && (
        <div
          className="ambient-cloud-field"
          style={reducedMotion ? STATIC_LAYER_STYLE : undefined}
        >
          <div className="ambient-cloud ambient-cloud-1" />
          <div className="ambient-cloud ambient-cloud-2" />
          <div className="ambient-cloud ambient-cloud-3" />
          <div className="ambient-cloud ambient-cloud-4" />
          <div className="ambient-cloud ambient-cloud-5" />
        </div>
      )}

      <div className="orb orb-1" style={layerStyle} />
      <div className="orb orb-2" style={layerStyle} />
      <div className="orb orb-3" style={layerStyle} />
      <div className="orb orb-4" style={layerStyle} />
      <div className="ambient-stars" style={layerStyle} />
    </div>
  );
}
