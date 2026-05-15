import { SignUp } from "@clerk/react";
import { Link } from "wouter";

import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { ClerkConfigBanner } from "@/components/clerk-config-banner";
import { isClerkEnabled } from "@/lib/auth-config";
import {
  CLERK_APPEARANCE,
  getPostAuthRedirect,
} from "@/lib/clerk-appearance";

const basePath = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

/**
 * Trang `/sign-up` — đăng ký bằng widget Clerk.
 *
 * Hành vi (Requirement 15.1, 15.2, 15.3, 15.5):
 *
 * - **15.1**: Render `<SignUp />`. `localizations` tiếng Việt được áp
 *   dụng cấp `<ClerkProvider />` ở `App.tsx` (xem `viVN` từ
 *   `@clerk/localizations`).
 * - **15.2**: Theme widget khớp Color_Token qua {@link CLERK_APPEARANCE}
 *   (dùng chung với `/sign-in`). Tất cả giá trị màu là biểu thức
 *   `hsl(var(--token))` để cascade theo theme light/dark hiện tại.
 * - **15.3**: Sau khi đăng ký thành công, Clerk điều hướng tới giá trị
 *   từ {@link getPostAuthRedirect} (query `redirect_url`, fallback
 *   `/profile`).
 * - **15.5**: Liên kết "Đã có tài khoản? Đăng nhập" được render bởi
 *   widget thông qua localizations + bản phụ trợ ngoài widget (giữ lối
 *   thoát khi banner thay thế widget vì thiếu publishable key).
 * - **15.4**: Khi `isClerkEnabled` là `false`, render
 *   `<ClerkConfigBanner />` thay cho widget.
 *
 * Layout:
 *
 * - Breadcrumb đầu trang (Requirement 7.4) — `/sign-up` đã được thêm
 *   vào `ROUTE_MAP` của `breadcrumb.tsx`.
 * - Một `<h1>` duy nhất (Requirement 1.4): "Đăng ký".
 * - Semantic tokens, không hex (Requirement 1.1).
 *
 * Validates: Requirements 15.1, 15.2, 15.3, 15.5.
 */
export default function SignUpPage() {
  const redirectUrl = getPostAuthRedirect();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main
        id="main"
        tabIndex={-1}
        className="flex-1 px-4 pt-20 pb-16 outline-none"
      >
        <div className="max-w-md mx-auto space-y-6">
          <Breadcrumb />

          <header className="text-center space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-primary/60">
              Tài khoản
            </p>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              Đăng ký
            </h1>
            <p className="text-sm text-muted-foreground">
              Tạo tài khoản để lưu lá số cá nhân
            </p>
          </header>

          {!isClerkEnabled ? (
            <ClerkConfigBanner />
          ) : (
            <SignUp
              routing="path"
              path={`${basePath}/sign-up`}
              signInUrl={`${basePath}/sign-in?redirect_url=${encodeURIComponent(redirectUrl)}`}
              fallbackRedirectUrl={`${basePath}${redirectUrl}`}
              forceRedirectUrl={`${basePath}${redirectUrl}`}
              appearance={CLERK_APPEARANCE}
            />
          )}

          <p className="text-center text-sm text-muted-foreground">
            Đã có tài khoản?{" "}
            <Link
              href={`/sign-in?redirect_url=${encodeURIComponent(redirectUrl)}`}
              className="text-primary hover:text-primary/80 underline-offset-4 hover:underline"
            >
              Đăng nhập
            </Link>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
