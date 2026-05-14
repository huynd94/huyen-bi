/**
 * `/dev/design-tokens` — trang QA trực quan cho hệ thống thiết kế.
 *
 * Mục đích: hiển thị live mọi `Color_Token`, `Type_Scale`, spacing, border
 * radius, shadows, button variants và badge variants để designer/QA kiểm
 * tra nhanh độ tương phản và kiểu chữ trong cả hai theme. Không thuộc luồng
 * người dùng cuối — route được mount có điều kiện trong `App.tsx` chỉ khi
 * `import.meta.env.DEV` là `true`, đảm bảo Vite tree-shake toàn bộ chunk
 * này khỏi production bundle (Requirement 20.3).
 *
 * @remarks
 * Trang đọc giá trị token bằng cách dựng hai phần tử "probe" ẩn (`.light`
 * và `.dark`) rồi `getComputedStyle()` từng custom property — vì vậy giá
 * trị hiển thị luôn khớp với những gì `src/index.css` đang khai báo, kể
 * cả khi token thay đổi sau này.
 */

import { useEffect, useMemo, useState } from "react";
import {
  TOKEN_PAIRS,
  CONTRAST_THRESHOLDS,
  computeContrast,
  meetsContrast,
  parseHsl,
  type TokenPair,
} from "@/components/ui/design-tokens";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Cấu hình hiển thị (literal — Tailwind cần tên class tĩnh để JIT)
// ---------------------------------------------------------------------------

interface SpacingEntry {
  readonly token: string;
  readonly className: string;
  readonly rem: string;
  readonly px: number;
}

/**
 * Thang spacing 1–16 trên trục `p-*`. Liệt kê literal để Tailwind v4 JIT
 * giữ lại các utility class trong build.
 */
const SPACING_SCALE: readonly SpacingEntry[] = [
  { token: "p-1", className: "p-1", rem: "0.25rem", px: 4 },
  { token: "p-2", className: "p-2", rem: "0.5rem", px: 8 },
  { token: "p-3", className: "p-3", rem: "0.75rem", px: 12 },
  { token: "p-4", className: "p-4", rem: "1rem", px: 16 },
  { token: "p-5", className: "p-5", rem: "1.25rem", px: 20 },
  { token: "p-6", className: "p-6", rem: "1.5rem", px: 24 },
  { token: "p-8", className: "p-8", rem: "2rem", px: 32 },
  { token: "p-10", className: "p-10", rem: "2.5rem", px: 40 },
  { token: "p-12", className: "p-12", rem: "3rem", px: 48 },
  { token: "p-16", className: "p-16", rem: "4rem", px: 64 },
];

interface RadiusEntry {
  readonly token: string;
  readonly className: string;
  readonly rem: string;
  readonly px: number;
  readonly mapping: string;
}

const RADIUS_SCALE: readonly RadiusEntry[] = [
  { token: "--radius-sm", className: "rounded-sm", rem: "0.25rem", px: 4, mapping: "Input, Badge" },
  { token: "--radius-md", className: "rounded-md", rem: "0.375rem", px: 6, mapping: "Button, Toggle" },
  { token: "--radius-lg", className: "rounded-lg", rem: "0.75rem", px: 12, mapping: "Card, Popover" },
  { token: "--radius-xl", className: "rounded-xl", rem: "1.25rem", px: 20, mapping: "Hero, Dialog lớn" },
];

interface ShadowEntry {
  readonly token: string;
  readonly className: string;
  readonly note: string;
}

const SHADOW_SCALE: readonly ShadowEntry[] = [
  { token: "--shadow-sm", className: "shadow-sm", note: "Card mặc định, hover state nhẹ" },
  { token: "--shadow-md", className: "shadow-md", note: "Popover, Dropdown, Dialog nhỏ" },
];

interface TypeScaleEntry {
  readonly token: string;
  readonly fontSizeVar: string;
  readonly lineHeightVar: string;
  readonly note: string;
}

const TYPE_SCALE: readonly TypeScaleEntry[] = [
  { token: "display", fontSizeVar: "--font-size-display", lineHeightVar: "--line-height-display", note: "Hero trang chủ" },
  { token: "h1", fontSizeVar: "--font-size-h1", lineHeightVar: "--line-height-h1", note: "Tiêu đề Module_Page" },
  { token: "h2", fontSizeVar: "--font-size-h2", lineHeightVar: "--line-height-h2", note: "Tiêu đề section" },
  { token: "h3", fontSizeVar: "--font-size-h3", lineHeightVar: "--line-height-h3", note: "Tiêu đề sub-section" },
  { token: "body", fontSizeVar: "--font-size-body", lineHeightVar: "--line-height-body", note: "Đoạn văn mặc định" },
  { token: "small", fontSizeVar: "--font-size-small", lineHeightVar: "--line-height-small", note: "Caption, helper text" },
];

interface ButtonVariantEntry {
  readonly variant: "default" | "secondary" | "outline" | "ghost" | "destructive" | "link";
  readonly label: string;
}

const BUTTON_VARIANTS: readonly ButtonVariantEntry[] = [
  { variant: "default", label: "Lập lá số" },
  { variant: "secondary", label: "Hồ sơ" },
  { variant: "outline", label: "Xem thêm" },
  { variant: "ghost", label: "Đóng" },
  { variant: "destructive", label: "Xoá" },
  { variant: "link", label: "Liên kết" },
];

interface BadgeVariantEntry {
  readonly variant: "default" | "secondary" | "destructive" | "outline";
  readonly label: string;
}

const BADGE_VARIANTS: readonly BadgeVariantEntry[] = [
  { variant: "default", label: "Mới" },
  { variant: "secondary", label: "Beta" },
  { variant: "destructive", label: "Hết hạn" },
  { variant: "outline", label: "Lưu trữ" },
];

// ---------------------------------------------------------------------------
// Probe theme tokens at runtime
// ---------------------------------------------------------------------------

type ThemeName = "light" | "dark";

interface ResolvedTokenMaps {
  readonly light: Readonly<Record<string, string>>;
  readonly dark: Readonly<Record<string, string>>;
}

/**
 * Mount hai phần tử ẩn — một mang class `.light`, một mang `.dark` — rồi
 * dùng `getComputedStyle()` để đọc giá trị thực của mỗi custom property
 * trong từng theme. Cách này né được mọi giả định về theme đang active
 * trên `<html>`: chúng ta luôn lấy được CẢ HAI giá trị bất kể user đang
 * ở light hay dark.
 */
function useResolvedThemeTokens(tokenNames: readonly string[]): ResolvedTokenMaps | null {
  const namesKey = useMemo(() => tokenNames.join("|"), [tokenNames]);
  const [maps, setMaps] = useState<ResolvedTokenMaps | null>(null);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const probeLight = document.createElement("div");
    probeLight.className = "light";
    probeLight.setAttribute("aria-hidden", "true");
    probeLight.style.position = "absolute";
    probeLight.style.pointerEvents = "none";
    probeLight.style.opacity = "0";
    probeLight.style.width = "0";
    probeLight.style.height = "0";

    const probeDark = document.createElement("div");
    probeDark.className = "dark";
    probeDark.setAttribute("aria-hidden", "true");
    probeDark.style.position = "absolute";
    probeDark.style.pointerEvents = "none";
    probeDark.style.opacity = "0";
    probeDark.style.width = "0";
    probeDark.style.height = "0";

    document.body.appendChild(probeLight);
    document.body.appendChild(probeDark);

    const lightStyle = getComputedStyle(probeLight);
    const darkStyle = getComputedStyle(probeDark);

    const light: Record<string, string> = {};
    const dark: Record<string, string> = {};
    for (const name of tokenNames) {
      light[name] = lightStyle.getPropertyValue(`--${name}`).trim();
      dark[name] = darkStyle.getPropertyValue(`--${name}`).trim();
    }

    setMaps({ light, dark });

    return () => {
      probeLight.remove();
      probeDark.remove();
    };
    // namesKey identifies the input list; tokenNames identity is stable per render only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [namesKey]);

  return maps;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** An toàn parse HSL: trả `null` thay vì throw để render không bị vỡ. */
function safeContrast(fgHsl: string, bgHsl: string): number | null {
  if (!fgHsl || !bgHsl) return null;
  try {
    return computeContrast(parseHsl(fgHsl), parseHsl(bgHsl));
  } catch {
    return null;
  }
}

function formatRatio(ratio: number | null): string {
  if (ratio === null) return "—";
  return `${ratio.toFixed(2)}:1`;
}

function formatPercent(value: string | undefined): string {
  return value && value.length > 0 ? value : "—";
}

// ---------------------------------------------------------------------------
// UI: section wrapper
// ---------------------------------------------------------------------------

interface SectionProps {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly children: React.ReactNode;
}

function Section({ id, title, description, children }: SectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className="space-y-4 border-t border-border pt-8 first:border-t-0 first:pt-0"
    >
      <header className="space-y-1">
        <h2 id={`${id}-heading`} className="text-2xl font-semibold tracking-tight">
          {title}
        </h2>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </header>
      {children}
    </section>
  );
}

// ---------------------------------------------------------------------------
// UI: color tokens
// ---------------------------------------------------------------------------

interface ContrastSwatchProps {
  readonly pair: TokenPair;
  readonly theme: ThemeName;
  readonly fgHsl: string;
  readonly bgHsl: string;
}

function ContrastSwatch({ pair, theme, fgHsl, bgHsl }: ContrastSwatchProps) {
  const ratio = safeContrast(fgHsl, bgHsl);
  const passes = ratio !== null && meetsContrast(pair, ratio);
  const threshold = CONTRAST_THRESHOLDS[pair.sizeBucket];
  const swatchClass = theme === "light" ? "light" : "dark";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs uppercase tracking-wider text-muted-foreground">
        <span>{theme === "light" ? "Light" : "Dark"}</span>
        <span aria-live="polite" className={cn(passes ? "text-primary" : "text-destructive")}>
          {formatRatio(ratio)} / ≥ {threshold}:1
        </span>
      </div>
      <div className={swatchClass}>
        <div
          className="rounded-md border border-border p-4"
          style={{
            backgroundColor: bgHsl ? `hsl(${bgHsl})` : undefined,
            color: fgHsl ? `hsl(${fgHsl})` : undefined,
          }}
        >
          <p className="text-sm font-medium">Đoạn văn mẫu — kiểm tra tương phản.</p>
          <p className="mt-1 text-xs opacity-90">{pair.name}</p>
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
        <dt>--{pair.foreground}</dt>
        <dd className="text-right font-mono">{formatPercent(fgHsl)}</dd>
        <dt>--{pair.background}</dt>
        <dd className="text-right font-mono">{formatPercent(bgHsl)}</dd>
      </dl>
    </div>
  );
}

interface ColorTokensSectionProps {
  readonly maps: ResolvedTokenMaps | null;
}

function ColorTokensSection({ maps }: ColorTokensSectionProps) {
  return (
    <Section
      id="colors"
      title="Color tokens"
      description="Mỗi cặp token render ở cả light và dark, kèm tỉ số tương phản WCAG. Mục tiêu ≥ 4.5:1 cho text và ≥ 3:1 cho UI."
    >
      <ul className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {TOKEN_PAIRS.map((pair) => {
          const lightFg = maps?.light[pair.foreground] ?? "";
          const lightBg = maps?.light[pair.background] ?? "";
          const darkFg = maps?.dark[pair.foreground] ?? "";
          const darkBg = maps?.dark[pair.background] ?? "";
          return (
            <li
              key={pair.name}
              className="space-y-3 rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm"
            >
              <header className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold">{pair.name}</h3>
                <Badge variant="outline">
                  {pair.sizeBucket === "text" ? "text 4.5:1" : "UI 3:1"}
                </Badge>
              </header>
              <div className="grid gap-3 sm:grid-cols-2">
                <ContrastSwatch pair={pair} theme="light" fgHsl={lightFg} bgHsl={lightBg} />
                <ContrastSwatch pair={pair} theme="dark" fgHsl={darkFg} bgHsl={darkBg} />
              </div>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// UI: type scale
// ---------------------------------------------------------------------------

function TypeScaleSection() {
  return (
    <Section
      id="type-scale"
      title="Type scale"
      description="Sáu mức cỡ chữ, line-height đi kèm. Heading dùng 1.1, body 1.5, small 1.4."
    >
      <ul className="space-y-4">
        {TYPE_SCALE.map((entry) => (
          <li
            key={entry.token}
            className="rounded-lg border border-border bg-card p-4 text-card-foreground"
          >
            <header className="mb-2 flex flex-wrap items-baseline justify-between gap-2 text-xs text-muted-foreground">
              <span className="font-mono">{entry.fontSizeVar}</span>
              <span>{entry.note}</span>
            </header>
            <p
              className="font-serif"
              style={{
                fontSize: `var(${entry.fontSizeVar})`,
                lineHeight: `var(${entry.lineHeightVar})`,
              }}
            >
              Huyền Bí — chiêm tinh và mệnh lý.
            </p>
            <p className="mt-2 font-mono text-xs text-muted-foreground">
              line-height: var({entry.lineHeightVar})
            </p>
          </li>
        ))}
      </ul>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// UI: spacing scale
// ---------------------------------------------------------------------------

function SpacingScaleSection() {
  return (
    <Section
      id="spacing"
      title="Spacing 1–16"
      description="Thang 4px Tailwind. Vùng vàng là padding, ô đen ở giữa minh hoạ kích thước nội dung."
    >
      <ul className="space-y-2">
        {SPACING_SCALE.map((entry) => (
          <li key={entry.token} className="flex items-center gap-4">
            <div className="w-16 shrink-0 font-mono text-xs text-muted-foreground">
              {entry.token}
            </div>
            <div
              className={cn(
                "inline-flex items-center justify-start rounded-sm bg-primary",
                entry.className,
              )}
              aria-hidden="true"
            >
              <div className="h-3 w-3 rounded-sm bg-primary-foreground" />
            </div>
            <div className="text-xs text-muted-foreground">
              {entry.rem} ({entry.px}px)
            </div>
          </li>
        ))}
      </ul>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// UI: border radius
// ---------------------------------------------------------------------------

function RadiusScaleSection() {
  return (
    <Section
      id="radius"
      title="Border radius"
      description="Bốn mức tách rời, không bo `rounded-2xl` đồng nhất khắp nơi."
    >
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {RADIUS_SCALE.map((entry) => (
          <li
            key={entry.token}
            className={cn(
              "border border-border bg-card p-6 text-card-foreground shadow-sm",
              entry.className,
            )}
          >
            <p className="font-mono text-sm">{entry.className}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              {entry.rem} ({entry.px}px)
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{entry.mapping}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// UI: shadows
// ---------------------------------------------------------------------------

function ShadowScaleSection() {
  return (
    <Section
      id="shadows"
      title="Shadows"
      description="Chỉ hai mức được phép. Ngoài hai mức này, tránh dùng các shadow lớn hơn (lint chặn)."
    >
      <ul className="grid gap-6 sm:grid-cols-2">
        {SHADOW_SCALE.map((entry) => (
          <li
            key={entry.token}
            className={cn(
              "rounded-lg border border-border bg-card p-6 text-card-foreground",
              entry.className,
            )}
          >
            <p className="font-mono text-sm">{entry.className}</p>
            <p className="mt-2 text-xs text-muted-foreground">{entry.note}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// UI: button variants
// ---------------------------------------------------------------------------

function ButtonVariantsSection() {
  return (
    <Section
      id="buttons"
      title="Button variants"
      description="Mỗi biến thể × ba size (sm, default, lg). Variant `default` đảm bảo min-height 44px cho mobile target tap."
    >
      <div className="space-y-4">
        {BUTTON_VARIANTS.map((entry) => (
          <div
            key={entry.variant}
            className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-4"
          >
            <span className="w-24 shrink-0 font-mono text-xs text-muted-foreground">
              {entry.variant}
            </span>
            <Button variant={entry.variant} size="sm">
              {entry.label}
            </Button>
            <Button variant={entry.variant} size="default">
              {entry.label}
            </Button>
            <Button variant={entry.variant} size="lg">
              {entry.label}
            </Button>
            <Button variant={entry.variant} size="default" loading loadingText="Đang xử lý…">
              {entry.label}
            </Button>
            <Button variant={entry.variant} size="default" disabled>
              {entry.label}
            </Button>
          </div>
        ))}
      </div>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// UI: badge variants
// ---------------------------------------------------------------------------

function BadgeVariantsSection() {
  return (
    <Section
      id="badges"
      title="Badge variants"
      description="Pill ngắn hiển thị trạng thái, tag, đếm số. Biến thể default / secondary / destructive / outline."
    >
      <div className="flex flex-wrap items-center gap-3">
        {BADGE_VARIANTS.map((entry) => (
          <div key={entry.variant} className="flex items-center gap-2">
            <Badge variant={entry.variant}>{entry.label}</Badge>
            <span className="font-mono text-xs text-muted-foreground">{entry.variant}</span>
          </div>
        ))}
      </div>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Page export
// ---------------------------------------------------------------------------

/**
 * Trang nội bộ `/dev/design-tokens`.
 *
 * @remarks
 * Chỉ tồn tại trong build môi trường dev — `App.tsx` mount route phía sau
 * `import.meta.env.DEV`. Đừng link tới trang này từ UX của người dùng cuối.
 */
export default function DesignTokensPage() {
  // Tập hợp tất cả token cần probe — gộp foreground + background của mọi cặp.
  const tokenNames = useMemo(() => {
    const set = new Set<string>();
    for (const pair of TOKEN_PAIRS) {
      set.add(pair.foreground);
      set.add(pair.background);
    }
    return Array.from(set);
  }, []);

  const maps = useResolvedThemeTokens(tokenNames);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-10 md:px-8 md:py-16">
        <header className="space-y-2 border-b border-border pb-6">
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Internal · Dev only
          </p>
          <h1 className="text-4xl font-semibold tracking-tight">Design tokens</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Trang QA hiển thị live mọi token đang dùng trong Huyền Bí: màu sắc
            (light + dark), thang chữ, spacing, border radius, shadows, cùng
            với các variant của Button và Badge. Chỉ khả dụng trong môi trường
            phát triển — không có trong production bundle.
          </p>
        </header>

        <ColorTokensSection maps={maps} />
        <TypeScaleSection />
        <SpacingScaleSection />
        <RadiusScaleSection />
        <ShadowScaleSection />
        <ButtonVariantsSection />
        <BadgeVariantsSection />
      </div>
    </div>
  );
}
