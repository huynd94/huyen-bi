import { describe, expect, it } from "vitest";

import { CLERK_APPEARANCE, getPostAuthRedirect } from "./clerk-appearance";

/**
 * Đơn vị test cho helper Clerk appearance + redirect logic.
 *
 * Mục tiêu:
 *
 * - Validates Requirement 15.3: `redirect_url` query param được tôn
 *   trọng, fallback `/profile` khi vắng mặt; chặn open-redirect ngoài
 *   domain.
 * - Validates Requirement 15.2: object `appearance` có đủ 6 token bắt
 *   buộc (`--primary`, `--background`, `--foreground`, `--card`,
 *   `--border`, `--ring`) và không chứa hex literal.
 */

describe("getPostAuthRedirect", () => {
  it("trả /profile khi search rỗng", () => {
    expect(getPostAuthRedirect("")).toBe("/profile");
  });

  it("trả /profile khi không có redirect_url", () => {
    expect(getPostAuthRedirect("?foo=bar")).toBe("/profile");
  });

  it("trả path nội bộ hợp lệ", () => {
    expect(getPostAuthRedirect("?redirect_url=%2Fbat-tu")).toBe("/bat-tu");
    expect(getPostAuthRedirect("?redirect_url=%2Fprofile%3Ftab%3Dsaved")).toBe(
      "/profile?tab=saved",
    );
  });

  it("chấp nhận leading `?` hoặc không", () => {
    expect(getPostAuthRedirect("redirect_url=%2Fxem-que")).toBe("/xem-que");
    expect(getPostAuthRedirect("?redirect_url=%2Fxem-que")).toBe("/xem-que");
  });

  it("chặn URL bên ngoài domain", () => {
    expect(getPostAuthRedirect("?redirect_url=https%3A%2F%2Fevil.com")).toBe(
      "/profile",
    );
    expect(getPostAuthRedirect("?redirect_url=http%3A%2F%2Fevil.com")).toBe(
      "/profile",
    );
  });

  it("chặn protocol-relative `//host`", () => {
    expect(getPostAuthRedirect("?redirect_url=%2F%2Fevil.com")).toBe("/profile");
  });

  it("trả /profile nếu redirect_url rỗng", () => {
    expect(getPostAuthRedirect("?redirect_url=")).toBe("/profile");
  });
});

describe("CLERK_APPEARANCE", () => {
  it("phủ đủ 6 token Color_Token bắt buộc (Req 15.2)", () => {
    const variables = CLERK_APPEARANCE.variables;
    expect(variables.colorPrimary).toContain("var(--primary)");
    expect(variables.colorBackground).toContain("var(--background)");
    expect(variables.colorText).toContain("var(--foreground)");
    expect(variables.colorInputBackground).toContain("var(--card)");
    // `--border` và `--ring` được dùng qua `elements` className thay vì
    // `variables` (Clerk không expose token map cho border/ring trực tiếp).
    expect(JSON.stringify(CLERK_APPEARANCE.elements)).toContain("border-border");
    expect(JSON.stringify(CLERK_APPEARANCE.elements)).toContain("ring-ring");
  });

  it("không chứa hex literal trong variables / elements", () => {
    const dump = JSON.stringify(CLERK_APPEARANCE);
    expect(dump).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });
});
