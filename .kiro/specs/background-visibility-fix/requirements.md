# Requirements Document

## Giới thiệu

Sửa lỗi hiển thị nền trang trí (background decorative effects) trong ứng dụng Huyền Bí. Hiện tại, hiệu ứng ngôi sao (dark mode) và mây trôi (light mode) gần như không nhìn thấy được do kết hợp opacity quá thấp và màu sắc không tương phản với nền. Mục tiêu là làm cho các hiệu ứng nền rõ ràng hơn mà vẫn giữ tính thẩm mỹ huyền bí và không ảnh hưởng đến khả năng đọc nội dung.

## Thuật ngữ

- **Ambient_Background**: Component `AmbientBg` — lớp nền trang trí bao gồm orb, star field, và cloud field
- **Star_Field**: Lớp ngôi sao nhỏ (1-2px) hiển thị ở dark mode, sử dụng CSS `radial-gradient`
- **Prominent_Stars**: Nhóm 5-10 ngôi sao lớn hơn (3-4px), sáng hơn, rõ ràng hơn so với Star_Field
- **Cloud_Field**: Lớp mây trôi hiển thị ở light mode, gồm 5 phần tử `.ambient-cloud`
- **Wrapper_Opacity**: Opacity của container bao ngoài toàn bộ Ambient_Background (dark: 0.35, light: 0.15)
- **Twinkle_Animation**: Animation nhấp nháy của Star_Field, dao động opacity giữa 0.3 và 1.0
- **Orb_Layer**: 4 orb gradient mờ tạo hiệu ứng ánh sáng nền
- **Reduced_Motion_User**: Người dùng bật `prefers-reduced-motion: reduce`

## Requirements

### Requirement 1: Ngôi sao nổi bật trong Dark Mode

**User Story:** Là người dùng ở dark mode, tôi muốn nhìn thấy rõ các ngôi sao trang trí trên nền, để tạo cảm giác huyền bí và không gian vũ trụ.

#### Acceptance Criteria

1. WHEN Ambient_Background renders in dark mode, THE Prominent_Stars SHALL display 5 to 10 star points with size between 3px and 4px
2. WHEN Prominent_Stars are rendered, THE Prominent_Stars SHALL have individual opacity values between 0.7 and 1.0 (before Wrapper_Opacity is applied)
3. WHEN Prominent_Stars are rendered, THE Prominent_Stars SHALL be distributed across the viewport without clustering in any single quadrant
4. THE Prominent_Stars SHALL be implemented using CSS-only techniques (radial-gradient backgrounds) without adding extra DOM elements

### Requirement 2: Cải thiện Star Field hiện tại

**User Story:** Là người dùng ở dark mode, tôi muốn trường sao nhỏ hiện tại dễ nhìn hơn, để nền không bị trống trải.

#### Acceptance Criteria

1. WHEN Star_Field renders in dark mode, THE Twinkle_Animation SHALL have a minimum opacity of 0.5 (thay vì 0.3 hiện tại)
2. WHEN Star_Field renders in dark mode, THE Star_Field SHALL maintain all 60 existing star points at their current positions
3. THE Star_Field SHALL retain its existing drift animation behavior without modification

### Requirement 3: Đổi màu mây sang xanh biển trong Light Mode

**User Story:** Là người dùng ở light mode, tôi muốn nhìn thấy mây trôi rõ ràng trên nền kem, để tạo cảm giác nhẹ nhàng và thanh thoát.

#### Acceptance Criteria

1. WHEN Cloud_Field renders in light mode, THE Cloud_Field SHALL use ocean blue / light blue color tones (hsl range: hue 195-220, saturation 40-70%, lightness 60-80%) instead of white
2. WHEN Cloud_Field renders in light mode, THE Cloud_Field SHALL be clearly visible against the cream background (hsl 40 30% 98%)
3. THE Cloud_Field SHALL maintain its existing drift animation (cloud-drift keyframes) without modification
4. THE Cloud_Field SHALL maintain its existing blur filter (12px) and organic border-radius shape

### Requirement 4: Tăng khả năng hiển thị mây

**User Story:** Là người dùng ở light mode, tôi muốn mây đủ rõ để nhận biết hiệu ứng nền đang hoạt động, mà không làm mất tập trung khỏi nội dung chính.

#### Acceptance Criteria

1. WHEN Cloud_Field renders in light mode, THE Wrapper_Opacity for light mode SHALL remain at 0.15 to comply with existing Requirement 10.8 constraints
2. WHEN Cloud_Field renders in light mode, THE individual cloud elements SHALL have opacity values between 0.5 and 0.9 to compensate for low Wrapper_Opacity
3. IF the combined effective opacity (Wrapper_Opacity × cloud element opacity) results in clouds being invisible against the background, THEN THE Cloud_Field SHALL increase individual cloud opacity within the allowed range

### Requirement 5: Bảo toàn Accessibility

**User Story:** Là người dùng bật chế độ giảm chuyển động, tôi muốn vẫn nhìn thấy hiệu ứng nền ở trạng thái tĩnh, để trải nghiệm thị giác không bị mất hoàn toàn.

#### Acceptance Criteria

1. WHILE Reduced_Motion_User accesses the application, THE Prominent_Stars SHALL render in static state (no animation) with opacity set to 1
2. WHILE Reduced_Motion_User accesses the application, THE Cloud_Field SHALL render in static state with clouds visible at their initial positions
3. THE Ambient_Background SHALL continue to respect `prefers-reduced-motion: reduce` media query for all new and existing animations

### Requirement 6: Bảo toàn Orb Layer

**User Story:** Là developer, tôi muốn đảm bảo việc sửa lỗi không phá vỡ các hiệu ứng orb hiện có, để tránh regression.

#### Acceptance Criteria

1. WHEN changes are applied to Star_Field or Cloud_Field, THE Orb_Layer SHALL maintain its existing 4 orb elements with unchanged gradient colors, sizes, and animation keyframes
2. WHEN changes are applied to Star_Field or Cloud_Field, THE Orb_Layer SHALL maintain its existing `orb-appear` and `orb-drift-*` animations without modification
3. THE Orb_Layer SHALL continue to render in both dark mode and light mode without visual changes

### Requirement 7: Hiệu suất

**User Story:** Là developer, tôi muốn đảm bảo các thay đổi không ảnh hưởng đến hiệu suất render, để ứng dụng vẫn mượt mà.

#### Acceptance Criteria

1. THE Prominent_Stars SHALL be implemented within the existing `.ambient-star-field` element using CSS background-image (no additional DOM elements)
2. THE Cloud_Field color change SHALL only modify CSS property values without adding new DOM elements or JavaScript logic
3. WHEN Prominent_Stars are added, THE total number of radial-gradient layers in `.ambient-star-field` SHALL not exceed 70 (60 existing + 10 prominent)
