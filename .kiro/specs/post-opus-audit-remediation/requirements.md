# Requirements Document

## Introduction

Spec này **không phải là feature mới**. Đây là **remediation spec** cho 10 findings mà adversarial re-audit phát hiện sau khi Opus 4.6 đã hoàn tất 8 tasks hardening (Task 0–8, ghi chép tại `AUDIT_PLAN_PROGRESS.md`). Các findings đã lọt qua pass trước vì scope của 8 tasks đó tập trung vào XSS, admin auth, chat ownership, CORS, rate-limit core, input size, SSE parser, và health endpoint — nhưng bỏ sót các lỗ hổng ở **rìa** của cùng những khu vực đó (ví dụ: `/api/mysticism/ai-interpret` không được gate theo Clerk, dù chat đã được; compose file không set `TRUST_PROXY` nên rate-limit hardening của Task 5 collapse trong môi trường thật).

Mục tiêu spec: vá 10 findings còn sót lại mà **không đụng đến** logic đã làm tốt ở Task 1/4/5/7 (markdown renderer, CORS middleware, rate-limit core algorithm, SSE parser). Mỗi requirement dưới đây ánh xạ 1:1 với một finding ID (C1/C2/H1/H2/H3/M1/M2/M3/L). Thứ tự trình bày phản ánh priority CRITICAL → HIGH → MEDIUM → LOW.

Tham chiếu:
- Repo: `huyen-bi` (pnpm monorepo, React 19 + Express 5 + PostgreSQL + Clerk).
- Audit history: `AUDIT_PLAN_PROGRESS.md` (Task 0–8 đã completed).
- Re-audit findings: 10 items (2 CRITICAL, 3 HIGH, 3 MEDIUM, 2 LOW sau khi gom L6 vào H1).

## Glossary

- **TRUST_PROXY**: Env var truyền vào `app.set("trust proxy", ...)` của Express để `req.ip` phản ánh IP client thật từ header `X-Forwarded-For` khi API chạy sau reverse proxy (ví dụ: nginx). Nếu không set đúng trong môi trường containerized, `req.ip` trả về IP của container proxy (cùng Docker bridge network) → mọi request collapse về 1 bucket trong rate limiter.
- **CSP (Content-Security-Policy)**: HTTP response header giới hạn nguồn script/style/connect mà browser được phép load, giảm blast radius của XSS.
- **HSTS (HTTP Strict Transport Security)**: HTTP response header buộc browser chỉ dùng HTTPS cho domain đó trong khoảng `max-age`, ngăn downgrade attack.
- **helmet**: Express middleware đóng gói set security headers chuẩn (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, v.v.).
- **window.opener**: Reference từ popup mở bằng `window.open(...)` quay lại window cha. Nếu popup ở tab/origin khác mà không set `noopener`, popup có thể điều hướng tab cha (`window.opener.location = ...`) → phishing vector.
- **Clerk admin claim**: `user.publicMetadata.role === "admin"` — cơ chế admin authorization đã được Task 2 thiết lập.
- **System**: Backend API server (`artifacts/api-server`) trừ khi ngữ cảnh chỉ rõ frontend.
- **Web_Client**: Frontend mysticism web (`artifacts/mysticism-web`).
- **AI_Interpret_Endpoint**: `POST /api/mysticism/ai-interpret`.
- **Conversation_Message_Endpoint**: `POST /api/openai/conversations/:id/messages`.
- **Share_Endpoint**: `POST /api/readings/:id/share`.
- **Public_Config_Endpoint**: `GET /api/config/public`.
- **Finding ID**: Định danh finding trong re-audit (C1, C2, H1, H2, H3, M1, M2, M3, L3, L7). C = CRITICAL, H = HIGH, M = MEDIUM, L = LOW.

## Requirements

---

### Requirement 1 — [CRITICAL / C1] Yêu cầu xác thực Clerk cho AI_Interpret_Endpoint

**Finding ID:** C1
**Severity:** CRITICAL
**File:** `artifacts/api-server/src/routes/mysticism/index.ts`

**User Story:** Là operator hệ thống, tôi muốn `POST /api/mysticism/ai-interpret` bắt buộc phải có authenticated Clerk user, để anonymous botnet không thể xoay vòng IP rồi đốt cạn AI key hệ thống.

**Background:** Endpoint hiện tại chỉ bị rate-limit theo IP (bucket `ai-interpret`), không có `requireClerkUser`. Attacker có pool IP (residential proxy, Tor, botnet) có thể gọi endpoint này unlimited, tiêu tốn quota OpenAI/Gemini của tài khoản hệ thống. Đây là lỗ hổng rõ ràng hơn `/api/openai/conversations/*` (đã được Task 3 gate theo Clerk).

#### Acceptance Criteria

1. WHEN một request đến `AI_Interpret_Endpoint` không kèm Clerk session (không có cookie `__session` hợp lệ hoặc `Authorization: Bearer <jwt>`), THE System SHALL trả HTTP 401 với body JSON dạng `{ error: "Unauthorized" }` và KHÔNG gọi đến provider AI (OpenAI/Gemini).
2. WHEN một request đến `AI_Interpret_Endpoint` kèm Clerk session hợp lệ, THE System SHALL tiếp tục xử lý logic interpret (bao gồm rate-limit theo user/IP hiện hành) và stream response như hành vi trước hardening.
3. THE System SHALL áp dụng `requireClerkUser` middleware (đã có tại `artifacts/api-server/src/lib/clerk-user.ts`) giống pattern mount trong `artifacts/api-server/src/routes/openai/index.ts`, KHÔNG tạo middleware mới.
4. THE System SHALL giữ nguyên logic rate-limit bucket `ai-interpret` hiện tại của Task 5 (không refactor rate-limit core).
5. IF Clerk chưa được cấu hình (biến `CLERK_SECRET_KEY` vắng), THEN THE System SHALL trả 401 cho mọi request tới `AI_Interpret_Endpoint` (fail-closed) — giống behavior hiện có của `requireClerkUser` trong `clerk-user.test.ts`.
6. WHEN tests chạy `pnpm --filter @workspace/api-server run test:mysticism-auth` (script mới), THE System SHALL pass regression test bao gồm:
   - Case 1: request không Clerk session → 401 và không gọi provider.
   - Case 2: request có Clerk session mock → route handler nhận `req.userId`.
   - Case 3: rate-limit vẫn được áp dụng sau khi user đã authenticated.

---

### Requirement 2 — [CRITICAL / C2] Wire TRUST_PROXY trong Docker Compose

**Finding ID:** C2
**Severity:** CRITICAL
**Files:**
- `docker-compose.yml` (service `api`)
- `DEPLOY.md`
- `README.md`
- `.env.example`

**User Story:** Là operator triển khai qua `docker compose up`, tôi muốn rate limiter của Task 5 hoạt động đúng ngay sau `up` mặc định, để mỗi IP client có bucket riêng thay vì toàn bộ traffic bị gom vào 1 bucket theo IP của nginx container.

**Background:** Task 5 đã harden rate-limit core (`getClientIP` đọc `req.ip`, bắt buộc opt-in `TRUST_PROXY`). Nhưng trong `docker-compose.yml` hiện tại, service `api` ngồi sau `nginx` container trong cùng Docker bridge network và **không** set env `TRUST_PROXY`. Express mặc định không trust proxy → `req.ip` = IP của nginx container (một IP duy nhất) → rate limit `20/h × 100/d` áp cho toàn bộ user hệ thống collapse vào 1 bucket → DoS cho chính user thật hoặc bypass khi attacker biết limit chung.

#### Acceptance Criteria

1. THE `docker-compose.yml` SHALL set env `TRUST_PROXY` cho service `api` với giá trị phù hợp với topology "nginx container → api container cùng bridge network" (ví dụ: `TRUST_PROXY=loopback,linklocal,uniquelocal` hoặc số hop `1`, chọn giá trị nào làm `req.ip` reflect `X-Forwarded-For` do nginx forward).
2. WHEN hai máy client có public IP khác nhau cùng gọi API qua `docker compose up` mặc định, THE System SHALL ghi vào bảng `rate_limits` hai row với `ip` khác nhau (kiểm chứng được bằng query `SELECT DISTINCT ip FROM rate_limits WHERE ...`).
3. THE nginx config (nếu phải chỉnh) SHALL forward `X-Forwarded-For` và `X-Real-IP` chính xác (append IP client, không ghi đè).
4. THE `DEPLOY.md` SHALL document:
   - Tại sao compose mặc định cần `TRUST_PROXY` (link lại behavior của Express "behind proxies").
   - Cách override cho topology khác (direct-exposed, CDN như Cloudflare, multi-hop).
   - Cảnh báo: set sai `TRUST_PROXY` (ví dụ `true` khi không có proxy) sẽ tái kích hoạt spoofing bypass.
5. THE `README.md` SHALL có dòng nhắc `TRUST_PROXY` trong section "Deployment / Docker" với link tới `DEPLOY.md`.
6. THE `.env.example` SHALL có `TRUST_PROXY` với comment giải thích giá trị mặc định cho compose (đã có từ Task 5 — requirement này chỉ verify nó nhất quán với giá trị set trong compose).
7. IF `TRUST_PROXY` bị unset trong compose override, THEN THE System SHALL log cảnh báo ở startup (best-effort, không fail-fast) để operator biết rate-limit có thể bị collapse.

---

### Requirement 3 — [HIGH / H1] Loại bỏ XSS latent và window.opener gap trong handlePrint

**Finding ID:** H1 (gộp L6)
**Severity:** HIGH
**File:** `artifacts/mysticism-web/src/components/result-actions.tsx`

**User Story:** Là end-user click nút "In kết quả" trên trang reading, tôi muốn cửa sổ in không render bất kỳ HTML nào từ input người dùng và không để lại `window.opener` reference tới tab cha, để attacker không thể inject script hoặc phishing-navigate tab chính.

**Background:** `handlePrint` dùng `document.write` và template string `${title}`, `${moduleName}` interpolate trực tiếp. Nếu title reading chứa `<img src=x onerror=alert(1)>`, nó sẽ render thành HTML trong print window. Thêm vào đó `window.open("", "_blank")` không set `noopener,noreferrer` → popup có `window.opener` trỏ về tab cha → phishing/tabnabbing vector (finding L6 được gộp vào đây vì cùng function).

#### Acceptance Criteria

1. WHEN user-controllable variables (ví dụ `title`, `moduleName`, `result`) được render vào print window, THE Web_Client SHALL escape chúng (hoặc assign qua `textContent` / `createElement` thay vì string concatenation vào `document.write`) sao cho mọi ký tự `<`, `>`, `&`, `"`, `'` thành entity tương ứng.
2. WHEN `handlePrint` mở print window, THE Web_Client SHALL gọi `window.open(url, target, "noopener,noreferrer")` hoặc, nếu cần giữ reference để `.print()`, SHALL set `popup.opener = null` ngay sau khi open.
3. THE Web_Client SHALL KHÔNG dùng `dangerouslySetInnerHTML` hay `innerHTML =` với giá trị chứa biến user-controllable trong print flow.
4. THE Web_Client MAY tách helper escape dùng chung (ví dụ `escapeHtml(str)` trong `src/lib/escape-html.ts`) nếu có nhiều call-site, nhưng KHÔNG bắt buộc — refactor là optional.
5. WHEN regression test `pnpm --filter @workspace/mysticism-web run test:result-actions` (script mới) chạy với payload `title = '<img src=x onerror=alert(1)>'`, THE test SHALL assert rằng output HTML của print window KHÔNG chứa substring `<img src=x onerror=` như tag thật, mà chứa dạng đã escape (ví dụ `&lt;img src=x onerror=`).
6. THE regression test SHALL assert rằng `window.open` được gọi với `"noopener"` trong features string, HOẶC `popup.opener === null` ngay sau khi open.

---

### Requirement 4 — [HIGH / H2] Bổ sung security response headers (helmet + nginx)

**Finding ID:** H2
**Severity:** HIGH
**Files:**
- `artifacts/api-server/src/app.ts`
- `docker/nginx.conf` (hoặc tương đương — path thật sẽ xác định trong Design phase)
- `artifacts/api-server/package.json`

**User Story:** Là operator bảo mật, tôi muốn mọi response từ hệ thống đều kèm set security headers chuẩn (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy), để clickjacking, XSS blast radius, và HSTS downgrade đều có phòng tuyến baseline.

**Background:** `grep helmet` trong repo trả 0 match. Nginx config không `add_header` security nào. Dù Task 1 đã loại XSS ở markdown renderer, một lỗi future nào đó vẫn có thể inject DOM → CSP là lớp phòng thủ thứ hai. HSTS thiếu nghĩa là user lần đầu vào site vẫn có thể bị MITM downgrade về HTTP.

#### Acceptance Criteria

1. THE System SHALL gắn middleware `helmet()` (hoặc equivalent set header ở nginx layer — chọn 1 trong 2, nhất quán) lên Express app trong `app.ts` trước khi mount routes.
2. THE System SHALL set các response header sau trên mọi response của `/api/*`:
   - `Strict-Transport-Security: max-age=15552000; includeSubDomains` (≥ 6 tháng).
   - `X-Frame-Options: DENY`.
   - `X-Content-Type-Options: nosniff`.
   - `Referrer-Policy: strict-origin-when-cross-origin` hoặc `no-referrer`.
   - `Content-Security-Policy` với ít nhất các directive: `default-src 'self'`; `script-src` cho phép Clerk (`https://*.clerk.dev`, `https://*.clerk.accounts.dev`); `connect-src` cho phép Clerk endpoints (`https://frontend-api.clerk.dev`, `https://npm.clerk.dev`) và API origin; `frame-ancestors 'none'`; `object-src 'none'`.
3. WHEN Clerk JS được load từ frontend, THE Web_Client SHALL vẫn boot được (không bị CSP block) và sign-in flow SHALL hoạt động end-to-end.
4. WHEN SSE stream từ `/api/openai/conversations/:id/messages` hoặc `/api/mysticism/ai-interpret` được mở từ browser, THE CSP SHALL không block `EventSource`/`fetch` tới API origin.
5. WHEN integration test `pnpm --filter @workspace/api-server run test:security-headers` (script mới) chạy, THE test SHALL assert response của `GET /api/healthz` chứa các header liệt kê ở tiêu chí 2 với giá trị phù hợp.
6. IF helmet và nginx cùng set cùng một header, THEN THE System SHALL đảm bảo giá trị nhất quán (không conflict) — ưu tiên Express layer nếu trùng.

---

### Requirement 5 — [HIGH / H3] Rate-limit check phải chạy trước khi insert user message

**Finding ID:** H3
**Severity:** HIGH
**File:** `artifacts/api-server/src/routes/openai/index.ts` (handler `POST /api/openai/conversations/:id/messages`)

**User Story:** Là operator DB, tôi muốn `Conversation_Message_Endpoint` không insert row `messages` cho user đã bị rate-limit block, để attacker authenticated không thể spam làm DB phình dù bị block ở provider call.

**Background:** Handler hiện tại `await db.insert(messagesTable)...` chạy TRƯỚC `checkAndLogUsage`. Authenticated user spam loop ≥ rate-limit → provider call bị block, nhưng mỗi iteration vẫn tạo một row `messages` mới. Với rate-limit 20/h, sau 1 giờ spam tối đa, DB có thể có hàng ngàn orphan rows per user.

#### Acceptance Criteria

1. THE System SHALL reorder logic trong `POST /api/openai/conversations/:id/messages` sao cho rate-limit check (khi dùng server key) xảy ra TRƯỚC khi gọi `db.insert(messagesTable, { role: "user", ... })`.
2. IF rate-limit check trả `denied` (quota exceeded), THEN THE System SHALL trả HTTP 429 với body hiện có và SHALL KHÔNG tạo row `messages` mới nào cho request đó.
3. IF rate-limit check trả `allowed` nhưng provider call subsequently fail (network error, provider 5xx), THEN THE System MAY giữ row user message đã insert (không bắt buộc rollback) — vì lỗi tại provider không phải lỗi bypass.
4. IF rate-limit check trả `allowed` và provider call thành công, THE System SHALL insert cả user message và assistant message như hành vi hiện tại.
5. WHEN unit test `pnpm --filter @workspace/api-server run test:message-order` (script mới) chạy với `checkAndLogUsage` mock trả `denied`, THE test SHALL assert:
   - Response status = 429.
   - Số row `messages` với `conversation_id = :id` sau request = số row TRƯỚC request (không tăng).
6. THE System SHALL giữ nguyên logic ownership check `and(id = :id, user_id = :userId)` của Task 3 — không đụng đến ownership verification.

---

### Requirement 6 — [MEDIUM / M1] CSRF defense-in-depth cho state-changing requests

**Finding ID:** M1
**Severity:** MEDIUM
**File:** `artifacts/api-server/src/app.ts`

**User Story:** Là operator bảo mật, tôi muốn hệ thống có một lớp CSRF phòng thủ rõ ràng ngoài `SameSite=Lax` mặc định của Clerk cookie, để form POST cross-origin `application/x-www-form-urlencoded` không lách preflight.

**Background:** Hiện tại CSRF protection dựa ngầm vào:
- Clerk cookie `SameSite=Lax` (chặn request cross-site từ top-level navigation khác).
- CORS allow-list (Task 4) cho browser fetch.

Nhưng `express.urlencoded({ extended: true })` được mount tại app root, nghĩa là request `Content-Type: application/x-www-form-urlencoded` (simple request — không trigger CORS preflight) vẫn reach handler. Nếu attacker host form ngoài allow-list submit qua POST, browser vẫn gửi kèm Clerk cookie (tùy SameSite policy) → CSRF vector.

#### Acceptance Criteria

1. THE System SHALL chọn 1 trong 2 option (Design phase sẽ quyết định):
   - **Option A:** Loại bỏ hoàn toàn `express.urlencoded(...)` ra khỏi `app.ts` nếu audit confirm không route nào đang cần form-urlencoded body.
   - **Option B:** Thêm middleware explicit check `Origin` header cho mọi state-changing request (`POST`, `PATCH`, `PUT`, `DELETE`) trên `/api/*`. Middleware SHALL reject (HTTP 403) nếu `Origin` header vắng hoặc không thuộc CORS allow-list đã có (reuse `isOriginAllowed` từ `lib/cors-config.ts`).
2. IF Option B được chọn, THEN THE middleware SHALL cho phép:
   - Request same-origin (không có `Origin` header) chỉ khi `Referer` header present và match allow-list, HOẶC
   - Request có whitelist path `GET /api/healthz`, `GET /api/config/public` bypass check (read-only, không state-changing).
3. WHEN request `POST /api/readings` với `Content-Type: application/x-www-form-urlencoded` và `Origin: https://attacker.example` (không thuộc allow-list), THE System SHALL reject với HTTP 403 và KHÔNG tạo reading mới.
4. WHEN request `POST /api/readings` từ origin hợp lệ (`https://huyenbi.io.vn`) với `Content-Type: application/json` và Clerk session, THE System SHALL chấp nhận như hành vi hiện tại.
5. WHEN regression test `pnpm --filter @workspace/api-server run test:csrf` (script mới) chạy, THE test SHALL cover cả hai case trên (allowed + denied).
6. THE System SHALL KHÔNG thay đổi logic CORS allow-list đã làm ở Task 4 (không refactor `cors-config.ts`).

---

### Requirement 7 — [MEDIUM / M2] Validate `req.params.id` là số cho readings routes

**Finding ID:** M2
**Severity:** MEDIUM
**File:** `artifacts/api-server/src/routes/readings.ts`

**User Story:** Là operator và API consumer, tôi muốn endpoint readings trả 400 rõ ràng khi `:id` không phải số, thay vì để query chạm tới Postgres và gây 500 generic.

**Background:** Các handler PATCH/DELETE/share trong `readings.ts` truyền thẳng `req.params.id` (string) vào query column `int`. Khi client gửi `GET /api/readings/abc` hoặc `DELETE /api/readings/xyz`, pg ném lỗi parse integer → Express error handler trả 500 generic → leak thông tin + UX xấu. Pattern đã có sẵn trong `routes/openai/index.ts` cho `:id` conversations (validate `Number(id)` + `isNaN`).

#### Acceptance Criteria

1. WHEN request tới `GET /api/readings/:id`, `PATCH /api/readings/:id`, `DELETE /api/readings/:id`, `POST /api/readings/:id/share` với `:id` không parse được thành số nguyên dương (ví dụ `abc`, `12.5`, `-1`, empty string), THE System SHALL trả HTTP 400 với body JSON `{ error: "Invalid reading id" }` và KHÔNG gọi DB.
2. WHEN `:id` là số nguyên dương hợp lệ nhưng không tồn tại row trong bảng `readings`, THE System SHALL trả 404 (giữ hành vi hiện tại sau khi validate).
3. THE System SHALL reuse pattern validate giống `routes/openai/index.ts` (gọi `Number(id)` + kiểm tra `Number.isInteger(...)` và `> 0`), KHÔNG introduce validator library mới chỉ cho việc này.
4. THE validator SHALL được viết thành helper dùng chung (ví dụ `parseReadingId(req.params.id)` trong cùng file hoặc `src/lib/param-validators.ts`) để 4 handler share.
5. WHEN regression test `pnpm --filter @workspace/api-server run test:readings-params` (script mới) chạy, THE test SHALL cover:
   - `GET /api/readings/abc` → 400.
   - `GET /api/readings/-1` → 400.
   - `GET /api/readings/12.5` → 400.
   - `GET /api/readings/99999999` (số valid nhưng không tồn tại) → 404.
   - `DELETE /api/readings/xyz` → 400 và không xóa row nào.

---

### Requirement 8 — [MEDIUM / M3] Giới hạn / dedupe tạo share token cho readings

**Finding ID:** M3
**Severity:** MEDIUM
**File:** `artifacts/api-server/src/routes/readings.ts` (handler `POST /api/readings/:id/share`)

**User Story:** Là operator DB và end-user share reading, tôi muốn việc tạo share token có giới hạn để người dùng (cố ý hay lỗi client) không spam tạo token, làm DB phình và pha loãng entropy token.

**Background:** Handler hiện tại tạo row `share_tokens` mới mỗi lần gọi — không cap theo reading, không cap theo user/giờ, không dedupe token chưa hết hạn. Client bug loop call share 100 lần sẽ tạo 100 row hợp lệ.

#### Acceptance Criteria

1. THE System SHALL implement 1 trong 2 strategy (Design phase quyết định):
   - **Strategy A (Dedupe):** WHEN `POST /api/readings/:id/share` được gọi và đã tồn tại share token CHƯA hết hạn cho cùng `(reading_id, user_id)`, THE System SHALL trả lại token cũ đó thay vì tạo mới.
   - **Strategy B (Cap):** THE System SHALL giới hạn tối đa 5 active (chưa hết hạn) share token per `(reading_id, user_id)`, VÀ tối đa 20 share token được tạo per user per giờ.
2. IF Strategy B được chọn và request vượt cap, THEN THE System SHALL trả HTTP 429 với body `{ error: "Too many share tokens", retry_after: <seconds> }` và KHÔNG tạo token mới.
3. IF Strategy A được chọn, THEN response SHALL có shape giống request tạo mới (`{ token, url, expires_at }`), client KHÔNG phân biệt được là token cũ hay mới.
4. THE System SHALL reuse user ownership check của Task 3 (`reading.user_id === req.userId`) — chỉ owner mới share được.
5. THE cap/dedupe logic SHALL chạy TRONG transaction với advisory lock theo `reading_id` để tránh race (hai request đồng thời cùng tạo 2 token) — reuse pattern `pg_advisory_xact_lock` đã có ở `rate-limit.ts`.
6. WHEN regression test `pnpm --filter @workspace/api-server run test:share-cap` (script mới) chạy, THE test SHALL cover:
   - Gọi share 10 lần liên tiếp cho cùng reading → số row active không vượt 5 (Strategy B) HOẶC chỉ có 1 row duy nhất (Strategy A).
   - Gọi share cho reading không thuộc user → 403/404 (giữ hành vi hiện tại).
7. THE System SHALL KHÔNG đụng đến schema `share_tokens` hiện tại trừ khi Strategy B cần thêm index `(reading_id, user_id, expires_at)` — nếu có, migration phải idempotent (`CREATE INDEX IF NOT EXISTS`).

---

### Requirement 9 — [LOW / L3 + L7] Thu hẹp public config leak và mở rộng pino redact list

**Finding ID:** L3, L7 (gom thành 1 requirement)
**Severity:** LOW
**Files:**
- `artifacts/api-server/src/routes/config/index.ts` (`GET /api/config/public`)
- `artifacts/api-server/src/lib/logger.ts`

**User Story:** Là operator bảo mật, tôi muốn anonymous attacker không thể đoán được admin đã được cấu hình hay chưa từ `/api/config/public`, và muốn log file không vô tình chứa các secret header mà pino redact list hiện chưa cover.

**Background (L3):** `Public_Config_Endpoint` hiện tại trả field `adminConfigured: true|false` cho anonymous. Attacker dùng field này để biết deployment đã bị claim chưa → nếu `false`, trigger reconnaissance trước khi Task 2's Clerk admin bảo vệ được engage (edge case race với cold boot).

**Background (L7):** Pino logger redact list hiện tại (Task 6/8 đã thiết lập) thiếu `x-ai-key`, `x-clerk-secret-key`, `clerk-proxy-url` — các header này có thể xuất hiện trong log request nếu client vô tình gửi hoặc middleware forward.

#### Acceptance Criteria

**Phần L3 — Public config:**

1. THE System SHALL bỏ field `adminConfigured` ra khỏi response `GET /api/config/public` cho request KHÔNG authenticated, HOẶC SHALL chỉ trả field này khi request có Clerk admin claim.
2. WHEN request đến `/api/config/public` không kèm Clerk session, THE System SHALL trả JSON không chứa key `adminConfigured` (hoặc chứa với giá trị `null`/bị omit — miễn không phải `true|false` dương/âm leak).
3. WHEN request đến `/api/config/public` có Clerk admin claim hợp lệ, THE System MAY trả `adminConfigured` với giá trị thật (hành vi hiện tại).
4. THE response schema SHALL được update trong `lib/api-spec/openapi.yaml` để client TypeScript type không break.

**Phần L7 — Pino redact:**

5. THE System SHALL mở rộng `redact.paths` của pino logger trong `lib/logger.ts` để bao gồm ít nhất:
   - `req.headers["x-ai-key"]`
   - `req.headers["x-clerk-secret-key"]`
   - `req.headers["clerk-proxy-url"]`
   - Và giữ nguyên các entry đã có (`authorization`, `cookie`, `x-clerk-auth-token`, v.v.).
6. THE redact SHALL dùng path matching case-insensitive (pino hỗ trợ — verify trong design).
7. WHEN regression test `pnpm --filter @workspace/api-server run test:logger-redact` (script mới) chạy, THE test SHALL assert:
   - Log một request với header `x-ai-key: secret-value` → output log KHÔNG chứa substring `secret-value`, chứa `[Redacted]` hoặc tương đương.
   - Lặp cho `x-clerk-secret-key` và `clerk-proxy-url`.
8. WHEN regression test `pnpm --filter @workspace/api-server run test:public-config` (script mới) chạy, THE test SHALL assert:
   - Anonymous `GET /api/config/public` → response JSON không có key `adminConfigured`.
   - Admin `GET /api/config/public` → response JSON có key `adminConfigured`.

---

## Non-Goals

Spec này **CÓ CHỦ Ý KHÔNG** làm các việc sau, vì Task 0–8 đã hoàn tất hoặc không nằm trong scope re-audit:

1. **KHÔNG refactor rate-limit core algorithm** (`artifacts/api-server/src/lib/rate-limit.ts`). Task 5 đã harden `getClientIP`, atomic accounting qua `pg_advisory_xact_lock`. Spec này chỉ wire env `TRUST_PROXY` ở compose layer (C2), không đụng algorithm.
2. **KHÔNG refactor SSE parser** (`artifacts/mysticism-web/src/lib/sse-stream.ts`). Task 7 đã implement shared rolling-buffer parser. Spec này không đụng.
3. **KHÔNG refactor CORS middleware** (`artifacts/api-server/src/lib/cors-config.ts`). Task 4 đã fix. M1 có thể reuse helper `isOriginAllowed` nhưng không sửa nó.
4. **KHÔNG refactor markdown renderer** (`artifacts/mysticism-web/src/components/ui/markdown-renderer.tsx`). Task 1 đã loại `dangerouslySetInnerHTML`. H1 chỉ fix `handlePrint` trong `result-actions.tsx`.
5. **KHÔNG đổi schema `conversations` / `messages` / `readings` / `rate_limits`**. M3 có thể thêm index `share_tokens` nhưng chỉ idempotent, không migration phá backward compat.
6. **KHÔNG đổi admin authorization strategy**. Task 2 đã dùng `publicMetadata.role === "admin"`. Spec này reuse nguyên (L3 check admin để quyết trả `adminConfigured`).
7. **KHÔNG thay Clerk bằng auth provider khác**. Tất cả requirement tiếp tục dựa trên Clerk session & claim.
8. **KHÔNG implement property-based testing framework mới**. Regression tests dùng Vitest + express + node supertest patterns đã có từ Task 0–8.
9. **KHÔNG deploy, tune performance, hoặc gather production metrics** như một phần spec. Đây là static hardening; verification qua automated tests + manual check cục bộ là đủ.
10. **KHÔNG rewrite các endpoint không bị flag trong 10 findings**. Ví dụ: `/api/openai/conversations` list/get/delete đã OK ở Task 3 — không chạm.

---

**Spec này đã được prepared cho review.** Sau khi user review xong và confirm (hoặc yêu cầu chỉnh sửa) requirements này, sẽ chuyển sang Phase 2: Design.
