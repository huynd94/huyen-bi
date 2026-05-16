# AI Unauthorized Friendly Prompt Bugfix Design

## Overview

Hiện tại, trên cả 7 trang AI (`than-so-hoc`, `bat-tu`, `xem-ten`, `xem-que`, `phong-thuy`, `cat-hung`, `tu-vi`), khi một người dùng **chưa đăng nhập** bấm nút kích hoạt AI (ví dụ "Nhận thông điệp", "Luận giải chi tiết", "Nhận tư vấn"), giao diện hiển thị chuỗi lỗi kỹ thuật thô **"Lỗi: Unauthorized"** bằng tiếng Anh. Nguyên nhân là hook SSE dùng chung `artifacts/mysticism-web/src/hooks/use-sse-chat.ts` không phân biệt `HTTP 401` với các lỗi khác và ghép thẳng `err.error` của server vào `message.content`.

Chiến lược sửa tập trung vào **tầng dùng chung** để tất cả 7 trang hưởng lợi mà không cần chỉnh sửa từng trang:

1. Trong `useSSEChat` (hook cấp thấp), phát hiện `response.status === 401` và thay thế nội dung thô bằng thông điệp tiếng Việt thân thiện, kèm một liên kết dạng markdown tới `/sign-in` (vì mọi trang đều render qua `MarkdownRenderer`, CTA xuất hiện tự nhiên mà không cần JSX mới).
2. Trong `useAISSEChat` (wrapper cấp cao dùng bởi AI panel), sử dụng `useUser()` của Clerk để **chặn sớm** khi `isSignedIn === false` và phát chính thông điệp đó ra ngay lập tức, tránh phát sinh request tới `/api/mysticism/ai-interpret`.

Mọi nhánh lỗi khác (429 rate-limit, 5xx/mạng, thông điệp thiếu API key trong stream, 400 invalid body) và luồng streaming thành công khi đã đăng nhập phải không thay đổi.

## Glossary

- **Bug_Condition (C)**: điều kiện kích hoạt bug — người dùng chưa đăng nhập kích hoạt một luồng AI trên bất kỳ trang nào trong 7 trang AI.
- **Property (P)**: hành vi mong muốn khi `C(X)` đúng — UI hiển thị thông điệp tiếng Việt thân thiện mời đăng nhập, kèm liên kết tới `/sign-in`, và **không** chứa chuỗi `"Lỗi: Unauthorized"`.
- **Preservation**: mọi hành vi hiện có khi `C(X)` sai phải giữ nguyên — streaming khi đã đăng nhập, thông báo 429, 5xx/mạng, thông báo thiếu API key trong stream, phản hồi 400 invalid body, hợp đồng server 401 (`requireClerkUser`).
- **useSSEChat**: hook cấp thấp trong `artifacts/mysticism-web/src/hooks/use-sse-chat.ts` thực hiện fetch + đọc stream SSE và cập nhật `messages[]`.
- **useAISSEChat**: wrapper trong `artifacts/mysticism-web/src/hooks/use-ai-sse-chat.ts` gói `useSSEChat` với headers AI lấy từ `useAISettings`.
- **AIPanel**: pattern UI dùng chung (một instance JSX nội tuyến trong mỗi trang AI, hoặc hàm cục bộ `AIPanel` trong `cat-hung.tsx`) chịu trách nhiệm render các message `role === "assistant"` qua `MarkdownRenderer`.
- **isBugCondition**: vị ngữ trên input xác định xem input có thuộc bug domain hay không, dùng để định nghĩa tính chất của fix.
- **requireClerkUser**: middleware ở `artifacts/api-server/src/lib/clerk-user.ts` trả `HTTP 401 { error: "Unauthorized" }` khi request không có Clerk userId hợp lệ. Đây là phía server và phải giữ nguyên.
- **UNAUTHENTICATED_AI_MESSAGE**: hằng số markdown chứa thông điệp tiếng Việt + liên kết `/sign-in`, được introduce bởi fix này và dùng chung cho mọi consumer.

## Bug Details

### Bug Condition

Bug xuất hiện khi một người dùng chưa có session Clerk (không đăng nhập) kích hoạt luồng AI trên bất kỳ trang nào trong 7 trang AI. Hook `useSSEChat.streamResponse` gọi `POST /api/mysticism/ai-interpret`, server phản hồi `HTTP 401 { "error": "Unauthorized" }` do `requireClerkUser`. Nhánh xử lý `!response.ok` hiện tại không nhận diện 401 và ghi thẳng `err.error` vào `message.content` thông qua dòng ``last.content = `Lỗi: ${err.error || 'Không thể kết nối AI'}` ``, khiến UI hiển thị chuỗi tiếng Anh kỹ thuật.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type AIInterpretRequest
         // input gồm:
         //   session     : { isSignedIn: boolean }
         //   action      : "invokeAIInterpret"
         //   page        : một trong 7 trang AI
         //   endpoint    : "/api/mysticism/ai-interpret"
         //   response    : { status: number, body: { error?: string } } (khi có)
  OUTPUT: boolean

  RETURN input.action = "invokeAIInterpret"
         AND input.page IN {
               "than-so-hoc", "bat-tu", "xem-ten",
               "xem-que",    "phong-thuy", "cat-hung", "tu-vi"
             }
         AND (
               // Nhánh 1: chưa đăng nhập thực sự (có thể chặn trước khi gọi API)
               input.session.isSignedIn = false
               OR
               // Nhánh 2: server đã trả 401 { error: "Unauthorized" }
               (input.response.status = 401
                AND input.response.body.error = "Unauthorized")
             )
END FUNCTION
```

### Examples

- **Ví dụ 1 — Thần số học**: truy cập `/than-so-hoc`, chưa đăng nhập, nhập ngày sinh hợp lệ, bấm "Nhận thông điệp".
  - Hiện tại (F): card "Hỏi AI về kết quả của bạn" hiển thị `Lỗi: Unauthorized`.
  - Mong muốn (F'): card hiển thị "Vui lòng đăng nhập để nhận luận giải từ AI" kèm link "Đăng nhập" tới `/sign-in`.
- **Ví dụ 2 — Bát Tự**: truy cập `/bat-tu`, chưa đăng nhập, nhập đầy đủ thông tin sinh, bấm "Luận giải chi tiết".
  - Hiện tại (F): vùng Luận giải AI hiển thị `Lỗi: Unauthorized`.
  - Mong muốn (F'): hiển thị thông điệp thân thiện + CTA đăng nhập; không gọi API hoặc nếu có gọi thì thay thế response trước khi render.
- **Ví dụ 3 — Cát Hung (`cat-hung.tsx`, hàm `AIPanel` nội bộ)**: chưa đăng nhập, bấm "Nhận thông điệp" cho số điện thoại.
  - Hiện tại (F): `AIPanel` render `Lỗi: Unauthorized` qua `MarkdownRenderer`.
  - Mong muốn (F'): `AIPanel` render cùng thông điệp thân thiện + CTA, không cần sửa `AIPanel` cục bộ.
- **Ví dụ 4 — Edge case Clerk chưa load**: người dùng chưa xác định (`isLoaded === false`) bấm nút AI. Client chưa thể chặn sớm, request đi ra, server trả 401 (vì không có token). Nhánh hậu-response trong `useSSEChat` phải bắt 401 và thay thế nội dung.

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Người dùng đã đăng nhập: `useSSEChat` tiếp tục stream qua SSE và cập nhật `messages[-1].content` như hiện tại (req 3.1, 3.7).
- `HTTP 429` rate-limit: nội dung error message của server (ví dụ `Đã vượt giới hạn...`) tiếp tục được hiển thị qua định dạng `Lỗi: ${err.error}` hoặc tương đương (req 3.2).
- `HTTP 5xx` và network/`fetch` exception: tiếp tục hiển thị thông báo lỗi hệ thống chung như "Không thể kết nối AI" (req 3.3).
- Stream chứa thông điệp "Hệ thống chưa cấu hình API key..." từ backend khi `!cfg.ai_api_key`: tiếp tục render nguyên văn trong vùng kết quả (req 3.4).
- `HTTP 400` invalid body: tiếp tục hiển thị thông báo lỗi tương ứng (req 3.5).
- Server contract: `requireClerkUser` tiếp tục trả `HTTP 401 { "error": "Unauthorized" }` cho request chưa xác thực, và regression test `ai-interpret-auth.test.ts` không bị phá (req 3.6).
- Chữ ký public của `useSSEChat`: `{ messages, streamResponse, isStreaming, setMessages }` giữ nguyên để không vỡ consumer hiện có (req 3.8).
- Headers gửi đi khi đã đăng nhập: `x-ai-provider`, `x-ai-key`, `x-ai-model` vẫn được gửi đúng như logic hiện tại (req 3.7).

**Scope:**
Mọi input mà `isBugCondition(input) = false` phải không chịu ảnh hưởng của fix. Bao gồm:
- Request SSE thành công khi đã đăng nhập, với bất kỳ `type`/`context` nào trong 7 trang.
- Mọi HTTP error status khác 401 (400, 429, 5xx).
- Mọi lỗi exception từ `fetch` (DNS fail, abort, parse JSON fail).
- Mọi thông điệp in-stream đặc biệt của backend (thiếu API key).
- Mọi consumer ngoài 7 trang AI nếu có sử dụng `useSSEChat` trực tiếp.

## Hypothesized Root Cause

Dựa trên mô tả bug và code, nguyên nhân tập trung vào nhánh xử lý lỗi trong `useSSEChat`:

1. **Nhánh `!response.ok` không phân biệt status code**: toàn bộ lỗi HTTP đi qua một đường duy nhất trong `use-sse-chat.ts`:
   - `` last.content = `Lỗi: ${err.error || 'Không thể kết nối AI'}` ``
   - Với 401 thì `err.error === "Unauthorized"` → nội dung cuối là chuỗi tiếng Anh thô.

2. **Thiếu layer xác thực phía client trước khi gọi API**: các trang AI không kiểm tra `useUser().isSignedIn` trước khi gọi `streamResponse`, nên mọi yêu cầu đều đi ra mạng trước. Điều này vừa lãng phí vừa buộc phải dựa hoàn toàn vào phản hồi 401 của server.

3. **Không có thông điệp chuẩn dùng chung cho trạng thái chưa đăng nhập**: không có hằng số/helper tập trung để sinh thông điệp tiếng Việt + CTA, nên nếu sửa theo hướng per-page thì dễ lệch nội dung.

4. **Consumer render trực tiếp `msg.content` qua `MarkdownRenderer`**: điều này **có lợi** cho fix — chỉ cần đặt message content là một chuỗi markdown hợp lệ (bao gồm liên kết `[Đăng nhập](/sign-in)`), UI sẽ tự động hiển thị link mà không cần thay đổi JSX của 7 trang.

Hệ quả: sửa ở đúng hai tầng (`useSSEChat` + `useAISSEChat`) là đủ để đóng bug trên toàn bộ 7 trang.

## Correctness Properties

Property 1: Bug Condition — Friendly Vietnamese Sign-In Prompt Replaces Raw 401

_For any_ input where the bug condition holds (`isBugCondition(input) = true` — tức người dùng chưa đăng nhập kích hoạt một luồng AI trên một trong 7 trang, hoặc server trả `HTTP 401 { "error": "Unauthorized" }`), the fixed `useSSEChat` / `useAISSEChat` flow SHALL cập nhật message cuối cùng thành một thông điệp tiếng Việt thân thiện mời đăng nhập (ví dụ chứa cụm "Vui lòng đăng nhập"), phải chứa một liên kết markdown tới `/sign-in`, và KHÔNG chứa chuỗi `"Lỗi: Unauthorized"`. Khi có thể phát hiện `isSignedIn === false` trước khi gọi API, luồng fix SHALL không phát sinh request mạng.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**

Property 2: Preservation — All Non-401 AI Flows Behave Identically

_For any_ input where the bug condition does NOT hold (`isBugCondition(input) = false` — tức người dùng đã đăng nhập, hoặc server trả status khác 401 như 429/5xx/400, hoặc exception mạng, hoặc thông điệp in-stream thiếu API key), the fixed function SHALL produce the same observable behavior as the original function: cùng tập chunk stream được ghép vào `message.content`, cùng nội dung lỗi "Lỗi: ${err.error}" cho các status khác 401, cùng thông điệp "Không thể kết nối AI" cho exception, cùng headers `x-ai-provider`/`x-ai-key`/`x-ai-model`, cùng chữ ký public của `useSSEChat`, và server contract của `requireClerkUser` không bị thay đổi.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8**

## Fix Implementation

### Changes Required

Giả sử root cause analysis đúng, các thay đổi tập trung ở tầng hook dùng chung:

**File 1**: `artifacts/mysticism-web/src/hooks/use-sse-chat.ts`

**Function**: `useSSEChat` (bên trong `streamResponse`, nhánh `!response.ok`).

**Specific Changes**:

1. **Giới thiệu hằng số chung cho thông điệp chưa đăng nhập**: định nghĩa `UNAUTHENTICATED_AI_MESSAGE` (ví dụ ở một file mới `artifacts/mysticism-web/src/lib/ai-auth-messages.ts` hoặc ngay trong hook) với nội dung markdown:
   ```
   Vui lòng [đăng nhập](/sign-in) để nhận luận giải từ AI.
   ```
   - Tiếng Việt, ngắn gọn, nhất quán với ngôn ngữ UI.
   - Link markdown nhúng sẵn CTA `/sign-in` (render tự nhiên qua `MarkdownRenderer`).
   - Export như một constant để các hook/consumer khác có thể import và phát cùng nội dung.

2. **Phân biệt 401 với các status khác trong `useSSEChat`**: trong nhánh `if (!response.ok)`, kiểm tra `response.status === 401` TRƯỚC khi đọc body. Nếu là 401:
   - Gán `last.content = UNAUTHENTICATED_AI_MESSAGE`.
   - **Không** đọc `err.error` của server vào UI (tránh rò rỉ text tiếng Anh).
   - Các status khác tiếp tục đi qua path cũ: `` last.content = `Lỗi: ${err.error || 'Không thể kết nối AI'}` ``.
   
   Thay đổi giữ nguyên:
   - Thứ tự `setMessages` (user rồi assistant placeholder) ở đầu hàm.
   - Mọi header logic (`x-ai-provider`, `x-ai-key`, `x-ai-model`).
   - Toàn bộ nhánh `for await (const { data } of readSseStream(...))` và nhánh `catch` xử lý exception.
   - Chữ ký return `{ messages, streamResponse, isStreaming, setMessages }`.

**File 2**: `artifacts/mysticism-web/src/hooks/use-ai-sse-chat.ts`

**Function**: `useAISSEChat` (wrapper cấp cao được tất cả 7 trang dùng).

**Specific Changes**:

3. **Chặn sớm (client-side short-circuit) khi chưa đăng nhập**: trong `useAISSEChat`:
   - Gọi `const { isSignedIn, isLoaded } = useUser()` từ `@clerk/react` (guard bằng `isClerkEnabled` từ `@/lib/auth-config` để không vỡ môi trường không cấu hình Clerk).
   - Wrap `streamResponse` trả về từ `useSSEChat` thành một phiên bản mới: nếu `isClerkEnabled && isLoaded && isSignedIn === false`, phát trực tiếp cặp message `{ role: "user", content: body.context }` + `{ role: "assistant", content: UNAUTHENTICATED_AI_MESSAGE }` qua `setMessages`, không gọi inner `streamResponse` và không thực hiện fetch.
   - Nếu `isClerkEnabled === false` hoặc `isLoaded === false` hoặc `isSignedIn === true`: gọi thẳng `streamResponse` của `useSSEChat` nguyên như hiện tại (đảm bảo hành vi môi trường không-Clerk và trạng thái "đang load" không thay đổi).
   - Giữ nguyên return shape: `{ messages, streamResponse, isStreaming, setMessages }`.

4. **Không chạm vào bất kỳ trang AI nào trong số 7 trang**: vì tất cả đều gọi `useAISSEChat().streamResponse` và render `messages` qua `MarkdownRenderer`. Thông điệp chưa đăng nhập sẽ xuất hiện đúng vị trí với CTA nhấp được mà không cần sửa `than-so-hoc.tsx`, `bat-tu.tsx`, `xem-ten.tsx`, `xem-que.tsx`, `phong-thuy.tsx`, `cat-hung.tsx`, `tu-vi.tsx`.

5. **Không thay đổi server**: giữ nguyên `artifacts/api-server/src/lib/clerk-user.ts` (`requireClerkUser`) và `artifacts/api-server/src/routes/mysticism/index.ts`. Hợp đồng 401 cho request chưa xác thực phải còn nguyên — đó là nền móng để fix client hoạt động và để test `ai-interpret-auth.test.ts` tiếp tục xanh.

## Testing Strategy

### Validation Approach

Chiến lược test theo hai pha: (1) viết test mang tính **exploratory** chạy trên code **chưa fix** để ghi lại counterexample — xác nhận rằng chuỗi `"Lỗi: Unauthorized"` thực sự xuất hiện khi 401 xảy ra; (2) sau khi triển khai fix, chạy cả tập test (fix checking + preservation checking) để đảm bảo (a) bug đóng trên toàn bộ domain `C(X)` và (b) các luồng khác không bị ảnh hưởng.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexample cho thấy bug xảy ra BEFORE implementing the fix, xác nhận hypothesis rằng `useSSEChat` ghép thẳng `err.error` khi 401. Nếu test PASS bất ngờ trên code chưa fix → hypothesis sai → cần re-hypothesize.

**Test Plan**: Mock `fetch` trong môi trường test (vitest + testing-library/react) để trả `Response` với `status: 401`, body `{ "error": "Unauthorized" }`. Gọi `useSSEChat().streamResponse` và kiểm tra nội dung `messages` cuối cùng. Làm tương tự cho `useAISSEChat` với `useUser()` được mock trả `isSignedIn: false`.

**Test Cases**:
1. **`useSSEChat` 401 from server renders raw "Lỗi: Unauthorized"**: mock `fetch` trả 401 → gọi `streamResponse("/api/mysticism/ai-interpret", { type: "than-so-hoc", context: "..." })` → assert `last assistant message === "Lỗi: Unauthorized"` (sẽ PASS trên unfixed code, FAIL sau fix). (counterexample chính của bug, sẽ đảo xuôi ở fix checking)
2. **`useAISSEChat` không chặn sớm khi `isSignedIn === false`**: mock Clerk `useUser` trả `{ isSignedIn: false, isLoaded: true }`, mock `fetch` để đếm số lần gọi → gọi `streamResponse(...)` → assert `fetch` đã được gọi ít nhất một lần (sẽ PASS trên unfixed code, FAIL sau fix vì expected 0 calls).
3. **Per-page visual check (manual hoặc e2e)**: với mỗi trang trong 7 trang AI, mô phỏng click nút AI khi chưa đăng nhập → assert DOM chứa chuỗi `"Lỗi: Unauthorized"`. Dùng list-driven loop để tránh lặp code.
4. **Edge case: 401 với body không phải `{error:"Unauthorized"}`** (ví dụ `{error:"Token expired"}`): mock `fetch` trả 401 với body custom → assert unfixed code hiển thị `"Lỗi: Token expired"` (xác nhận nhánh hiện tại không phân biệt nội dung 401 nào, fix sẽ thống nhất thành `UNAUTHENTICATED_AI_MESSAGE`).

**Expected Counterexamples**:
- `last.content === "Lỗi: Unauthorized"` sau khi nhận 401.
- `fetch` vẫn được gọi dù `isSignedIn === false`.
- Possible causes: (a) nhánh `!response.ok` không phân biệt status; (b) `useAISSEChat` không kiểm tra `useUser()`; (c) không có hằng số chung để dùng cho cả hai path.

### Fix Checking

**Goal**: Verify rằng với mọi input thuộc bug domain, `useSSEChat'` / `useAISSEChat'` tạo ra hành vi đúng: không chứa chuỗi thô, chứa thông điệp tiếng Việt và liên kết `/sign-in`.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := runAIRequest_fixed(input)
  ui := renderAIPanelFromMessages(result.messages)
  ASSERT NOT ui.text.contains("Lỗi: Unauthorized")
     AND ui.text.containsFriendlyVietnameseLoginPrompt()
     AND ui.hasLinkTo("/sign-in")

  // Nếu có thể phát hiện isSignedIn === false trước fetch
  IF input.session.isSignedIn = false AND input.session.isLoaded = true THEN
     ASSERT result.fetchCallCount = 0
  END IF
END FOR
```

### Preservation Checking

**Goal**: Verify rằng với mọi input ngoài bug domain, `useSSEChat'` / `useAISSEChat'` cho kết quả giống hệt phiên bản gốc — cùng chuỗi nội dung stream, cùng thông báo lỗi cho status khác 401, cùng exception handling, cùng headers, cùng chữ ký hook.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT runAIRequest_original(input) ≡ runAIRequest_fixed(input)
  // So sánh:
  //   - messages[] cuối cùng (content, role)
  //   - số lần fetch + args (url, body, headers)
  //   - giá trị isStreaming trong suốt quá trình
END FOR
```

**Testing Approach**: Property-based testing (fast-check) được khuyến nghị cho preservation checking vì:
- Sinh nhiều trường hợp tự động trên toàn miền input (status code, kích thước chunk, nội dung error body, headers).
- Bắt edge case mà unit test thủ công dễ bỏ sót (ví dụ status 401 với body lạ, hoặc stream chứa content đặc biệt).
- Cung cấp đảm bảo mạnh rằng hành vi không đổi cho mọi input ngoài `C(X)`.

**Test Plan**: Quan sát hành vi của unfixed code cho các nhánh không-401 trước, ghi nhận baseline (test vá chạy trên unfixed PASS); sau fix, chạy lại test, expect tất cả vẫn PASS (không regression).

**Test Cases**:
1. **Signed-in streaming preservation**: với `isSignedIn: true`, mock `fetch` trả 200 + stream chunks ngẫu nhiên (1-50 chunks) → assert `messages[-1].content` = concat tất cả chunks (đúng như trước). (Validates 3.1, 3.7)
2. **Non-401 error preservation (PBT)**: sinh ngẫu nhiên `status ∈ {400, 429, 500, 502, 503}` và `err.error` ngẫu nhiên → assert `messages[-1].content === `Lỗi: ${err.error || 'Không thể kết nối AI'}`` giống code gốc. (Validates 3.2, 3.3, 3.5)
3. **Fetch exception preservation**: mock `fetch` throw → assert không set message lỗi mới (hoặc giữ nguyên hành vi hiện tại đối với nhánh catch — chỉ log console, không đổi content). (Validates 3.3)
4. **Missing API key in-stream message preservation**: mock server trả 200 và stream chứa chunk "Hệ thống chưa cấu hình API key..." → assert content được ghép nguyên văn. (Validates 3.4)
5. **Server 401 contract preservation**: chạy lại `artifacts/api-server/src/routes/mysticism/ai-interpret-auth.test.ts` và `sse-preservation.test.ts` — expect PASS không đổi. (Validates 3.6)
6. **Hook signature preservation**: compile-time + runtime assertion rằng `useSSEChat` return object có đúng 4 key `messages`, `streamResponse`, `isStreaming`, `setMessages` với kiểu cũ. (Validates 3.8)
7. **Headers preservation (PBT)**: sinh ngẫu nhiên `sseHeaders` hợp lệ → assert `fetch` được gọi với đúng headers như trước (provider, apiKey khi provider != "server", model). (Validates 3.7)

### Unit Tests

- **401 branch** trong `useSSEChat`: verify message cuối = `UNAUTHENTICATED_AI_MESSAGE`, không còn `"Lỗi: Unauthorized"`, có link `/sign-in`.
- **Non-401 branches**: verify mỗi status (400/429/5xx) vẫn sinh `"Lỗi: ${err.error}"` như trước.
- **Clerk short-circuit** trong `useAISSEChat`: verify khi `isSignedIn === false && isLoaded === true`, `fetch` không được gọi và `messages` chứa `UNAUTHENTICATED_AI_MESSAGE`.
- **Clerk loading/absent**: verify khi `isLoaded === false` hoặc `isClerkEnabled === false`, `streamResponse` gọi thẳng vào `useSSEChat` như cũ.
- **UNAUTHENTICATED_AI_MESSAGE content**: unit test khẳng định chuỗi tiếng Việt, chứa `[đăng nhập](/sign-in)` hoặc `](/sign-in)` để `MarkdownRenderer` render đúng.

### Property-Based Tests

- **Preservation property (PBT)**: generator sinh `{ status, errorBody, streamChunks, headers }` cho `status ≠ 401` và `isSignedIn = true` → assert kết quả fixed = kết quả original (so sánh deep-equal `messages` + `fetch` call list). Validates 3.1–3.5, 3.7.
- **Fix property (PBT)**: generator sinh `{ session, page ∈ 7 trang, action }` thỏa `isBugCondition` (bao gồm cả nhánh `isSignedIn=false` và nhánh server trả 401 với `errorBody` ngẫu nhiên) → assert `messages[-1].content` chứa cụm "đăng nhập" và `/sign-in`, không chứa `"Lỗi: Unauthorized"`. Validates 2.1–2.4.
- **Early short-circuit property**: với mọi combination `(isLoaded, isSignedIn, isClerkEnabled)`, verify `fetch` được gọi khi và chỉ khi không thuộc nhánh short-circuit `isClerkEnabled && isLoaded && !isSignedIn`. Validates 2.5.

### Integration Tests

- **Per-page smoke test**: với mỗi trang trong 7 trang AI, render trang trong test harness (Clerk mock `isSignedIn=false`), thực thi thao tác dẫn tới `handleAskAI`/`streamResponse`, assert DOM chứa chuỗi "đăng nhập" + link tới `/sign-in` và KHÔNG chứa `"Lỗi: Unauthorized"`.
- **Sign-in CTA click**: từ DOM của AIPanel, bấm link "Đăng nhập" → assert router chuyển sang `/sign-in` (hoặc `${basePath}/sign-in` theo `import.meta.env.BASE_URL`) — nhất quán với `sign-in.tsx`.
- **After sign-in flow**: mock chuyển từ `isSignedIn=false` sang `isSignedIn=true` → bấm lại nút AI → assert stream thành công, không còn thông điệp "đăng nhập". (Validates 2.4 + 3.1)
- **Server 401 regression**: chạy suite tồn tại `ai-interpret-auth.test.ts` + `sse-preservation.test.ts` trong CI — expect PASS không đổi. (Validates 3.6)
