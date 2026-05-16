# Bugfix Requirements Document

## Introduction

Trên toàn bộ các chức năng AI của ứng dụng Huyền Bí (Thần số học, Bát Tự, Xem tên/Ngũ Cách, Xem Quẻ I Ching, Phong Thủy, Cát Hung biển số/điện thoại, Tử Vi), khi người dùng **chưa đăng nhập** mà bấm các nút yêu cầu AI luận giải ("Nhận thông điệp", "Luận giải chi tiết", "Nhận tư vấn", "Luận giải lá số"), giao diện hiển thị chuỗi lỗi kỹ thuật thô **"Lỗi: Unauthorized"** thay vì một thông báo thân thiện mời đăng nhập.

Nguyên nhân gốc: endpoint `/api/mysticism/ai-interpret` được bảo vệ bởi `requireClerkUser` và trả `HTTP 401` với body `{ "error": "Unauthorized" }` khi không có phiên Clerk hợp lệ. Hook SSE dùng chung `artifacts/mysticism-web/src/hooks/use-sse-chat.ts` xử lý mọi `!response.ok` bằng một nhánh duy nhất:

```ts
last.content = `Lỗi: ${err.error || 'Không thể kết nối AI'}`;
```

Nhánh này không phân biệt giữa trường hợp chưa đăng nhập (401) và các lỗi khác (mạng, 5xx, 429, thiếu cấu hình), nên ghép thẳng chuỗi server trả về vào UI. Do tất cả các trang AI đều đi qua cùng một hook (`useAISSEChat` → `useSSEChat`), lỗi này ảnh hưởng đồng loạt mọi chức năng AI.

Tác động: người dùng mới, chưa đăng nhập, gặp thông báo kỹ thuật bằng tiếng Anh, không có hướng dẫn bước tiếp theo, dễ hiểu lầm là ứng dụng hỏng và thoát ra. Đây là trải nghiệm chặn chuyển đổi (conversion blocker) cho mọi luồng AI.

## Bug Analysis

### Current Behavior (Defect)

Mô tả hành vi hiện tại khi người dùng chưa đăng nhập (không có session Clerk hợp lệ) bấm bất kỳ nút kích hoạt AI nào ở các trang `than-so-hoc.tsx`, `bat-tu.tsx`, `xem-ten.tsx`, `xem-que.tsx`, `phong-thuy.tsx`, `cat-hung.tsx`, `tu-vi.tsx`.

1.1 WHEN người dùng chưa đăng nhập (không có Clerk session) VÀ bấm nút yêu cầu AI trên bất kỳ trang AI nào THEN the system hiển thị chuỗi thô `"Lỗi: Unauthorized"` trong vùng kết quả luận giải của `AIPanel`/card "Hỏi AI về kết quả của bạn".

1.2 WHEN hook `useSSEChat.streamResponse` nhận response với `status = 401` và body `{ "error": "Unauthorized" }` THEN the system ghi thẳng giá trị `err.error` vào `message.content` qua dòng `` last.content = `Lỗi: ${err.error || 'Không thể kết nối AI'}` `` mà không phân biệt mã lỗi auth với các lỗi khác.

1.3 WHEN thông báo lỗi 401 được hiển thị THEN the system không cung cấp bất kỳ CTA, link, hoặc gợi ý nào để người dùng chuyển sang luồng đăng nhập (`/sign-in`), buộc người dùng phải tự đoán cách giải quyết.

1.4 WHEN người dùng chưa đăng nhập bấm các nút AI ở nhiều trang khác nhau THEN the system đều hiển thị cùng một chuỗi kỹ thuật `"Lỗi: Unauthorized"` bằng tiếng Anh, không nhất quán với ngôn ngữ tiếng Việt của phần còn lại trong giao diện.

### Expected Behavior (Correct)

Mô tả hành vi đúng cho cùng tiền điều kiện ở mục 1, đồng nhất trên tất cả các trang AI.

2.1 WHEN người dùng chưa đăng nhập (không có Clerk session) VÀ bấm nút yêu cầu AI trên bất kỳ trang AI nào THEN the system SHALL hiển thị một thông báo thân thiện bằng tiếng Việt mời người dùng đăng nhập để sử dụng chức năng AI (ví dụ: "Vui lòng đăng nhập để nhận luận giải từ AI") thay vì chuỗi thô `"Lỗi: Unauthorized"`.

2.2 WHEN hook `useSSEChat.streamResponse` nhận response với `status = 401` (đặc biệt với body `{ "error": "Unauthorized" }` do `requireClerkUser` trả về) THEN the system SHALL nhận diện đây là trường hợp chưa xác thực và phát ra thông báo thân thiện theo mục 2.1, KHÔNG ghép chuỗi `err.error` của server vào UI.

2.3 WHEN thông báo chưa đăng nhập được hiển thị THEN the system SHALL kèm một CTA/liên kết dẫn người dùng đến trang đăng nhập `/sign-in` (đồng bộ với luồng Clerk hiện có ở `artifacts/mysticism-web/src/pages/sign-in.tsx` và `components/save-reading-btn.tsx`).

2.4 WHEN bug fix được triển khai THEN the system SHALL áp dụng thay đổi ở tầng dùng chung (`use-sse-chat.ts`/`use-ai-sse-chat.ts` và/hoặc component `AIPanel`) để TẤT CẢ các trang AI (`than-so-hoc.tsx`, `bat-tu.tsx`, `xem-ten.tsx`, `xem-que.tsx`, `phong-thuy.tsx`, `cat-hung.tsx`, `tu-vi.tsx`) đều hưởng hành vi mới mà không phải sửa từng trang.

2.5 WHEN có thể phát hiện trạng thái chưa đăng nhập trước khi gọi API (ví dụ qua `useUser().isSignedIn` của Clerk) THEN the system MAY chặn sớm ngay ở phía client, hiển thị cùng thông báo thân thiện như mục 2.1 mà không phát sinh request `POST /api/mysticism/ai-interpret`.

### Unchanged Behavior (Regression Prevention)

Danh sách hành vi hiện có phải được giữ nguyên sau khi sửa, ứng với các input không rơi vào bug condition (user đã đăng nhập, hoặc lỗi không phải 401).

3.1 WHEN người dùng đã đăng nhập (có Clerk session hợp lệ) VÀ bấm nút yêu cầu AI trên bất kỳ trang AI nào THEN the system SHALL CONTINUE TO stream luận giải AI qua SSE và render markdown vào card kết quả như hiện tại.

3.2 WHEN endpoint `/api/mysticism/ai-interpret` trả lỗi `HTTP 429` (rate limit) với body có `error` và `limitPerHour`/`limitPerDay` THEN the system SHALL CONTINUE TO hiển thị thông báo lỗi rate limit phù hợp (không bị gộp nhầm vào nhánh "chưa đăng nhập").

3.3 WHEN endpoint trả lỗi `HTTP 5xx` hoặc request thất bại vì lỗi mạng/`fetch` exception THEN the system SHALL CONTINUE TO hiển thị thông báo lỗi kết nối/hệ thống chung (ví dụ "Không thể kết nối AI") thay vì thông báo "chưa đăng nhập".

3.4 WHEN endpoint trả phản hồi cấu hình thiếu API key (stream chứa thông điệp "Hệ thống chưa cấu hình API key…" do backend phát khi `!cfg.ai_api_key`) THEN the system SHALL CONTINUE TO hiển thị nguyên văn thông điệp đó trong vùng kết quả.

3.5 WHEN endpoint trả `HTTP 400` (body không hợp lệ, ví dụ `{ "error": "Invalid body" }`) THEN the system SHALL CONTINUE TO hiển thị thông báo lỗi tương ứng, không nhầm sang nhánh "chưa đăng nhập".

3.6 WHEN backend `requireClerkUser` từ chối request chưa xác thực THEN the server SHALL CONTINUE TO trả `HTTP 401` với body `{ "error": "Unauthorized" }` (regression của bugfix `ai-interpret-auth` không bị phá vỡ — xem `artifacts/api-server/src/routes/mysticism/ai-interpret-auth.test.ts`).

3.7 WHEN người dùng đã đăng nhập sử dụng các nút AI trên tất cả các trang đã liệt kê ở mục 2.4 THEN the system SHALL CONTINUE TO gửi đúng `type`, `context`, và các header `x-ai-provider` / `x-ai-key` / `x-ai-model` (nếu có) như logic hiện tại của `useSSEChat`.

3.8 WHEN hook `useSSEChat` được gọi bên ngoài 7 trang AI trên (nếu có) THEN the system SHALL CONTINUE TO giữ nguyên chữ ký (`messages`, `streamResponse`, `isStreaming`, `setMessages`) để không vỡ các consumer hiện tại.

## Deriving the Bug Condition

### Bug Condition Function

```pascal
FUNCTION isBugCondition(X)
  INPUT: X of type AIInterpretRequest
         // X gồm: session (có/không có Clerk userId hợp lệ),
         //        page (một trong 7 trang AI),
         //        action (bấm nút Nhận thông điệp / Luận giải / Nhận tư vấn)
  OUTPUT: boolean

  // Trigger bug: user CHƯA đăng nhập kích hoạt luồng AI,
  // khiến backend trả 401 { error: "Unauthorized" } và hook SSE hiển thị thô.
  RETURN X.session.isSignedIn = false
         AND X.action = "invokeAIInterpret"
         AND X.page IN {
               "than-so-hoc", "bat-tu", "xem-ten",
               "xem-que",    "phong-thuy", "cat-hung", "tu-vi"
             }
END FUNCTION
```

### Property Specification (Fix Checking)

```pascal
// Property: Fix Checking — Thông báo chưa đăng nhập thân thiện
FOR ALL X WHERE isBugCondition(X) DO
  ui ← renderAIPanelAfter(invokeAIInterpret'(X))
  ASSERT NOT ui.contains("Lỗi: Unauthorized")
     AND ui.containsFriendlyVietnameseLoginPrompt()
     AND ui.hasSignInCTA(targetRoute = "/sign-in")
END FOR
```

- **F**: luồng hiện tại — `useSSEChat.streamResponse` gặp 401 → `last.content = "Lỗi: Unauthorized"`.
- **F'**: luồng sau khi sửa — nhận diện 401 (hoặc `isSignedIn === false`) → thay bằng thông báo thân thiện + CTA đăng nhập.

### Preservation Goal (Preservation Checking)

```pascal
// Property: Preservation Checking — Các luồng không phải bug giữ nguyên
FOR ALL X WHERE NOT isBugCondition(X) DO
  // X gồm: user đã đăng nhập (thành công streaming),
  //       hoặc lỗi 429 rate-limit, 5xx, network, 400 invalid body,
  //       hoặc cấu hình thiếu API key (stream message).
  ASSERT F(X) = F'(X)
END FOR
```

Nói cách khác: với mọi input không phải "user chưa đăng nhập bấm nút AI", `F'` phải hành xử y hệt `F` — streaming thành công, thông báo rate-limit, thông báo lỗi mạng/hệ thống, thông báo thiếu API key, và thông báo body không hợp lệ đều không bị thay đổi.

### Counterexample (Minh họa)

- Tiền điều kiện: truy cập trang `/than-so-hoc`, không đăng nhập.
- Thao tác: nhập ngày sinh hợp lệ → bấm "Nhận thông điệp".
- Kết quả hiện tại (F): card "Hỏi AI về kết quả của bạn" hiển thị `Lỗi: Unauthorized`.
- Kết quả mong muốn (F'): card hiển thị thông điệp kiểu "Vui lòng đăng nhập để nhận luận giải từ AI" kèm nút/liên kết "Đăng nhập" dẫn tới `/sign-in`.
