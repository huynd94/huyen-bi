# Requirements Document

## Introduction

Spec này định nghĩa yêu cầu cho một **đợt audit UX/UI frontend** của dự án Huyền Bí. Mục tiêu là **đánh giá hiện trạng** (assessment-only) trên 4 trục: **hiệu ứng** (animations, transitions, micro-interactions), **bố cục** (layout, spacing, hierarchy, responsive), **cách hiển thị các module**, và **tương tác UX/UI tổng thể** (accessibility, feedback, loading/error/empty states, navigation, form patterns).

Spec này KHÔNG triển khai cải thiện. Mọi đề xuất sửa đổi sẽ được ghi vào báo cáo audit dưới dạng finding kèm khuyến nghị, ưu tiên, và evidence — để các spec triển khai sau (ví dụ `ux-ui-upgrade`, hoặc spec mới phát sinh từ audit) sử dụng làm đầu vào.

Phạm vi audit:
- **Frontend chính:** `artifacts/mysticism-web` (React 19 + Tailwind + shadcn/ui + Framer Motion). Bao gồm 15 trang module huyền học, `ai-chat`, `profile`, `lich-su`, `sign-in`, `sign-up`, `share-view`, layout (navbar, mobile-drawer, footer, breadcrumb, offline-banner), shared components (`ambient-bg`, `tilt-card`, `mystic-cursor`, `result-card`, `result-actions`, `save-reading-btn`, `pwa-install-prompt`, `knowledge-base`, `data-table`, `markdown-renderer`, `export-card-*`).
- **Sandbox:** `artifacts/mockup-sandbox` (React preview server cho mockup components, dùng shadcn/ui primitives) — audit chỉ ở mức quy ước (convention), không sâu như `mysticism-web` vì đây là dev tool, không phải production surface.
- **Loại trừ:** `artifacts/api-server` (backend, không có UI), node_modules, dist, generated files (`.generated/`), test files (`*.test.ts`, `*.property.test.tsx`).

Mối quan hệ với spec đã có:
- `ux-ui-upgrade` đã định nghĩa **target state** (design system, WCAG 2.1 AA, theme parity, motion guidelines, brand identity). Audit này dùng nó làm **rubric tham chiếu**: gap giữa current state và target state là một loại finding.
- `post-opus-audit-remediation` là spec security-focused, không phải UX/UI — không trùng phạm vi.

## Glossary

- **Audit_Report**: Tài liệu Markdown duy nhất tóm tắt kết quả audit, đặt tại `.kiro/specs/frontend-ux-ui-audit/audit-report.md` (sẽ được tạo trong giai đoạn implementation tasks). Chứa Executive Summary, Methodology, Findings, Recommendations, Appendices.
- **Finding**: Một quan sát có vấn đề (problem) hoặc cơ hội cải thiện (opportunity), kèm severity, evidence, recommendation. Mỗi Finding là một mục có ID dạng `F-{nhóm}-{số}` (ví dụ `F-ANIM-01`, `F-LAYOUT-03`).
- **Audit_Axis**: Một trong 4 trục đánh giá: `ANIM` (hiệu ứng), `LAYOUT` (bố cục), `MODULE` (hiển thị module), `INTERACTION` (tương tác UX/UI).
- **Severity**: Mức độ ưu tiên của Finding, gồm 3 bậc:
  - **P0 (Blocker):** Phá vỡ chức năng cốt lõi, vi phạm WCAG 2.1 AA bắt buộc, hoặc gây mất dữ liệu / hiểu nhầm nghiêm trọng cho người dùng. Phải fix trước khi release tiếp theo.
  - **P1 (Major):** Giảm rõ rệt UX hoặc khả năng sử dụng nhưng có workaround. Nên fix trong sprint kế tiếp.
  - **P2 (Minor):** Cải thiện chất lượng, polish, hoặc consistency. Có thể đưa vào backlog.
- **Audit_Surface**: Một đơn vị UI cụ thể được audit. Bao gồm: 15 Module_Page, các trang phụ trợ (`home`, `ai-chat`, `profile`, `lich-su`, `sign-in`, `sign-up`, `share-view`, `not-found`), shared components, và preview server `mockup-sandbox`.
- **Module_Page**: 15 trang module huyền học trong `artifacts/mysticism-web/src/pages/` (`than-so-hoc`, `bat-tu`, `xem-que`, `cat-hung`, `lich-van-nien`, `tu-vi`, `phong-thuy`, `xem-ten`, `lich-ca-nhan`, `tu-dien`, `hop-tuoi`, `xem-ngay-tot`, `sao-han`).
- **Heuristic_Set**: Tập hợp tiêu chí đánh giá được dùng làm rubric:
  1. **Nielsen 10 heuristics** cho usability tổng thể.
  2. **WCAG 2.1 Level AA** cho accessibility (target ngầm: AAA cho contrast nếu khả thi).
  3. **Core Web Vitals** (LCP, INP, CLS) cho perceived performance.
  4. **Design system consistency** đối chiếu với target trong spec `ux-ui-upgrade` (tokens, type scale, spacing scale, radius scale).
  5. **Motion principles** (Material Design Motion, Framer Motion best practices) cho hiệu ứng.
- **Tooling_Set**: Tập công cụ định lượng được dùng trong audit, gồm: Lighthouse (Performance, Accessibility, Best Practices, SEO), axe-core hoặc `@axe-core/playwright` (a11y violations), Chrome DevTools (Performance panel, Rendering tab, Coverage), `prefers-reduced-motion` simulation, manual keyboard / screen reader spot-check.
- **Evidence**: Bằng chứng đính kèm cho một Finding, gồm tối thiểu một trong các loại: file path + line number, screenshot (PNG trong `audit-evidence/`), Lighthouse JSON output snippet, axe violation JSON snippet, browser console log, hoặc reproduction steps.
- **Recommendation**: Đề xuất cải thiện cho một Finding, viết theo format "WHAT to change, WHY it improves UX, WHERE to apply (file/component)". Phải actionable nhưng không cần kèm code mẫu.
- **Audit_Backlog**: Danh sách Finding đã phân loại P0/P1/P2 ở cuối Audit_Report, dùng làm input cho spec triển khai sau.
- **Auditor**: Vai trò người (hoặc agent) thực hiện audit theo spec này. Trong context AI-assisted, Auditor có thể là Kiro agent dùng `frontend-ui-engineering` skill + manual tooling.

## Requirements

---

### Requirement 1: Phạm vi audit phải rõ ràng và đầy đủ

**User Story:** Là người ra quyết định về backlog UX, tôi muốn biết chính xác audit này đã cover những surface nào và bỏ qua surface nào, để tôi không phải đoán hoặc trả tiền cho audit thứ hai bù chỗ thiếu.

#### Acceptance Criteria

1. THE Audit_Report SHALL liệt kê tất cả Audit_Surface đã được audit dưới dạng bảng, mỗi hàng gồm: tên surface, đường dẫn file (relative tới repo root), trạng thái audit (`Audited` / `Skipped`), và lý do nếu `Skipped`.
2. THE Audit_Report SHALL bao gồm trong phạm vi tối thiểu: 15 Module_Page, trang `home`, `ai-chat`, `profile`, `lich-su`, `sign-in`, `sign-up`, `share-view`, `not-found`, navbar, mobile-drawer, footer, breadcrumb, offline-banner, `result-card`, `result-actions`, `ambient-bg`, `tilt-card`, `mystic-cursor`, `pwa-install-prompt`, `data-table`, `knowledge-base`, `markdown-renderer` (component), và 4 `export-card-*` components.
3. THE Audit_Report SHALL bao gồm `mockup-sandbox` ở mức convention review (audit gallery rendering, preview shell, không cần audit từng mockup component bên trong vì đây là user-generated content).
4. THE Audit_Report SHALL nêu rõ các loại trừ: `node_modules`, `dist`, `*.test.ts`, `*.property.test.tsx`, file `.generated/`, file `__clerk-mock-*`, và backend `api-server`.
5. WHERE một surface có nhiều state (loading, empty, error, success), THE Audit_Report SHALL audit tất cả state đó hoặc ghi rõ state nào không kiểm tra được kèm lý do (ví dụ: cần backend running, không reproduce được locally).
6. THE Audit_Report SHALL có một section `Unaudited States` ngay sau bảng surface ở Requirement 1.1, kể cả khi mọi state đã được audit (trường hợp này section ghi "Tất cả state đã được audit"). Khi state có thể reproduce locally và đã audit thành công, KHÔNG bắt buộc liệt kê chi tiết — chỉ cần khẳng định coverage.

---

### Requirement 2: Mỗi Finding phải có đủ trường bắt buộc

**User Story:** Là kỹ sư nhận finding để fix, tôi muốn mỗi finding có đủ thông tin để tôi tái hiện vấn đề và biết phải sửa ở đâu, để tôi không phải quay lại hỏi auditor.

#### Acceptance Criteria

1. THE Audit_Report SHALL đảm bảo mỗi Finding có đầy đủ các trường: `id`, `title`, `axis` (1 trong 4 Audit_Axis), `severity` (P0/P1/P2), `surface` (tên Audit_Surface), `description`, `evidence`, `recommendation`, `references` (link tới heuristic / WCAG criterion / spec liên quan).
2. THE Auditor SHALL gán `id` cho mỗi Finding theo format `F-{AXIS}-{số 2 chữ số tăng dần}`, với `AXIS` ∈ {`ANIM`, `LAYOUT`, `MODULE`, `INTERACTION`}; ví dụ `F-ANIM-01`, `F-LAYOUT-12`.
3. WHEN một Finding ánh xạ tới một WCAG 2.1 success criterion cụ thể, THE Auditor SHALL ghi `references` ở dạng `WCAG 2.1 SC X.Y.Z (Level A/AA)`; ví dụ `WCAG 2.1 SC 2.4.7 (Level AA)`.
4. WHEN một Finding ánh xạ tới một Nielsen heuristic, THE Auditor SHALL ghi `references` ở dạng `Nielsen #N: <tên heuristic>`; ví dụ `Nielsen #4: Consistency and standards`.
5. WHEN một Finding ánh xạ tới một requirement đã có trong spec `ux-ui-upgrade`, THE Auditor SHALL ghi `references` ở dạng `ux-ui-upgrade Req X.Y`; ví dụ `ux-ui-upgrade Req 3.2`.
6. THE Audit_Report SHALL đảm bảo trường `evidence` của mỗi Finding chứa tối thiểu một trong các loại: `file:line` (đường dẫn file kèm số dòng), screenshot path (relative tới `.kiro/specs/frontend-ux-ui-audit/audit-evidence/`), tooling output snippet (Lighthouse / axe JSON), hoặc reproduction steps đánh số ≥ 3 bước.
7. THE Audit_Report SHALL đảm bảo trường `recommendation` của mỗi Finding nêu rõ: WHAT (thay đổi gì), WHY (cải thiện UX ở điểm nào), WHERE (file hoặc component cụ thể), và KHÔNG bắt buộc kèm code patch.
8. IF một Finding không có evidence khả thi (ví dụ: vấn đề lý thuyết, đề xuất polish), THEN THE Auditor SHALL gán severity dựa trên mức độ nghiêm trọng của vấn đề bất chấp việc thiếu evidence: vấn đề lý thuyết quan trọng (ví dụ vi phạm WCAG bắt buộc, layout breakage giả định) vẫn được phép P0/P1 nếu reasoning rõ ràng; quan sát chủ quan / polish gán P2. Trong mọi trường hợp, `description` SHALL ghi rõ đây là quan sát không có evidence cụ thể và lý do severity được chọn.

---

### Requirement 3: Audit phải bao quát cả 4 trục bắt buộc

**User Story:** Là chủ sản phẩm yêu cầu audit theo 4 mảng cụ thể (hiệu ứng, bố cục, hiển thị module, tương tác), tôi muốn báo cáo có findings ở mọi trục, để tôi không bị bỏ sót khía cạnh.

#### Acceptance Criteria

1. THE Audit_Report SHALL có findings ở tất cả 4 Audit_Axis: `ANIM`, `LAYOUT`, `MODULE`, `INTERACTION`. Mỗi trục có tối thiểu 1 finding (kể cả ở mức P2 "không phát hiện vấn đề nghiêm trọng" — nếu thực sự không có, vẫn ghi 1 finding `INFO` xác nhận đã kiểm tra).
2. THE Audit_Axis `ANIM` SHALL bao gồm đánh giá tối thiểu các điểm sau: thời lượng transition (so với khoảng [120ms, 800ms] khuyến nghị), easing function, hành vi `prefers-reduced-motion`, hiệu ứng tilt-card và ambient-bg orbs, scroll-reveal, AI streaming typing indicator, mystic-cursor.
3. THE Audit_Axis `LAYOUT` SHALL bao gồm đánh giá tối thiểu các điểm sau: spacing scale consistency, type scale hierarchy (h1/h2/h3/body), responsive behavior tại 4 breakpoint (320px / 768px / 1024px / 1440px), grid alignment, vertical rhythm, container max-width và prose width, footer placement.
4. THE Audit_Axis `MODULE` SHALL bao gồm đánh giá cho mỗi trong 15 Module_Page: thứ tự ưu tiên thông tin trong Result_Card (header → key numbers → chart → table → AI interpretation → actions), độ rõ ràng của chart label, độ scan được của bảng dữ liệu, độ dày đặc thông tin (information density), và hiệu lực của empty state khi chưa có dữ liệu input.
5. THE Audit_Axis `INTERACTION` SHALL bao gồm đánh giá tối thiểu: keyboard navigation (Tab order, focus ring visibility, Esc to close), form validation (real-time, on-blur, on-submit), loading / error / empty state coverage, toast feedback, navbar dropdown behavior, mobile drawer behavior, share/export action affordance, theme toggle, accessibility violations từ axe-core.
6. WHERE Audit_Report cho rằng một trục không có vấn đề (zero finding ghi nhận), THE Audit_Report SHALL kèm bằng chứng đã thực sự kiểm tra trục đó (ví dụ: log Lighthouse run, screenshot keyboard navigation, danh sách surface đã quét). Bằng chứng này SHALL được yêu cầu kể cả khi không có Finding nào được ghi — không được để trục trống không bằng chứng.

---

### Requirement 4: Phương pháp audit phải được ghi chép minh bạch

**User Story:** Là kỹ sư review báo cáo audit, tôi muốn biết auditor đã dùng tool gì, chạy trên cấu hình nào, để tôi đánh giá độ tin cậy của findings và tự reproduce nếu cần.

#### Acceptance Criteria

1. THE Audit_Report SHALL có một section `Methodology` đặt ngay sau `Executive Summary`, mô tả: rubric áp dụng (Heuristic_Set), công cụ (Tooling_Set), môi trường thử nghiệm (browser + version, OS, viewport sizes), và quy trình từng bước (manual review trước, tooling sau, hay ngược lại).
2. THE Audit_Report SHALL liệt kê chính xác phiên bản công cụ định lượng đã dùng, ví dụ "Lighthouse 12.x (Chrome DevTools)", "axe-core 4.x", để reproducible.
3. THE Auditor SHALL chạy Lighthouse audit trên tối thiểu các route sau và lưu kết quả tóm tắt (Performance / Accessibility / Best Practices / SEO scores) vào `audit-evidence/lighthouse/`: `/`, `/than-so-hoc`, `/bat-tu`, `/tu-vi`, `/ai-chat`, `/profile`, `/lich-su`, `/sign-in`.
4. THE Auditor SHALL chạy axe-core (hoặc `@axe-core/playwright` / `axe-core/react` / Chrome DevTools Issues panel với axe ruleset) trên cùng tập route ở tiêu chí 3, lưu output JSON tóm tắt số violation theo impact (critical / serious / moderate / minor) vào `audit-evidence/axe/`.
5. THE Auditor SHALL kiểm tra responsive behavior thủ công trên 4 viewport size: 360×800 (mobile), 768×1024 (tablet), 1280×800 (desktop), 1920×1080 (large), lưu screenshot tối thiểu 1 ảnh per route per viewport vào `audit-evidence/responsive/`.
6. THE Auditor SHALL kiểm tra `prefers-reduced-motion: reduce` thủ công trên 3 surface có animation rõ rệt nhất (`home`, một Module_Page có Result_Card animation, `ai-chat`), lưu screenshot và mô tả hành vi vào `audit-evidence/reduced-motion/`.
7. THE Auditor SHALL thực hiện keyboard-only navigation walkthrough cho 3 luồng chính: (a) trang chủ → click vào một Module_Page → submit form → xem kết quả; (b) sign-in flow; (c) `ai-chat` gửi tin nhắn và copy phản hồi. Ghi chép Tab order, focus ring visibility, và mọi trap focus / unreachable element vào `audit-evidence/keyboard/`.
8. WHERE Auditor không thể chạy một công cụ (ví dụ Lighthouse mobile emulation không khả thi local), THE Audit_Report SHALL ghi rõ giới hạn này trong section `Methodology > Limitations` thay vì bỏ qua âm thầm. Section `Limitations` chỉ bắt buộc khi có giới hạn thực tế cần ghi nhận; nếu mọi tool chạy thành công và mọi route được audit đầy đủ, section này CÓ THỂ được lược bỏ.

---

### Requirement 5: Severity phải được phân loại theo tiêu chí khách quan

**User Story:** Là người lập backlog, tôi muốn biết auditor phân P0/P1/P2 theo tiêu chí cụ thể, để tôi không cãi nhau về "cái này có phải P0 không".

#### Acceptance Criteria

1. THE Audit_Report SHALL có một section `Severity Rubric` mô tả tiêu chí khách quan cho mỗi mức P0/P1/P2.
2. THE Auditor SHALL gán `severity = P0` chỉ khi Finding thoả ít nhất một trong các điều kiện: (a) vi phạm WCAG 2.1 Level A hoặc AA bắt buộc (ví dụ thiếu label, contrast < 4.5:1, không keyboard-accessible); (b) gây hiểu nhầm dữ liệu nghiêm trọng (ví dụ chart label sai, severity icon đảo ngược ý nghĩa cát/hung); (c) form không thể submit hoặc data loss khi navigate; (d) layout vỡ ở viewport ≥ 360px gây không sử dụng được.
3. THE Auditor SHALL gán `severity = P1` khi Finding thoả: (a) vi phạm Nielsen heuristic gây UX kém rõ rệt nhưng có workaround; (b) inconsistency design system trên nhiều surface (≥ 3 surface) làm giảm độ tin cậy thương hiệu; (c) animation gây xao nhãng / motion sickness với người dùng thông thường mà chưa có `prefers-reduced-motion` honoring; (d) loading hoặc error state thiếu trên flow quan trọng (form submit, AI streaming, lưu lá số); (e) Lighthouse Accessibility score < 90 trên ≥ 1 route.
4. THE Auditor SHALL gán `severity = P2` cho: (a) polish / consistency nhỏ trên ≤ 2 surface; (b) đề xuất cải thiện nice-to-have; (c) gap so với target state spec `ux-ui-upgrade` ở mức không ảnh hưởng UX thực tế hiện tại; (d) khuyến nghị micro-interaction tăng cảm giác cao cấp.
5. WHEN một Finding có thể rơi vào nhiều mức severity (ví dụ vừa vi phạm WCAG vừa Nielsen), THE Auditor SHALL chọn mức cao nhất (WCAG-driven P0 thắng Nielsen-driven P1) và ghi lý do trong `description`.
6. THE Audit_Report SHALL hiển thị tổng số Finding theo từng mức severity trong `Executive Summary` (ví dụ "5 P0, 14 P1, 23 P2") để chủ sản phẩm đọc 1 dòng nắm được tình trạng tổng thể.

---

### Requirement 6: Định dạng Audit_Report

**User Story:** Là người đọc báo cáo trên GitHub / Markdown viewer, tôi muốn báo cáo dễ scan, có mục lục, và mỗi finding tự đứng một mình, để tôi đọc lướt và link trực tiếp được tới một finding cụ thể.

#### Acceptance Criteria

1. THE Audit_Report SHALL được lưu tại đường dẫn cố định `.kiro/specs/frontend-ux-ui-audit/audit-report.md` và dùng format Markdown chuẩn (CommonMark + GFM).
2. THE Audit_Report SHALL có cấu trúc sections theo đúng thứ tự: `# Frontend UX/UI Audit Report` → `## Executive Summary` → `## Scope` → `## Methodology` → `## Severity Rubric` → `## Findings` (theo Audit_Axis) → `## Audit_Backlog` (P0 → P1 → P2) → `## Appendices` (links tới `audit-evidence/`).
3. THE Audit_Report SHALL có một Table of Contents tự động hoặc manual ngay sau heading chính, link tới mọi section ≥ heading level 2.
4. THE Audit_Report SHALL trình bày mỗi Finding dưới dạng heading level 3 (`### F-AXIS-NN: <title>`) với trường metadata theo block đầu (Severity, Surface, Axis, References) trước phần Description / Evidence / Recommendation.
5. THE Audit_Report SHALL không hard-code màu hex hoặc HTML inline; chỉ dùng cú pháp Markdown thuần, không phụ thuộc renderer cụ thể.
6. THE Audit_Backlog section SHALL trình bày 3 bảng (P0, P1, P2), mỗi bảng cột: `id`, `title`, `axis`, `surface`, `effort estimate (S/M/L)`, `recommendation summary` (≤ 80 ký tự).
7. THE Audit_Report SHALL có file companion `audit-summary.json` tại cùng thư mục, chứa machine-readable representation của tất cả Finding (mảng object với các trường như Requirement 2 quy định) — để tooling sau này có thể parse mà không cần regex Markdown.
8. WHERE Audit_Report (hoặc bất kỳ output companion nào, kể cả non-Markdown như `audit-summary.json`) tham chiếu tới screenshot, THE Audit_Report SHALL dùng đường dẫn relative `./audit-evidence/<subfolder>/<file>.png` thay vì absolute path để portable giữa các máy.

---

### Requirement 7: Hiệu ứng (Audit_Axis ANIM) — Tiêu chí kiểm tra

**User Story:** Là chủ sản phẩm muốn biết hiệu ứng có "lạm dụng" hay không, tôi muốn auditor có checklist cụ thể về thời lượng, easing, và hành vi reduced-motion, để tôi tin kết luận "hiệu ứng hợp lý" có cơ sở.

#### Acceptance Criteria

1. WHEN audit Audit_Axis `ANIM`, THE Auditor SHALL kiểm tra mọi animation có thời lượng nằm trong khoảng [120ms, 800ms]; bất kỳ animation nào < 120ms hoặc > 800ms (trừ ambient orb drift dạng background ambient) SHALL được flag thành Finding với severity tối thiểu P2.
2. WHEN audit Audit_Axis `ANIM`, THE Auditor SHALL kiểm tra `prefers-reduced-motion: reduce` được honor: dưới setting này, animation dạng translate / scale / rotate > 4px hoặc > 0.05 scale ratio SHALL được giảm xuống fade ≤ 150ms hoặc tắt; vi phạm SHALL được flag P1.
3. WHEN audit Audit_Axis `ANIM`, THE Auditor SHALL kiểm tra easing không dùng `linear` cho chuyển động không gian (translate / scale); vi phạm SHALL được flag P2 trừ khi animation thuộc dạng progress bar — exemption áp dụng cho mọi progress bar bất kể là loại tiến trình tuần tự hay có sliding/scaling indicator.
4. WHEN audit `ambient-bg` component, THE Auditor SHALL kiểm tra opacity orb / star field ≤ 35% trong dark mode và ≤ 15% trong light mode; ngưỡng này được enforce nghiêm ngặt, không có tolerance (ví dụ 16% trong light mode SHALL được flag).
5. WHEN audit `tilt-card` component, THE Auditor SHALL kiểm tra max tilt ≤ ±15° (khuyến nghị ±8°); vi phạm SHALL được flag P2.
6. WHEN audit `ai-chat` typing indicator và Result_Card AI streaming, THE Auditor SHALL kiểm tra typing dots animation chỉ chạy khi đang chờ chunk đầu tiên, và markdown render incremental thay vì re-render full; vi phạm rendering pattern (full re-render) SHALL được flag P1.
7. WHEN audit `mystic-cursor`, THE Auditor SHALL kiểm tra cursor không hiển thị trên thiết bị touch (no hover) và bị `aria-hidden="true"`; vi phạm SHALL được flag P1 cho a11y.

---

### Requirement 8: Bố cục (Audit_Axis LAYOUT) — Tiêu chí kiểm tra

**User Story:** Là người dùng truy cập trên nhiều thiết bị, tôi muốn auditor xác minh layout không vỡ trên mobile/tablet/desktop và có hierarchy rõ ràng, để tôi tin kết luận "bố cục hợp lý" có dữ liệu.

#### Acceptance Criteria

1. WHEN audit Audit_Axis `LAYOUT`, THE Auditor SHALL kiểm tra không có horizontal scroll ở viewport ≥ 360px trừ bảng dữ liệu rộng đã dùng `overflow-x-auto` chủ ý; vi phạm SHALL được flag P0.
2. WHEN audit Audit_Axis `LAYOUT`, THE Auditor SHALL kiểm tra spacing dùng Tailwind scale chuẩn (bội của 0.25rem); padding/margin dùng giá trị tùy ý dạng `p-[13px]`, `mt-[2.3rem]` SHALL được flag P2.
3. WHEN audit Audit_Axis `LAYOUT`, THE Auditor SHALL kiểm tra heading hierarchy: mỗi page đúng một `h1`, không skip cấp (h1 → h3 không có h2); vi phạm SHALL được flag P1 (a11y / SEO).
4. WHEN audit Audit_Axis `LAYOUT`, THE Auditor SHALL kiểm tra `prose` text container có `max-width` ≤ 75ch trên Breakpoint_Desktop trở lên; vi phạm SHALL được flag P2.
5. WHEN audit responsive behavior, THE Auditor SHALL kiểm tra navbar collapse thành drawer ở < 768px; nếu navbar overflow / cắt nội dung ở mobile SHALL được flag P0.
6. WHEN audit responsive behavior, THE Auditor SHALL kiểm tra mọi interactive target có chiều cao ≥ 44px trên mobile (touch target size); vi phạm SHALL được flag P1.
7. WHEN audit hierarchy chữ, THE Auditor SHALL kiểm tra type scale ≤ 6 mức rõ rệt (display / h1 / h2 / h3 / body / small) với ratio nhất quán; sử dụng > 8 size khác nhau hoặc ratio chaos SHALL được flag P2.

---

### Requirement 9: Hiển thị module (Audit_Axis MODULE) — Tiêu chí kiểm tra

**User Story:** Là người dùng tra cứu, tôi muốn auditor xác nhận thông tin trong Result_Card được sắp xếp theo mức quan trọng, để tôi tin báo cáo có giá trị thực tế.

#### Acceptance Criteria

1. WHEN audit mỗi Module_Page, THE Auditor SHALL kiểm tra Result_Card hiển thị thông tin theo thứ tự ưu tiên: tên / chủ thể tra cứu (top) → key numbers / quẻ / cung tinh chính → chart trực quan → bảng chi tiết → luận giải AI (nếu bật) → action group (lưu / chia sẻ / xuất); thứ tự sai SHALL được flag P1.
2. WHEN audit chart trong mỗi Module_Page (radar ngũ giác, donut ngũ hành, hào âm/dương, la bàn 8 hướng, biểu đồ điểm hợp tuổi), THE Auditor SHALL kiểm tra chart có `role="img"` và `aria-label` mô tả nội dung; thiếu SHALL được flag P0.
3. WHEN audit chart, THE Auditor SHALL kiểm tra label trục / segment đọc được trên Breakpoint_Mobile (≥ 12px effective size, không bị cắt); vi phạm SHALL được flag P1.
4. WHEN audit bảng dữ liệu (4 trụ Bát Tự, 12 cung Tử Vi, ngũ cách Xem Tên, lịch sử quẻ), THE Auditor SHALL kiểm tra `<thead>` với `scope="col"`, và mobile có thể horizontal scroll riêng bảng (không kéo cả page); vi phạm SHALL được flag P1.
5. WHEN audit Module_Page có Form_Input, THE Auditor SHALL kiểm tra empty state (chưa submit) hiển thị helper text hoặc minh hoạ giải thích module dùng để làm gì, không phải trang trắng; thiếu SHALL được flag P2.
6. WHEN audit Module_Page có chart và luận giải AI cùng surface, THE Auditor SHALL kiểm tra chart và luận giải không cạnh tranh attention bằng motion đồng thời (chart nên tĩnh khi AI streaming); vi phạm SHALL được flag P2.
7. WHEN audit `share-view` page (xem reading được chia sẻ), THE Auditor SHALL kiểm tra render đầy đủ Result_Card không cần đăng nhập, không hiển thị action "Lưu" / "Xoá" cho viewer ẩn danh; lộ action không khả dụng SHALL được flag P2.
8. WHEN audit information density của một Module_Page, THE Auditor SHALL kiểm tra không quá 3 mức nhấn mạnh (highlight color, bold, badge) trong cùng một viewport; lạm dụng SHALL được flag P2.

---

### Requirement 10: Tương tác UX/UI (Audit_Axis INTERACTION) — Tiêu chí kiểm tra

**User Story:** Là người dùng dùng bàn phím hoặc gặp lỗi mạng, tôi muốn auditor xác minh mọi luồng tương tác đều có feedback rõ ràng và truy cập được, để báo cáo phản ánh trải nghiệm thật chứ không chỉ pixel-perfect.

#### Acceptance Criteria

1. WHEN audit Audit_Axis `INTERACTION`, THE Auditor SHALL kiểm tra Tab order tự nhiên (top-to-bottom, left-to-right) trên mọi page audit; thứ tự lộn xộn SHALL được flag P1.
2. WHEN audit focus visibility, THE Auditor SHALL kiểm tra focus ring nhìn thấy được trên mọi interactive element với độ tương phản ≥ 3:1 so với nền; thiếu hoặc tương phản thấp SHALL được flag P0.
3. WHEN audit dialog / dropdown / drawer, THE Auditor SHALL kiểm tra Esc đóng, focus trap khi mở, và return focus về trigger khi đóng; vi phạm SHALL được flag P1.
4. WHEN audit form validation, THE Auditor SHALL kiểm tra hành vi trên 3 thời điểm: real-time (khi nhập), on-blur (khi rời input), on-submit (khi gửi form); thiếu validation on-submit (cho phép submit data sai) SHALL được flag P0.
5. WHEN audit form error, THE Auditor SHALL kiểm tra `aria-invalid="true"` và `aria-describedby` trỏ tới id thông báo lỗi; thiếu SHALL được flag P1.
6. WHEN audit loading state, THE Auditor SHALL kiểm tra mọi async action (form submit, fetch list, AI streaming, save reading, share, export) có visual feedback trong ≤ 100ms; thiếu SHALL được flag P0 cho action quan trọng (submit form, save), P1 cho action phụ.
7. WHEN audit error state, THE Auditor SHALL kiểm tra mọi error path (network failure, 4xx, 5xx, AI rate-limit 429) có UI riêng với title tiếng Việt + nút retry hoặc fallback; thiếu SHALL được flag P1.
8. WHEN audit empty state, THE Auditor SHALL kiểm tra danh sách rỗng (history, saved readings, search) có illustration / message + CTA dẫn dắt action tiếp theo; trang trắng SHALL được flag P1.
9. WHEN audit toast feedback (`use-toast` hook + `sonner`), THE Auditor SHALL kiểm tra mọi success action có toast tiếng Việt, mọi error có toast khác màu (`--destructive`); thiếu SHALL được flag P2.
10. WHEN audit theme toggle, THE Auditor SHALL kiểm tra chuyển light/dark không gây flash màu cũ và lựa chọn được persist trong `localStorage`; vi phạm SHALL được flag P2.
11. WHEN audit `pwa-install-prompt`, THE Auditor SHALL kiểm tra prompt không hiển thị modal toàn màn hình, có nút dismiss rõ ràng, và có khoảng cấm tái xuất hiện ≥ 14 ngày; vi phạm SHALL được flag P2.
12. WHEN audit color contrast bằng axe-core hoặc Lighthouse, THE Auditor SHALL flag mọi cặp text/background có ratio < 4.5:1 (text thường) hoặc < 3:1 (text ≥ 18px hoặc ≥ 14px bold) thành Finding P0.

---

### Requirement 11: Mockup-sandbox audit (giảm phạm vi)

**User Story:** Là dev nội bộ dùng mockup-sandbox để preview component, tôi muốn auditor confirm tooling này không có UX vấn đề ở vỏ ngoài (gallery, error display), để tôi không tốn effort fix dev tool.

#### Acceptance Criteria

1. WHEN audit `mockup-sandbox`, THE Auditor SHALL chỉ kiểm tra: trang gallery (`Gallery` component trong `App.tsx`), `PreviewRenderer` error state hiển thị khi component không tồn tại / load fail, và base styling của Tailwind / shadcn primitives.
2. WHEN audit `mockup-sandbox`, THE Auditor SHALL KHÔNG audit từng mockup component bên trong `src/components/mockups/` vì đây là user-generated content thay đổi liên tục.
3. WHEN audit `mockup-sandbox` gallery, THE Auditor SHALL kiểm tra hướng dẫn URL `${basePath}/preview/ComponentName` được render rõ ràng, trang không bị "AI default" feel (tránh padding khổng lồ, gradient tím vô hồn); vi phạm SHALL được flag P2.
4. WHEN audit `mockup-sandbox` error state, THE Auditor SHALL kiểm tra error message dùng `<pre>` với contrast đọc được trên cả 2 theme (light + dark). Bất kỳ contrast failure nào trong error display SHALL được flag P2; nếu chỉ test được 1 theme do giới hạn local, việc test thiếu cũng SHALL được flag P2 riêng.
5. WHEN audit `mockup-sandbox`, THE Auditor SHALL ghi nhận kết quả audit ở section riêng `## Findings > Mockup Sandbox` trong Audit_Report, không trộn với findings của `mysticism-web`.

---

### Requirement 12: Phân biệt audit này với spec đã có

**User Story:** Là kỹ sư quản lý spec backlog, tôi muốn audit này không nhân đôi nội dung đã có ở spec `ux-ui-upgrade`, để tôi không phải đọc cùng requirement hai lần.

#### Acceptance Criteria

1. THE Audit_Report SHALL có section `## Relationship to Existing Specs` mô tả: spec `ux-ui-upgrade` định nghĩa target state, audit này đo current state, gap giữa chúng là findings.
2. WHEN một Finding trùng nội dung với requirement của spec `ux-ui-upgrade`, THE Auditor SHALL ghi reference `ux-ui-upgrade Req X.Y` trong trường `references` thay vì copy nguyên requirement vào Audit_Report. Auditor SHALL luôn dùng spec reference cho overlapping content và giữ Audit_Report tập trung vào gap (current vs target) và measurement (số liệu đo được), KHÔNG đưa context bổ sung hay góc nhìn khác lên cùng vấn đề trong Audit_Report.
3. THE Audit_Report SHALL KHÔNG đề xuất implementation chi tiết hoặc code patch; những đề xuất sâu hơn 1 đoạn ngắn SHALL được redirect sang spec triển khai mới hoặc cập nhật `ux-ui-upgrade`.
4. THE Audit_Report SHALL không lặp lại security audit (đã có `post-opus-audit-remediation`); nếu Auditor thấy issue security trong frontend (XSS, CSRF, secret leak trong console), SHALL ghi note 1 dòng và link tới `post-opus-audit-remediation` thay vì coverage chi tiết.

---

### Requirement 13: Deliverables và acceptance của đợt audit

**User Story:** Là chủ sản phẩm thuê audit, tôi muốn biết khi nào audit được coi là "xong", để tôi chốt và chuyển sang giai đoạn fix.

#### Acceptance Criteria

1. THE Audit_Report SHALL được coi là hoàn thành khi đáp ứng đồng thời: (a) tất cả Audit_Surface ở Requirement 1 đã được audit hoặc được loại trừ với lý do; (b) cả 4 Audit_Axis đều có Finding; (c) tất cả Finding có đủ trường ở Requirement 2; (d) Audit_Backlog có 3 bảng P0/P1/P2; (e) `audit-evidence/` chứa output của Lighthouse, axe, screenshot responsive, screenshot reduced-motion, log keyboard walkthrough; (f) `audit-summary.json` parse được bằng JSON parser chuẩn.
2. THE Audit_Report SHALL có một `## Acceptance Checklist` ở cuối file liệt kê 6 điều kiện trên với checkbox `- [ ]` / `- [x]` để reviewer tick từng mục.
3. WHEN một điều kiện chưa đạt, THE Auditor SHALL ghi rõ trạng thái và workaround tạm thời thay vì giả vờ đã đạt; ví dụ "Lighthouse mobile audit chưa chạy được do thiếu HTTPS local — fallback dùng desktop emulation".
4. THE Audit_Report SHALL KHÔNG yêu cầu chạy bất kỳ test property-based nào để được chấp nhận, vì audit này là assessment, không phải implementation.
5. WHEN Audit_Report được commit, THE Auditor SHALL không commit `node_modules`, `dist`, hoặc file binary > 5MB vào `audit-evidence/`; screenshot SHALL được tối ưu PNG (chấp nhận nén lossy ≤ 60% chất lượng cho PNG full-page).
6. THE Audit_Report SHALL có thông tin tác giả (auditor name / agent), ngày audit, và hash commit của repo tại thời điểm audit ở `Executive Summary` để trace lại được.

---

## Open Questions (cần xác nhận với user trước khi vào Design)

Các giả định dưới đây đã được dùng trong requirements ở trên. Nếu user muốn điều chỉnh, hãy phản hồi để chúng ta cập nhật trước khi sang Phase 2.

1. **Phạm vi `mockup-sandbox`**: Đã giả định chỉ audit ở mức convention (gallery + error shell), KHÔNG audit từng mockup component. Đúng ý user?
2. **Chuẩn WCAG**: Đã chọn WCAG 2.1 Level AA làm bắt buộc, AAA chỉ ngầm cho contrast nếu khả thi. Có cần nâng lên AAA bắt buộc không?
3. **Performance benchmark**: Đã yêu cầu chạy Lighthouse trên 8 route đại diện (không phải toàn bộ 15 module) để tránh tốn quá nhiều thời gian. Cần audit cả 15 không?
4. **Output format**: Đã chọn Markdown (`audit-report.md`) + JSON sidecar (`audit-summary.json`) thay vì issue tracker (Jira/Linear/GitHub Issues). Có cần xuất thêm format nào (CSV, GitHub Issues bulk import)?
5. **Tooling cụ thể**: Đã chọn Lighthouse + axe-core làm baseline. Có muốn thêm Pa11y, WAVE, hoặc tích hợp Storybook a11y addon không?
6. **Số lượng evidence**: Đã yêu cầu screenshot per route per viewport (4 viewport × 8+ route ≈ 32+ ảnh). Nếu muốn nhẹ hơn (chỉ chụp khi có vấn đề), nói để giảm requirement.
7. **Browser scope**: Đã giả định audit trên Chrome (DevTools / Lighthouse). Có cần audit cross-browser (Firefox, Safari, Edge) không?

---

**Spec này đã sẵn sàng cho review.** Sau khi user confirm hoặc chỉnh sửa, sẽ chuyển sang Phase 2 (Design) để thiết kế cấu trúc Audit_Report, schema `audit-summary.json`, layout `audit-evidence/`, và quy trình thực thi audit từng surface.
