# Implementation Plan: Frontend UX/UI Audit

## Overview

Convert the feature design into a series of prompts for a code-generation LLM that will implement each step with incremental progress. Make sure that each prompt builds on the previous prompts, and ends with wiring things together. There should be no hanging or orphaned code that isn't integrated into a previous step. Focus ONLY on tasks that involve writing, modifying, or testing code.

Đây là spec **assessment-only**: deliverable là `audit-report.md` (Markdown), `audit-summary.json` (JSON sidecar), và thư mục `audit-evidence/` chứa output tooling + screenshot. Phần "code" duy nhất là 4 verification script `.mjs` (TS1–TS6) dùng để lint cấu trúc deliverable trước khi tick Acceptance Checklist.

Quy trình thực thi tuân thứ tự pipeline ở Design:

1. **Setup** thư mục + script harness (Wave 0).
2. **Verification scripts trước** — viết TS1–TS6 sớm để lint scaffold ngay khi có (Wave 1).
3. **Tooling Pass song song** — Lighthouse, axe, responsive, reduced-motion, keyboard độc lập nhau (Wave 1).
4. **Author audit-report.md tuần tự** — tất cả ghi cùng một file nên phải serialize qua nhiều wave.
5. **Author audit-summary.json** sau khi findings đã ổn định.
6. **Final verify** chạy `npm run audit:verify` để tick Acceptance Checklist.

Tham chiếu: requirements `R1`–`R13`, design sections `Architecture` / `Components and Interfaces` / `Data Models` / `Testing Strategy`.

## Tasks

- [x] 1. Setup audit infrastructure
  - [x] 1.1 Create audit-evidence/ directory tree with README scaffold
    - Tạo `.kiro/specs/frontend-ux-ui-audit/audit-evidence/` với 5 subfolder: `lighthouse/`, `axe/`, `responsive/`, `reduced-motion/`, `keyboard/`
    - Viết `audit-evidence/README.md` mô tả layout, browser version, viewport list theo Design > Artifact Layout
    - Đặt placeholder `.gitkeep` trong subfolder rỗng để git track
    - _Requirements: 4.5, 4.6, 4.7, 6.8, 13.1.e_

  - [x] 1.2 Create scripts/ directory and wire npm script audit:verify
    - Tạo `.kiro/specs/frontend-ux-ui-audit/scripts/` directory
    - Tạo `scripts/package.json` với devDependencies tối thiểu: `ajv`, `remark-parse`, `unified` (Node.js >= 18)
    - Thêm `audit:verify` script vào `package.json` ở repo root để gọi `node .kiro/specs/frontend-ux-ui-audit/scripts/audit-verify.mjs`
    - _Requirements: 13.1.f, design Testing Strategy TS6_

- [x] 2. Implement verification scripts (TS1–TS6)
  - [x] 2.1 Implement JSON schema validator (TS1)
    - File: `scripts/validate-summary.mjs`
    - Định nghĩa Ajv schema cho `AuditSummary` theo Design > Data Models
    - Kiểm tra: `JSON.parse` thành công, fields bắt buộc tồn tại, `id` regex `/^F-(ANIM|LAYOUT|MODULE|INTERACTION)-\d{2,}$/`, `findings.length === totals.P0+P1+P2+INFO`, `totals.byAxis[axis]` khớp `findings.filter(...).length`, mỗi `evidence` item có đúng 1 nhánh khác null/empty, mọi đường dẫn relative bắt đầu `./audit-evidence/`
    - Exit 0 nếu pass, exit 1 + lỗi cụ thể nếu fail
    - _Requirements: 2.1, 2.6, 6.7, 6.8, 13.1.f, design TS1_

  - [x] 2.2 Implement Markdown structure linter (TS2)
    - File: `scripts/lint-report.mjs`
    - Dùng `remark-parse` + `unified` (hoặc regex với heading tree) để parse `audit-report.md`
    - Kiểm tra: heading L1 = "Frontend UX/UI Audit Report", có ToC trước heading L2 đầu, heading L2 đúng thứ tự ở Design > Audit_Report section ordering, mỗi heading L3 trong `## Findings — *` match `^F-(ANIM|LAYOUT|MODULE|INTERACTION)-\d{2,}: .+$`, mỗi finding heading có metadata block (`Severity:`, `Surface:`, `Axis:`, `References:`), `## Audit_Backlog` có 3 sub-section P0/P1/P2 với bảng 6 cột, không có `style="color:` hay `<font color`, mọi screenshot path bắt đầu `./audit-evidence/`
    - Báo cáo lỗi với line number và section context
    - _Requirements: 2.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.8, design TS2_

  - [x] 2.3 Implement cross-file consistency check (TS3)
    - File: `scripts/check-consistency.mjs`
    - Parse cả `audit-report.md` (heading L3 finding ids + severity từ metadata block) và `audit-summary.json` (`findings[].id` + `severity`)
    - Kiểm tra: bidirectional id match (Markdown ↔ JSON), severity khớp, số dòng trong mỗi bảng `Audit_Backlog` (P0/P1/P2) khớp `totals.P0/P1/P2` của JSON
    - _Requirements: 6.7, design TS3, design Error Handling E6_

  - [x] 2.4 Implement evidence file checker (TS4)
    - File: `scripts/check-evidence.mjs`
    - Liệt kê mọi đường dẫn `./audit-evidence/...` trong Markdown + JSON, dùng `fs.existsSync` để xác nhận file tồn tại
    - Kiểm tra naming: `lighthouse/{slug}.json`, `axe/{slug}.json`, `responsive/{slug}-{w}x{h}.png`, `reduced-motion/{slug}-reduced.png`, `keyboard/flow-{a|b|c}-{slug}.md` theo Design > Evidence file naming
    - Kiểm tra mọi file dưới `audit-evidence/` ≤ 5MB (`fs.statSync().size`); fail với gợi ý optimize
    - Kiểm tra minimum coverage: ≥ 1 file mỗi loại lighthouse/axe/responsive/reduced-motion/keyboard
    - _Requirements: 4.3, 4.4, 4.5, 4.6, 4.7, 13.1.e, 13.5, design TS4_

  - [x] 2.5 Wire smoke run script audit-verify.mjs (TS6)
    - File: `scripts/audit-verify.mjs`
    - Chạy tuần tự fail-fast: validate-summary → lint-report → check-consistency → check-evidence
    - Output format theo Design > TS6 ("✓ JSON schema valid" / "Audit verification PASSED.")
    - Exit code phản ánh kết quả tổng thể
    - _Requirements: 13.1, 13.2, design TS6_

  - [x] 2.6 Write fixture-based unit tests for validators
    - Tạo `scripts/__fixtures__/` chứa: `valid-summary.json`, `valid-report.md`, plus 6–8 invalid variants (missing field, bad id format, wrong severity, mismatched totals, oversized evidence, broken cross-file ids)
    - Viết `scripts/test-validators.mjs` chạy mỗi script trên fixtures và assert exit code + key error messages
    - _Requirements: design TS1–TS4_

- [x] 3. Author audit-report.md scaffold and front-matter sections
  - [x] 3.1 Create file with all section headings and Table of Contents per R6.2
    - Tạo `.kiro/specs/frontend-ux-ui-audit/audit-report.md`
    - Đặt heading L1 "Frontend UX/UI Audit Report" + manual ToC link tới mọi heading L2
    - Tạo placeholder cho 11 section L2 đúng thứ tự: Executive Summary, Scope, Methodology, Severity Rubric, Relationship to Existing Specs, Findings, Audit_Backlog, Appendices, Acceptance Checklist (xem Design > Audit_Report section ordering)
    - Bên trong `## Findings`, đặt 5 sub-heading L2: `## Findings — ANIM`, `## Findings — LAYOUT`, `## Findings — MODULE`, `## Findings — INTERACTION`, `## Findings — Mockup Sandbox`
    - _Requirements: 6.1, 6.2, 6.3, 11.5_

  - [x] 3.2 Author Scope section (Surface Inventory + Unaudited States)
    - Bảng Surface Inventory với cột: Surface, Path, Status, Reason theo Design > C1
    - Liệt kê 15 Module_Page + trang phụ trợ + shared components + 4 export-card-* + mockup-sandbox theo R1.2 và R1.3
    - Liệt kê loại trừ theo R1.4 (`node_modules`, `dist`, `*.test.ts`, `.generated/`, `__clerk-mock-*`, api-server)
    - Section `Unaudited States` ngay sau bảng (kể cả nếu tất cả audited, ghi rõ R1.6)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

  - [x] 3.3 Author Methodology section
    - Mô tả Heuristic_Set (Nielsen 10, WCAG 2.1 AA, CWV, design system from `ux-ui-upgrade`, motion principles)
    - Mô tả Tooling_Set: Lighthouse version, axe-core version, browser version, OS, viewport sizes
    - Mô tả quy trình: Tooling Pass trước Manual Pass (theo Design > Architecture)
    - Section `Limitations` chỉ nếu có giới hạn thực tế (R4.8)
    - _Requirements: 4.1, 4.2, 4.8_

  - [x] 3.4 Author Severity Rubric section
    - Bảng severity theo Design > C4 với tiêu chí khách quan cho P0/P1/P2/INFO
    - Ghi rõ rule "chọn mức cao nhất khi rơi nhiều mức" (R5.5)
    - Đặt section giữa `## Methodology` và `## Findings`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 3.5 Author Relationship to Existing Specs section
    - Mô tả: `ux-ui-upgrade` định nghĩa target state, audit này đo current state, gap = finding
    - Quy ước reference format `ux-ui-upgrade Req X.Y` thay vì copy nội dung
    - Note về `post-opus-audit-remediation`: security issue chỉ ghi 1 dòng + link
    - _Requirements: 12.1, 12.2, 12.4_

- [x] 4. Collect tooling evidence (parallel with script work)
  - [x] 4.1 Run Lighthouse on 8 routes
    - Routes: `/`, `/than-so-hoc`, `/bat-tu`, `/tu-vi`, `/ai-chat`, `/profile`, `/lich-su`, `/sign-in`
    - Lưu JSON output vào `audit-evidence/lighthouse/{slug}.json` (slug = route không có `/`, root → `home`)
    - Nếu route fail, lưu placeholder `{"error": "<message>"}` và ghi vào `Methodology > Limitations` (Design E1)
    - _Requirements: 4.2, 4.3, 13.1.e_

  - [x] 4.2 Run axe-core on 8 routes
    - Cùng tập route ở 4.1
    - Lưu JSON output vào `audit-evidence/axe/{slug}.json` với cấu trúc summary + violations theo impact (critical/serious/moderate/minor)
    - _Requirements: 4.4, 13.1.e_

  - [x] 4.3 Capture responsive screenshots (4 viewports × routes)
    - Viewports: 360×800, 768×1024, 1280×800, 1920×1080
    - Lưu PNG vào `audit-evidence/responsive/{slug}-{w}x{h}.png`
    - Tối thiểu 1 ảnh per route per viewport (R4.5)
    - Optimize PNG ≤ 5MB (pngquant/oxipng) — Design Error Handling E7
    - _Requirements: 4.5, 13.1.e, 13.5_

  - [x] 4.4 Capture prefers-reduced-motion screenshots on 3 surfaces
    - Surfaces: `home`, một Module_Page có Result_Card animation, `ai-chat`
    - Lưu vào `audit-evidence/reduced-motion/{slug}-reduced.png`
    - Kèm mô tả hành vi observed trong file Markdown ngắn nếu cần thiết
    - _Requirements: 4.6, 7.2, 13.1.e_

  - [x] 4.5 Author keyboard walkthrough logs for 3 flows
    - Flow A: home → click Module_Page → submit form → xem kết quả
    - Flow B: sign-in flow
    - Flow C: ai-chat gửi message và copy response
    - Mỗi flow là một file `audit-evidence/keyboard/flow-{a|b|c}-{slug}.md` ghi Tab order, focus ring visibility, mọi trap focus / unreachable element
    - _Requirements: 4.7, 10.1, 10.2, 10.3, 13.1.e_

- [x] 5. Checkpoint - verify infrastructure
  - Chạy `npm run audit:verify` trên scaffold + evidence đã thu thập
  - Xác nhận TS1–TS4 báo lỗi đúng những gì còn thiếu (findings chưa có, JSON sidecar chưa tạo) và pass mọi check khác
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Author findings per axis
  - [x] 6.1 Author ANIM findings worksheet
    - Heading `## Findings — ANIM` với axis summary 1–2 đoạn
    - Checklist tham chiếu (Design > C2) tick `[x]` cho mọi điểm đã kiểm tra
    - Mỗi finding theo template Design > C2: id `F-ANIM-NN`, Severity, Surface, Axis, References, Description, Evidence, Recommendation (WHAT/WHY/WHERE)
    - Tối thiểu 1 finding (kể cả `INFO` nếu zero issue thực sự — R3.6)
    - Kiểm tra theo R7.1–R7.7: thời lượng [120ms,800ms], reduced-motion honor, easing không linear, ambient-bg opacity, tilt-card max ±15°, AI streaming incremental, mystic-cursor `aria-hidden`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 3.1, 3.2, 3.6, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

  - [x] 6.2 Author LAYOUT findings worksheet
    - Heading `## Findings — LAYOUT` + axis summary + checklist
    - Mỗi finding theo template với id `F-LAYOUT-NN`
    - Kiểm tra theo R8.1–R8.7: no horizontal scroll ≥ 360px, Tailwind spacing scale, heading hierarchy, prose max-width ≤ 75ch, navbar collapse < 768px, touch target ≥ 44px, type scale ≤ 6 mức
    - Cross-reference responsive screenshots ở `audit-evidence/responsive/`
    - _Requirements: 2.1–2.8, 3.1, 3.3, 3.6, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

  - [x] 6.3 Author MODULE findings worksheet
    - Heading `## Findings — MODULE` + axis summary + checklist
    - Mỗi finding theo template với id `F-MODULE-NN`
    - Kiểm tra cho mỗi 15 Module_Page theo R9.1–R9.8: thứ tự Result_Card, chart `role="img"`+`aria-label`, label đọc được mobile, bảng `<thead scope="col">`, empty state helper, không cạnh tranh motion, share-view không lộ action, ≤ 3 mức nhấn mạnh
    - _Requirements: 2.1–2.8, 3.1, 3.4, 3.6, 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8_

  - [x] 6.4 Author INTERACTION findings worksheet
    - Heading `## Findings — INTERACTION` + axis summary + checklist
    - Mỗi finding theo template với id `F-INTERACTION-NN`
    - Kiểm tra theo R10.1–R10.12: Tab order, focus ring contrast ≥ 3:1, dialog Esc/trap/return focus, form validation 3 thời điểm, `aria-invalid`+`aria-describedby`, loading ≤ 100ms, error UI với retry, empty state với CTA, toast feedback, theme toggle persist, pwa-install-prompt 14 ngày, color contrast 4.5:1/3:1
    - Cross-reference axe-core JSON ở `audit-evidence/axe/` và keyboard logs ở `audit-evidence/keyboard/`
    - _Requirements: 2.1–2.8, 3.1, 3.5, 3.6, 10.1–10.12_

  - [x] 6.5 Author Mockup Sandbox findings section
    - Heading `## Findings — Mockup Sandbox` (đặt sau 4 axis chính, theo R11.5)
    - Convention review: Gallery rendering, PreviewRenderer error state, base styling, URL hint `${basePath}/preview/ComponentName`
    - Findings với id format `F-MODULE-NN` hoặc `F-INTERACTION-NN` tuỳ loại issue (axis vẫn 1 trong 4)
    - KHÔNG audit từng mockup component bên trong `src/components/mockups/` (R11.2)
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 7. Author Audit_Backlog
  - [x] 7.1 Build P0/P1/P2 backlog tables aggregating all findings
    - Heading `## Audit_Backlog` + 3 sub-section `### P0 (Blocker)`, `### P1 (Major)`, `### P2 (Minor)` (Design > C5)
    - Mỗi bảng 6 cột: id, title, axis, surface, effort (S/M/L), recommendation summary (≤ 80 ký tự)
    - Bảng trống vẫn có header + 1 dòng `| — | — | — | — | — | (không phát hiện) |` (Design > C5)
    - INFO findings KHÔNG vào backlog (Design > C4)
    - Gán effort dựa trên kinh nghiệm: S (≤ ½ ngày), M (½–2 ngày), L (> 2 ngày)
    - _Requirements: 6.6_

- [x] 8. Author closing sections of audit-report.md
  - [x] 8.1 Author Executive Summary
    - Tổng số Finding theo từng severity (ví dụ "5 P0, 14 P1, 23 P2") (R5.6)
    - Meta: auditor name, audit date (ISO 8601), repo commit SHA, app version (R13.6)
    - 1–2 đoạn highlight finding nghiêm trọng nhất + định hướng tổng thể
    - _Requirements: 5.6, 13.6_

  - [x] 8.2 Author Appendices section
    - Link tới `./audit-evidence/lighthouse/`, `./audit-evidence/axe/`, `./audit-evidence/responsive/`, `./audit-evidence/reduced-motion/`, `./audit-evidence/keyboard/`
    - Mọi đường dẫn relative bắt đầu `./audit-evidence/` (R6.8)
    - _Requirements: 6.2, 6.8_

  - [x] 8.3 Author Acceptance Checklist section
    - 6 condition theo R13.1 với checkbox `- [ ]` / `- [x]`:
      - (a) tất cả Audit_Surface đã audit hoặc loại trừ với lý do
      - (b) cả 4 Audit_Axis đều có Finding
      - (c) tất cả Finding có đủ trường ở R2
      - (d) Audit_Backlog có 3 bảng P0/P1/P2
      - (e) `audit-evidence/` chứa output Lighthouse, axe, responsive screenshot, reduced-motion screenshot, keyboard log
      - (f) `audit-summary.json` parse được bằng JSON parser chuẩn
    - Section đặt cuối file (theo Design > Audit_Report section ordering)
    - _Requirements: 13.1, 13.2, 13.3_

- [x] 9. Generate audit-summary.json sidecar
  - [x] 9.1 Build JSON from findings + meta + totals
    - File `.kiro/specs/frontend-ux-ui-audit/audit-summary.json` theo schema Design > Data Models > AuditSummary
    - Populate `meta` (auditor, auditDate, repoCommit, appVersion, browsers, viewports), `scope` (auditedSurfaces, skippedSurfaces, unauditedStates), `rubric` (severityDefinitions, heuristicSets), `totals` (P0/P1/P2/INFO + byAxis), `findings[]`
    - Mỗi `Finding` có đủ field theo schema (id, title, axis, severity, surface, description, evidence[], recommendation{what,why,where}, references[], effort?)
    - Mọi `evidence` path bắt đầu `./audit-evidence/`
    - _Requirements: 2.1–2.7, 6.7, 6.8, 13.1.f_

  - [x] 9.2 Verify cross-file consistency vs Markdown
    - Chạy `node scripts/check-consistency.mjs` để confirm bidirectional id match + severity khớp + counts khớp
    - Sửa drift nếu có (Design > Error Handling E6)
    - _Requirements: 6.7, design TS3_

- [x] 10. Final verify checkpoint
  - Chạy `npm run audit:verify` lần cuối — phải pass cả TS1, TS2, TS3, TS4
  - Manual review TS5: Description ≥ 1 đoạn, recommendation đầy đủ what/why/where, references đúng issue, severity gán đúng rubric
  - Tick toàn bộ 6 box trong `## Acceptance Checklist`
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` (chỉ 2.6) là optional — có thể skip để rút ngắn cho MVP audit. Khuyến nghị làm vì verification scripts là tài sản dùng lại được giữa các đợt audit.
- Mỗi task tham chiếu requirement cụ thể (granular sub-clause như `R2.1`, không chỉ user story) để traceability.
- Checkpoint 5 (sau infrastructure) và 10 (final) đảm bảo incremental validation: nếu scripts báo lỗi sớm, fix trước khi viết hàng chục finding.
- Design **không có Correctness Properties section** (lược bỏ có chủ ý — R13.4) nên tasks list **không có property test sub-tasks**. Verification dùng JSON schema validator + Markdown structure linter (TS1–TS6) thay thế.
- Tất cả task ghi vào `audit-report.md` được serialize qua các wave riêng biệt vì cùng touch một file (Markdown không merge song song an toàn).
- Tooling pass (4.1–4.5) độc lập file output nên có thể chạy song song trong cùng wave.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["2.1", "2.2", "2.3", "2.4", "4.1", "4.2", "4.3", "4.4", "4.5", "3.1"] },
    { "id": 2, "tasks": ["2.5", "2.6", "3.2"] },
    { "id": 3, "tasks": ["3.3"] },
    { "id": 4, "tasks": ["3.4"] },
    { "id": 5, "tasks": ["3.5"] },
    { "id": 6, "tasks": ["6.1"] },
    { "id": 7, "tasks": ["6.2"] },
    { "id": 8, "tasks": ["6.3"] },
    { "id": 9, "tasks": ["6.4"] },
    { "id": 10, "tasks": ["6.5"] },
    { "id": 11, "tasks": ["7.1"] },
    { "id": 12, "tasks": ["8.1"] },
    { "id": 13, "tasks": ["8.2"] },
    { "id": 14, "tasks": ["8.3"] },
    { "id": 15, "tasks": ["9.1"] },
    { "id": 16, "tasks": ["9.2"] }
  ]
}
```
