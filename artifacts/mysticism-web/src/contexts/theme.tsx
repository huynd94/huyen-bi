import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type Theme = "dark" | "light";

/**
 * Public contract của ThemeProvider.
 *
 * - `theme` luôn là giá trị cụ thể đang áp ("light" | "dark"); không null.
 * - `setTheme(next)` lưu override vào localStorage và đặt `isSystem = false`.
 * - `toggleTheme()` giữ tương thích với consumer cũ (navbar) — đảo light↔dark.
 * - `isSystem` true khi user chưa override; theme bám `prefers-color-scheme`
 *   và tự cập nhật khi system preference đổi.
 * - `clearThemeOverride()` xoá override, đưa theme về bám system lại.
 */
export interface ThemeContextValue {
  theme: Theme;
  setTheme: (next: Theme) => void;
  toggleTheme: () => void;
  isSystem: boolean;
  clearThemeOverride: () => void;
}

const STORAGE_KEY = "theme";
/** Khóa storage cũ trước khi đặc tả UX/UI v2; migrate một chiều khi gặp. */
const LEGACY_STORAGE_KEY = "huyen-bi-theme";
const MEDIA_DARK = "(prefers-color-scheme: dark)";

/**
 * `<meta name="theme-color">` content theo theme.
 * - Dark: midnight purple đang có sẵn trong `index.html` (`hsl(260 40% 5%)` ≈ `#1a0f2e`).
 * - Light: nền sáng từ `.light` block trong `src/index.css` (`hsl(40 30% 98%)` ≈ `#fbf8f1`).
 */
const META_THEME_COLOR: Record<Theme, string> = {
  dark: "#1a0f2e",
  light: "#fbf8f1",
};

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  setTheme: () => {},
  toggleTheme: () => {},
  isSystem: true,
  clearThemeOverride: () => {},
});

function isTheme(value: unknown): value is Theme {
  return value === "dark" || value === "light";
}

/** Đọc override từ localStorage (kèm migrate legacy). Trả `null` khi chưa có. */
function readStoredTheme(): Theme | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isTheme(stored)) return stored;

    // One-shot migration từ key cũ ("huyen-bi-theme") để không reset
    // preference của user khi nâng cấp.
    const legacy = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (isTheme(legacy)) {
      try {
        window.localStorage.setItem(STORAGE_KEY, legacy);
      } catch {
        /* ignore quota / privacy mode */
      }
      return legacy;
    }
    return null;
  } catch {
    return null;
  }
}

/** Ghi (hoặc xóa) override; nuốt mọi lỗi storage. */
function writeStoredTheme(value: Theme | null): void {
  if (typeof window === "undefined") return;
  try {
    if (value === null) {
      window.localStorage.removeItem(STORAGE_KEY);
    } else {
      window.localStorage.setItem(STORAGE_KEY, value);
    }
  } catch {
    /* ignore */
  }
}

/** Đọc `prefers-color-scheme` hiện tại; fallback "dark" nếu không khả dụng. */
function getSystemTheme(): Theme {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return "dark";
  }
  return window.matchMedia(MEDIA_DARK).matches ? "dark" : "light";
}

/** Cập nhật class trên `<html>` và content của `<meta name="theme-color">`. */
function applyThemeToDocument(theme: Theme): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (theme === "light") {
    root.classList.add("light");
    root.classList.remove("dark");
  } else {
    root.classList.add("dark");
    root.classList.remove("light");
  }
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", META_THEME_COLOR[theme]);
  }
}

function getInitialState(): { theme: Theme; isSystem: boolean } {
  const stored = readStoredTheme();
  if (stored) {
    return { theme: stored, isSystem: false };
  }
  return { theme: getSystemTheme(), isSystem: true };
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => getInitialState().theme);
  const [isSystem, setIsSystem] = useState<boolean>(() => getInitialState().isSystem);

  // Đồng bộ DOM + meta mỗi khi theme đổi.
  useEffect(() => {
    applyThemeToDocument(theme);
  }, [theme]);

  // Theo dõi system preference khi user chưa override.
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    if (!isSystem) return;

    const mql = window.matchMedia(MEDIA_DARK);
    const handler = (event: MediaQueryListEvent) => {
      setThemeState(event.matches ? "dark" : "light");
    };

    // Luôn đồng bộ ngay lập tức trong trường hợp giá trị đã đổi giữa lúc mount.
    setThemeState(mql.matches ? "dark" : "light");

    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", handler);
      return () => mql.removeEventListener("change", handler);
    }
    // Safari < 14 fallback.
    mql.addListener(handler);
    return () => mql.removeListener(handler);
  }, [isSystem]);

  const setTheme = useCallback((next: Theme) => {
    writeStoredTheme(next);
    setIsSystem(false);
    setThemeState(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next: Theme = prev === "dark" ? "light" : "dark";
      writeStoredTheme(next);
      return next;
    });
    setIsSystem(false);
  }, []);

  const clearThemeOverride = useCallback(() => {
    writeStoredTheme(null);
    setIsSystem(true);
    setThemeState(getSystemTheme());
  }, []);

  return (
    <ThemeContext.Provider
      value={{ theme, setTheme, toggleTheme, isSystem, clearThemeOverride }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook truy cập theme hiện tại.
 *
 * @example
 * const { theme, setTheme, toggleTheme, isSystem, clearThemeOverride } = useTheme();
 */
export function useTheme() {
  return useContext(ThemeContext);
}
