"use client"

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"

import { cn } from "@/lib/utils"

/**
 * Avatar — wrapper Radix Avatar Root.
 *
 * Mục đích: hiển thị ảnh đại diện người dùng (40×40 mặc định) với
 * fallback hai chữ cái viết tắt khi ảnh chưa tải / lỗi.
 *
 * Props: kế thừa props của `AvatarPrimitive.Root` (`asChild`, `className`,
 * `delayMs` tránh nhấp nháy fallback,...).
 *
 * Lưu ý a11y: bản thân Avatar là khối trang trí; khi cần ngữ cảnh hãy
 * gắn `aria-label` ở container hoặc thêm tên người dùng cạnh avatar.
 * `<AvatarImage>` cần `alt` để screen reader đọc.
 *
 * @example
 * ```tsx
 * <Avatar>
 *   <AvatarImage src={user.avatarUrl} alt={user.fullName} />
 *   <AvatarFallback>{initials}</AvatarFallback>
 * </Avatar>
 * ```
 */
const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
      className
    )}
    {...props}
  />
))
Avatar.displayName = AvatarPrimitive.Root.displayName

/**
 * Ảnh thật của Avatar. Bắt buộc truyền `alt` để screen reader đọc;
 * nếu avatar chỉ trang trí, dùng `alt=""`.
 *
 * Mặc định bật `loading="lazy"` và `decoding="async"` (Requirement 11.5):
 * avatar gần như luôn nằm ngoài viewport đầu tiên (navbar dropdown, danh
 * sách hồ sơ, sidebar) nên trì hoãn tải giúp tiết kiệm băng thông và
 * tránh chặn LCP. Nếu hiếm hoi cần render avatar above-the-fold (hero
 * profile…), consumer ghi đè rõ ràng `loading="eager"`.
 */
const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, loading, decoding, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn("aspect-square h-full w-full", className)}
    loading={loading ?? "lazy"}
    decoding={decoding ?? "async"}
    {...props}
  />
))
AvatarImage.displayName = AvatarPrimitive.Image.displayName

/**
 * Fallback hiển thị khi ảnh lỗi / chưa tải xong. Thường chứa 1–2 chữ
 * cái viết tắt từ tên người dùng (Vietnamese: bỏ dấu trước khi lấy).
 */
const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-muted",
      className
    )}
    {...props}
  />
))
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

export { Avatar, AvatarImage, AvatarFallback }
