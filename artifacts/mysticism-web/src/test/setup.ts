/**
 * Vitest global setup.
 *
 * Imported once per test worker via `vitest.config.ts` -> `test.setupFiles`.
 * Registers `@testing-library/jest-dom` matchers (e.g. `toBeInTheDocument`,
 * `toHaveAttribute`, `toBeVisible`) on Vitest's `expect`.
 */
import "@testing-library/jest-dom/vitest";
