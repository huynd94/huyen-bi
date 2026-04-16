import { SignIn } from "@clerk/react";
import { Redirect } from "wouter";
import { Navbar } from "@/components/layout/navbar";
import { AmbientBg } from "@/components/ambient-bg";
import { isClerkEnabled } from "@/lib/auth-config";

const basePath = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

export default function SignInPage() {
  if (!isClerkEnabled) return <Redirect to="/" />;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AmbientBg />
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4 pt-20 relative z-10">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary tracking-widest mb-2">HUYỀN BÍ</h1>
            <p className="text-muted-foreground text-sm">Đăng nhập để lưu lá số và chia sẻ kết quả</p>
          </div>
          <SignIn
            routing="path"
            path={`${basePath}/sign-in`}
            signUpUrl={`${basePath}/sign-up`}
            afterSignInUrl={`${basePath}/profile`}
          />
        </div>
      </div>
    </div>
  );
}
