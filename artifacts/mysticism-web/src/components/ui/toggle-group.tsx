"use client"

import * as React from "react"
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group"
import { type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { toggleVariants } from "@/components/ui/toggle"

const ToggleGroupContext = React.createContext<
  VariantProps<typeof toggleVariants>
>({
  size: "default",
  variant: "default",
})

/**
 * ToggleGroup — nhóm các nút bật/tắt (bọc Radix `ToggleGroup.Root`).
 *
 * Mục đích: cho phép người dùng chọn một (`type="single"`) hoặc nhiều
 * (`type="multiple"`) lựa chọn từ một dải nút có cùng phong cách. Dùng
 * cho bộ lọc, chọn alignment, chọn chế độ hiển thị bài.
 *
 * Lưu ý a11y: Radix tự gán `role="group"`/`role="radiogroup"` tuỳ `type`
 * và quản lý focus theo dạng roving tabindex (mũi tên trái/phải hoặc
 * lên/xuống để điều hướng giữa các item). Truyền `aria-label` ở Root
 * để screen reader đọc tên nhóm. `variant`/`size` truyền xuống các item
 * thông qua context, đảm bảo style đồng nhất.
 *
 * @example
 * ```tsx
 * <ToggleGroup type="single" defaultValue="left" aria-label="Căn lề">
 *   <ToggleGroupItem value="left">Trái</ToggleGroupItem>
 *   <ToggleGroupItem value="center">Giữa</ToggleGroupItem>
 *   <ToggleGroupItem value="right">Phải</ToggleGroupItem>
 * </ToggleGroup>
 * ```
 */
const ToggleGroup = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root> &
    VariantProps<typeof toggleVariants>
>(({ className, variant, size, children, ...props }, ref) => (
  <ToggleGroupPrimitive.Root
    ref={ref}
    className={cn("flex items-center justify-center gap-1", className)}
    {...props}
  >
    <ToggleGroupContext.Provider value={{ variant, size }}>
      {children}
    </ToggleGroupContext.Provider>
  </ToggleGroupPrimitive.Root>
))

ToggleGroup.displayName = ToggleGroupPrimitive.Root.displayName

/**
 * ToggleGroupItem — một nút bật/tắt nằm trong `ToggleGroup`.
 *
 * Mục đích: đại diện cho một lựa chọn riêng lẻ; trạng thái `on/off` được
 * quản lý bởi parent `ToggleGroup`. Tự động kế thừa `variant`/`size` của
 * group qua context (props truyền trực tiếp được ưu tiên).
 *
 * Lưu ý a11y: item là một button tham gia roving tabindex; trạng thái
 * "đang chọn" được phản ánh qua `aria-pressed`/`data-state="on"` để
 * người dùng trợ năng nhận biết. Đảm bảo nội dung con có nhãn rõ ràng
 * (text hoặc `aria-label` khi chỉ dùng icon).
 */
const ToggleGroupItem = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item> &
    VariantProps<typeof toggleVariants>
>(({ className, children, variant, size, ...props }, ref) => {
  const context = React.useContext(ToggleGroupContext)

  return (
    <ToggleGroupPrimitive.Item
      ref={ref}
      className={cn(
        toggleVariants({
          variant: context.variant || variant,
          size: context.size || size,
        }),
        className
      )}
      {...props}
    >
      {children}
    </ToggleGroupPrimitive.Item>
  )
})

ToggleGroupItem.displayName = ToggleGroupPrimitive.Item.displayName

export { ToggleGroup, ToggleGroupItem }
