import { SignIn } from "@clerk/react";
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
 * Trang `/sign-in` — đăng nhập bằng widget Clerk.
 *
 * Hành vi (Requirement 15.1, 15.2, 15.3, 15.5):
 *
 * - **15.1**: Render `<SignIn />` từ `@clerk/react`. `localizations`
 *   tiếng Việt (`viVN` từ `@clerk/localizations`) đã được áp dụng cấp
 *   `<ClerkProvider />` ở `App.tsx`, nên widget thừa kế ngay mà không
 *   cần truyền lại trong từng page.
 * - **15.2**: Theme widget khớp Color_Token qua object
 *   {@link CLERK_APPEARANCE} — đặt trong `src/lib/clerk-appearance.ts`
 *   để dùng chung với `/sign-up`. Mọi giá trị màu là biểu thức
 *   `hsl(var(--token))`, không hex literal — bám đúng quy ước design
 *   tokens (Requirement 1.1) và không chạm lint rule `no-hex-in-tsx`.
 * - **15.3**: Sau khi đăng nhập thành công, Clerk điều hướng tới giá
 *   trị từ {@link getPostAuthRedirect} — đọc query `redirect_url`,
 *   fallback `/profile` (chặn open-redirect ngoài domain).
 * - **15.5**: Liên kết "Quên mật khẩu" / "Chưa có tài khoản? Đăng ký"
 *   được Clerk widget tự render thông qua `localizations` viVN. Phía
 *   page bổ sung cụm dẫn dẫn dưới widget cho user thoát khỏi form
 *   (về trang chủ hoặc xem 15 mô-đun mà không cần đăng nhập).
 * - **15.4**: Khi `isClerkEnabled` là `false` (thiếu publishable key),
 *   thay vì redirect, page hiển thị `<ClerkConfigBanner />` — vẫn giữ
 *   layout (Navbar / Breadcrumb / Footer) để user dễ điều hướng.
 *
 * Layout:
 *
 * - Breadcrumb đầu trang (Requirement 7.4) — đã thêm `/sign-in` vào
 *   `ROUTE_MAP` của `breadcrumb.tsx`.
 * - Một và chỉ một `<h1>` (Requirement 1.4): "Đăng nhập".
 * - Toàn bộ màu/typography neo vào semantic tokens (Requirement 1.1),
 *   không hex.
 *
 * Validates: Requirements 15.1, 15.2, 15.3, 15.5 (cùng 1.4, 7.4 cho
 * a11y / cấu trúc heading).
 */
export default function SignInPage() {
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
              Đăng nhập
            </h1>
            <p className="text-sm text-muted-foreground">
              Đăng nhập để lưu lá số và chia sẻ kết quả
            </p>
          </header>

          {!isClerkEnabled ? (
            <ClerkConfigBanner />
          ) : (
            <SignIn
              routing="path"
              path={`${basePath}/sign-in`}
              signUpUrl={`${basePath}/sign-up?redirect_url=${encodeURIComponent(redirectUrl)}`}
              fallbackRedirectUrl={`${basePath}${redirectUrl}`}
              forceRedirectUrl={`${basePath}${redirectUrl}`}
              appearance={CLERK_APPEARANCE}
            />
          )}

          {/*
           * Phụ trợ điều hướng (Requirement 15.5):
           *
           * - "Chưa có tài khoản? Đăng ký" — Clerk widget cũng tự render
           *   link này thông qua localizations, nhưng giữ thêm bản tiếng
           *   Việt sentence-case ngoài widget để khi banner thay thế
           *   widget (`!isClerkEnabled`) vẫn có lối thoát.
           * - "Quên mật khẩu" được Clerk widget render mặc định trong
           *   bước nhập mật khẩu; không cần lặp ngoài widget.
           */}
          <p className="text-center text-sm text-muted-foreground">
            Chưa có tài khoản?{" "}
            <Link
              href={`/sign-up?redirect_url=${encodeURIComponent(redirectUrl)}`}
              className="text-primary hover:text-primary/80 underline-offset-4 hover:underline"
            >
              Đăng ký
            </Link>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
