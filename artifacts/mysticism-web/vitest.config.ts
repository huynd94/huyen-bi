import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  test: {
    environment: "happy-dom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    // Only match the new vitest-native test patterns introduced by the
    // UX/UI upgrade spec. Legacy `*.test.ts` files are run by the dedicated
    // `tsx`-based scripts (`test:markdown`, `test:sse`, etc.) and must not
    // be collected here. As legacy tests migrate to vitest this list can
    // be widened.
    include: [
      "src/**/*.property.test.{ts,tsx}",
      "src/**/*.a11y.test.{ts,tsx}",
    ],
    css: false,
  },
});
