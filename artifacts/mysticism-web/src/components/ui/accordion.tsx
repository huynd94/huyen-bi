import * as React from "react"
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Accordion gốc — wrapper trực tiếp của `@radix-ui/react-accordion` Root.
 *
 * Mục đích: gom nhóm nội dung gập-mở dạng vertical, hỗ trợ chế độ
 * `single` (mỗi lúc mở một item) hoặc `multiple` (mở đồng thời nhiều item).
 *
 * Props: kế thừa toàn bộ props của `AccordionPrimitive.Root` —
 * `type` (`"single" | "multiple"`), `collapsible`, `value`, `onValueChange`,
 * `defaultValue`, `dir`, `disabled`,...
 *
 * Lưu ý a11y: Radix tự gắn `role="region"` cho từng nội dung và liên kết
 * `aria-controls` / `aria-expanded` cho trigger; bàn phím hỗ trợ
 * `Space`/`Enter` toggle, `↑/↓` di chuyển giữa các trigger,
 * `Home`/`End` về đầu/cuối.
 *
 * @example
 * ```tsx
 * <Accordion type="single" collapsible>
 *   <AccordionItem value="q1">
 *     <AccordionTrigger>Câu hỏi 1?</AccordionTrigger>
 *     <AccordionContent>Trả lời cho câu hỏi 1.</AccordionContent>
 *   </AccordionItem>
 * </Accordion>
 * ```
 */
const Accordion = AccordionPrimitive.Root

/**
 * Một mục bên trong {@link Accordion}. Mỗi item có thuộc tính `value`
 * duy nhất để Radix theo dõi trạng thái mở/đóng.
 */
const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={cn("border-b", className)}
    {...props}
  />
))
AccordionItem.displayName = "AccordionItem"

/**
 * Nút trigger để mở/đóng nội dung của một {@link AccordionItem}.
 * Render `<button>` bên trong `<h3>` với icon `ChevronDown` xoay 180°
 * khi `data-state="open"`.
 *
 * Lưu ý a11y: nội dung `children` phải là chuỗi mô tả ngắn — Radix
 * gắn `aria-expanded` và `aria-controls` tự động; tránh nhúng `<button>`
 * lồng nhau.
 */
const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        "flex flex-1 items-center justify-between py-4 text-sm font-medium transition-all hover:underline text-left [&[data-state=open]>svg]:rotate-180",
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
))
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName

/**
 * Phần nội dung gập-mở của một {@link AccordionItem}. Áp animation
 * `accordion-down` / `accordion-up` đã định nghĩa trong Tailwind config;
 * khi `prefers-reduced-motion` được bật, animation tự bị giảm thiểu.
 */
const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className="overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
    {...props}
  >
    <div className={cn("pb-4 pt-0", className)}>{children}</div>
  </AccordionPrimitive.Content>
))
AccordionContent.displayName = AccordionPrimitive.Content.displayName

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
