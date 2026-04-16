import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { Navbar } from "@/components/layout/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { readingsApi, type SavedReading } from "@/lib/readings-api";
import { storeReopenData } from "@/lib/reopen-reading";
import { useLocation } from "wouter";

const MODULE_LABELS: Record<string, string> = {
  "than-so-hoc": "Thần Số Học",
  "bat-tu": "Bát Tự Tứ Trụ",
  "xem-que": "Xem Quẻ I Ching",
  "cat-hung": "Xem Cát Hung",
  "tu-vi": "Tử Vi Đẩu Số",
  "phong-thuy": "Phong Thuỷ",
  "xem-ten": "Xem Tên",
  "lich-ca-nhan": "Lịch Cá Nhân",
  "hop-tuoi": "Hợp Tuổi",
  "xem-ngay-tot": "Xem Ngày Tốt",
  "sao-han": "Sao Hạn",
};

const FIELD_LABELS: Record<string, string> = {
  hoTen: "Họ và tên",
  ngaySinh: "Ngày sinh",
  dob: "Ngày sinh",
  dob1: "Ngày sinh người 1",
  dob2: "Ngày sinh người 2",
  gioiTinh: "Giới tính",
  gioiTinh1: "Giới tính người 1",
  gioiTinh2: "Giới tính người 2",
  namSinh: "Năm sinh",
  gioSinh: "Giờ sinh",
  ngay: "Ngày",
  thang: "Tháng",
  nam: "Năm",
  gio: "Giờ",
  mucDich: "Mục đích",
  soDienThoai: "Số điện thoại",
  tenChuSo: "Tên chủ số",
  bienSo: "Biển số",
  duongDoi: "Số Đường Đời",
  suMenh: "Số Sứ Mệnh",
  linhHon: "Số Linh Hồn",
  nhanCach: "Số Nhân Cách",
  menhCuc: "Mệnh Cục",
  nguHanhCuc: "Ngũ Hành",
  canNam: "Can Năm",
  chiNam: "Chi Năm",
  ketQua: "Kết quả",
  moTa: "Mô tả",
  gio_thien_can: "Giờ — Thiên Can",
  gio_dia_chi: "Giờ — Địa Chi",
  nguHanhChu: "Ngũ Hành chủ",
};

function formatValue(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "object") return JSON.stringify(v, null, 2);
  return String(v);
}

function DataTable({ data, title }: { data: Record<string, unknown>; title: string }) {
  const entries = Object.entries(data).filter(([, v]) => v !== null && v !== undefined && v !== "");
  if (!entries.length) return null;
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-widest text-primary/60 mb-3">{title}</h3>
      <div className="space-y-2">
        {entries.map(([k, v]) => (
          <div key={k} className="flex items-start gap-3 text-sm border-b border-border/20 pb-2">
            <span className="text-muted-foreground w-40 shrink-0">{FIELD_LABELS[k] ?? k}</span>
            <span className="text-foreground/90 font-medium">{formatValue(v)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ShareViewPage() {
  const { token } = useParams<{ token: string }>();
  const [, setLocation] = useLocation();
  const [reading, setReading] = useState<SavedReading | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    readingsApi.getShared(token)
      .then(setReading)
      .catch(() => setError("Liên kết không hợp lệ hoặc đã hết hạn."))
      .finally(() => setLoading(false));
  }, [token]);

  const handleReopen = () => {
    if (!reading) return;
    storeReopenData(reading.module, reading.input_data);
    setLocation(`/${reading.module}`);
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none" />
      <Navbar />

      <main className="flex-1 container mx-auto px-4 pt-24 pb-16 z-10 relative">
        <div className="max-w-2xl mx-auto space-y-8">

          {loading && (
            <div className="text-center py-24 space-y-3">
              <div className="text-3xl text-primary/30 animate-pulse">◈</div>
              <p className="text-muted-foreground">Đang tải lá số...</p>
            </div>
          )}

          {error && (
            <Card className="bg-card/40 backdrop-blur-sm border-red-500/30 text-center py-12">
              <CardContent>
                <div className="text-4xl mb-3">🔮</div>
                <p className="text-red-400 font-semibold mb-2">Không thể tải lá số</p>
                <p className="text-muted-foreground text-sm mb-6">{error}</p>
                <Link href="/">
                  <button className="px-4 py-2 rounded-xl border border-primary/30 text-primary text-sm hover:bg-primary/10 transition-all">
                    Về trang chủ
                  </button>
                </Link>
              </CardContent>
            </Card>
          )}

          {reading && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="text-center space-y-2">
                <p className="text-xs tracking-[0.3em] uppercase text-primary/60">Lá số được chia sẻ</p>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground">{reading.title}</h1>
                <p className="text-muted-foreground text-sm">
                  {MODULE_LABELS[reading.module] ?? reading.module}
                  {" · "}
                  {new Date(reading.created_at).toLocaleDateString("vi-VN", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                </p>
              </div>

              <Card className="bg-card/40 backdrop-blur-sm border-primary/25">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold text-primary/80 uppercase tracking-wider">
                    Thông tin đầu vào
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <DataTable data={reading.input_data} title="" />
                </CardContent>
              </Card>

              {reading.result_data && Object.keys(reading.result_data).length > 0 && (
                <Card className="bg-card/40 backdrop-blur-sm border-primary/25">
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold text-primary/80 uppercase tracking-wider">
                      Kết quả luận giải
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DataTable data={reading.result_data} title="" />
                  </CardContent>
                </Card>
              )}

              <div className="flex flex-wrap gap-3 justify-center pt-2">
                <button
                  onClick={handleReopen}
                  className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all"
                >
                  Tra cứu lại với thông tin này
                </button>
                <Link href={`/${reading.module}`}>
                  <button className="px-6 py-2.5 rounded-xl border border-primary/30 text-primary text-sm hover:bg-primary/10 transition-all">
                    Mở {MODULE_LABELS[reading.module] ?? "module"}
                  </button>
                </Link>
              </div>

              <p className="text-center text-xs text-muted-foreground/50 pb-4">
                Mọi luận giải chỉ mang tính tham khảo · Huyền Bí
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
