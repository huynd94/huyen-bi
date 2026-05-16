# Requirements Document

## Introduction

Nâng cấp lớp nền trang trí (Ambient Background) của ứng dụng Huyền Bí: thêm layer nền mới phía dưới các orb hiện tại. Ở dark mode, nền hiển thị bầu trời đêm đầy sao (50–100+ sao) di chuyển và nhấp nháy. Ở light mode, nền hiển thị bầu trời xanh với mây trắng trôi ngang chậm rãi từ trái sang phải. Kỹ thuật CSS-only (keyframes) được sử dụng để đảm bảo hiệu năng tối ưu. Opacity wrapper tổng thể giữ nguyên ràng buộc ≤ 35% (dark) và ≤ 15% (light).

## Glossary

- **Ambient_Background**: Component React (`ambient-bg.tsx`) chứa các lớp trang trí nền gồm orb và layer nền mới (star field / cloud field).
- **Star_Field_Layer**: Lớp CSS hiển thị nhiều ngôi sao (50–100+ điểm sáng) với hiệu ứng nhấp nháy và di chuyển nhẹ, chỉ hiển thị ở dark mode.
- **Cloud_Field_Layer**: Lớp CSS hiển thị các đám mây trắng trôi ngang từ trái sang phải trên nền trời xanh, chỉ hiển thị ở light mode.
- **Orb_Layer**: Các phần tử orb gradient mờ hiện có (orb-1 đến orb-4) nằm phía trên Star_Field_Layer và Cloud_Field_Layer.
- **Theme_Context**: React context cung cấp giá trị theme hiện tại ("dark" hoặc "light").
- **Reduced_Motion_User**: Người dùng có cài đặt hệ thống `prefers-reduced-motion: reduce`.
- **Wrapper_Opacity**: Giá trị opacity áp lên container bao ngoài toàn bộ Ambient_Background (dark ≤ 0.35, light ≤ 0.15).

## Requirements

### Requirement 1: Star Field Layer cho Dark Mode

**User Story:** As a user, I want to see a starry night sky background when using dark mode, so that the app feels immersive and mystical.

#### Acceptance Criteria

1. WHILE Theme_Context provides "dark", THE Ambient_Background SHALL render Star_Field_Layer containing between 50 and 100 star points distributed across the viewport.
2. WHILE Theme_Context provides "dark", THE Star_Field_Layer SHALL display star points as CSS radial-gradient dots with sizes between 1px and 2px.
3. WHILE Theme_Context provides "dark", THE Star_Field_Layer SHALL animate star points with a twinkle keyframe that varies opacity between 0.3 and 1.0 over a cycle of 4 to 8 seconds.
4. WHILE Theme_Context provides "dark", THE Star_Field_Layer SHALL animate a slow drift movement using CSS translate keyframes with a cycle duration between 60 and 120 seconds.
5. WHILE Theme_Context provides "light", THE Ambient_Background SHALL hide Star_Field_Layer by setting its visibility to hidden or display to none.

### Requirement 2: Cloud Field Layer cho Light Mode

**User Story:** As a user, I want to see a blue sky with drifting white clouds when using light mode, so that the app feels light and airy.

#### Acceptance Criteria

1. WHILE Theme_Context provides "light", THE Ambient_Background SHALL render Cloud_Field_Layer displaying cloud shapes on a transparent background.
2. WHILE Theme_Context provides "light", THE Cloud_Field_Layer SHALL animate clouds drifting horizontally from left to right using CSS translateX keyframes.
3. WHILE Theme_Context provides "light", THE Cloud_Field_Layer SHALL use a drift animation cycle duration between 30 and 80 seconds for each cloud element.
4. WHILE Theme_Context provides "light", THE Cloud_Field_Layer SHALL render clouds as white or near-white CSS shapes with soft blur and varying opacity between 0.4 and 0.8.
5. WHILE Theme_Context provides "dark", THE Ambient_Background SHALL hide Cloud_Field_Layer by setting its visibility to hidden or display to none.

### Requirement 3: Layer Stacking Order

**User Story:** As a user, I want the new background layers to appear behind the existing orbs, so that the orbs remain visible as an overlay effect.

#### Acceptance Criteria

1. THE Ambient_Background SHALL render Star_Field_Layer and Cloud_Field_Layer at a z-index lower than Orb_Layer within the Ambient_Background container.
2. THE Ambient_Background SHALL maintain existing Orb_Layer rendering (orb-1 through orb-4) without modification to their styles or animations.
3. THE Ambient_Background SHALL render the new background layers (Star_Field_Layer or Cloud_Field_Layer) as the first child elements before Orb_Layer elements in the DOM order.

### Requirement 4: CSS-Only Animation Technique

**User Story:** As a developer, I want all new animations to use CSS keyframes only, so that performance remains optimal without JavaScript animation overhead.

#### Acceptance Criteria

1. THE Star_Field_Layer SHALL use CSS `@keyframes` rules and the `animation` property for all visual motion effects including twinkle and drift.
2. THE Cloud_Field_Layer SHALL use CSS `@keyframes` rules and the `animation` property for all horizontal drift motion.
3. THE Star_Field_Layer SHALL apply `will-change: transform, opacity` and `transform: translateZ(0)` to enable GPU compositing.
4. THE Cloud_Field_Layer SHALL apply `will-change: transform` and `transform: translateZ(0)` to enable GPU compositing.

### Requirement 5: Wrapper Opacity Constraints

**User Story:** As a user, I want the background decoration to remain subtle, so that content readability is preserved.

#### Acceptance Criteria

1. WHILE Theme_Context provides "dark", THE Ambient_Background wrapper SHALL apply an opacity value no greater than 0.35.
2. WHILE Theme_Context provides "light", THE Ambient_Background wrapper SHALL apply an opacity value no greater than 0.15.
3. THE Ambient_Background SHALL compute wrapper opacity using the existing `computeAmbientOpacity` function without modification.

### Requirement 6: Reduced Motion Support

**User Story:** As a user with motion sensitivity, I want animations to be disabled when I have prefers-reduced-motion enabled, so that I can use the app comfortably.

#### Acceptance Criteria

1. WHILE Reduced_Motion_User accesses the application, THE Star_Field_Layer SHALL render in a static state with all animations paused (animation set to "none") and opacity set to 1.
2. WHILE Reduced_Motion_User accesses the application, THE Cloud_Field_Layer SHALL render in a static state with all animations paused (animation set to "none") and opacity set to 1.
3. WHEN the system `prefers-reduced-motion` setting changes at runtime, THE Ambient_Background SHALL update Star_Field_Layer and Cloud_Field_Layer animation states within the same render cycle.

### Requirement 7: Accessibility and Non-interference

**User Story:** As a user, I want the background decoration to not interfere with content interaction or screen readers, so that the app remains fully accessible.

#### Acceptance Criteria

1. THE Ambient_Background container SHALL include `aria-hidden="true"` attribute to exclude the element from the accessibility tree.
2. THE Ambient_Background container SHALL include `pointer-events: none` style to prevent the background from intercepting user interactions.
3. THE Star_Field_Layer and Cloud_Field_Layer SHALL not contain any text content or interactive elements.

### Requirement 8: Theme Transition

**User Story:** As a user, I want a smooth visual transition when switching between dark and light mode, so that the background change feels natural.

#### Acceptance Criteria

1. WHEN Theme_Context value changes from "dark" to "light", THE Ambient_Background SHALL hide Star_Field_Layer and show Cloud_Field_Layer within the same React render cycle.
2. WHEN Theme_Context value changes from "light" to "dark", THE Ambient_Background SHALL hide Cloud_Field_Layer and show Star_Field_Layer within the same React render cycle.
