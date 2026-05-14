# UX Guidelines — Huyền Bí

Tài liệu này định nghĩa giọng văn, microcopy, thông báo lỗi chuẩn, hướng dẫn empty/error/loading state, và checklist a11y thủ công cho ứng dụng **Huyền Bí**. Mọi text giao diện phải bám đúng tài liệu này để giữ tính nhất quán giữa 15 mô-đun.

> Companion: `artifacts/mysticism-web/src/components/ui/README.md` mô tả token, primitive và scale.
> Source of truth cho thông báo lỗi: `artifacts/mysticism-web/src/lib/error-messages.ts` — KHÔNG inline string ở component, luôn import từ file đó.

_Validates: Requirements 19.1, 19.2, 19.3, 19.4, 19.5, 20.2_

---

## 1. Voice & Tone

### Nguyên tắc nền

- **Tiếng Việt có dấu, sentence case**. Viết hoa chữ cái đầu của nhãn nút và tiêu đề; KHÔNG dùng UPPERCASE ngoại trừ acronym (AI, PDF, PNG, TXT, SSE, API). _Req 19.3_
- **Trang trọng và ấm áp** — gần với một học giả huyền học giàu kinh nghiệm đang trò chuyện cùng bạn, không phải một chatbot công nghệ. Tránh quá kỹ thuật, tránh quá phổ thông.
- **Ngôi xưng cố định: "bạn"**. Không dùng "anh/chị", "quý khách", "các bạn", "chúng ta". _Req 19.2_
- **Ngắn gọn, hành động trước lý do**. Một câu nên có một ý. Câu thông báo lỗi có thể tách 2 câu: (1) chuyện gì xảy ra, (2) bạn nên làm gì.
- **Không hứa hẹn quá đà**. Tránh "nhanh chóng", "đầy đủ", "tuyệt vời", "siêu chính xác". Khi cần định lượng, dùng số đo cụ thể (ví dụ "kết quả trong ≤ 3 giây", "phân tích 12 cung Tử Vi"). _Req 19.5_
- **Giữ thuật ngữ huyền học gốc**. Bát Tự, Tử Vi, Kinh Dịch (I Ching), Cửu Tinh, Thái Tuế, Hoàng Đạo, Can Chi (Giáp Tý, Bính Dần…), Ngũ Hành (Kim, Mộc, Thủy, Hỏa, Thổ) — viết thường khi nằm giữa câu, viết hoa chữ cái đầu khi đứng đơn lẻ làm tên riêng của hệ thống. _Req 19.1, 19.4_
- **Số Ả Rập cho năm/tháng/ngày/giờ**. "23/03/1990 lúc 7 giờ", không "ngày hai mươi ba tháng ba năm chín mươi". _Req 19.4_
- **Tên thương hiệu cố định**: "Huyền Bí". Không tách "huyền bí" trong heading.

### Ví dụ đối chiếu

| Tình huống | ✅ Nên dùng | ❌ Không dùng |
|---|---|---|
| Loading khi tính lá số | "Đang tính lá số…" | "Loading...", "Vui lòng đợi" |
| Lỗi server | "Đã có lỗi từ máy chủ. Vui lòng thử lại sau ít phút." | "Server error 500", "Oops! Có gì đó sai sai 😅" |
| Trống lịch sử | "Chưa có lá số nào được lưu." | "Không có dữ liệu", "Empty list" |
| Mô tả tính năng | "Phân tích 4 trụ Bát Tự theo can chi và ngũ hành." | "Bát Tự cực kỳ chính xác và đầy đủ!" |
| CTA chính | "Lập lá số" / "Xem kết quả" | "Submit", "Click here", "Bắt đầu ngay!!!" |
| Toast thành công | "Đã sao chép link" | "Copied!", "Thành công 🎉" |

---

## 2. Microcopy rules

### Button label

- **Dạng động từ ngắn**, ưu tiên 1–2 từ. Ví dụ: `Lưu`, `Chia sẻ`, `Xuất PNG`, `Xuất PDF`, `Xuất TXT`, `Thử lại`, `Đăng nhập`, `Đăng ký`, `Đóng`, `Huỷ`, `Xác nhận`, `So sánh`, `Dừng`.
- Cụm động từ + danh từ khi cần làm rõ: `Lưu lá số`, `Sao chép link`, `Tải lại trang`, `Mở trợ lý AI`.
- KHÔNG dùng "Click here", "Nhấn vào đây", "Tại đây" làm nhãn link/nút. Nhãn phải mô tả đích đến hoặc hành động: `Xem hồ sơ`, `Đọc hướng dẫn cài đặt PWA`.
- KHÔNG dùng dấu chấm than ở cuối nhãn nút (`Đăng ký ngay!` ❌).
- Trạng thái loading dùng dấu ba chấm tiếng Việt (`…`) trong cùng nhãn: `Đang lưu…`, `Đang tính lá số…`, `Đang tạo link chia sẻ…`. _Req 5.2_

### Heading

- **Dạng danh từ / cụm danh từ**. Mô tả nội dung khu vực, không kêu gọi hành động.
  - ✅ "Lịch sử tra cứu", "Lá số đã lưu", "Trợ lý AI", "Bát Tự", "Phong Thuỷ nhà ở".
  - ❌ "Hãy xem lịch sử của bạn", "Bắt đầu Bát Tự ngay".
- Mỗi Module_Page có đúng một `h1` và không bỏ cấp (h1 → h3 phải qua h2). _Req 1.4_
- Heading mô-đun dùng tên riêng huyền học (Bát Tự, Tử Vi, Xem Quẻ…), KHÔNG kèm tagline marketing.

### Helper text & placeholder

- Helper text giải thích **định dạng/đơn vị** mong đợi: "Định dạng dd/MM/yyyy", "Giờ trong khoảng 0–23", "Ví dụ: 0987 654 321". _Req 6.7_
- Placeholder KHÔNG thay thế label. Placeholder mô tả ví dụ hoặc gợi ý nhập, không lặp lại label.
  - ✅ Label "Ngày sinh" + placeholder "23/03/1990".
  - ❌ Label ẩn + placeholder "Ngày sinh".

### Toast

- **Tối đa một câu**, sentence case, không emoji ở cuối. Hiển thị ≤ 4 giây. _Req 5.9_
- Success: "Đã lưu lá số", "Đã sao chép link", "Đã kết nối lại", "Đã xuất PNG".
- Info: "Link chia sẻ hết hạn sau 30 ngày." (đi kèm sau success copy link).
- Error toast: bám đúng `ERROR_MESSAGES` — KHÔNG sáng tác wording mới.

### Liên kết ngoài

- Link external thêm context: "Hướng dẫn cài đặt trên iOS (mở trang mới)" với `target="_blank"` và `rel="noopener noreferrer"`. _Req 8.5_

### Số nhiều / số ít tiếng Việt

- Tiếng Việt không biến hình số nhiều — dùng cùng dạng cho cả 1 và nhiều: "1 lá số đã lưu", "12 lá số đã lưu". KHÔNG dùng "lá số(s)", "1 lá số / 2 lá sốs".

---

## 3. Thông báo lỗi chuẩn

Mọi component (`ErrorState`, `OfflineBanner`, sonner toast, `AuthRequiredDialog`, `DeleteConfirmDialog`, `fetchWithTimeout`, `useAiSseChat`, react-hook-form resolvers…) **PHẢI import** từ `artifacts/mysticism-web/src/lib/error-messages.ts`. Wording dưới đây là copy chính xác từ file đó (single source of truth).

### 3.1 Network & server (HTTP / fetch)

| Key | Wording chính xác | Tình huống dùng |
|---|---|---|
| `network_offline` | `Bạn đang offline. Một số tính năng tạm thời không khả dụng.` | Banner sticky đỉnh trang khi `navigator.onLine === false`. _Req 18.1_ |
| `network_lost_during_stream` | `Mất kết nối — đang thử lại…` | Banner inline trong khu vực AI khi SSE bị ngắt giữa chừng (auto-retry tối đa 2 lần). _Req 5.6_ |
| `network_reconnected` | `Đã kết nối lại` | Toast khi `online` event quay lại. _Req 18.3_ |
| `server_error` | `Đã có lỗi từ máy chủ. Vui lòng thử lại sau ít phút.` | HTTP 5xx. _Req 5.4_ |
| `client_error` | `Yêu cầu chưa hợp lệ. Vui lòng kiểm tra lại thông tin.` | HTTP 4xx (trừ 401, 429 — xử lý riêng). _Req 5.4_ |
| `timeout` | `Hết thời gian chờ. Vui lòng thử lại.` | Fetch timeout ≥ 30s sau khi `AbortController` huỷ thành công. _Req 18.4_ |

### 3.2 Rate limit (AI)

| Key | Wording chính xác | Tham số |
|---|---|---|
| `rate_limit(mins)` | `` `Đã đạt giới hạn lượt gọi AI. Vui lòng thử lại sau ${mins} phút.` `` | `mins = Math.ceil(parseRetryAfter(headers["retry-after"]) / 60)`. Khi không có header thì hard-fallback `mins = 5`. _Req 5.5_ |

### 3.3 Auth & destructive action

| Key | Wording chính xác | Tình huống |
|---|---|---|
| `unauth_save` | `Bạn cần đăng nhập để lưu lá số.` | Dialog hiện khi chưa đăng nhập click "Lưu lá số". _Req 8.7_ |
| `delete_irreversible` | `Thao tác xoá không thể hoàn tác. Bạn chắc chắn?` | Dòng cảnh báo trong dialog xoá lá số (yêu cầu confirm 2 bước). _Req 14.4_ |
| `clipboard_fail` | `Không thể sao chép. Hãy chọn và sao chép thủ công.` | Toast khi `navigator.clipboard.writeText()` reject. |

### 3.4 Validation form (client-side)

Tất cả nằm trong `ERROR_MESSAGES.validation.*`. _Req 6.1, 6.2_

| Key | Wording chính xác | Ràng buộc |
|---|---|---|
| `validation.required` | `Vui lòng nhập trường này` | Trường bắt buộc bị bỏ trống. |
| `validation.invalidDate` | `Ngày không hợp lệ (định dạng dd/MM/yyyy)` | Parse fail hoặc ngày không tồn tại (32, 30/02…). |
| `validation.yearRange` | `Năm phải trong khoảng 1900–2100` | Năm < 1900 hoặc > 2100. |
| `validation.hourRange` | `Giờ phải trong khoảng 0–23` | Giờ < 0 hoặc > 23. |
| `validation.phoneLength` | `Số điện thoại phải có ít nhất 10 chữ số` | Số điện thoại < 10 chữ số (sau khi loại bỏ ký tự không phải số). |

### 3.5 Quy tắc khi cần thêm wording mới

1. Đề xuất wording trong PR mô tả; bám đúng tone ở mục 1.
2. Thêm key + JSDoc ở `error-messages.ts` (nêu rõ requirement liên quan).
3. Cập nhật bảng tương ứng trong tài liệu này.
4. KHÔNG inline string trực tiếp trong component dù chỉ một lần — luôn đi qua `ERROR_MESSAGES`.

---

## 4. Hướng dẫn Empty / Error / Loading state

Đây là 3 trạng thái bắt buộc với mọi luồng có dữ liệu không đồng bộ. Không có chúng nghĩa là user thấy trang trắng — tệ hơn cả lỗi rõ ràng.

### 4.1 Khi nào dùng từng loại

| Trạng thái | Khi nào | Component | ARIA |
|---|---|---|---|
| **Loading** | Đang chờ fetch / submit / AI streaming chưa nhả token đầu tiên. | `Skeleton` (cho danh sách, card, chart) hoặc spinner inline trong button. KHÔNG spinner toàn trang cho list > 3 mục. | `aria-busy="true"` trên container. _Req 5.1, 5.8_ |
| **Empty** | Request thành công nhưng kết quả rỗng (lịch sử trống, lá số đã lưu = 0, search không có hit). | `EmptyState` | `role="status"` _Req 5.7, 5.8_ |
| **Error** | Request thất bại (4xx/5xx/timeout/abort). | `ErrorState` (full-state) hoặc inline error trong form / toast cho thao tác nhỏ. | `role="alert"` cho `ErrorState` chiếm toàn vùng; toast tự `aria-live`. _Req 5.4, 5.8_ |

> **Lưu ý quan trọng**: empty ≠ error. List trả về `[]` là empty (success path). Network fail là error. Rate-limit 429 là error nhưng có wording riêng (`rate_limit(mins)`), không dùng `server_error`.

### 4.2 Structure chuẩn

#### `EmptyState` — icon + title + description + CTA

```
┌──────────────────────────────────┐
│            [icon huyền học]       │
│                                  │
│         Tiêu đề (h3, danh từ)     │
│                                  │
│   Mô tả ngắn 1 dòng giải thích    │
│   trạng thái và gợi ý hành động.  │
│                                  │
│        [Nút CTA chính]            │
└──────────────────────────────────┘
```

- **Icon**: `lucide-react` theo chủ đề (sao, mặt trăng, la bàn, hoa sen). KHÔNG emoji generic. _Req 10.7_
- **Title**: dạng danh từ, mô tả trạng thái, không bi quan: "Chưa có lá số nào được lưu" (✅), "Trống trơn 😢" (❌).
- **Description**: 1 dòng (≤ 90 ký tự), giải thích nhẹ và dẫn lối.
- **CTA**: một hành động chính dẫn người dùng tiếp tục. Nhãn dạng động từ.

#### `ErrorState` — title + description + 2 actions (retry + về trang chủ)

```
┌──────────────────────────────────┐
│        [icon cảnh báo / lỗi]      │
│                                  │
│     Tiêu đề lỗi (h3, danh từ)     │
│                                  │
│   Mô tả ngắn nguyên nhân và       │
│   hành động bạn nên làm tiếp theo.│
│                                  │
│   [Thử lại]    [Về trang chủ]     │
└──────────────────────────────────┘
```

- Tiêu đề + description = wording từ `ERROR_MESSAGES`.
- Nút "Thử lại" gọi cùng request (retry function được truyền qua prop `onRetry`). _Req 5.4_
- Nút "Về trang chủ" là link `<a href="/">`, không gọi router programmatic để không lock state.
- Trường hợp 429: thay nút "Thử lại" bằng countdown `Thử lại sau X phút` disabled cho đến khi `Retry-After` hết.

#### `Loading` — Skeleton match khung dữ liệu thực

- Skeleton phải có **hình dạng giống component cuối** (cùng số hàng, cùng chiều cao card, cùng số ô bảng) để tránh layout shift > 0.1. _Req 11.7_
- Pulse opacity giữ ở `0.4 → 0.7 → 0.4` mỗi 1.2s. Reduced_Motion_User → không pulse, chỉ giữ opacity tĩnh `0.5`. _Req 9.4_
- Nút submit trong loading: vô hiệu hoá + spinner inline + đổi label sang trạng thái: `Lập lá số` → `Đang tính lá số…`. _Req 5.2_
- AI streaming: typing indicator (3 chấm pulse) cho đến chunk đầu tiên, rồi render markdown incremental — KHÔNG chờ stream xong mới render. _Req 5.3, 11.6_

### 4.3 Wording mẫu theo luồng

| Luồng | Loading | Empty | Error |
|---|---|---|---|
| **Submit form Bát Tự** | Nút: `Đang tính lá số…` | n/a (form luôn ra kết quả) | Inline form: dùng validation messages; toàn trang: `server_error` |
| **AI streaming** | Typing indicator (3 chấm) | n/a | `rate_limit(X)` cho 429; `network_lost_during_stream` cho giữa stream |
| **Lịch sử tra cứu** | Skeleton 5 hàng bảng | Title: `Chưa có lượt tra cứu nào`. Desc: `Bắt đầu một mô-đun để lưu lại lịch sử của bạn.` CTA: `Khám phá mô-đun` | `server_error` + `Thử lại` |
| **Lá số đã lưu (`/profile`)** | Skeleton grid 6 card | Title: `Chưa có lá số nào được lưu`. Desc: `Lưu lá số sau khi tra cứu để xem lại bất cứ lúc nào.` CTA: `Lập lá số mới` | `server_error` + `Thử lại` |
| **Tìm kiếm Từ Điển** | Skeleton 4 dòng kết quả | Title: `Không tìm thấy kết quả`. Desc: `Thử từ khoá khác hoặc kiểm tra chính tả.` CTA: `Xoá tìm kiếm` | `server_error` + `Thử lại` |
| **Chia sẻ lá số** | Spinner trong nút `Đang tạo link…` | n/a | Toast: `clipboard_fail` hoặc `server_error` |
| **Xuất PNG/PDF** | Spinner trong nút `Đang xuất…` | n/a | Toast inline kèm wording cụ thể (ví dụ "Không thể xuất PDF lúc này. Vui lòng thử lại.") |
| **Đăng nhập (Clerk chưa cấu hình)** | n/a | Banner: `Tài khoản tạm thời chưa khả dụng. Bạn vẫn dùng được 15 mô-đun mà không cần đăng nhập.` _Req 15.4_ | n/a |

### 4.4 Anti-patterns cần tránh

- ❌ Spinner toàn trang cho list > 3 mục (dùng skeleton). _Req 5.1_
- ❌ Tin nhắn lỗi technical leak (`TypeError: Cannot read property 'x' of undefined`). Luôn map về `client_error` / `server_error`.
- ❌ Empty state không có CTA — user bị kẹt.
- ❌ Toast lỗi chồng nhau (5 toast cùng lúc khi một stream lỗi). Dedupe theo key wording.
- ❌ Reset form về rỗng sau submit thành công. Giữ giá trị để cho phép tinh chỉnh. _Req 6.9_

---

## 5. Manual a11y checklist

Checklist này dùng cho QA thủ công trên **15 mô-đun + trang chủ + ai-chat + profile + lịch sử + sign-in/up** ở cả light và dark mode, ở 4 breakpoint (320 / 768 / 1024 / 1440). Không thay thế `axe-core` automated trong CI mà bổ sung cho các vấn đề chỉ con người mới nhận ra. _Req 3.1–3.12, 9.4_

### 5.1 Tab traversal (chỉ dùng bàn phím)

- [ ] Nhấn `Tab` từ đầu trang: phần tử đầu tiên focus là **Skip link** "Bỏ qua tới nội dung chính"; nó hiện ra (không invisible). _Req 3.10_
- [ ] Skip link đưa focus vào `#main` khi nhấn Enter.
- [ ] Tab thứ tự đi top-to-bottom, left-to-right; không có jump bất thường về cuối trang. _Req 3.1_
- [ ] Mọi button/link/input/select/dropdown/tab tới được bằng Tab; không có `tabindex="-1"` ngầm trên phần tử cần thao tác.
- [ ] Mọi item trong dropdown navbar tới được bằng `Arrow Down/Up`; `Esc` đóng dropdown. _Req 3.7_
- [ ] Trong dialog xoá lá số: `Tab` chỉ vòng quanh các phần tử trong dialog (focus trap), không thoát ra background. _Req 3.6_
- [ ] Khi dialog đóng (Esc hoặc click "Huỷ"), focus quay lại trigger button đã mở dialog. _Req 3.7_
- [ ] Mobile drawer mở: focus vào item đầu tiên trong drawer; Esc đóng và trả focus về hamburger button.
- [ ] Trên `/ai-chat`: `Enter` gửi tin nhắn, `Shift+Enter` xuống dòng — verify từng phím. _Req 13.6_

### 5.2 Focus visible

- [ ] Mỗi phần tử nhận focus có **focus ring** dày ≥ 2px sử dụng `--ring` token. _Req 3.2_
- [ ] Focus ring có contrast ≥ 3:1 so với nền (dùng eyedropper + công cụ đo contrast nếu cần).
- [ ] Focus ring không bị `outline: none` ở đâu đó override.
- [ ] Khi click chuột vào button rồi rời tay: focus ring không hiện (nhờ `:focus-visible`); khi tab vào: hiện rõ. Verify cả desktop và touch.
- [ ] Trong dropdown, item đang highlight bằng keyboard có background `--accent` rõ ràng phân biệt với item khác.

### 5.3 Contrast (WCAG 2.1 AA)

- [ ] Text thường (≤ 14px regular, ≤ 17px regular): contrast ≥ **4.5:1**. _Req 2.1, 3.8_
- [ ] Text lớn (≥ 18px regular hoặc ≥ 14px bold): contrast ≥ **3:1**.
- [ ] UI element không phải text (border input, icon nút, focus ring): contrast ≥ **3:1**.
- [ ] Verify ở **cả light và dark mode**. Đo bằng Chrome DevTools "Inspect element" → Accessibility → Contrast, hoặc extension `axe DevTools`.
- [ ] Đặc biệt kiểm tra: `--muted-foreground` trên `--card`, badge variants, link trong markdown AI output, header bảng, label biểu đồ.
- [ ] Không truyền tải thông tin **chỉ bằng màu**: ngày tốt/xấu kèm icon hoặc text; mức cát hung kèm chữ; ngũ hành kèm label. _Req 3.9_

### 5.4 Reduced motion

- [ ] Bật `prefers-reduced-motion: reduce` trong DevTools (Rendering → Emulate CSS media features). _Req 9.4_
- [ ] Ambient orb ngừng drift, star field tĩnh.
- [ ] Tilt-card 3D không tilt khi hover; chỉ giữ elevation tĩnh.
- [ ] Scroll reveal slide bị bỏ — section hiện trực tiếp, không animate translateY.
- [ ] Shimmer-text trên heading thương hiệu: tĩnh, không lặp gradient.
- [ ] Glow-pulse trên CTA: tĩnh.
- [ ] Skeleton: opacity tĩnh `0.5`, không pulse.
- [ ] Mọi chuyển cảnh còn lại (dialog enter, dropdown open) ≤ 150ms hoặc bị tắt — dùng fade thay translate/scale > 4px.
- [ ] Mystic_Cursor: bỏ hiệu ứng đuôi sao, chỉ giữ icon tĩnh hoặc dùng cursor hệ thống. _Req 17.4_

### 5.5 Screen reader testing

Test trên **NVDA** (Windows + Firefox/Chrome) và **VoiceOver** (macOS Safari, iOS Safari). Cài đặt:
- NVDA: tải miễn phí từ <https://www.nvaccess.org/download/>. Bật bằng `Ctrl+Alt+N`. Tắt bằng `NVDA+Q`.
- VoiceOver: macOS `Cmd+F5`; iOS Settings → Accessibility → VoiceOver.

Walkthrough cho mỗi trang:

- [ ] `<html lang="vi">` → screen reader phát âm tiếng Việt. _Req 3.11_
- [ ] Tiêu đề trang đọc đúng (`<title>` được set đúng cho từng route).
- [ ] Khi load trang: heading `h1` đọc lên đầu tiên sau navigation landmark.
- [ ] Tất cả icon-only button có `aria-label` tiếng Việt (theme toggle, close dialog, hamburger, chia sẻ, xuất). _Req 3.3_
- [ ] Form input: label đọc lên cùng input khi focus (`htmlFor`/`id` đúng). _Req 3.4_
- [ ] Khi input lỗi: SR đọc cả label + giá trị + thông báo lỗi (qua `aria-describedby`). _Req 3.5_
- [ ] `EmptyState` đọc title + description khi xuất hiện (do `role="status"`).
- [ ] `ErrorState` interrupt và đọc khi xuất hiện (do `role="alert"`).
- [ ] Container loading có `aria-busy="true"` → SR thông báo "đang bận" hoặc tương tự.
- [ ] Toast (sonner) đọc nội dung khi xuất hiện (sonner tự gắn `aria-live="polite"`).
- [ ] Biểu đồ SVG đọc `aria-label` mô tả nội dung (ví dụ: "Biểu đồ ngũ giác Thần Số Học: số chủ đạo 7, số định mệnh 3…"). _Req 8.2_
- [ ] Bảng dữ liệu (4 trụ Bát Tự, 12 cung Tử Vi): SR navigate được qua header + cell, không đọc lộn xộn (do `<thead>` + `scope="col"`). _Req 8.4_
- [ ] Markdown AI output: heading levels không nhảy cấp; link đọc text + "(mở trang mới)" cho external. _Req 8.5_
- [ ] `Mystic_Cursor` không bị SR đọc (gắn `aria-hidden="true"` trên decorative element). _Req 3.12_
- [ ] Đoạn tiếng Anh nhúng (tên thuật ngữ, "I Ching") gắn `lang="en"` để SR đổi giọng. _Req 3.11_

### 5.6 Quy trình QA

1. Trước mỗi release lớn (changelog có sửa UI), chạy checklist này trên **3 mô-đun đại diện**: Bát Tự (form phức tạp + biểu đồ + AI), Lịch Vạn Niên (read-only data dày), AI Chat (streaming + dialog).
2. Chạy `axe-core` automated trên CI cho 100% page fixtures — fail trên `serious` / `critical`. Nếu pass automated nhưng manual checklist phát hiện vấn đề, ghi issue và blocker release.
3. Khi rời chuẩn (ví dụ thêm component mới), bổ sung test fixture vào `e2e/a11y.spec.ts` và mục tương ứng vào checklist này.

---

## 6. Tài liệu liên quan

- `artifacts/mysticism-web/src/components/ui/README.md` — design tokens, primitive API, ví dụ code.
- `artifacts/mysticism-web/src/lib/error-messages.ts` — single source of truth cho error/status copy.
- `.kiro/specs/ux-ui-upgrade/requirements.md` — toàn bộ acceptance criteria.
- `.kiro/specs/ux-ui-upgrade/design.md` — quyết định kiến trúc và rationale.
- Trang nội bộ `/dev/design-tokens` (chỉ trong build dev) — preview live mọi token, button variants, badge variants.
