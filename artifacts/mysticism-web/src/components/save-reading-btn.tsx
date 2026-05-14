import { useCallback, useRef, useState } from "react";
import { useUser } from "@clerk/react";
import { useLocation } from "wouter";

import { readingsApi } from "@/lib/readings-api";
import { cn } from "@/lib/utils";
import { isClerkEnabled } from "@/lib/auth-config";
import { showToast } from "@/lib/toast";
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
 * - `variant`: `"full"` (default) hiển thị nút đầy đủ với label tiếng
 *   Việt; `"icon"` hiển thị icon nhỏ vuông cho action group ở header.
 *
 * Behaviour (Requirements 8.7, 11.3):
 * - Khi user **chưa đăng nhập** (Clerk `useUser().isSignedIn === false`),
 *   click sẽ mở `Dialog` tiếng Việt với 2 nút "Đăng nhập" / "Để sau"
 *   (Requirement 8.7).
 * - Khi đã đăng nhập, áp dụng **optimistic update** (Requirement 11.3):
 *   button chuyển sang trạng thái "Đã lưu vào hồ sơ" ngay lập tức,
 *   không chờ network. Nếu API thất bại, UI rollback và toast lỗi
 *   tiếng Việt hiện lên kèm CTA "Thử lại" (gọi lại cùng request).
 */
interface SaveReadingBtnProps {
  module: string;
  title: string;
  inputData?: Record<string, unknown>;
  resultData?: Record<string, unknown>;
  className?: string;
  variant?: "icon" | "full";
}

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
  // Trạng thái dialog "Đăng nhập để lưu lá số" cho user chưa đăng nhập (Req 8.7).
  const [signInDialogOpen, setSignInDialogOpen] = useState(false);
  // Timer reset trạng thái "Đã lưu" sau 3s — giữ ref để có thể clear khi
  // user save lại nhanh hoặc khi rollback.
  const successResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearSuccessTimer = useCallback(() => {
    if (successResetTimer.current !== null) {
      clearTimeout(successResetTimer.current);
      successResetTimer.current = null;
    }
  }, []);

  const performSave = useCallback(async () => {
    // Snapshot trạng thái trước để rollback nếu cần.
    const previousSaved = saved;
    clearSuccessTimer();
    // Optimistic: hiển thị "Đã lưu" ngay, không chờ network (Req 11.3 / 5.2).
    setSaved(true);

    try {
      await readingsApi.save({
        module,
        title,
        input_data: inputData,
        result_data: resultData,
      });
      // Giữ saved=true và tự reset sau 3s để user thấy phản hồi rõ.
      successResetTimer.current = setTimeout(() => {
        setSaved(false);
        successResetTimer.current = null;
      }, 3000);
    } catch (_error) {
      // Rollback UI và surface toast lỗi tiếng Việt + CTA "Thử lại" (Req 11.3, 19.3).
      setSaved(previousSaved);
      showToast({
        variant: "error",
        title: "Lưu thất bại — vui lòng thử lại",
        retry: {
          onClick: () => {
            void performSave();
          },
        },
      });
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

  if (!isLoaded) return null;

  const signInDialog = (
    <Dialog open={signInDialogOpen} onOpenChange={setSignInDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Đăng nhập để lưu lá số</DialogTitle>
          <DialogDescription>
            Bạn cần đăng nhập để lưu lá số vào hồ sơ. Bạn có thể tạo tài khoản
            miễn phí trong vài giây.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => setSignInDialogOpen(false)}
          >
            Để sau
          </Button>
          <Button
            onClick={() => {
              setSignInDialogOpen(false);
              setLocation("/sign-in");
            }}
          >
            Đăng nhập
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  if (variant === "icon") {
    return (
      <>
        <button
          type="button"
          onClick={handleClick}
          title={isSignedIn ? "Lưu lá số" : "Đăng nhập để lưu"}
          aria-label={isSignedIn ? "Lưu lá số" : "Đăng nhập để lưu"}
          className={cn(
            "w-8 h-8 rounded-lg border flex items-center justify-center transition-all",
            saved
              ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-400"
              : "border-primary/30 text-primary/60 hover:border-primary hover:text-primary hover:bg-primary/10",
            className,
          )}
        >
          {saved ? (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
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
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all",
            saved
              ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-400"
              : "border-primary/30 text-primary hover:border-primary hover:bg-primary/10",
          )}
        >
          {saved ? (
            <>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Đã lưu vào hồ sơ
            </>
          ) : (
            <>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              {isSignedIn ? "Lưu lá số" : "Đăng nhập để lưu"}
            </>
          )}
        </button>
      </div>
      {signInDialog}
    </>
  );
}
