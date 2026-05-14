import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

/**
 * InputGroup — container gom input/textarea và các addon (icon, text,
 * button) thành một control thống nhất.
 *
 * Mục đích: tạo input có icon prefix/suffix (ví dụ: ô search có icon
 * kính lúp, ô số tiền có ký hiệu đơn vị), hoặc input với button kèm
 * theo (copy, clear, submit). Border + focus ring nằm trên container,
 * input bên trong tự bỏ border riêng để không có "double border".
 *
 * Lưu ý a11y: container dùng `role="group"` để screen reader hiểu là
 * một nhóm control. Khi control con có `aria-invalid="true"`, toàn
 * bộ container đổi sang trạng thái lỗi (`border-destructive`,
 * `ring-destructive/20`). Focus ring di chuyển ra container nhờ
 * `has-[[data-slot=input-group-control]:focus-visible]`.
 *
 * @example
 * ```tsx
 * <InputGroup>
 *   <InputGroupAddon align="inline-start">
 *     <SearchIcon />
 *   </InputGroupAddon>
 *   <InputGroupInput placeholder="Tìm lá số..." />
 *   <InputGroupAddon align="inline-end">
 *     <InputGroupButton onClick={onClear}>Clear</InputGroupButton>
 *   </InputGroupAddon>
 * </InputGroup>
 * ```
 */
function InputGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-group"
      role="group"
      className={cn(
        "group/input-group border-input dark:bg-input/30 shadow-xs relative flex w-full items-center rounded-md border outline-none transition-[color,box-shadow]",
        "h-9 has-[>textarea]:h-auto",

        // Variants based on alignment.
        "has-[>[data-align=inline-start]]:[&>input]:pl-2",
        "has-[>[data-align=inline-end]]:[&>input]:pr-2",
        "has-[>[data-align=block-start]]:h-auto has-[>[data-align=block-start]]:flex-col has-[>[data-align=block-start]]:[&>input]:pb-3",
        "has-[>[data-align=block-end]]:h-auto has-[>[data-align=block-end]]:flex-col has-[>[data-align=block-end]]:[&>input]:pt-3",

        // Focus state.
        "has-[[data-slot=input-group-control]:focus-visible]:ring-ring has-[[data-slot=input-group-control]:focus-visible]:ring-1",

        // Error state.
        "has-[[data-slot][aria-invalid=true]]:ring-destructive/20 has-[[data-slot][aria-invalid=true]]:border-destructive dark:has-[[data-slot][aria-invalid=true]]:ring-destructive/40",

        className
      )}
      {...props}
    />
  )
}

const inputGroupAddonVariants = cva(
  "text-muted-foreground flex h-auto cursor-text select-none items-center justify-center gap-2 py-1.5 text-sm font-medium group-data-[disabled=true]/input-group:opacity-50 [&>kbd]:rounded-[calc(var(--radius)-5px)] [&>svg:not([class*='size-'])]:size-4",
  {
    variants: {
      align: {
        "inline-start":
          "order-first pl-3 has-[>button]:ml-[-0.45rem] has-[>kbd]:ml-[-0.35rem]",
        "inline-end":
          "order-last pr-3 has-[>button]:mr-[-0.4rem] has-[>kbd]:mr-[-0.35rem]",
        "block-start":
          "[.border-b]:pb-3 order-first w-full justify-start px-3 pt-3 group-has-[>input]/input-group:pt-2.5",
        "block-end":
          "[.border-t]:pt-3 order-last w-full justify-start px-3 pb-3 group-has-[>input]/input-group:pb-2.5",
      },
    },
    defaultVariants: {
      align: "inline-start",
    },
  }
)

/**
 * InputGroupAddon — phần phụ kiện đặt trong {@link InputGroup}. Có
 * thể chứa icon, text, kbd hint, hoặc {@link InputGroupButton}.
 *
 * Prop `align`:
 * - `"inline-start"` (mặc định): bên trái input.
 * - `"inline-end"`: bên phải input.
 * - `"block-start"`: phía trên input (chuyển container sang flex-col).
 * - `"block-end"`: phía dưới input (chuyển container sang flex-col).
 *
 * Click vào vùng addon (không phải button) sẽ tự focus input bên
 * trong group — tăng affordance giống native `<label>`.
 */
function InputGroupAddon({
  className,
  align = "inline-start",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof inputGroupAddonVariants>) {
  return (
    <div
      role="group"
      data-slot="input-group-addon"
      data-align={align}
      className={cn(inputGroupAddonVariants({ align }), className)}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("button")) {
          return
        }
        e.currentTarget.parentElement?.querySelector("input")?.focus()
      }}
      {...props}
    />
  )
}

const inputGroupButtonVariants = cva(
  "flex items-center gap-2 text-sm shadow-none",
  {
    variants: {
      size: {
        xs: "h-6 gap-1 rounded-[calc(var(--radius)-5px)] px-2 has-[>svg]:px-2 [&>svg:not([class*='size-'])]:size-3.5",
        sm: "h-8 gap-1.5 rounded-md px-2.5 has-[>svg]:px-2.5",
        "icon-xs":
          "size-6 rounded-[calc(var(--radius)-5px)] p-0 has-[>svg]:p-0",
        "icon-sm": "size-8 p-0 has-[>svg]:p-0",
      },
    },
    defaultVariants: {
      size: "xs",
    },
  }
)

/**
 * InputGroupButton — button thu gọn dùng bên trong
 * {@link InputGroupAddon} (clear, submit, copy,...). Mặc định
 * `type="button"` để không submit form ngoài ý muốn, `variant="ghost"`
 * để hoà với background của container.
 *
 * Prop `size`: `"xs"` (mặc định, h-6), `"sm"` (h-8), `"icon-xs"`
 * (vuông 6×6), `"icon-sm"` (vuông 8×8).
 *
 * Lưu ý a11y: khi chỉ có icon, gắn `aria-label` để screen reader
 * biết hành động (ví dụ: `aria-label="Xoá nội dung"`).
 */
function InputGroupButton({
  className,
  type = "button",
  variant = "ghost",
  size = "xs",
  ...props
}: Omit<React.ComponentProps<typeof Button>, "size"> &
  VariantProps<typeof inputGroupButtonVariants>) {
  return (
    <Button
      type={type}
      data-size={size}
      variant={variant}
      className={cn(inputGroupButtonVariants({ size }), className)}
      {...props}
    />
  )
}

/**
 * InputGroupText — text/inline content (label phụ, đơn vị, hint)
 * trong {@link InputGroupAddon}. Render `<span>` với màu muted và
 * icon SVG con tự áp `size-4`.
 */
function InputGroupText({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "text-muted-foreground flex items-center gap-2 text-sm [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none",
        className
      )}
      {...props}
    />
  )
}

/**
 * InputGroupInput — `<Input>` đã tinh chỉnh để dùng trong
 * {@link InputGroup}: bỏ border/shadow/focus-ring riêng, kế thừa từ
 * container; nền trong suốt để hoà với background của group.
 *
 * Tự gắn `data-slot="input-group-control"` để container chuyển focus
 * ring và error state đúng lúc qua selector `:has()`.
 */
function InputGroupInput({
  className,
  ...props
}: React.ComponentProps<"input">) {
  return (
    <Input
      data-slot="input-group-control"
      className={cn(
        "flex-1 rounded-none border-0 bg-transparent shadow-none focus-visible:ring-0 dark:bg-transparent",
        className
      )}
      {...props}
    />
  )
}

/**
 * InputGroupTextarea — phiên bản textarea cho {@link InputGroup}.
 * Bỏ resize handle (`resize-none`), bỏ border/shadow riêng, padding
 * dọc `py-3` để cao hơn input single-line.
 *
 * Dùng cho ô comment có icon prefix, hoặc textarea với button đính
 * kèm (gửi, đính kèm file). Container tự chuyển sang chiều cao auto
 * khi chứa `<textarea>` (`has-[>textarea]:h-auto`).
 */
function InputGroupTextarea({
  className,
  ...props
}: React.ComponentProps<"textarea">) {
  return (
    <Textarea
      data-slot="input-group-control"
      className={cn(
        "flex-1 resize-none rounded-none border-0 bg-transparent py-3 shadow-none focus-visible:ring-0 dark:bg-transparent",
        className
      )}
      {...props}
    />
  )
}

export {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupInput,
  InputGroupTextarea,
}
