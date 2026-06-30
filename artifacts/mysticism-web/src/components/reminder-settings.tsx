import { useEffect, useState } from "react";
import { BellRing } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { showToast } from "@/lib/toast";
import {
  getNotificationPermission,
  isPushSupported,
  pushApi,
  type ReminderPrefs,
} from "@/lib/push-client";

/**
 * Reminder settings card for the profile page.
 *
 * Lets a signed-in user enable Web Push reminders ("vận hôm nay" + sao hạn),
 * choose the daily send hour, and toggle each reminder type. All state is
 * persisted server-side (account-scoped) via {@link pushApi}; the device's push
 * subscription is created/removed through the service worker.
 */
export function ReminderSettings() {
  const supported = isPushSupported();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [prefs, setPrefs] = useState<ReminderPrefs | null>(null);
  const [permission, setPermission] = useState(getNotificationPermission());

  useEffect(() => {
    if (!supported) {
      setLoading(false);
      return;
    }
    pushApi
      .getPrefs()
      .then(setPrefs)
      .catch(() => setPrefs(null))
      .finally(() => setLoading(false));
  }, [supported]);

  if (!supported) {
    return (
      <Card className="border-primary/15 bg-card/40">
        <CardHeader className="flex flex-row items-center gap-3">
          <BellRing aria-hidden="true" className="h-5 w-5 text-primary" />
          <div>
            <h2 className="text-base font-semibold">Nhắc nhở vận hạn</h2>
            <p className="text-sm text-muted-foreground">
              Trình duyệt này chưa hỗ trợ thông báo đẩy. Hãy cài đặt ứng dụng
              (PWA) hoặc dùng Chrome/Edge/Firefox để bật nhắc nhở.
            </p>
          </div>
        </CardHeader>
      </Card>
    );
  }

  const subscribed = prefs?.subscribed ?? false;

  async function handleEnable() {
    setBusy(true);
    try {
      await pushApi.enable();
      setPermission(getNotificationPermission());
      const fresh = await pushApi.getPrefs();
      setPrefs(fresh);
      showToast({ variant: "success", title: "Đã bật nhắc nhở", description: "Bạn sẽ nhận vận hôm nay mỗi ngày." });
    } catch (err) {
      showToast({
        variant: "error",
        title: "Không thể bật nhắc nhở",
        description: err instanceof Error ? err.message : "Vui lòng thử lại.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleDisable() {
    setBusy(true);
    try {
      await pushApi.disable();
      await pushApi.updatePrefs({ dailyFortune: false, saoHan: false });
      const fresh = await pushApi.getPrefs();
      setPrefs({ ...fresh, subscribed: false });
      showToast({ variant: "info", title: "Đã tắt nhắc nhở" });
    } catch (err) {
      showToast({
        variant: "error",
        title: "Không thể tắt nhắc nhở",
        description: err instanceof Error ? err.message : "Vui lòng thử lại.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function patch(payload: Partial<ReminderPrefs>) {
    if (!prefs) return;
    const next = { ...prefs, ...payload };
    setPrefs(next);
    try {
      await pushApi.updatePrefs(payload);
    } catch {
      // Revert optimistic update on failure.
      setPrefs(prefs);
      showToast({ variant: "error", title: "Lưu cài đặt thất bại" });
    }
  }

  return (
    <Card className="border-primary/15 bg-card/40">
      <CardHeader className="flex flex-row items-center gap-3">
        <BellRing aria-hidden="true" className="h-5 w-5 text-primary" />
        <div className="flex-1">
          <h2 className="text-base font-semibold">Nhắc nhở vận hạn</h2>
          <p className="text-sm text-muted-foreground">
            Nhận thông báo &quot;vận hôm nay&quot; theo Can Chi, Thần Số và sao
            hạn từ lá số đã lưu.
          </p>
        </div>
        {!loading && (
          <Button
            variant={subscribed ? "outline" : "default"}
            disabled={busy}
            onClick={subscribed ? handleDisable : handleEnable}
          >
            {subscribed ? "Tắt nhắc nhở" : "Bật nhắc nhở"}
          </Button>
        )}
      </CardHeader>

      {subscribed && prefs && (
        <CardContent className="space-y-4">
          {permission === "denied" && (
            <p className="text-sm text-destructive">
              Quyền thông báo đang bị chặn trong trình duyệt — hãy mở lại quyền
              cho trang này để nhận nhắc nhở.
            </p>
          )}

          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="reminder-daily" className="flex-1">
              Vận hôm nay (hàng ngày)
            </Label>
            <Switch
              id="reminder-daily"
              checked={prefs.dailyFortune}
              onCheckedChange={(v) => patch({ dailyFortune: v })}
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="reminder-saohan" className="flex-1">
              Cảnh báo sao hạn (từ lá số đã lưu)
            </Label>
            <Switch
              id="reminder-saohan"
              checked={prefs.saoHan}
              onCheckedChange={(v) => patch({ saoHan: v })}
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="reminder-hour" className="flex-1">
              Giờ nhận thông báo
            </Label>
            <Select
              value={String(prefs.sendHour)}
              onValueChange={(v) => patch({ sendHour: Number(v) })}
            >
              <SelectTrigger id="reminder-hour" className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 24 }, (_, h) => (
                  <SelectItem key={h} value={String(h)}>
                    {String(h).padStart(2, "0")}:00
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
