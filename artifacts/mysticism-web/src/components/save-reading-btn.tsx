import { useState } from "react";
import { useUser } from "@clerk/react";
import { useLocation } from "wouter";
import { readingsApi } from "@/lib/readings-api";
import { cn } from "@/lib/utils";
import { isClerkEnabled } from "@/lib/auth-config";

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
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    if (!isSignedIn) {
      setLocation("/sign-in");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await readingsApi.save({ module, title, input_data: inputData, result_data: resultData });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setError(e.message ?? "Lỗi lưu");
    } finally {
      setSaving(false);
    }
  }

  if (!isLoaded) return null;

  if (variant === "icon") {
    return (
      <button
        onClick={handleSave}
        disabled={saving}
        title={isSignedIn ? "Lưu lá số" : "Đăng nhập để lưu"}
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
    );
  }

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <button
        onClick={handleSave}
        disabled={saving}
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
        ) : saving ? (
          <>
            <div className="w-4 h-4 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
            Đang lưu...
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
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
