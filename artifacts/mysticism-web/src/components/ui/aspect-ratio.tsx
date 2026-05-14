import * as AspectRatioPrimitive from "@radix-ui/react-aspect-ratio"

/**
 * AspectRatio — wrapper trực tiếp của `@radix-ui/react-aspect-ratio` Root.
 *
 * Mục đích: ép children giữ tỉ lệ khung hình cố định (ví dụ 16:9, 1:1)
 * bất kể chiều rộng container thay đổi. Hữu ích cho ảnh bìa lá số,
 * thumbnail bài viết, video embed.
 *
 * Props:
 * - `ratio`: số (mặc định `1`). Ví dụ `16 / 9`, `4 / 3`, `1`.
 *
 * Lưu ý a11y: AspectRatio là wrapper trình bày, không thêm role.
 * Nếu wrap `<img>`, nhớ truyền `alt`. Nếu chứa nội dung quan trọng,
 * cân nhắc gắn `aria-label` cho container ngoài.
 *
 * @example
 * ```tsx
 * <AspectRatio ratio={16 / 9}>
 *   <img src="/cover.jpg" alt="Bìa lá số" className="object-cover" />
 * </AspectRatio>
 * ```
 */
const AspectRatio = AspectRatioPrimitive.Root

export { AspectRatio }
