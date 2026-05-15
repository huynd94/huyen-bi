# Requirements Document

## Introduction

Tài liệu này định nghĩa các yêu cầu cho việc nâng cấp UX/UI toàn diện của ứng dụng **Huyền Bí** — nền tảng huyền học Việt Nam gồm 15 mô-đun tra cứu và trợ lý AI. Mục tiêu của bản nâng cấp là đưa giao diện đạt chất lượng sản phẩm cao cấp: hệ thống thiết kế nhất quán, tuân thủ WCAG 2.1 AA, responsive đầy đủ trên các điểm ngắt 320px / 768px / 1024px / 1440px, có loading / error / empty state cho mọi luồng, vi tương tác có chủ đích (Framer Motion), và tránh vẻ "AI mặc định" (gradient tím vô hồn, padding khổng lồ, bo góc đồng nhất, shadow nặng) trong khi vẫn giữ bản sắc huyền bí (vàng `#c9a227`, tím đêm `#0d0818`, ambient orbs, star field).

Phạm vi áp dụng cho toàn bộ frontend tại `artifacts/mysticism-web/src/`, bao gồm: 15 trang mô-đun, các trang `home`, `sign-in`, `sign-up`, `profile`, `ai-chat`, `lich-su`, layout (`navbar`, `footer`), và các component dùng chung (`ambient-bg`, `tilt-card`, `mystic-cursor`, `save-reading-btn`, `result-actions`, `export-card-*`, `pwa-install-prompt`, `markdown-renderer`).

Bản nâng cấp này KHÔNG thay đổi: kiến trúc backend, schema database, logic nghiệp vụ huyền học, hay các đảm bảo bảo mật đã kiểm toán (XSS, CSRF, rate limiting).

## Glossary

- **Huyền_Bí_App**: Ứng dụng web Huyền Bí (frontend `artifacts/mysticism-web`) — phạm vi mọi yêu cầu trong tài liệu này.
- **Design_System**: Tập hợp design tokens được định nghĩa trong `src/index.css` (màu sắc, typography, spacing, radius) cùng các component primitive trong `src/components/ui/`.
- **Module_Page**: Một trong 15 trang tra cứu (`than-so-hoc`, `bat-tu`, `xem-que`, `cat-hung`, `lich-van-nien`, `tu-vi`, `phong-thuy`, `xem-ten`, `lich-ca-nhan`, `tu-dien`, `hop-tuoi`, `xem-ngay-tot`, `sao-han`, `lich-su`, `ai-chat`).
- **Result_Card**: Khu vực hiển thị kết quả tra cứu của Module_Page (bao gồm bảng, biểu đồ, văn bản luận giải).
- **Form_Input**: Mọi trường nhập của người dùng (text, date, select, radio, textarea) trên Module_Page hoặc trang `sign-in` / `sign-up` / `profile`.
- **Color_Token**: Biến CSS semantic trong `:root` / `.light` / `.dark` (ví dụ `--primary`, `--background`, `--card`, `--muted-foreground`).
- **Spacing_Scale**: Thang khoảng cách Tailwind chuẩn (bội số của 0.25rem: `gap-1`, `gap-2`, `gap-3`, `gap-4`, `gap-6`, `gap-8`, `gap-12`, `gap-16`).
- **Type_Scale**: Hệ phân cấp typography gồm 6 mức `display`, `h1`, `h2`, `h3`, `body`, `small`.
- **Breakpoint_Mobile**: Chiều rộng viewport trong khoảng [320px, 767px].
- **Breakpoint_Tablet**: Chiều rộng viewport trong khoảng [768px, 1023px].
- **Breakpoint_Desktop**: Chiều rộng viewport trong khoảng [1024px, 1439px].
- **Breakpoint_Large**: Chiều rộng viewport ≥ 1440px.
- **Loading_State**: Trạng thái UI hiển thị trong khi chờ dữ liệu không đồng bộ (form submit, fetch, AI streaming).
- **Empty_State**: Trạng thái UI hiển thị khi danh sách dữ liệu rỗng (lịch sử tra cứu trống, không có lá số đã lưu, kết quả tìm kiếm rỗng).
- **Error_State**: Trạng thái UI hiển thị khi có lỗi (network failure, validation failure, server 4xx/5xx, AI rate-limit).
- **Skeleton**: Placeholder mờ pulse hiển thị khung dữ liệu đang tải, thay vì spinner cho nội dung lớn.
- **Focus_Ring**: Vòng outline hiển thị trên phần tử đang nhận keyboard focus, sử dụng `--ring` token.
- **Reduced_Motion_User**: Người dùng có thiết lập hệ điều hành `prefers-reduced-motion: reduce`.
- **High_Contrast_Ratio**: Tỷ lệ tương phản tối thiểu 4.5:1 cho text thường, 3:1 cho text lớn (≥18px hoặc ≥14px bold) và phần tử UI không phải text.
- **Markdown_Renderer**: Component `markdown-renderer.tsx` dùng để render output AI streaming.
- **Mystic_Cursor**: Hiệu ứng con trỏ ngôi sao tùy biến trên thiết bị có hover.
- **Ambient_Background**: Component `ambient-bg.tsx` chứa các orb mờ và star field.

---

## Requirements

### Requirement 1: Hệ thống thiết kế nhất quán (Design System)

**User Story:** Là người dùng cuối, tôi muốn mọi trang trong ứng dụng có cảm giác thuộc cùng một sản phẩm, để tôi tin tưởng vào tính chuyên nghiệp và dễ học các luồng mới.

#### Acceptance Criteria

1. THE Huyền_Bí_App SHALL sử dụng các Color_Token semantic (`--primary`, `--background`, `--foreground`, `--card`, `--muted`, `--accent`, `--destructive`, `--border`, `--ring`) cho mọi giá trị màu, không sử dụng hex hoặc rgb hard-code trong file `.tsx` ngoại trừ trong `src/index.css` và file định nghĩa SVG export card.
2. THE Huyền_Bí_App SHALL sử dụng giá trị thuộc Spacing_Scale chuẩn Tailwind (bội số của 0.25rem) cho mọi khoảng cách `padding`, `margin`, `gap`, không sử dụng giá trị tùy ý dạng `p-[13px]` hoặc `mt-[2.3rem]`.
3. THE Huyền_Bí_App SHALL áp dụng Type_Scale 6 mức (`display` ≥48px, `h1` 36px, `h2` 28px, `h3` 22px, `body` 16px, `small` 14px) với line-height tương ứng (1.1 cho heading, 1.5 cho body, 1.4 cho small).
4. THE Huyền_Bí_App SHALL sử dụng đúng một mức tiêu đề `h1` trên mỗi Module_Page, và không bỏ cấp tiêu đề (h1 → h3 không có h2).
5. WHEN một component mới được thêm vào dưới `src/components/`, THE Huyền_Bí_App SHALL tái sử dụng các primitive đã có trong `src/components/ui/` (button, card, input, dialog, dropdown, badge, tabs, accordion, alert, tooltip) thay vì tạo lại.
6. THE Huyền_Bí_App SHALL định nghĩa một thang `border-radius` thống nhất gồm 4 mức (`--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-xl`) và sử dụng đúng các mức này, không bo `rounded-2xl` đồng nhất khắp nơi.
7. THE Huyền_Bí_App SHALL có một file documentation `src/components/ui/README.md` mô tả: thang spacing, type scale, color tokens, border radius scale, và quy tắc khi nào dùng từng primitive.

### Requirement 2: Tương đương Light/Dark mode (Theme Parity)

**User Story:** Là người dùng dùng chế độ sáng vào ban ngày, tôi muốn mọi thành phần UI hoạt động tốt như chế độ tối, để tôi không phải chuyển theme khi đọc kết quả ngoài trời.

#### Acceptance Criteria

1. WHEN người dùng chuyển giữa light mode và dark mode, THE Huyền_Bí_App SHALL hiển thị mọi text với High_Contrast_Ratio trong cả hai chế độ.
2. WHEN người dùng chuyển theme, THE Huyền_Bí_App SHALL chuyển đổi tất cả Color_Token, biểu đồ SVG (radar ngũ giác, donut ngũ hành, hào âm/dương, la bàn phong thuỷ), border, shadow, và Result_Card mà không có "flash" màu cũ.
3. THE Huyền_Bí_App SHALL lưu lựa chọn theme vào `localStorage` với key `theme` và áp dụng lại lựa chọn này khi tải lại trang.
4. WHILE người dùng chưa từng chọn theme, THE Huyền_Bí_App SHALL áp dụng theme theo `prefers-color-scheme` của hệ điều hành.
5. THE Huyền_Bí_App SHALL áp dụng Color_Token cho tất cả phần tử biểu đồ SVG (fill, stroke, text) thông qua thuộc tính `fill="currentColor"` hoặc biến CSS, không hard-code màu trong markup SVG ngoại trừ export card render qua html2canvas.
6. IF người dùng đang ở light mode, THEN THE Ambient_Background SHALL giảm opacity orb và star field xuống tối thiểu 40% so với dark mode để duy trì độ đọc của text.
7. WHEN component hiển thị kết quả AI streaming (Markdown_Renderer), THE Huyền_Bí_App SHALL hiển thị code block, blockquote, table, list với màu nền và viền phù hợp Color_Token của theme hiện tại.

### Requirement 3: Khả năng tiếp cận (Accessibility — WCAG 2.1 AA)

**User Story:** Là người dùng sử dụng bàn phím hoặc trình đọc màn hình, tôi muốn truy cập được mọi tính năng tra cứu, để tôi không bị loại khỏi sản phẩm vì giới hạn nhập liệu.

#### Acceptance Criteria

1. THE Huyền_Bí_App SHALL cho phép truy cập mọi phần tử tương tác (button, link, input, select, dropdown, tab, dialog) bằng phím Tab theo thứ tự đọc tự nhiên (top-to-bottom, left-to-right).
2. WHEN một phần tử tương tác nhận focus bằng bàn phím, THE Huyền_Bí_App SHALL hiển thị Focus_Ring nhìn thấy được với độ dày tối thiểu 2px sử dụng `--ring` token và độ tương phản ≥ 3:1 so với nền.
3. THE Huyền_Bí_App SHALL gắn `aria-label` (tiếng Việt) cho mọi button không có nhãn text nhìn thấy, bao gồm icon-only button, close button của dialog, theme toggle, mobile menu trigger.
4. THE Huyền_Bí_App SHALL liên kết mỗi Form_Input với một `<label>` qua thuộc tính `htmlFor` / `id` hoặc bao bọc `<label>`.
5. WHEN một Form_Input có lỗi validation, THE Huyền_Bí_App SHALL gắn `aria-invalid="true"` và `aria-describedby` trỏ tới id của thông báo lỗi.
6. WHEN một dialog hoặc dropdown menu mở ra, THE Huyền_Bí_App SHALL chuyển focus vào phần tử focusable đầu tiên bên trong và bẫy focus (focus trap) cho đến khi đóng.
7. WHEN người dùng nhấn phím Escape trong khi dialog hoặc dropdown menu đang mở, THE Huyền_Bí_App SHALL đóng panel đó và trả focus về trigger element.
8. THE Huyền_Bí_App SHALL đảm bảo mọi cặp text/nền trong cả light và dark mode đạt High_Contrast_Ratio (4.5:1 cho text thường, 3:1 cho text ≥18px hoặc ≥14px bold).
9. THE Huyền_Bí_App SHALL không truyền tải thông tin chỉ bằng màu sắc (ví dụ "ngày tốt/ngày xấu" cần kèm icon hoặc text, biểu đồ ngũ hành cần label, mức độ cát hung cần kèm chữ).
10. THE Huyền_Bí_App SHALL có một liên kết "Bỏ qua tới nội dung chính" (skip link) nhìn thấy khi nhận focus đầu tiên trên mọi trang.
11. THE Huyền_Bí_App SHALL gắn thuộc tính `lang="vi"` trên thẻ `<html>` và `lang="en"` cho các đoạn văn bản tiếng Anh nhúng (ví dụ tên thuật ngữ).
12. WHEN trình đọc màn hình kích hoạt, THE Mystic_Cursor SHALL bị vô hiệu hoá hoặc không gây nhiễu đến text content (giữ vai trò trang trí, dùng `aria-hidden="true"` nếu cần).

### Requirement 4: Responsive trên các Breakpoint

**User Story:** Là người dùng dùng điện thoại để xem nhanh ngày tốt, tôi muốn giao diện hiện đầy đủ và sử dụng được trên màn hình hẹp, để tôi không phải zoom hay scroll ngang.

#### Acceptance Criteria

1. THE Huyền_Bí_App SHALL hiển thị đúng và sử dụng được tại Breakpoint_Mobile, Breakpoint_Tablet, Breakpoint_Desktop, và Breakpoint_Large mà không gây tràn ngang (`overflow-x-auto` chỉ chấp nhận trên bảng dữ liệu rộng đã được đánh dấu rõ ràng).
2. WHILE viewport ở Breakpoint_Mobile, THE Huyền_Bí_App SHALL hiển thị navbar dạng menu thu gọn (hamburger) với 5 nhóm dropdown vẫn truy cập được, và menu đóng tự động sau khi người dùng chọn một liên kết.
3. WHILE viewport ở Breakpoint_Mobile, THE Huyền_Bí_App SHALL bố trí Form_Input theo một cột dọc với chiều cao chạm tối thiểu 44px cho mọi phần tử tương tác.
4. WHILE viewport ở Breakpoint_Mobile, THE Huyền_Bí_App SHALL hiển thị biểu đồ SVG (radar, donut, la bàn) theo chiều rộng tối đa 100% container, không bị cắt và vẫn đọc được label.
5. WHILE viewport ở Breakpoint_Tablet, THE Huyền_Bí_App SHALL hiển thị Result_Card và biểu đồ trong layout 2 cột khi có đủ không gian, ngược lại 1 cột.
6. WHILE viewport ở Breakpoint_Desktop hoặc Breakpoint_Large, THE Huyền_Bí_App SHALL giới hạn chiều rộng nội dung text chính (prose) tối đa 75ch để tối ưu khả năng đọc.
7. THE Huyền_Bí_App SHALL không yêu cầu cuộn ngang để đọc bất kỳ đoạn văn bản nào trong Result_Card ở mọi breakpoint.
8. WHEN người dùng thay đổi orientation (portrait ↔ landscape) trên thiết bị di động, THE Huyền_Bí_App SHALL bố trí lại layout mà không cần tải lại trang.

### Requirement 5: Loading, Error, Empty State

**User Story:** Là người dùng đang chờ kết quả tra cứu hoặc AI luận giải, tôi muốn biết hệ thống đang xử lý hay đã lỗi, để tôi không click lại nhiều lần hoặc hiểu nhầm thành trang trắng.

#### Acceptance Criteria

1. WHEN một Module_Page đang fetch dữ liệu nền (lịch sử tra cứu, lá số đã lưu, công khai từ link chia sẻ), THE Huyền_Bí_App SHALL hiển thị Skeleton tương ứng với khung dữ liệu thực, không hiển thị spinner toàn trang cho danh sách hơn 3 mục.
2. WHEN người dùng submit Form_Input và backend đang xử lý, THE Huyền_Bí_App SHALL vô hiệu hoá nút submit, hiển thị icon spinner trong nút kèm text trạng thái tiếng Việt (ví dụ "Đang tính lá số…").
3. WHEN AI streaming bắt đầu trên trang `ai-chat` hoặc khi luận giải Module_Page, THE Huyền_Bí_App SHALL hiển thị typing indicator (3 chấm pulse) cho đến khi token đầu tiên đến, sau đó render token theo Markdown_Renderer.
4. IF backend trả về lỗi 4xx hoặc 5xx, THEN THE Huyền_Bí_App SHALL hiển thị Error_State chứa: tiêu đề lỗi tiếng Việt, mô tả ngắn nguyên nhân, nút "Thử lại" gọi cùng request, và liên kết về trang chủ.
5. IF AI rate-limit trả về (HTTP 429), THEN THE Huyền_Bí_App SHALL hiển thị Error_State riêng biệt với thông điệp tiếng Việt "Đã đạt giới hạn lượt gọi AI. Vui lòng thử lại sau X phút." với X được tính từ header `Retry-After` nếu có.
6. IF mạng bị mất kết nối trong khi AI streaming, THEN THE Huyền_Bí_App SHALL giữ nguyên text đã stream được, hiển thị banner cảnh báo "Mất kết nối — đang thử lại…", và tự động retry tối đa 2 lần.
7. WHEN một danh sách rỗng (lịch sử tra cứu, lá số đã lưu, kết quả tìm kiếm `tu-dien`), THE Huyền_Bí_App SHALL hiển thị Empty_State chứa: icon minh hoạ, tiêu đề tiếng Việt mô tả trạng thái, một dòng mô tả ngắn, và một CTA chính dẫn người dùng tới hành động tiếp theo.
8. THE Huyền_Bí_App SHALL gắn `aria-busy="true"` cho container đang ở Loading_State và `role="status"` cho thông báo Empty_State / Error_State để trình đọc màn hình thông báo.
9. WHEN một thao tác thành công (lưu lá số, copy link chia sẻ, xuất PNG/PDF/TXT), THE Huyền_Bí_App SHALL hiển thị toast (sonner) tiếng Việt với icon success trong ≤4 giây.

### Requirement 6: Form UX và Validation

**User Story:** Là người dùng nhập ngày sinh để xem lá số, tôi muốn biết ngay khi nhập sai và sửa nhanh, để tôi không phải submit lại nhiều lần.

#### Acceptance Criteria

1. WHEN người dùng rời khỏi (blur) một Form_Input bắt buộc và để trống, THE Huyền_Bí_App SHALL hiển thị thông báo lỗi tiếng Việt ngay dưới input đó.
2. WHEN người dùng nhập giá trị không hợp lệ (ví dụ ngày 32, năm < 1900 hoặc > 2100, giờ ngoài khoảng 0–23, số điện thoại < 10 chữ số) vào Form_Input, THE Huyền_Bí_App SHALL hiển thị thông báo lỗi cụ thể nêu rõ ràng buộc bằng tiếng Việt.
3. WHILE Form_Input đang ở trạng thái lỗi, THE Huyền_Bí_App SHALL áp dụng border `--destructive` và icon cảnh báo bên phải input.
4. WHEN người dùng sửa lỗi và giá trị trở thành hợp lệ, THE Huyền_Bí_App SHALL gỡ bỏ trạng thái lỗi mà không cần blur lại.
5. WHEN người dùng submit form có lỗi, THE Huyền_Bí_App SHALL chuyển focus tới Form_Input đầu tiên bị lỗi và scroll vào tầm nhìn.
6. THE Huyền_Bí_App SHALL hỗ trợ nhập ngày bằng cả picker (`react-day-picker`) lẫn gõ tay theo định dạng `dd/MM/yyyy` cho mọi Form_Input ngày sinh.
7. THE Huyền_Bí_App SHALL hiển thị helper text bên dưới Form_Input phức tạp (ví dụ giờ sinh, hướng nhà) giải thích đơn vị hoặc định dạng mong đợi.
8. WHERE Form_Input là số điện thoại hoặc biển số xe (Module_Page `cat-hung`), THE Huyền_Bí_App SHALL tự định dạng hiển thị với dấu cách hoặc dấu chấm để dễ đọc, đồng thời lưu giá trị thô cho xử lý; định dạng vẫn được áp dụng kể cả khi input đang ở trạng thái lỗi.
9. WHEN người dùng submit form thành công, THE Huyền_Bí_App SHALL giữ giá trị đã nhập trong form để cho phép tinh chỉnh và tra cứu lại, không reset về rỗng.

### Requirement 7: Điều hướng và kiến trúc thông tin (Navbar, Mobile Menu, Breadcrumb)

**User Story:** Là người dùng truy cập sâu vào một mô-đun, tôi muốn biết mình đang ở đâu trong cấu trúc và đi nhanh tới mô-đun khác, để tôi không bị lạc giữa 15 trang.

#### Acceptance Criteria

1. THE Huyền_Bí_App SHALL hiển thị navbar dạng dropdown 5 nhóm trên Breakpoint_Tablet trở lên: Số Học, Mệnh Lý, Tiên Tri, Tra Cứu, Trợ lý AI.
2. WHEN viewport ở Breakpoint_Mobile, THE Huyền_Bí_App SHALL hiển thị menu thu gọn dạng drawer trượt từ trái với cùng 5 nhóm và các tài khoản (đăng nhập / hồ sơ / đăng xuất).
3. WHILE người dùng đang ở Module_Page, THE Huyền_Bí_App SHALL highlight liên kết của mô-đun đó trong navbar bằng `--primary` color và `aria-current="page"`.
4. THE Huyền_Bí_App SHALL hiển thị breadcrumb trên mọi Module_Page theo dạng `Trang chủ → [Tên nhóm] → [Tên mô-đun]` với separator có `aria-hidden="true"`.
5. WHEN người dùng click logo "Huyền Bí" trong navbar, THE Huyền_Bí_App SHALL điều hướng về trang chủ `/`.
6. THE Huyền_Bí_App SHALL giữ trạng thái cuộn (scroll position) khi điều hướng quay lại bằng nút back của trình duyệt giữa các Module_Page.
7. WHEN người dùng đăng nhập, THE Huyền_Bí_App SHALL thay nút "Đăng nhập / Đăng ký" trong navbar bằng avatar dropdown chứa các mục: Hồ sơ, Lịch sử, Đăng xuất.
8. WHILE người dùng cuộn xuống, THE Huyền_Bí_App SHALL giữ navbar dính (sticky) ở đỉnh viewport với nền có `backdrop-filter: blur` để duy trì khả năng truy cập dropdown.

### Requirement 8: Hiển thị kết quả tra cứu (Result Card và Biểu đồ)

**User Story:** Là người dùng xem kết quả tra cứu, tôi muốn nội dung được trình bày rõ ràng theo thứ tự ưu tiên, để tôi đọc nhanh phần quan trọng nhất.

#### Acceptance Criteria

1. THE Result_Card SHALL trình bày thông tin theo thứ tự: tên người / chủ thể tra cứu, các con số / ký tự / quẻ / cung tinh chính, biểu đồ trực quan, bảng chi tiết, luận giải AI (nếu bật), khu vực hành động (lưu / chia sẻ / xuất).
2. THE Huyền_Bí_App SHALL render biểu đồ SVG (radar ngũ giác, donut ngũ hành, hào âm/dương, la bàn 8 hướng, biểu đồ điểm hợp tuổi) tự thích nghi (`viewBox` + `width="100%"`) và có `role="img"` kèm `aria-label` mô tả nội dung biểu đồ.
3. WHEN người dùng hover vào một phần tử biểu đồ (cánh radar, mảnh donut, hướng la bàn), THE Huyền_Bí_App SHALL hiển thị tooltip kèm giá trị số và mô tả tiếng Việt; cùng tooltip phải truy cập được bằng keyboard focus.
4. THE Huyền_Bí_App SHALL hiển thị bảng dữ liệu (4 trụ Bát Tự, 12 cung Tử Vi, ngũ cách Xem Tên, lịch sử 10 lần gieo quẻ) với header `<thead>`, `scope="col"` cho cột, và trên Breakpoint_Mobile cho phép cuộn ngang chỉ riêng bảng đó.
5. WHEN AI luận giải streaming, THE Markdown_Renderer SHALL render heading, list, blockquote, code block, table, link với style đồng bộ Type_Scale và Color_Token, và liên kết ngoài có `target="_blank"` `rel="noopener noreferrer"`.
6. THE Huyền_Bí_App SHALL hiển thị nút hành động ("Lưu lá số", "Chia sẻ", "Xuất PNG", "Xuất PDF", "Xuất TXT") theo nhóm cố định ở cuối Result_Card; trên Breakpoint_Mobile nhóm các nút phụ vào dropdown "Xuất / Chia sẻ" để giảm tải hiển thị.
7. WHEN người dùng nhấn "Lưu lá số" mà chưa đăng nhập, THE Huyền_Bí_App SHALL hiển thị dialog tiếng Việt giải thích cần đăng nhập, kèm 2 nút "Đăng nhập" và "Để sau".
8. THE Huyền_Bí_App SHALL bảo toàn nội dung Result_Card khi xuất PNG/PDF qua `html2canvas` + `jsPDF`, đảm bảo màu, chữ, biểu đồ giữ nguyên dù theme đang ở light hay dark.

### Requirement 9: Vi tương tác và hoạt cảnh có chủ đích (Motion)

**User Story:** Là người dùng tương tác với UI, tôi muốn các chuyển động có ý nghĩa và không gây mất tập trung, để trải nghiệm cảm giác cao cấp chứ không phải hoa mỹ vô bổ.

#### Acceptance Criteria

1. THE Huyền_Bí_App SHALL sử dụng Framer Motion cho mọi chuyển cảnh có thời lượng > 200ms (dialog enter/exit, dropdown, tab switch, scroll reveal).
2. THE Huyền_Bí_App SHALL giới hạn thời lượng chuyển cảnh trong khoảng [120ms, 400ms] cho phản hồi tương tác và [400ms, 800ms] cho chuyển trang hoặc reveal lớn.
3. THE Huyền_Bí_App SHALL sử dụng easing `cubic-bezier(0.22, 0.61, 0.36, 1)` (ease-out) cho enter và `cubic-bezier(0.4, 0, 1, 1)` (ease-in) cho exit, không dùng `linear` cho chuyển động không gian.
4. WHEN Reduced_Motion_User truy cập, THE Huyền_Bí_App SHALL bỏ qua animation orb drift, scroll reveal slide, tilt-card 3D, glow-pulse, shimmer-text, và các chuyển cảnh có translate/scale > 4px, thay bằng fade ≤ 150ms (áp dụng cho tất cả chuyển cảnh, không chỉ phần thay thế) hoặc tắt hoàn toàn.
5. THE Huyền_Bí_App SHALL không tự khởi động animation tự động (auto-play) trên các phần tử ngoài viewport.
6. WHEN người dùng hover lên Result_Card hoặc tilt-card, THE Huyền_Bí_App SHALL áp dụng tilt 3D tối đa ±8 độ và elevation tăng nhẹ, không vượt quá ±15 độ để tránh cảm giác "đồ chơi".
7. THE Huyền_Bí_App SHALL không lặp animation ánh sáng (shimmer, glow-pulse) trên text dài hơn 30 ký tự để tránh gây xao nhãng khi đọc.

### Requirement 10: Tránh vẻ "AI mặc định" và giữ bản sắc huyền bí (Visual Identity)

**User Story:** Là chủ sản phẩm, tôi muốn ứng dụng có dấu ấn thiết kế riêng, không giống các sản phẩm AI generative khác, để khách hàng nhận diện thương hiệu Huyền Bí.

#### Acceptance Criteria

1. THE Huyền_Bí_App SHALL sử dụng vàng `#c9a227` (HSL `43 74% 49%`) làm primary chỉ cho điểm nhấn (CTA chính, highlight số quan trọng, focus ring), không dùng làm màu nền lớn.
2. THE Huyền_Bí_App SHALL không sử dụng gradient tím-hồng-xanh kiểu mặc định AI (purple→pink→indigo); gradient được phép chỉ giới hạn `magic-line` trang trí, `shimmer-text` cho heading, và radial gradient của ambient orb.
3. THE Huyền_Bí_App SHALL không bo `rounded-2xl` hay `rounded-3xl` đồng nhất khắp nơi; thay vào đó áp dụng `--radius-sm` cho input/badge, `--radius-md` cho button, `--radius-lg` cho card, `--radius-xl` chỉ cho hero hoặc dialog lớn.
4. THE Huyền_Bí_App SHALL không dùng padding khổng lồ "AI hero" (`py-32` toàn trang); chiều cao hero trang chủ tối đa 70vh và có nội dung tóm tắt 15 mô-đun trong viewport đầu tiên.
5. THE Huyền_Bí_App SHALL ưu tiên typography huyền bí: heading dùng `Playfair Display` serif, body dùng `Plus Jakarta Sans` sans-serif, mono dùng `Space Mono`, và không dùng font hệ thống làm fallback chính cho heading.
6. THE Huyền_Bí_App SHALL giới hạn shadow tối đa 2 mức (`shadow-sm`, `shadow-md`); không sử dụng `shadow-2xl` hoặc shadow nhiều lớp chồng nhau.
7. WHERE một biểu tượng được dùng, THE Huyền_Bí_App SHALL sử dụng icon từ `lucide-react` hoặc `react-icons` theo chủ đề huyền học (sao, mặt trăng, la bàn, sấm chớp, hoa sen) thay vì emoji generic.
8. THE Ambient_Background SHALL chỉ xuất hiện trên trang chủ và Module_Page với mức opacity ≤ 35% trong dark mode và ≤ 15% trong light mode để không gây nhiễu khi đọc bảng và biểu đồ.

### Requirement 11: Hiệu năng cảm nhận (Perceived Performance)

**User Story:** Là người dùng mở ứng dụng trên 4G, tôi muốn cảm nhận trang phản hồi tức thì kể cả khi mạng chậm, để tôi không thoát đi trước khi nội dung tải xong.

#### Acceptance Criteria

1. THE Huyền_Bí_App SHALL hiển thị navbar và placeholder cấu trúc trang chính trong vòng 1 giây kể từ khi navigate, bằng cách lazy-load component nặng (export-card, html2canvas, jsPDF, recharts) qua `React.lazy` + `Suspense`.
2. WHEN người dùng tương tác (click button, toggle), THE Huyền_Bí_App SHALL phản hồi trực quan trong ≤ 100ms (state visual cập nhật ngay, không chờ network).
3. THE Huyền_Bí_App SHALL áp dụng optimistic update cho thao tác lưu lá số và xoá lá số trên trang `profile`, rollback UI nếu request thất bại và hiển thị toast lỗi.
4. THE Huyền_Bí_App SHALL preload font `Playfair Display`, `Plus Jakarta Sans` và áp dụng `font-display: swap` để tránh FOIT.
5. THE Huyền_Bí_App SHALL nén và lazy-load mọi ảnh tĩnh (orb, hero, knowledge-base) bằng `loading="lazy"` và `decoding="async"` ngoại trừ ảnh trong viewport đầu tiên.
6. WHEN AI streaming nhả token, THE Markdown_Renderer SHALL render từng phần (incremental) thay vì re-render toàn bộ markdown trên mỗi token.
7. THE Huyền_Bí_App SHALL không gây Cumulative Layout Shift (CLS) > 0.1 do font swap, ảnh tải muộn, hay quảng cáo / banner tự thay đổi kích thước.

### Requirement 12: Trang chủ (Home) — Layout dẫn dắt nội dung trước

**User Story:** Là người dùng lần đầu vào trang chủ, tôi muốn hiểu ứng dụng cung cấp gì và bắt đầu một mô-đun bất kỳ trong vài giây, để tôi không phải đọc dài dòng.

#### Acceptance Criteria

1. THE Huyền_Bí_App SHALL hiển thị trên trang chủ trong viewport đầu tiên: tiêu đề `h1` "Huyền Bí" hoặc tiêu đề thương hiệu, một dòng mô tả ngắn (≤ 120 ký tự), và 2 CTA (mô-đun phổ biến nhất hoặc Trợ lý AI).
2. THE Huyền_Bí_App SHALL trình bày 15 Module_Page trên trang chủ dưới dạng grid responsive: 1 cột trên Breakpoint_Mobile, 2 cột trên Breakpoint_Tablet, 3 cột trên Breakpoint_Desktop, 4 hoặc 5 cột trên Breakpoint_Large.
3. THE Huyền_Bí_App SHALL hiển thị mỗi card mô-đun trên trang chủ với: icon, tên mô-đun (h3), 1 dòng mô tả tiếng Việt (≤ 90 ký tự), và toàn bộ card là vùng click dẫn tới Module_Page tương ứng.
4. WHEN người dùng cuộn qua các section trang chủ, THE Huyền_Bí_App SHALL áp dụng scroll reveal nhẹ (≤ 28px translateY, ≤ 700ms) một lần cho mỗi section, không lặp lại khi cuộn lên.
5. THE Huyền_Bí_App SHALL nhóm 15 mô-đun trên trang chủ theo cùng 5 nhóm như navbar (Số Học, Mệnh Lý, Tiên Tri, Tra Cứu, Trợ lý AI) với tiêu đề `h2` cho từng nhóm.
6. THE Huyền_Bí_App SHALL hiển thị footer chứa: liên kết tới các nhóm mô-đun, liên kết "Lịch sử tra cứu", "Hồ sơ", "Đăng ký", liên kết tới chính sách & điều khoản (placeholder), và phiên bản app.

### Requirement 13: Trợ lý AI (`/ai-chat`) — Trải nghiệm hội thoại

**User Story:** Là người dùng đặt câu hỏi huyền học cho AI, tôi muốn câu hỏi và câu trả lời có bố cục dễ đọc và tương tác mượt, để tôi tập trung vào nội dung huyền học.

#### Acceptance Criteria

1. THE Huyền_Bí_App SHALL trình bày hội thoại trên trang `/ai-chat` dưới dạng list bubble: bubble user căn phải nền `--secondary`, bubble AI căn trái nền `--card`.
2. THE Huyền_Bí_App SHALL gắn timestamp tương đối (ví dụ "vừa xong", "2 phút trước") cho mỗi bubble và đầy đủ ngày-giờ trong tooltip.
3. WHILE AI đang stream phản hồi, THE Huyền_Bí_App SHALL hiển thị typing indicator ở cuối bubble AI cho đến khi chunk đầu tiên đến, sau đó render markdown incremental.
4. WHEN người dùng gửi tin nhắn, THE Huyền_Bí_App SHALL tự động cuộn xuống bubble mới nhất; ngoại trừ khi người dùng đã chủ động cuộn lên đọc lịch sử thì giữ nguyên vị trí và hiển thị nút "Tin nhắn mới ↓".
5. THE Huyền_Bí_App SHALL hiển thị 14 câu gợi ý theo chủ đề dưới dạng chip nằm trong khu vực cố định phía trên ô input, mỗi chip click sẽ điền vào input và focus chờ chỉnh sửa trước khi gửi.
6. WHEN người dùng nhấn Enter trong ô input, THE Huyền_Bí_App SHALL gửi tin nhắn; WHEN người dùng nhấn Shift + Enter, THE Huyền_Bí_App SHALL chèn xuống dòng mới mà không gửi.
7. WHEN AI streaming đang chạy, THE Huyền_Bí_App SHALL hiển thị nút "Dừng" để người dùng huỷ stream; sau khi dừng, phần text đã nhả vẫn được giữ.
8. THE Huyền_Bí_App SHALL bảo toàn lịch sử hội thoại trong `localStorage` cho phiên chưa đăng nhập, và đồng bộ qua API khi đã đăng nhập.

### Requirement 14: Trang Hồ sơ (`/profile`) và Lịch sử (`/lich-su`)

**User Story:** Là người dùng đã đăng nhập, tôi muốn duyệt, tìm kiếm, lọc và so sánh các lá số đã lưu, để tôi quản lý gọn gàng các tra cứu của mình.

#### Acceptance Criteria

1. THE Huyền_Bí_App SHALL hiển thị danh sách lá số đã lưu trên `/profile` dưới dạng grid card với: tên / tiêu đề, mô-đun, ngày lưu, ghi chú ngắn nếu có.
2. THE Huyền_Bí_App SHALL cung cấp bộ lọc theo mô-đun (15 lựa chọn) và ô tìm kiếm theo tên / tiêu đề / ghi chú.
3. WHEN người dùng chọn 2 lá số bằng checkbox, THE Huyền_Bí_App SHALL kích hoạt nút "So sánh" và mở dialog hiển thị 2 lá số cạnh nhau (Breakpoint_Tablet trở lên) hoặc xếp chồng (Breakpoint_Mobile).
4. WHEN người dùng nhấn "Xoá" trên một lá số, THE Huyền_Bí_App SHALL hiển thị dialog xác nhận tiếng Việt nêu rõ thao tác không thể hoàn tác và yêu cầu nhấn nút "Xoá" lần thứ hai để hoàn tất.
5. WHEN người dùng nhấn "Chia sẻ", THE Huyền_Bí_App SHALL tạo link chia sẻ qua API, sao chép vào clipboard, và hiển thị toast "Đã sao chép link" kèm thông tin link hết hạn sau 30 ngày.
6. THE Huyền_Bí_App SHALL hiển thị một widget thống kê trên `/profile` nêu: tổng số lá số đã lưu, mô-đun dùng nhiều nhất, lần tra cứu gần nhất.
7. THE Huyền_Bí_App SHALL hiển thị `/lich-su` dưới dạng bảng có sắp xếp theo cột (ngày, mô-đun, tiêu đề), bộ lọc theo mô-đun, và thao tác xoá hàng / xoá toàn bộ với xác nhận.

### Requirement 15: Đăng ký / Đăng nhập (`/sign-in`, `/sign-up`)

**User Story:** Là người dùng mới, tôi muốn đăng ký nhanh bằng Google hoặc email, để tôi bắt đầu lưu lá số mà không bị form chặn.

#### Acceptance Criteria

1. THE Huyền_Bí_App SHALL hiển thị trang `/sign-in` và `/sign-up` với widget Clerk được tuỳ biến bằng `localizations` tiếng Việt.
2. THE Huyền_Bí_App SHALL áp dụng theme tuỳ biến cho widget Clerk khớp Color_Token (`--primary`, `--background`, `--foreground`, `--card`, `--border`, `--ring`).
3. WHEN người dùng đăng nhập / đăng ký thành công, THE Huyền_Bí_App SHALL điều hướng về URL được chỉ định trong query param `redirect_url` nếu có, ngược lại về `/profile`.
4. IF Clerk publishable key không được cấu hình, THEN THE Huyền_Bí_App SHALL hiển thị banner cảnh báo trên `/sign-in` và `/sign-up` thông báo tài khoản chưa khả dụng và vẫn cho phép sử dụng 15 mô-đun không cần đăng nhập.
5. THE Huyền_Bí_App SHALL hiển thị liên kết "Quên mật khẩu" và "Đã có tài khoản? Đăng nhập" / "Chưa có tài khoản? Đăng ký" hoán đổi giữa hai trang.

### Requirement 16: PWA và trải nghiệm cài đặt

**User Story:** Là người dùng yêu thích Huyền Bí, tôi muốn cài đặt như một app gốc trên điện thoại, để truy cập nhanh từ màn hình chính.

#### Acceptance Criteria

1. THE Huyền_Bí_App SHALL hiển thị `pwa-install-prompt` chỉ một lần trên mỗi thiết bị sau khi người dùng đã hoàn thành ít nhất một tra cứu thành công.
2. WHEN người dùng đóng `pwa-install-prompt` mà không cài, THE Huyền_Bí_App SHALL bắt đầu khoảng cấm hiện lại lập tức tại thời điểm đóng và không hiển thị lại trong 14 ngày kế tiếp trên cùng thiết bị (lưu cờ trong `localStorage`).
3. THE Huyền_Bí_App SHALL trình bày `pwa-install-prompt` dưới dạng banner mảnh ở dưới cùng (Breakpoint_Mobile) hoặc card góc dưới phải (Breakpoint_Desktop), không phải dialog modal toàn màn hình.
4. WHERE thiết bị là iOS Safari (không hỗ trợ `beforeinstallprompt`), THE Huyền_Bí_App SHALL hiển thị hướng dẫn 3 bước "Chia sẻ → Thêm vào màn hình chính → Thêm" bằng tiếng Việt.

### Requirement 17: Giao diện Mystic Cursor và bảo toàn khả dụng

**User Story:** Là người dùng dùng chuột, tôi muốn con trỏ ngôi sao tăng thêm chất huyền bí, nhưng không cản tôi nhập liệu hay đọc nội dung.

#### Acceptance Criteria

1. THE Mystic_Cursor SHALL chỉ kích hoạt trên thiết bị có `(hover: hover)` và không kích hoạt trên thiết bị cảm ứng.
2. WHILE Mystic_Cursor đang kích hoạt, THE Huyền_Bí_App SHALL chuyển con trỏ về dạng `text` khi hover lên `input`, `textarea`, `[contenteditable]`.
3. WHILE Mystic_Cursor đang kích hoạt, THE Huyền_Bí_App SHALL chuyển con trỏ về dạng `pointer` (sao + tay) khi hover lên `a`, `button`, `[role="button"]`, `select`, `label[for]`.
4. WHEN Reduced_Motion_User truy cập, THE Mystic_Cursor SHALL bỏ hiệu ứng đuôi sao chuyển động và chỉ giữ icon tĩnh hoặc dùng cursor hệ thống.
5. THE Huyền_Bí_App SHALL cho phép vô hiệu hoá Mystic_Cursor qua một toggle trong dropdown user (Preferences) và lưu lựa chọn vào `localStorage`.

### Requirement 18: Quản lý lỗi mạng và offline cơ bản

**User Story:** Là người dùng đang trên metro, tôi muốn ứng dụng vẫn dùng được tối thiểu khi mất mạng, để tôi không thấy trang trắng.

#### Acceptance Criteria

1. WHEN người dùng mất kết nối mạng, THE Huyền_Bí_App SHALL hiển thị banner "Bạn đang offline" ở đỉnh trang.
2. WHILE offline, THE Huyền_Bí_App SHALL cho phép tiếp tục dùng các Module_Page chỉ tính toán phía client (Lịch Vạn Niên, Thần Số Học, Cát Hung, Xem Tên, Lịch Cá Nhân, Hợp Tuổi, Xem Ngày Tốt, Sao Hạn, Phong Thuỷ, Bát Tự, Tử Vi, Xem Quẻ, Từ Điển) và disable các tính năng cần backend (lưu lá số, chia sẻ, AI luận giải, lịch sử đám mây) với tooltip giải thích.
3. WHEN kết nối phục hồi, THE Huyền_Bí_App SHALL ẩn banner offline và hiển thị toast "Đã kết nối lại" trong ≤ 4 giây.
4. IF một request fetch thất bại do timeout (≥ 30 giây), THEN THE Huyền_Bí_App SHALL huỷ request và chỉ hiển thị Error_State với nút "Thử lại" sau khi việc huỷ request hoàn tất thành công.

### Requirement 19: Microcopy và ngôn ngữ tiếng Việt

**User Story:** Là người dùng Việt, tôi muốn mọi thông báo, nhãn nút, và microcopy đúng ngữ pháp và giọng điệu nhất quán, để tôi tin tưởng vào chất lượng nội dung.

#### Acceptance Criteria

1. THE Huyền_Bí_App SHALL viết toàn bộ text giao diện bằng tiếng Việt có dấu, ngoại trừ thuật ngữ riêng (Bát Tự, Tử Vi, I Ching, AI) và tên thương hiệu.
2. THE Huyền_Bí_App SHALL dùng giọng điệu trang trọng và ấm áp, ngôi xưng "bạn" cho người dùng, không dùng "anh/chị" hay "quý khách".
3. THE Huyền_Bí_App SHALL viết hoa chữ cái đầu tiên cho mỗi nhãn nút và tiêu đề (sentence case), không viết hoa toàn bộ (UPPERCASE) ngoại trừ acronym (AI, PDF, PNG, TXT).
4. THE Huyền_Bí_App SHALL dùng số Ả Rập cho năm, tháng, ngày, giờ; tên Can Chi và Hoàng Đạo viết bằng chữ Việt thuần (Giáp Tý, Hoàng Đạo, Thái Tuế).
5. THE Huyền_Bí_App SHALL không dùng từ mơ hồ "nhanh chóng", "đầy đủ", "tuyệt vời" trong mô tả tính năng kỹ thuật mà thay bằng số đo cụ thể.

### Requirement 20: Tài liệu hoá hệ thống thiết kế

**User Story:** Là lập trình viên đóng góp tính năng mới, tôi muốn có tài liệu mô tả tokens, primitives và quy ước, để tôi không phá vỡ tính nhất quán.

#### Acceptance Criteria

1. THE Huyền_Bí_App SHALL có file `artifacts/mysticism-web/src/components/ui/README.md` mô tả: spacing scale, type scale, color tokens, border radius scale, animation durations, breakpoints.
2. THE Huyền_Bí_App SHALL có file `artifacts/mysticism-web/docs/ux-guidelines.md` mô tả: voice & tone tiếng Việt, quy tắc microcopy, danh sách thông báo lỗi chuẩn, hướng dẫn empty / error / loading state.
3. THE Huyền_Bí_App SHALL có một trang nội bộ `/dev/design-tokens` chỉ tồn tại trong build môi trường dev, được loại bỏ hoàn toàn khỏi production bundle, hiển thị live tất cả Color_Token, Type_Scale, button variants, badge variants để kiểm tra trực quan.
4. THE Huyền_Bí_App SHALL bổ sung TSDoc cho mỗi component primitive trong `src/components/ui/` mô tả: mục đích, props bắt buộc, ví dụ sử dụng, lưu ý a11y.
