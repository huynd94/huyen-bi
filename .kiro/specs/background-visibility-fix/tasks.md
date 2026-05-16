# Implementation Plan: Background Visibility Fix

## Overview

Sửa CSS trong `src/index.css` để cải thiện hiển thị nền trang trí: thêm prominent stars cho dark mode, nâng twinkle minimum opacity, và đổi màu mây sang xanh biển cho light mode. Thay đổi tối thiểu, chỉ CSS, không sửa logic component.

## Task Dependency Graph

```json
{
  "waves": [
    {
      "tasks": ["1", "2"],
      "description": "Thay đổi CSS song song: dark mode stars và light mode clouds"
    },
    {
      "tasks": ["3"],
      "description": "Checkpoint kiểm tra visual và regression"
    }
  ]
}
```

## Tasks

- [x] 1. Thêm Prominent Stars và fix twinkle animation cho Dark Mode
  - [x] 1.1 Thêm `.ambient-star-field::after` pseudo-element với 8 ngôi sao lớn (3-4px, opacity 0.7-1.0)
    - Thêm CSS rule mới sau block `.ambient-star-field` hiện tại
    - 8 radial-gradient layers, phân bố đều 4 góc viewport
    - Màu vàng ấm: hsl(40-45, 80-95%, 78-85%)
    - Animation: `stars-field-twinkle 8s ease-in-out infinite`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 7.1_
  - [x] 1.2 Thêm `@media (prefers-reduced-motion: reduce)` rule cho pseudo-element
    - Set `animation: none; opacity: 1` cho `.ambient-star-field::after`
    - _Requirements: 5.1, 5.3_
  - [x] 1.3 Sửa `@keyframes stars-field-twinkle` — nâng opacity minimum từ 0.3 lên 0.5
    - Chỉ thay đổi giá trị `0.3` thành `0.5` trong keyframe `0%, 100%`
    - Giữ nguyên `50% { opacity: 1 }`
    - _Requirements: 2.1, 2.2, 2.3_

- [x] 2. Đổi màu mây sang xanh biển và tăng opacity cho Light Mode
  - [x] 2.1 Đổi `.ambient-cloud` background từ `rgba(255, 255, 255, 0.9)` sang `hsl(200 60% 75% / 0.85)`
    - Giữ nguyên border-radius, filter blur(12px), và các property khác
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  - [x] 2.2 Tăng opacity các `.ambient-cloud-1` đến `.ambient-cloud-5`
    - cloud-1: 0.6 → 0.7
    - cloud-2: 0.5 → 0.65
    - cloud-3: 0.7 → 0.85
    - cloud-4: 0.45 → 0.6
    - cloud-5: 0.8 → 0.9
    - _Requirements: 4.1, 4.2, 4.3_

- [x] 3. Checkpoint — Kiểm tra visual và regression
  - Mở app ở dark mode: xác nhận prominent stars hiển thị rõ, star field twinkle không biến mất
  - Mở app ở light mode: xác nhận mây xanh biển nhìn thấy được trên nền kem
  - Xác nhận orb layer (4 orbs) không bị ảnh hưởng ở cả hai mode
  - Bật `prefers-reduced-motion: reduce` trong DevTools → xác nhận stars và clouds hiển thị tĩnh
  - Ensure all tests pass, ask the user if questions arise.
  - _Requirements: 5.1, 5.2, 6.1, 6.2, 6.3_

## Notes

- Tất cả thay đổi nằm trong file `artifacts/mysticism-web/src/index.css`
- Không cần sửa `ambient-bg.tsx` — pseudo-element và media query xử lý hoàn toàn trong CSS
- Orb layer không bị chạm vào — chỉ thêm/sửa rules cho star field và cloud field
- Tổng gradient layers sau fix: 60 (existing) + 8 (prominent, trong pseudo) = 68 < 70 (Requirement 7.3)
