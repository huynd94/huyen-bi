# Kế Hoạch Fix Full Audit

## Summary

Fix toàn bộ findings audit theo thứ tự rủi ro: dependency vulnerabilities, Markdown URL XSS, typecheck/test blockers, API behavior drift, OpenAPI/client sync, Docker hardening. Checklist này được cập nhật trong lúc implementation để người review thấy rõ trạng thái từng phase.

## Checklist

- [x] Dependency security: update direct deps, add safe transitive overrides, refresh lockfile, audit production deps.
- [x] MarkdownRenderer XSS: sanitize markdown link href and add protocol regression tests.
- [x] Build/test blockers: fix Clerk mock loader types, restore result-actions test, make root remediation script use `corepack pnpm`.
- [x] Readings API behavior: allow explicit `notes: null` to clear notes and update frontend type.
- [x] OpenAPI/client sync: add readings/share contract and regenerate Orval clients.
- [x] Docker hardening: run API as non-root and require production DB password.
- [x] Verification: typecheck, build, remediation tests, codegen diff review, production audit.

## Dependency Targets

- `@clerk/express` -> `^2.1.29`
- `@clerk/react` -> `^6.10.3`
- `@clerk/localizations` -> `^4.9.1`
- `drizzle-orm` catalog -> `^0.45.2`
- `http-proxy-middleware` -> `^3.0.6` first, then only escalate if audit still requires it.
- Overrides: `path-to-regexp@8.4.0`, `picomatch` patched lines, `dompurify@3.4.11`, `qs@6.15.2`.

## Verification Results

- `corepack pnpm --filter @workspace/api-spec run codegen` passed after setting zod `indexFiles: false` so the manual `@workspace/api-zod` root export remains schema-only.
- `corepack pnpm run typecheck` passed.
- `corepack pnpm run build` passed outside sandbox; Vite needs to write `.vite-temp` under `node_modules`.
- `corepack pnpm run test:audit-remediation` passed.
- `corepack pnpm audit --prod` passed with `No known vulnerabilities found`.

## Acceptance Criteria

- `corepack pnpm audit --prod` has no critical/high findings; unresolved moderate findings are documented.
- `corepack pnpm run typecheck` passes.
- `corepack pnpm run build` passes.
- `corepack pnpm run test:audit-remediation` passes.
- Markdown links block unsafe protocols while preserving safe absolute, relative, hash, mailto, and tel URLs.
- `PATCH /readings/:id` clears notes when request body contains `notes: null` and keeps notes unchanged when `notes` is absent.
- Generated API/Zod clients include readings/share schemas without unrelated churn.

## Assumptions

- Keep handwritten `readings-api.ts` unless generated client migration is low-risk in this pass.
- No DB migration is required for `notes` because schema already allows nullable values.
- Keep `minimumReleaseAge` enabled. If urgent patched versions are blocked, add a temporary package-specific `minimumReleaseAgeExclude` with a removal note.
