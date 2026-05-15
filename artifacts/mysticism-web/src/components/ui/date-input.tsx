"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import type { Matcher } from "react-day-picker"

import { cn } from "@/lib/utils"
import {
  formatVietnameseDate,
  parseVietnameseDate,
} from "@/lib/form-utils"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

/**
 * Props cho {@link DateInput}.
 *
 * Component là một composite "text + popover calendar" cho phép vừa gõ tay
 * theo định dạng `dd/MM/yyyy`, vừa chọn từ `react-day-picker` qua
 * {@link Calendar}. Mọi hành động (gõ hợp lệ, chọn từ calendar, xoá trắng)
 * đều phát một sự kiện `onChange` thống nhất với một `Date | undefined`.
 */
export interface DateInputProps {
  /**
   * Giá trị Date hiện hành. `undefined` nghĩa là chưa chọn — input hiển thị
   * trống và Calendar không có ngày được highlight.
   *
   * Component đồng bộ ô text khi `value` thay đổi từ ngoài (ví dụ form reset),
   * so sánh bằng `getTime()` để tránh ghi đè khi user đang gõ dở một chuỗi
   * parse được ra cùng Date.
   */
  value?: Date | undefined
  /**
   * Phát ra khi người dùng:
   *  - chọn một ngày trong Calendar (luôn fire),
   *  - gõ một chuỗi `dd/MM/yyyy` parse thành công qua `parseVietnameseDate`,
   *  - xoá trắng ô text (fire với `undefined`).
   *
   * **Không** fire trong khi user đang gõ dở (chuỗi chưa hợp lệ) để tránh
   * "flash" giá trị giữa từng phím; form-level validation nên dựa vào
   * {@link DateInputProps.value} cuối cùng đã được commit.
   */
  onChange?: (date: Date | undefined) => void
  /**
   * Trạng thái lỗi. Có hai dạng:
   *  - `string`: thông điệp tiếng Việt hiển thị dưới input, gắn `id` và liên
   *    kết qua `aria-describedby`; ô input nhận `aria-invalid="true"` và
   *    border `--destructive`.
   *  - `boolean`: bật trạng thái lỗi visual + `aria-invalid="true"` mà không
   *    hiển thị thông điệp (form-layer có thể đã render lỗi ở chỗ khác).
   *
   * Khi cùng tồn tại với {@link DateInputProps.helperText}, error có ưu tiên:
   * helper bị ẩn để tránh trùng lặp ngữ nghĩa. ARIA mapping (Requirements 3.4,
   * 3.5, 6.3, 6.7).
   */
  error?: string | boolean
  /**
   * Mô tả hỗ trợ dưới input (Requirement 6.7) — ví dụ "Định dạng dd/MM/yyyy".
   * Hiển thị khi không có error string. Nếu là chuỗi, render trong `<p>` với
   * `text-muted-foreground`; có thể truyền JSX để bao gồm icon.
   */
  helperText?: React.ReactNode
  /**
   * `id` cho ô input. Khi không truyền, dùng `React.useId()` để tự sinh và
   * tự liên kết `<Label htmlFor>` (Requirement 3.4).
   */
  id?: string
  /**
   * Label tiếng Việt cho field. Render qua {@link Label} với `htmlFor` trỏ
   * tới `id` của input.
   */
  label?: React.ReactNode
  /**
   * Vô hiệu hoá toàn bộ field (input + nút mở popover). Nút calendar nhận
   * `disabled` thật để keyboard / SR đều bỏ qua.
   */
  disabled?: boolean
  /**
   * Placeholder cho ô text. Mặc định `"dd/MM/yyyy"` để gợi ý định dạng.
   */
  placeholder?: string
  /**
   * Ngày sớm nhất chấp nhận. Calendar disable mọi ngày `< min`. Component
   * **không** chặn việc gõ tay — caller chịu trách nhiệm reject qua zod để
   * giữ thông điệp lỗi đồng nhất với phần còn lại của form.
   */
  min?: Date
  /**
   * Ngày muộn nhất chấp nhận. Calendar disable mọi ngày `> max`. Xem ghi chú
   * ở {@link DateInputProps.min} về ranh giới giữa input và validation.
   */
  max?: Date
  /**
   * Tên field cho `<input name>` — hữu ích khi DateInput nằm trong form
   * native không dùng react-hook-form.
   */
  name?: string
  /**
   * className bổ sung gắn vào wrapper ngoài cùng. Không tác động đến chính
   * input/label để giữ kiểu cách design tokens nhất quán.
   */
  className?: string
}

/**
 * Ghép một danh sách `id` (đã loại trừ `null` / `undefined` / chuỗi rỗng)
 * thành chuỗi `space-separated` cho `aria-describedby`. Trả `undefined` khi
 * danh sách rỗng để không render thuộc tính rỗng trên DOM.
 */
function joinIds(ids: Array<string | null | undefined>): string | undefined {
  const filtered = ids.filter((value): value is string => Boolean(value))
  return filtered.length > 0 ? filtered.join(" ") : undefined
}

/**
 * Tạo danh sách `Matcher` cho `react-day-picker` từ `min` / `max`. Trả
 * `undefined` khi không có ràng buộc nào để DayPicker không bật disabled
 * pipeline thừa.
 */
function buildDisabledMatchers(
  min: Date | undefined,
  max: Date | undefined,
): Matcher[] | undefined {
  const matchers: Matcher[] = []
  if (min) matchers.push({ before: min })
  if (max) matchers.push({ after: max })
  return matchers.length > 0 ? matchers : undefined
}

/**
 * Composite **DateInput** — ô text `dd/MM/yyyy` cộng với popover Calendar
 * (`react-day-picker` qua wrapper {@link Calendar}). Hai hướng nhập đồng bộ
 * qua một `value: Date | undefined` duy nhất.
 *
 * Hành vi:
 * - **Gõ tay**: mỗi `onChange` của input gọi `parseVietnameseDate`. Khi
 *   parse thành công và (nếu có) nằm trong `[min, max]`, fire `onChange`
 *   với `Date`. Khi chuỗi rỗng, fire `onChange(undefined)`. Khi parse thất
 *   bại (gõ dở), giữ nguyên `value` ngoài để không nhấp nháy.
 * - **Chọn từ calendar**: format qua `formatVietnameseDate`, đóng popover,
 *   fire `onChange`.
 * - **Đồng bộ ngược**: khi `value` đổi từ ngoài (ví dụ form reset), ô text
 *   được ghi đè bằng định dạng chuẩn.
 *
 * Accessibility (Requirements 3.4, 3.5, 6.3, 6.7):
 * - `<Label htmlFor>` liên kết với `id` của input (sinh tự động nếu không
 *   được truyền).
 * - `aria-invalid="true"` khi `error` truthy.
 * - `aria-describedby` trỏ tới id của thông điệp lỗi và/hoặc helper.
 * - Nút mở Calendar mang `aria-label="Chọn ngày"` và `aria-haspopup="dialog"`.
 * - Popover dùng Radix nên đã hỗ trợ Escape-to-close + return focus về
 *   trigger (Requirements 3.6, 3.7).
 *
 * @example Form không kiểm soát
 * ```tsx
 * <DateInput
 *   id="dob"
 *   label="Ngày sinh"
 *   helperText="Định dạng dd/MM/yyyy"
 *   value={dob}
 *   onChange={setDob}
 *   min={new Date(1900, 0, 1)}
 *   max={new Date(2100, 11, 31)}
 * />
 * ```
 *
 * @example Tích hợp react-hook-form
 * ```tsx
 * <Controller
 *   control={control}
 *   name="dob"
 *   render={({ field, fieldState }) => (
 *     <DateInput
 *       label="Ngày sinh"
 *       value={field.value ?? undefined}
 *       onChange={field.onChange}
 *       error={fieldState.error?.message}
 *     />
 *   )}
 * />
 * ```
 *
 * Validates: Requirements 6.6, 6.7.
 */
export const DateInput = React.forwardRef<HTMLInputElement, DateInputProps>(
  function DateInput(
    {
      value,
      onChange,
      error,
      helperText,
      id,
      label,
      disabled,
      placeholder = "dd/MM/yyyy",
      min,
      max,
      name,
      className,
    },
    forwardedRef,
  ) {
    const reactId = React.useId()
    const inputId = id ?? `date-input-${reactId}`
    const errorId = `${inputId}-error`
    const helperId = `${inputId}-helper`

    // Lưu chuỗi đang hiển thị tách rời với `value` để cho phép gõ dở mà
    // không bị overwrite mỗi keystroke. Sync ngược chỉ chạy khi `getTime()`
    // của value thực sự khác lần sync gần nhất.
    const [text, setText] = React.useState<string>(() =>
      value ? formatVietnameseDate(value) : "",
    )
    const lastSyncedTimeRef = React.useRef<number | null>(
      value ? value.getTime() : null,
    )

    React.useEffect(() => {
      const nextTime = value ? value.getTime() : null
      if (nextTime === lastSyncedTimeRef.current) return
      lastSyncedTimeRef.current = nextTime
      setText(value ? formatVietnameseDate(value) : "")
    }, [value])

    const [open, setOpen] = React.useState(false)

    const errorMessage = typeof error === "string" && error.length > 0 ? error : null
    const hasError = Boolean(error)
    const showHelper = !errorMessage && Boolean(helperText)

    const describedBy = joinIds([
      errorMessage ? errorId : null,
      showHelper ? helperId : null,
    ])

    const isInRange = React.useCallback(
      (candidate: Date): boolean => {
        if (min && candidate.getTime() < min.getTime()) return false
        if (max && candidate.getTime() > max.getTime()) return false
        return true
      },
      [min, max],
    )

    const handleTextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const next = event.target.value
      setText(next)

      if (next.trim() === "") {
        if (lastSyncedTimeRef.current !== null) {
          lastSyncedTimeRef.current = null
          onChange?.(undefined)
        }
        return
      }

      const parsed = parseVietnameseDate(next)
      if (!parsed) return // chuỗi chưa hợp lệ — chờ user gõ tiếp.
      if (!isInRange(parsed)) return

      if (parsed.getTime() !== lastSyncedTimeRef.current) {
        lastSyncedTimeRef.current = parsed.getTime()
        onChange?.(parsed)
      }
    }

    const handleCalendarSelect = (selected: Date | undefined) => {
      if (!selected) {
        setText("")
        lastSyncedTimeRef.current = null
        onChange?.(undefined)
        setOpen(false)
        return
      }
      const formatted = formatVietnameseDate(selected)
      setText(formatted)
      lastSyncedTimeRef.current = selected.getTime()
      onChange?.(selected)
      setOpen(false)
    }

    const disabledMatchers = buildDisabledMatchers(min, max)

    return (
      <div className={cn("space-y-1.5", className)}>
        {label ? (
          <Label
            htmlFor={inputId}
            className={cn(hasError && "text-destructive")}
          >
            {label}
          </Label>
        ) : null}
        <div className="relative">
          <Input
            ref={forwardedRef}
            id={inputId}
            name={name}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={text}
            placeholder={placeholder}
            disabled={disabled}
            onChange={handleTextChange}
            aria-invalid={hasError ? true : undefined}
            aria-describedby={describedBy}
            className={cn(
              "pr-10",
              hasError &&
                "border-destructive focus-visible:ring-destructive",
            )}
          />
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label="Chọn ngày"
                aria-haspopup="dialog"
                aria-expanded={open}
                disabled={disabled}
                className={cn(
                  "absolute right-1 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors",
                  "hover:bg-accent hover:text-accent-foreground",
                  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                  "disabled:pointer-events-none disabled:opacity-50",
                )}
              >
                <CalendarIcon className="h-4 w-4" aria-hidden="true" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-auto p-0">
              <Calendar
                mode="single"
                selected={value}
                onSelect={handleCalendarSelect}
                defaultMonth={value ?? max ?? undefined}
                disabled={disabledMatchers}
                captionLayout="dropdown"
                startMonth={min}
                endMonth={max}
              />
            </PopoverContent>
          </Popover>
        </div>
        {errorMessage ? (
          <p
            id={errorId}
            role="alert"
            className="text-xs leading-snug text-destructive"
          >
            {errorMessage}
          </p>
        ) : null}
        {showHelper ? (
          <p
            id={helperId}
            className="text-xs leading-snug text-muted-foreground"
          >
            {helperText}
          </p>
        ) : null}
      </div>
    )
  },
)
DateInput.displayName = "DateInput"
