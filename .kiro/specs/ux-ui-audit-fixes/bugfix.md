# Bugfix Requirements Document

## Introduction

Tài liệu này mô tả 4 lỗi UX/UI đang tồn tại trong ứng dụng Huyền Bí (frontend tại `artifacts/mysticism-web/src/`) được phát hiện trong quá trình audit sau khi triển khai spec `ux-ui-upgrade`. Các lỗi ảnh hưởng trực tiếp đến trải nghiệm người dùng: sub-menu hiển thị sai vị trí gây khó điều hướng, nội dung trang chủ canh trái tạo khoảng trống thừa, animation bị giật/đơ gây cảm giác thiếu chuyên nghiệp, và tương phản thấp ở light mode khiến nội dung khó đọc.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN người dùng hover/click vào một NavigationMenuTrigger trên navbar desktop (≥768px) THEN sub-menu (NavigationMenuContent) hiển thị ở vị trí cố định phía dưới bên trái của toàn bộ NavigationMenu root thay vì ngay phía dưới menu item cha tương ứng, do NavigationMenuViewport được đặt với `absolute left-0 top-full` trên container root chứ không tương đối với từng NavigationMenuItem

1.2 WHEN người dùng xem trang chủ trên viewport rộng (≥1024px) với các nhóm module có ít item (2–3 card) THEN nội dung grid các module card bị canh trái (left-aligned) trong container `max-w-6xl`, tạo khoảng trống lớn bên phải do grid tự fill từ trái sang mà không có cơ chế canh giữa nội dung

1.3 WHEN các hiệu ứng animation/transition chạy (orb drift, scroll reveal, shimmer-text, glow-pulse, hover card) THEN chuyển động bị giật, đơ, không mượt mà do sử dụng các thuộc tính gây layout/paint (như `filter: blur` trên phần tử lớn, animation không được GPU-accelerated, thiếu `will-change` hint, hoặc easing curve không phù hợp)

1.4 WHEN người dùng chuyển sang light mode THEN một số cặp text/background có tương phản thấp hơn WCAG 2.1 AA (4.5:1 cho text thường, 3:1 cho text lớn), đặc biệt ở `--muted-foreground` trên `--background`, `--primary` trên `--card`, và các text phụ (tagline, description) trên nền sáng, khiến nội dung khó đọc ngoài trời hoặc trên màn hình độ sáng thấp

### Expected Behavior (Correct)

2.1 WHEN người dùng hover/click vào một NavigationMenuTrigger trên navbar desktop THEN sub-menu (dropdown content) SHALL hiển thị ngay phía dưới menu item cha tương ứng, căn chỉnh theo vị trí ngang của trigger đó, theo đúng chuẩn dropdown navigation (viewport wrapper phải được đặt tương đối với NavigationMenuItem hoặc sử dụng positioning logic để align với trigger)

2.2 WHEN người dùng xem trang chủ trên mọi viewport THEN nội dung grid các module card SHALL được canh giữa (center-aligned) trong container, sử dụng `justify-items: center` hoặc `place-content: center` trên grid, hoặc `justify-center` trên flex wrapper, để các card phân bố đều và giao diện cân đối khi số lượng card không lấp đầy hàng cuối

2.3 WHEN các hiệu ứng animation/transition chạy THEN chuyển động SHALL mượt mà ở 60fps bằng cách: (a) sử dụng GPU-accelerated properties (`transform`, `opacity`) thay vì `top`/`left`/`width`/`height`/`filter` cho animation liên tục, (b) thêm `will-change: transform` cho các phần tử có animation phức tạp (orbs), (c) sử dụng đúng easing curves (`cubic-bezier(0.22, 0.61, 0.36, 1)` cho enter, `cubic-bezier(0.4, 0, 1, 1)` cho exit), (d) tránh trigger layout thrashing trong animation loop

2.4 WHEN người dùng ở light mode THEN tất cả cặp text/background SHALL đạt WCAG 2.1 AA contrast ratio: tối thiểu 4.5:1 cho text thường (<18px hoặc <14px bold) và tối thiểu 3:1 cho text lớn (≥18px hoặc ≥14px bold), bao gồm `--muted-foreground` trên `--background`, `--muted-foreground` trên `--card`, `--primary` dùng làm text trên nền sáng, và mọi text decorative/tagline

### Unchanged Behavior (Regression Prevention)

3.1 WHEN người dùng tương tác với navbar trên mobile (<768px) THEN hệ thống SHALL CONTINUE TO hiển thị MobileDrawer trượt từ trái với 5 nhóm dropdown và đóng tự động sau khi chọn link, không bị ảnh hưởng bởi thay đổi positioning của desktop sub-menu

3.2 WHEN người dùng xem trang chủ trên mobile (1 cột) THEN grid layout SHALL CONTINUE TO hiển thị các card module xếp dọc full-width, không bị ảnh hưởng bởi thay đổi canh giữa trên desktop

3.3 WHEN người dùng có thiết lập `prefers-reduced-motion: reduce` THEN hệ thống SHALL CONTINUE TO bỏ qua animation orb drift, scroll reveal slide, tilt-card 3D, glow-pulse, shimmer-text và thay bằng fade ≤150ms hoặc tắt hoàn toàn

3.4 WHEN người dùng ở dark mode THEN tất cả color tokens SHALL CONTINUE TO giữ nguyên giá trị HSL hiện tại (không thay đổi dark mode tokens), đảm bảo giao diện dark mode không bị ảnh hưởng bởi việc điều chỉnh light mode contrast

3.5 WHEN người dùng hover lên card module trên trang chủ THEN hiệu ứng hover (border-primary/40, bg-card/80, translate arrow) SHALL CONTINUE TO hoạt động bình thường với transition mượt mà

3.6 WHEN NavigationMenuContent hiển thị THEN animation enter/exit (fade-in, slide-in, zoom-in) SHALL CONTINUE TO hoạt động với cùng duration và easing đã định nghĩa, chỉ thay đổi vị trí hiển thị chứ không thay đổi hiệu ứng chuyển cảnh
