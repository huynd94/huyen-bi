import * as React from "react"
import * as RechartsPrimitive from "recharts"

import { cn } from "@/lib/utils"

// Format: { THEME_NAME: CSS_SELECTOR }
const THEMES = { light: "", dark: ".dark" } as const

/**
 * Cấu hình chart cho `<ChartContainer>` — ánh xạ key dữ liệu (ví dụ tên
 * dataKey của Recharts) sang nhãn tiếng Việt, icon, và màu sắc.
 *
 * Mỗi entry gồm `label` (React node hiển thị trong legend / tooltip),
 * `icon` tuỳ chọn, và **một trong hai** cách khai báo màu:
 *
 * - `color`: một chuỗi CSS color áp dụng cho cả light và dark theme.
 * - `theme`: `{ light, dark }` — chuỗi CSS color khác nhau cho từng theme,
 *   được Recharts inject vào `:root` / `.dark` qua biến CSS.
 *
 * Lưu ý a11y: nhãn `label` nên là chuỗi tiếng Việt rõ nghĩa để screen
 * reader đọc đúng khi tooltip/legend nhận focus (xem `ChartBase`).
 *
 * @example
 * ```tsx
 * const config: ChartConfig = {
 *   kim: { label: "Kim", color: "hsl(var(--chart-1))" },
 *   moc: { label: "Mộc", theme: { light: "hsl(140 60% 35%)", dark: "hsl(140 60% 60%)" } },
 * };
 * ```
 */
export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode
    icon?: React.ComponentType
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  )
}

type ChartContextProps = {
  config: ChartConfig
}

const ChartContext = React.createContext<ChartContextProps | null>(null)

/**
 * Hook nội bộ — đọc {@link ChartConfig} từ context của
 * {@link ChartContainer}. Throw khi gọi ngoài cây con của
 * `<ChartContainer />` để báo lỗi sớm cho lập trình viên.
 *
 * Không export ra ngoài; chỉ phục vụ các sub-component (tooltip, legend)
 * trong file này.
 *
 * @throws {Error} Khi không tìm thấy `ChartContext` (gọi ngoài
 *   `<ChartContainer />`).
 */
function useChart() {
  const context = React.useContext(ChartContext)

  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />")
  }

  return context
}

/**
 * ChartContainer — root wrapper cho mọi biểu đồ Recharts trong app.
 *
 * Mục đích: bọc một biểu đồ Recharts (`<BarChart>`, `<LineChart>`,...)
 * trong `<ResponsiveContainer>`, inject design tokens (`--color-<key>`)
 * cho từng `dataKey` được khai báo ở `config`, và override màu mặc định
 * của Recharts bằng các CSS variable của design system (`--border`,
 * `--muted-foreground`,...) để biểu đồ tự bám theo theme light/dark.
 *
 * Props:
 * - `config` (bắt buộc): {@link ChartConfig} — bản đồ `dataKey → { label, icon, color, theme }`.
 * - `id`: id tuỳ biến cho `data-chart`. Nếu bỏ qua, dùng `useId()`.
 * - `children`: cấu trúc Recharts ở mức `ResponsiveContainer["children"]`
 *   (ví dụ một `<BarChart>` duy nhất).
 *
 * Lưu ý a11y: Recharts SVG mặc định không bị screen reader đọc đầy đủ.
 * Hãy bổ sung `<title>` / `aria-label` mô tả ý nghĩa biểu đồ ở component
 * cha, hoặc cung cấp bảng dữ liệu ẩn (`<table className="sr-only">`) khi
 * biểu đồ là điểm dữ liệu chính của trang. Tooltip ({@link ChartTooltipContent})
 * focus-able qua bàn phím khi `role="status"` được Recharts gắn.
 *
 * @example
 * ```tsx
 * const config: ChartConfig = {
 *   kim: { label: "Kim", color: "hsl(var(--chart-1))" },
 *   moc: { label: "Mộc", color: "hsl(var(--chart-2))" },
 * };
 *
 * <ChartContainer config={config} aria-label="Phân bố ngũ hành">
 *   <BarChart data={data}>
 *     <Bar dataKey="kim" fill="var(--color-kim)" />
 *     <Bar dataKey="moc" fill="var(--color-moc)" />
 *     <ChartTooltip content={<ChartTooltipContent />} />
 *   </BarChart>
 * </ChartContainer>
 * ```
 */
const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    config: ChartConfig
    children: React.ComponentProps<
      typeof RechartsPrimitive.ResponsiveContainer
    >["children"]
  }
>(({ id, className, children, config, ...props }, ref) => {
  const uniqueId = React.useId()
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        ref={ref}
        className={cn(
          "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none",
          className
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
})
ChartContainer.displayName = "Chart"

/**
 * ChartStyle — inject `<style>` tag với các CSS variable
 * `--color-<key>` cho từng entry trong {@link ChartConfig} có khai báo
 * `color` hoặc `theme`. Mỗi theme (`light`, `.dark`) được phát ra
 * riêng để cùng một biểu đồ tự đổi màu khi theme switch.
 *
 * Render trong `<ChartContainer>` qua `data-chart={id}` selector — không
 * dùng độc lập. Lưu ý: dùng `dangerouslySetInnerHTML` an toàn vì giá trị
 * màu được khai báo ở compile-time bởi developer (không phải user input).
 */
const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(
    ([, config]) => config.theme || config.color
  )

  if (!colorConfig.length) {
    return null
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(
            ([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig
  .map(([key, itemConfig]) => {
    const color =
      itemConfig.theme?.[theme as keyof typeof itemConfig.theme] ||
      itemConfig.color
    return color ? `  --color-${key}: ${color};` : null
  })
  .join("\n")}
}
`
          )
          .join("\n"),
      }}
    />
  )
}

/**
 * ChartTooltip — re-export `Recharts.Tooltip`.
 *
 * Mục đích: dùng làm điểm gắn `<ChartTooltip content={<ChartTooltipContent />} />`
 * trong các biểu đồ. Tách thành alias để consumer chỉ cần import từ một
 * module duy nhất (`@/components/ui/chart`) thay vì pha trộn import
 * Recharts.
 *
 * Lưu ý a11y: tooltip Recharts hiển thị khi hover/focus điểm dữ liệu;
 * không tự động được screen reader đọc — nên đảm bảo dữ liệu cốt lõi
 * vẫn truy cập được qua `<table>` ẩn hoặc `aria-label` của series.
 */
const ChartTooltip = RechartsPrimitive.Tooltip

/**
 * ChartTooltipContent — body tooltip thiết kế thống nhất theo design
 * system (border, padding, typography, indicator).
 *
 * Props (kế thừa Recharts `Tooltip` + props của `<div>`):
 * - `hideLabel`: ẩn label header của tooltip (mặc định `false`).
 * - `hideIndicator`: ẩn chấm/đường màu trước mỗi entry.
 * - `indicator`: kiểu indicator — `"dot" | "line" | "dashed"` (mặc định `"dot"`).
 * - `nameKey`: key dùng để lookup nhãn trong {@link ChartConfig} (override `name`/`dataKey`).
 * - `labelKey`: tương tự `nameKey` nhưng cho label header.
 *
 * Lưu ý a11y: nhãn `label` lấy từ `ChartConfig` nên là chuỗi tiếng Việt
 * rõ nghĩa; tooltip dùng `font-mono tabular-nums` cho con số để dễ đọc
 * và so sánh thẳng cột giữa các entry.
 *
 * @example
 * ```tsx
 * <ChartTooltip content={<ChartTooltipContent indicator="line" hideLabel />} />
 * ```
 */
const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof RechartsPrimitive.Tooltip> &
    React.ComponentProps<"div"> & {
      hideLabel?: boolean
      hideIndicator?: boolean
      indicator?: "line" | "dot" | "dashed"
      nameKey?: string
      labelKey?: string
    }
>(
  (
    {
      active,
      payload,
      className,
      indicator = "dot",
      hideLabel = false,
      hideIndicator = false,
      label,
      labelFormatter,
      labelClassName,
      formatter,
      color,
      nameKey,
      labelKey,
    },
    ref
  ) => {
    const { config } = useChart()

    const tooltipLabel = React.useMemo(() => {
      if (hideLabel || !payload?.length) {
        return null
      }

      const [item] = payload
      const key = `${labelKey || item?.dataKey || item?.name || "value"}`
      const itemConfig = getPayloadConfigFromPayload(config, item, key)
      const value =
        !labelKey && typeof label === "string"
          ? config[label as keyof typeof config]?.label || label
          : itemConfig?.label

      if (labelFormatter) {
        return (
          <div className={cn("font-medium", labelClassName)}>
            {labelFormatter(value, payload)}
          </div>
        )
      }

      if (!value) {
        return null
      }

      return <div className={cn("font-medium", labelClassName)}>{value}</div>
    }, [
      label,
      labelFormatter,
      payload,
      hideLabel,
      labelClassName,
      config,
      labelKey,
    ])

    if (!active || !payload?.length) {
      return null
    }

    const nestLabel = payload.length === 1 && indicator !== "dot"

    return (
      <div
        ref={ref}
        className={cn(
          "grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl",
          className
        )}
      >
        {!nestLabel ? tooltipLabel : null}
        <div className="grid gap-1.5">
          {payload
            .filter((item) => item.type !== "none")
            .map((item, index) => {
              const key = `${nameKey || item.name || item.dataKey || "value"}`
              const itemConfig = getPayloadConfigFromPayload(config, item, key)
              const indicatorColor = color || item.payload.fill || item.color

              return (
                <div
                  key={item.dataKey}
                  className={cn(
                    "flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground",
                    indicator === "dot" && "items-center"
                  )}
                >
                  {formatter && item?.value !== undefined && item.name ? (
                    formatter(item.value, item.name, item, index, item.payload)
                  ) : (
                    <>
                      {itemConfig?.icon ? (
                        <itemConfig.icon />
                      ) : (
                        !hideIndicator && (
                          <div
                            className={cn(
                              "shrink-0 rounded-[2px] border-[--color-border] bg-[--color-bg]",
                              {
                                "h-2.5 w-2.5": indicator === "dot",
                                "w-1": indicator === "line",
                                "w-0 border-[1.5px] border-dashed bg-transparent":
                                  indicator === "dashed",
                                "my-0.5": nestLabel && indicator === "dashed",
                              }
                            )}
                            style={
                              {
                                "--color-bg": indicatorColor,
                                "--color-border": indicatorColor,
                              } as React.CSSProperties
                            }
                          />
                        )
                      )}
                      <div
                        className={cn(
                          "flex flex-1 justify-between leading-none",
                          nestLabel ? "items-end" : "items-center"
                        )}
                      >
                        <div className="grid gap-1.5">
                          {nestLabel ? tooltipLabel : null}
                          <span className="text-muted-foreground">
                            {itemConfig?.label || item.name}
                          </span>
                        </div>
                        {item.value && (
                          <span className="font-mono font-medium tabular-nums text-foreground">
                            {item.value.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )
            })}
        </div>
      </div>
    )
  }
)
ChartTooltipContent.displayName = "ChartTooltip"

/**
 * ChartLegend — re-export `Recharts.Legend`.
 *
 * Mục đích: làm điểm gắn `<ChartLegend content={<ChartLegendContent />} />`
 * cho các biểu đồ; tương tự {@link ChartTooltip}, alias để giảm số module
 * import.
 *
 * Lưu ý a11y: Recharts render legend dưới dạng list items với
 * `role="list"` ngầm; nội dung label phải là text rõ nghĩa (đã được
 * lookup từ {@link ChartConfig}).
 */
const ChartLegend = RechartsPrimitive.Legend

/**
 * ChartLegendContent — chú thích biểu đồ thống nhất theo design system.
 *
 * Props (kế thừa Recharts `Legend` + props của `<div>`):
 * - `hideIcon`: ẩn icon mặc định, chỉ render chấm màu.
 * - `payload`: được Recharts inject ở runtime — danh sách series.
 * - `verticalAlign`: `"top" | "bottom"` — quyết định padding trên/dưới.
 * - `nameKey`: key lookup nhãn trong {@link ChartConfig}.
 *
 * Lưu ý a11y: label tiếng Việt rõ nghĩa giúp screen reader đọc đúng tên
 * series. Khi nhiều series, sắp xếp theo thứ tự visual (trái sang phải)
 * để khớp thứ tự đọc.
 */
const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> &
    Pick<RechartsPrimitive.LegendProps, "payload" | "verticalAlign"> & {
      hideIcon?: boolean
      nameKey?: string
    }
>(
  (
    { className, hideIcon = false, payload, verticalAlign = "bottom", nameKey },
    ref
  ) => {
    const { config } = useChart()

    if (!payload?.length) {
      return null
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center justify-center gap-4",
          verticalAlign === "top" ? "pb-3" : "pt-3",
          className
        )}
      >
        {payload
          .filter((item) => item.type !== "none")
          .map((item) => {
            const key = `${nameKey || item.dataKey || "value"}`
            const itemConfig = getPayloadConfigFromPayload(config, item, key)

            return (
              <div
                key={item.value}
                className={cn(
                  "flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground"
                )}
              >
                {itemConfig?.icon && !hideIcon ? (
                  <itemConfig.icon />
                ) : (
                  <div
                    className="h-2 w-2 shrink-0 rounded-[2px]"
                    style={{
                      backgroundColor: item.color,
                    }}
                  />
                )}
                {itemConfig?.label}
              </div>
            )
          })}
      </div>
    )
  }
)
ChartLegendContent.displayName = "ChartLegend"

// Helper to extract item config from a payload.
function getPayloadConfigFromPayload(
  config: ChartConfig,
  payload: unknown,
  key: string
) {
  if (typeof payload !== "object" || payload === null) {
    return undefined
  }

  const payloadPayload =
    "payload" in payload &&
    typeof payload.payload === "object" &&
    payload.payload !== null
      ? payload.payload
      : undefined

  let configLabelKey: string = key

  if (
    key in payload &&
    typeof payload[key as keyof typeof payload] === "string"
  ) {
    configLabelKey = payload[key as keyof typeof payload] as string
  } else if (
    payloadPayload &&
    key in payloadPayload &&
    typeof payloadPayload[key as keyof typeof payloadPayload] === "string"
  ) {
    configLabelKey = payloadPayload[
      key as keyof typeof payloadPayload
    ] as string
  }

  return configLabelKey in config
    ? config[configLabelKey]
    : config[key as keyof typeof config]
}

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
}
