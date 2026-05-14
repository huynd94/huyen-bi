import { useCallback, useRef, useState } from "react";
import { useUser } from "@clerk/react";
import { useLocation } from "wouter";
import { Bookmark, Check } from "lucide-react";

import { readingsApi } from "@/lib/readings-api";
import { cn } from "@/lib/utils";
import { isClerkEnabled } from "@/lib/auth-config";
import { showToast } from "@/lib/toast";
import { ERROR_MESSAGES } from "@/lib/error-messages";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * Props của {@link SaveReadingBtn}.
 *
 * - `module`, `title`, `inputData`, `resultData`: payload gửi tới
 *   `POST /api/readings` (xem `readingsApi.save`).
 * - `variant`: `"full"` (mặc định) hiển thị nút đầy đủ với label tiếng
 *   Việt; `"icon"` hiển thị nút icon vuông gọn cho action group ở
 *   header Result_Card.
 * - `className`: tuỳ biến container ngoài cùng.
 */
interface SaveReadingBtnProps {
  module: string;
  title: string;
  inputData?: Record<string, unknown>;
  resultData?: Record<string, unknown>;
  className?: string;
  variant?: "icon" | "full";
}

/**
 * Nút "Lưu lá số" áp dụng quy tắc UX/UI Upgrade:
 *
 * - **Requirement 8.7** — Khi user **chưa đăng nhập** (Clerk
 *   `useUser().isSignedIn === false`), click sẽ mở `Dialog` tiếng
 *   Việt giải thích cần đăng nhập, kèm 2 nút "Đăng nhập" và "Để
 *   sau". Nút "Đăng nhập" dẫn tới `/sign-in?redirect_url=...` với
 *   path hiện tại được encode để Clerk trả người dùng về đúng trang
 *   ngay sau khi xác thực.
 * - **Requirement 11.3** — Khi đã đăng nhập, áp dụng **optimistic
 *   update**: button chuyển sang trạng thái "Đã lưu vào hồ sơ" ngay
 *   lập tức (không chờ network) cho phép user cảm nhận phản hồi
 *   tức thì. Nếu API thất bại, UI rollback và một toast lỗi tiếng
 *   Việt hiện lên kèm CTA "Thử lại" để user gọi lại cùng request
 *   (xem `showToast({ retry })` trong `src/lib/toast.ts`).
 * - **Requirement 1.1 / 2.1** — Mọi màu sắc dùng semantic
 *   `--primary` token, không hard-code hex / rgb / palette ngoài
 *   token registry.
 * - **Requirement 10.3** — Button bo `rounded-md` (`--radius-md`),
 *   không dùng `rounded-2xl` đồng nhất.
 *
 * Khi Clerk publishable key chưa được cấu hình
 * (`isClerkEnabled === false`), component **không render** — phù
 * hợp với phương án "tài khoản tạm thời chưa khả dụng" của
 * Requirement 15.4 và tránh dẫn user vào flow lưu không hoạt động.
 */
export function SaveReadingBtn(props: SaveReadingBtnProps) {
  if (!isClerkEnabled) return null;
  return <SaveReadingBtnInner {...props} />;
}

function SaveReadingBtnInner({
  module,
  title,
  inputData = {},
  resultData = {},
  className,
  variant = "full",
}: SaveReadingBtnProps) {
  const { isSignedIn, isLoaded } = useUser();
  const [, setLocation] = useLocation();

  // Trạng thái UI đã lưu — optimistic. Set ngay khi click (auth) và
  // rollback nếu request POST /api/readings thất bại (Req 11.3).
  const [saved, setSaved] = useState(false);
  // Trạng thái dialog "Đăng nhập để lưu lá số" cho user chưa đăng
  // nhập (Req 8.7).
  const [signInDialogOpen, setSignInDialogOpen] = useState(false);
  // Timer reset trạng thái "Đã lưu" sau 3s — giữ ref để có thể clear
  // khi user save lại nhanh hoặc khi rollback toast.
  const successResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // In-flight guard: tránh user click nhiều lần liên tục tạo nhiều
  // request POST /api/readings cùng payload. Dùng ref thay vì state
  // để không bị bắt trong closure cũ của onClick handler.
  const inFlight = useRef(false);

  const clearSuccessTimer = useCallback(() => {
    if (successResetTimer.current !== null) {
      clearTimeout(successResetTimer.current);
      successResetTimer.current = null;
    }
  }, []);

  const performSave = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;

    // Snapshot trạng thái trước để rollback nếu cần (Req 11.3).
    const previousSaved = saved;
    clearSuccessTimer();
    // Optimistic: hiển thị "Đã lưu" ngay, không chờ network
    // (Req 11.3 / 5.2).
    setSaved(true);

    try {
      await readingsApi.save({
        module,
        title,
        input_data: inputData,
        result_data: resultData,
      });
      // Giữ saved=true và tự reset sau 3s để user thấy phản hồi rõ
      // mà nút vẫn quay lại trạng thái "có thể lưu lại" cho lần sau.
      successResetTimer.current = setTimeout(() => {
        setSaved(false);
        successResetTimer.current = null;
      }, 3000);
    } catch (_error) {
      // Rollback UI và surface toast lỗi tiếng Việt + CTA "Thử lại"
      // (Req 11.3 — surface toast khi optimistic update fail; Req 19.3
      // — microcopy sentence case "Thử lại").
      setSaved(previousSaved);
      showToast({
        variant: "error",
        title: "Không thể lưu lá số",
        description: "Vui lòng kiểm tra kết nối và thử lại.",
        retry: {
          onClick: () => {
            void performSave();
          },
        },
      });
    } finally {
      inFlight.current = false;
    }
  }, [clearSuccessTimer, inputData, module, resultData, saved, title]);

  const handleClick = useCallback(() => {
    if (!isSignedIn) {
      // Mở dialog tiếng Việt thay vì redirect thẳng (Req 8.7).
      setSignInDialogOpen(true);
      return;
    }
    void performSave();
  }, [isSignedIn, performSave]);

  const goToSignIn = useCallback(() => {
    setSignInDialogOpen(false);
    // Bảo toàn route hiện tại để Clerk trả user về đúng trang sau khi
    // xác thực — đồng nhất với `<SignIn fallbackRedirectUrl>` ở
    // `src/pages/sign-in.tsx`. Trên môi trường happy-dom dùng cho test
    // `window.location` luôn tồn tại; defensive guard cho SSR/edge.
    const here =
      typeof window !== "undefined"
        ? `${window.location.pathname}${window.location.search}`
        : "/";
    const target = `/sign-in?redirect_url=${encodeURIComponent(here)}`;
    setLocation(target);
  }, [setLocation]);

  if (!isLoaded) return null;

  // Dialog "Đăng nhập để lưu lá số" — Req 8.7. Radix tự bẫy focus,
  // gắn `role="dialog"` + `aria-modal="true"` và trả focus về trigger
  // sau khi đóng (xem `Dialog` primitive). Title + Description liên
  // kết tự động qua `aria-labelledby` / `aria-describedby`.
  const signInDialog = (
    <Dialog open={signInDialogOpen} onOpenChange={setSignInDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cần đăng nhập để lưu lá số</DialogTitle>
          <DialogDescription>
            {ERROR_MESSAGES.unauth_save} Bạn có thể tạo tài khoản miễn phí
            trong vài giây.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => setSignInDialogOpen(false)}
          >
            Để sau
          </Button>
          <Button onClick={goToSignIn}>Đăng nhập</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const savedLabel = isSignedIn ? "Lưu lá số" : "Đăng nhập để lưu";
  const ariaPressed = isSignedIn ? saved : undefined;

  if (variant === "icon") {
    return (
      <>
        <button
          type="button"
          onClick={handleClick}
          title={saved ? "Đã lưu vào hồ sơ" : savedLabel}
          aria-label={saved ? "Đã lưu vào hồ sơ" : savedLabel}
          aria-pressed={ariaPressed}
          className={cn(
            "w-8 h-8 rounded-md border flex items-center justify-center transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            saved
              ? "border-primary bg-primary/15 text-primary"
              : "border-primary/30 text-primary/70 hover:border-primary hover:text-primary hover:bg-primary/10",
            className,
          )}
        >
          {saved ? (
            <Check aria-hidden="true" className="h-4 w-4" />
          ) : (
            <Bookmark aria-hidden="true" className="h-4 w-4" />
          )}
        </button>
        {signInDialog}
      </>
    );
  }

  return (
    <>
      <div className={cn("flex flex-col gap-1", className)}>
        <button
          type="button"
          onClick={handleClick}
          aria-pressed={ariaPressed}
          className={cn(
            "inline-flex items-center gap-2 px-4 py-2 min-h-11 rounded-md border text-sm font-medium transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            saved
              ? "border-primary bg-primary/15 text-primary"
              : "border-primary/30 text-primary hover:border-primary hover:bg-primary/10",
          )}
        >
          {saved ? (
            <>
              <Check aria-hidden="true" className="h-4 w-4" />
              Đã lưu vào hồ sơ
            </>
          ) : (
            <>
              <Bookmark aria-hidden="true" className="h-4 w-4" />
              {savedLabel}
            </>
          )}
        </button>
      </div>
      {signInDialog}
    </>
  );
}
