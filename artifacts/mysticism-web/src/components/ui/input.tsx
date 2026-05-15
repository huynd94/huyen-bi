import * as React from "react"
import { AlertCircle } from "lucide-react"

import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

/**
 * Props cho {@link Input}.
 *
 * Mở rộng `<input>` chuẩn với các affordance UX bắt buộc theo
 * Requirements 3.4, 3.5, 6.1, 6.2, 6.3, 6.7:
 *
 * - `label`: liên kết tự động `<label htmlFor>` với input qua cùng `id`.
 * - `helperText`: chú thích bên dưới input cho ràng buộc / định dạng.
 * - `error`: trạng thái lỗi (boolean hoặc thông điệp tiếng Việt).
 * - Tự động sinh `id` qua `React.useId` nếu caller không truyền —
 *   đảm bảo `htmlFor` của `<Label>` ngoài cũng có thể trỏ vào.
 *
 * Tất cả màu / khoảng cách dùng design token (`border-destructive`,
 * `text-destructive`, `text-muted-foreground`, …); không có hex hay giá
 * trị tailwind tuỳ ý.
 */
export interface InputProps extends React.ComponentProps<"input"> {
  /**
   * Trạng thái lỗi của input.
   *
   * - Khi là chuỗi không rỗng: hiển thị nội dung như thông điệp lỗi
   *   tiếng Việt bên dưới input và bật style lỗi.
   * - Khi là `true`: chỉ bật style lỗi (border `--destructive` + icon
   *   cảnh báo bên phải) mà không render thông điệp; phù hợp khi caller
   *   tự kiểm soát layout thông điệp lỗi ở chỗ khác.
   * - Khi là `false` / `undefined`: trạng thái bình thường.
   *
   * Khi truthy, component gắn `aria-invalid="true"`. Nếu có thông điệp,
   * `aria-describedby` được trỏ tới `id` của phần tử thông điệp lỗi
   * (Requirement 3.5).
   */
  error?: string | boolean
  /**
   * Chú thích phụ hiển thị bên dưới input (Requirement 6.7) —
   * thường là đơn vị, định dạng mong đợi (ví dụ "dd/MM/yyyy") hay
   * phạm vi giá trị. Khi cùng tồn tại với `error`, helper text vẫn
   * hiển thị và được liên kết qua `aria-describedby`.
   */
  helperText?: React.ReactNode
  /**
   * Nhãn text hiển thị phía trên input. Khi truyền, component render
   * `<Label htmlFor={id}>` (Requirement 3.4) và bao input trong wrapper
   * dạng cột. Khi không truyền, caller phải tự render `<Label htmlFor>`
   * khớp với `id` của input.
   */
  label?: React.ReactNode
}

/**
 * Tổ hợp nhiều giá trị `aria-describedby` thành chuỗi space-separated,
 * loại bỏ entry trùng lặp và rỗng. Trả `undefined` khi danh sách trống
 * để không thêm thuộc tính rỗng vào DOM.
 */
function joinDescribedBy(
  ...ids: Array<string | null | undefined>
): string | undefined {
  const unique = Array.from(
    new Set(
      ids
        .filter((value): value is string => typeof value === "string")
        .flatMap((value) => value.split(/\s+/))
        .filter(Boolean),
    ),
  )
  return unique.length > 0 ? unique.join(" ") : undefined
}

/**
 * Input cơ sở của hệ thống, tương thích `<input>` chuẩn nhưng thêm
 * affordance lỗi / helper text / nhãn theo design system Huyền Bí.
 *
 * Hành vi chính:
 * - Khi không có `label`, `helperText`, hay `error`, component render
 *   thuần một `<input>` (giống API cũ) để các wrapper như
 *   `InputGroup` (CSS targeting `> input`) tiếp tục hoạt động.
 * - Khi `error` truthy: gắn `aria-invalid="true"`, áp `border-destructive`
 *   và hiển thị icon `AlertCircle` ở mép phải input (Requirement 6.3).
 * - Khi có `error` dạng chuỗi hoặc `helperText`: render thông điệp
 *   tương ứng kèm `id` ổn định, đồng thời bổ sung `aria-describedby`
 *   trỏ vào những `id` đó (Requirement 3.5, 6.7).
 * - `id` luôn được đảm bảo (useId fallback) để `<Label htmlFor>`
 *   ngoài hoặc bên trong đều có target hợp lệ (Requirement 3.4).
 *
 * @example
 * ```tsx
 * // Có label, helper text, và lỗi tiếng Việt:
 * <Input
 *   label="Năm sinh"
 *   helperText="Nhập năm trong khoảng 1900–2100."
 *   error={errors.year?.message}
 *   {...register("year")}
 * />
 *
 * // Dùng kèm <Label> bên ngoài:
 * <Label htmlFor="phone">Số điện thoại</Label>
 * <Input id="phone" inputMode="tel" />
 * ```
 *
 * Validates: Requirements 3.4, 3.5, 6.1, 6.2, 6.3, 6.7.
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type,
      id,
      label,
      helperText,
      error,
      "aria-describedby": ariaDescribedByProp,
      "aria-invalid": ariaInvalidProp,
      ...props
    },
    ref,
  ) => {
    const generatedId = React.useId()
    const inputId = id ?? generatedId
    const helperId = `${inputId}-helper`
    const errorId = `${inputId}-error`

    const hasError = Boolean(error)
    const errorMessage = typeof error === "string" && error.length > 0 ? error : undefined

    const describedBy = joinDescribedBy(
      ariaDescribedByProp,
      helperText ? helperId : undefined,
      errorMessage ? errorId : undefined,
    )

    const inputElement = (
      <input
        ref={ref}
        id={inputId}
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          hasError &&
            "border-destructive pr-9 focus-visible:ring-destructive",
          className,
        )}
        aria-invalid={hasError ? true : ariaInvalidProp}
        aria-describedby={describedBy}
        {...props}
      />
    )

    // Không có decoration nào → giữ API cũ, render input thuần để
    // các wrapper CSS targeting `> input` (InputGroup) vẫn hoạt động.
    if (!label && !helperText && !hasError) {
      return inputElement
    }

    return (
      <div className="flex w-full flex-col gap-1.5">
        {label ? (
          <Label htmlFor={inputId} data-slot="input-label">
            {label}
          </Label>
        ) : null}
        <div className="relative">
          {inputElement}
          {hasError ? (
            <AlertCircle
              aria-hidden="true"
              data-slot="input-error-icon"
              className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-destructive"
            />
          ) : null}
        </div>
        {errorMessage ? (
          <p
            id={errorId}
            role="alert"
            className="text-sm font-medium text-destructive"
          >
            {errorMessage}
          </p>
        ) : null}
        {helperText ? (
          <p id={helperId} className="text-sm text-muted-foreground">
            {helperText}
          </p>
        ) : null}
      </div>
    )
  },
)
Input.displayName = "Input"

export { Input }
