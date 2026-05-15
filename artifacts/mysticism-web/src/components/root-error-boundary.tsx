import * as React from "react"

import { ErrorState } from "@/components/ui/error-state"
import { cn } from "@/lib/utils"

/**
 * State của các error boundary trong file này. Khi `error` không phải
 * `null`, fallback UI được render thay cho `children`.
 */
interface ErrorBoundaryState {
  error: Error | null
  /**
   * Thông tin component stack do React truyền vào `componentDidCatch`. Chỉ
   * được hiển thị trong dev mode (xem {@link RootErrorBoundary}).
   */
  errorInfo: React.ErrorInfo | null
}

/**
 * Props cho {@link RootErrorBoundary}.
 *
 * Boundary này được đặt ở gần gốc cây React (trong {@link App}), bên trong
 * `ThemeProvider` để fallback có thể dùng design tokens, nhưng bên ngoài
 * router để chặn cả lỗi xảy ra trong quá trình resolve route / render
 * trang con.
 */
export interface RootErrorBoundaryProps {
  /** Cây UI được bảo vệ. */
  children: React.ReactNode
  /**
   * Hook tuỳ chọn cho consumer (ví dụ telemetry / Sentry trong tương lai).
   * Được gọi mỗi lần `componentDidCatch` nhận lỗi mới.
   */
  onError?: (error: Error, info: React.ErrorInfo) => void
}

/**
 * Error boundary cấp toàn ứng dụng — fallback chiếm trọn viewport với
 * {@link ErrorState} và nút "Tải lại trang".
 *
 * - `getDerivedStateFromError` cập nhật state để render fallback.
 * - `componentDidCatch` log lỗi vào `console.error` (telemetry-out-of-scope
 *   theo `design.md` — Section "Error Handling").
 * - Nút "Tải lại trang" gọi `window.location.reload()` để reset hoàn toàn
 *   cây React; trong môi trường không có `window` (SSR / vitest happy-dom
 *   chưa load) nó fallback về việc clear lỗi và để user thử lại in-place.
 * - Trong `import.meta.env.DEV`, thông tin lỗi (message + stack +
 *   componentStack) được hiển thị trong khối `<details>` có thể đóng/mở
 *   để debug; ở production, các thông tin này được ẩn để tránh rò rỉ chi
 *   tiết kỹ thuật cho người dùng cuối.
 *
 * Microcopy tiếng Việt theo tone formal-warm (Requirement 19.1, 19.2):
 *
 * - Tiêu đề: "Đã có lỗi xảy ra".
 * - Mô tả: "Ứng dụng gặp sự cố không mong muốn. Vui lòng tải lại trang
 *   để tiếp tục."
 * - Nút: "Tải lại trang".
 *
 * Validates: Requirements 5.4.
 *
 * @example
 * ```tsx
 * <ThemeProvider>
 *   <RootErrorBoundary>
 *     <Router />
 *   </RootErrorBoundary>
 * </ThemeProvider>
 * ```
 */
export class RootErrorBoundary extends React.Component<
  RootErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null, errorInfo: null }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    // Chính sách logging: chỉ console.error theo design.md (mục Error
    // Handling — "log lỗi vào console.error, không gửi telemetry trong scope
    // này"). Consumer có thể opt-in qua prop `onError`.
    // eslint-disable-next-line no-console
    console.error("[RootErrorBoundary]", error, info.componentStack)
    this.setState({ errorInfo: info })
    this.props.onError?.(error, info)
  }

  /**
   * Reset state nội bộ để boundary re-render `children`. Chỉ dùng trong
   * môi trường không có `window` (test / SSR); production luôn reload.
   */
  private handleReload = (): void => {
    if (typeof window !== "undefined" && typeof window.location?.reload === "function") {
      window.location.reload()
      return
    }
    this.setState({ error: null, errorInfo: null })
  }

  render(): React.ReactNode {
    const { error, errorInfo } = this.state
    if (error === null) {
      return this.props.children
    }

    const isDev = Boolean(import.meta.env?.DEV)

    return (
      <div
        className="flex min-h-screen w-full flex-col items-center justify-center gap-4 bg-background p-4 md:p-8"
        data-testid="root-error-boundary-fallback"
      >
        <div className="w-full max-w-2xl">
          <ErrorState
            status="5xx"
            title="Đã có lỗi xảy ra"
            description="Ứng dụng gặp sự cố không mong muốn. Vui lòng tải lại trang để tiếp tục."
            onRetry={this.handleReload}
          />
          {isDev ? (
            <details className="mt-4 rounded-md border border-border bg-card p-4 text-left text-sm">
              <summary className="cursor-pointer font-medium text-foreground">
                Chi tiết lỗi (chỉ hiển thị ở dev mode)
              </summary>
              <div className="mt-2 space-y-2 text-muted-foreground">
                <p className="font-mono text-xs">
                  <span className="font-semibold text-foreground">
                    {error.name}:
                  </span>{" "}
                  {error.message}
                </p>
                {error.stack ? (
                  <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-sm bg-muted p-2 font-mono text-xs leading-relaxed text-muted-foreground">
                    {error.stack}
                  </pre>
                ) : null}
                {errorInfo?.componentStack ? (
                  <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-sm bg-muted p-2 font-mono text-xs leading-relaxed text-muted-foreground">
                    {errorInfo.componentStack}
                  </pre>
                ) : null}
              </div>
            </details>
          ) : null}
        </div>
      </div>
    )
  }
}

/**
 * Props cho {@link LocalErrorBoundary}.
 */
export interface LocalErrorBoundaryProps {
  /** Cây UI được bảo vệ — thường là một `<Suspense>` chunk lazy. */
  children: React.ReactNode
  /**
   * Microcopy tiếng Việt cho fallback; mặc định:
   * `"Không tải được phần này. Thử lại."` (Requirement 5.4).
   */
  message?: string
  /**
   * ClassName bổ sung cho fallback container — cho phép caller chèn
   * spacing/sizing phù hợp với chỗ embed (ví dụ chiều cao bằng
   * `<SkeletonChart />` để tránh layout shift).
   */
  className?: string
  /**
   * Hook tuỳ chọn cho consumer; gọi mỗi lần boundary bắt được lỗi mới.
   */
  onError?: (error: Error, info: React.ErrorInfo) => void
}

interface LocalErrorBoundaryInternalState extends ErrorBoundaryState {
  /**
   * Số lần boundary đã reset thành công. Dùng làm `key` để force remount
   * cây con sau khi user nhấn "Thử lại".
   */
  resetKey: number
}

/**
 * Error boundary cục bộ cho các chunk lazy nặng — `export-card-*`,
 * `recharts`, `html2canvas`, `jsPDF` (xem `design.md` mục Lazy-loading
 * boundary).
 *
 * Khác với {@link RootErrorBoundary}:
 *
 * - Fallback nhỏ gọn dạng inline (không full-page) để không che các
 *   khu vực xung quanh — phù hợp khi đặt quanh một `<Suspense>` chỉ chứa
 *   một biểu đồ hoặc một nút "Xuất".
 * - Nút "Thử lại" reset state nội bộ và remount cây con qua `key`, nên
 *   gọi nó sẽ kích hoạt lại `React.lazy(...)` (nếu chunk thất bại do
 *   network blip) hoặc render lại component đã throw.
 *
 * Microcopy tiếng Việt mặc định: `"Không tải được phần này. Thử lại."`
 * (Requirement 5.4) — caller có thể override qua prop `message`.
 *
 * Validates: Requirements 5.4.
 *
 * @example
 * ```tsx
 * <LocalErrorBoundary>
 *   <Suspense fallback={<SkeletonChart />}>
 *     <RadarChart data={data} />
 *   </Suspense>
 * </LocalErrorBoundary>
 * ```
 */
export class LocalErrorBoundary extends React.Component<
  LocalErrorBoundaryProps,
  LocalErrorBoundaryInternalState
> {
  state: LocalErrorBoundaryInternalState = {
    error: null,
    errorInfo: null,
    resetKey: 0,
  }

  static getDerivedStateFromError(
    error: Error,
  ): Partial<LocalErrorBoundaryInternalState> {
    return { error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    // eslint-disable-next-line no-console
    console.error("[LocalErrorBoundary]", error, info.componentStack)
    this.setState({ errorInfo: info })
    this.props.onError?.(error, info)
  }

  private handleRetry = (): void => {
    this.setState((prev) => ({
      error: null,
      errorInfo: null,
      resetKey: prev.resetKey + 1,
    }))
  }

  render(): React.ReactNode {
    const { children, message, className } = this.props
    const { error, resetKey } = this.state

    if (error === null) {
      // `key` đảm bảo cây con remount sau mỗi lần retry — cần thiết cho
      // `React.lazy` vì sau khi lỗi, instance lazy giữ trạng thái rejected
      // cho đến khi component bị unmount.
      return (
        <React.Fragment key={resetKey}>
          {children}
        </React.Fragment>
      )
    }

    return (
      <div
        role="alert"
        aria-live="assertive"
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-md border border-destructive/40 bg-card p-4 text-center text-sm",
          className,
        )}
        data-testid="local-error-boundary-fallback"
      >
        <p className="text-muted-foreground">
          {message ?? "Không tải được phần này. Thử lại."}
        </p>
        <button
          type="button"
          onClick={this.handleRetry}
          className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md border border-primary-border bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          Thử lại
        </button>
      </div>
    )
  }
}
