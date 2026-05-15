import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Textarea — `<textarea>` HTML chuẩn đã áp style theo design system.
 *
 * Mục đích: ô nhập văn bản nhiều dòng (ghi chú lá số, mô tả câu hỏi,
 * phản hồi). Tự áp `min-h-[60px]`, `text-base` trên mobile và
 * `text-sm` từ `md:` để giảm zoom in tự động trên iOS, focus ring
 * dùng `ring-ring` đồng bộ với các control khác.
 *
 * Props: kế thừa toàn bộ thuộc tính HTML của `<textarea>` —
 * `value`, `onChange`, `placeholder`, `rows`, `disabled`, `required`,
 * `aria-*`, `name`,...
 *
 * Lưu ý a11y: dùng cùng `<Label htmlFor>` hoặc bọc trong `<label>`
 * để screen reader đọc label cho input. Khi validate fail, gắn
 * `aria-invalid="true"` và `aria-describedby` trỏ tới message lỗi
 * (cặp với {@link FormControl} + {@link FormMessage} ở `form.tsx`).
 * Khi `disabled`, tự áp `cursor-not-allowed` và `opacity-50` để
 * truyền tải trạng thái thị giác.
 *
 * @example
 * ```tsx
 * <Textarea
 *   placeholder="Mô tả câu hỏi của bạn..."
 *   rows={5}
 *   aria-label="Câu hỏi"
 *   value={text}
 *   onChange={(e) => setText(e.target.value)}
 * />
 * ```
 */
const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
