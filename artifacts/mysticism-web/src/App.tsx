import { lazy, Suspense, useEffect, useRef } from "react";
import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { ClerkProvider, Show, useClerk, useUser } from "@clerk/react";
import { viVN } from "@clerk/localizations";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { LazyMotion, MotionConfig, domAnimation } from "framer-motion";
import { isClerkEnabled } from "@/lib/auth-config";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AISettingsProvider } from "@/contexts/ai-settings";
import { ThemeProvider } from "@/contexts/theme";
import Home from "@/pages/home";
import SignInPage from "@/pages/sign-in";
import SignUpPage from "@/pages/sign-up";

const NotFound = lazy(() => import("@/pages/not-found"));
const NumerologyPage = lazy(() => import("@/pages/than-so-hoc"));
const BatuPage = lazy(() => import("@/pages/bat-tu"));
const IChingPage = lazy(() => import("@/pages/xem-que"));
const AIChatPage = lazy(() => import("@/pages/ai-chat"));
const CatHungPage = lazy(() => import("@/pages/cat-hung"));
const LichVanNienPage = lazy(() => import("@/pages/lich-van-nien"));
const TuViPage = lazy(() => import("@/pages/tu-vi"));
const PhongThuyPage = lazy(() => import("@/pages/phong-thuy"));
const XemTenPage = lazy(() => import("@/pages/xem-ten"));
const LichCaNhanPage = lazy(() => import("@/pages/lich-ca-nhan"));
const TuDienPage = lazy(() => import("@/pages/tu-dien"));
const HopTuoiPage = lazy(() => import("@/pages/hop-tuoi"));
const XemNgayTotPage = lazy(() => import("@/pages/xem-ngay-tot"));
const SaoHanPage = lazy(() => import("@/pages/sao-han"));
const LichSuPage = lazy(() => import("@/pages/lich-su"));
const ProfilePage = lazy(() => import("@/pages/profile"));
const ShareViewPage = lazy(() => import("@/pages/share-view"));

/**
 * Trang nội bộ `/dev/design-tokens` chỉ tồn tại trong build môi trường dev
 * (Requirement 20.3). `import.meta.env.DEV` được Vite thay thế bằng literal
 * `true` / `false` lúc build, nên ở production cả ternary lẫn dynamic import
 * bên dưới đều được dead-code-eliminate và Vite không phát chunk tương ứng.
 *
 * Hệ quả: production bundle không chứa chuỗi `design-tokens` — thoả mãn
 * lint rule `build-assertion` trong `scripts/lint-design-system.ts`.
 */
const DesignTokensDevPage = import.meta.env.DEV
  ? lazy(() => import("@/pages/dev/design-tokens"))
  : null;

const PAGE_TITLES: Record<string, string> = {
  "/": "Huyền Bí — Khám Phá Vận Mệnh",
  "/than-so-hoc": "Thần Số Học — Huyền Bí",
  "/bat-tu": "Bát Tự Tứ Trụ — Huyền Bí",
  "/xem-que": "Xem Quẻ I Ching — Huyền Bí",
  "/cat-hung": "Cát Hung — Huyền Bí",
  "/lich-van-nien": "Lịch Vạn Niên — Huyền Bí",
  "/tu-vi": "Tử Vi Đẩu Số — Huyền Bí",
  "/ai-chat": "Trợ Lý AI — Huyền Bí",
  "/phong-thuy": "Phong Thuỷ Hướng Nhà — Huyền Bí",
  "/xem-ten": "Xem Tên — Huyền Bí",
  "/lich-ca-nhan": "Lịch Cá Nhân — Huyền Bí",
  "/tu-dien": "Từ Điển Huyền Học — Huyền Bí",
  "/hop-tuoi": "Hợp Tuổi & Duyên Số — Huyền Bí",
  "/xem-ngay-tot": "Xem Ngày Tốt — Huyền Bí",
  "/sao-han": "Sao Hạn Hàng Năm — Huyền Bí",
  "/lich-su": "Lịch Sử Tra Cứu — Huyền Bí",
  "/profile": "Hồ Sơ — Huyền Bí",
  "/sign-in": "Đăng Nhập — Huyền Bí",
  "/sign-up": "Đăng Ký — Huyền Bí",
};

function PageTitleUpdater() {
  const [location] = useLocation();
  useEffect(() => {
    const base = location.split("?")[0].replace(/\/$/, "") || "/";
    const title = PAGE_TITLES[base] ?? "Huyền Bí — Huyền Học Việt Nam";
    document.title = title;
  }, [location]);
  return null;
}

function PageFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <p className="text-xs text-muted-foreground tracking-widest uppercase">Đang tải...</p>
      </div>
    </div>
  );
}
import { PwaInstallPrompt } from "@/components/pwa-install-prompt";
import { MysticCursor } from "@/components/mystic-cursor";
import { AmbientBg } from "@/components/ambient-bg";

/**
 * Các route được phép mount {@link AmbientBg}: trang chủ và 15
 * Module_Page (Requirement 10.8).
 *
 * Lift mount lên router để cùng một instance tồn tại liên tục giữa các
 * điều hướng trong nhóm này — giảm flicker và đảm bảo các route khác
 * (sign-in, sign-up, profile, share, lịch sử thuần dữ liệu, 404) hoàn
 * toàn không có ambient layer như Property 4 yêu cầu.
 */
const AMBIENT_ROUTES: ReadonlySet<string> = new Set([
  "/",
  "/than-so-hoc",
  "/bat-tu",
  "/xem-que",
  "/cat-hung",
  "/lich-van-nien",
  "/tu-vi",
  "/phong-thuy",
  "/xem-ten",
  "/lich-ca-nhan",
  "/tu-dien",
  "/hop-tuoi",
  "/xem-ngay-tot",
  "/sao-han",
  "/lich-su",
  "/ai-chat",
]);

/**
 * Chuẩn hoá pathname — bỏ query string và trailing slash — trước khi
 * match vào {@link AMBIENT_ROUTES}.
 */
function normalizeRoute(location: string): string {
  const base = location.split("?")[0];
  if (base.length > 1 && base.endsWith("/")) {
    return base.slice(0, -1);
  }
  return base || "/";
}

/**
 * Render {@link AmbientBg} chỉ khi route hiện tại nằm trong danh sách
 * cho phép. Đặt cạnh router (trong cùng `<WouterRouter>`) để `useLocation`
 * trả về pathname đã trừ `basePath`, khớp đúng các literal trong
 * {@link AMBIENT_ROUTES}.
 */
function AmbientBgGate() {
  const [location] = useLocation();
  const route = normalizeRoute(location);
  if (!AMBIENT_ROUTES.has(route)) return null;
  return <AmbientBg />;
}
import { SkipLink } from "@/components/ui/skip-link";
import { RootErrorBoundary } from "@/components/root-error-boundary";

const queryClient = new QueryClient();

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
// Proxy chỉ dùng khi VITE_CLERK_PROXY_URL được set rõ ràng.
// Với custom domain VPS + production keys, KHÔNG cần proxy — Clerk load thẳng từ CDN.
// Proxy cần thiết cho Replit.app deployments (không có DNS CNAME).
const clerkProxyUrl: string | undefined = import.meta.env.VITE_CLERK_PROXY_URL || undefined;
const basePath = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath) ? path.slice(basePath.length) || "/" : path;
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

function Router() {
  return (
    <>
      <PageTitleUpdater />
      {/*
        Phần tử `<main id="main">` ở cấp router đảm bảo skip link
        (`<SkipLink />` mount trong {@link App}) có target hợp lệ trên
        MỌI route — kể cả các trang không tự render `<main>` của riêng
        mình. `tabIndex={-1}` cho phép phần tử nhận focus theo lập trình
        khi hash thay đổi, hỗ trợ WCAG 2.4.1 (Bỏ qua khối). Requirement 3.10.
      */}
      <main id="main" tabIndex={-1} className="outline-none">
        <Suspense fallback={<PageFallback />}>
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/sign-in/*?" component={SignInPage} />
            <Route path="/sign-up/*?" component={SignUpPage} />
            <Route path="/profile" component={ProfilePage} />
            <Route path="/than-so-hoc" component={NumerologyPage} />
            <Route path="/bat-tu" component={BatuPage} />
            <Route path="/xem-que" component={IChingPage} />
            <Route path="/cat-hung" component={CatHungPage} />
            <Route path="/lich-van-nien" component={LichVanNienPage} />
            <Route path="/tu-vi" component={TuViPage} />
            <Route path="/ai-chat" component={AIChatPage} />
            <Route path="/phong-thuy" component={PhongThuyPage} />
            <Route path="/xem-ten" component={XemTenPage} />
            <Route path="/lich-ca-nhan" component={LichCaNhanPage} />
            <Route path="/tu-dien" component={TuDienPage} />
            <Route path="/hop-tuoi" component={HopTuoiPage} />
            <Route path="/xem-ngay-tot" component={XemNgayTotPage} />
            <Route path="/sao-han" component={SaoHanPage} />
            <Route path="/lich-su" component={LichSuPage} />
            <Route path="/share/:token" component={ShareViewPage} />
            {import.meta.env.DEV && DesignTokensDevPage ? (
              <Route path="/dev/design-tokens" component={DesignTokensDevPage} />
            ) : null}
            <Route component={NotFound} />
          </Switch>
        </Suspense>
      </main>
    </>
  );
}

function AppContent() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AISettingsProvider>
          <AmbientBgGate />
          <Router />
          {/*
            Thứ tự mount cuối router (Requirement 5.9): `<PwaInstallPrompt />`
            và `<MysticCursor />` render trước `<Toaster />` để toast sonner
            (region `aria-live`) chiếm layer cuối cùng trong cây React.
            Nhờ đó toast luôn xuất hiện đè lên banner cài PWA và canvas cursor,
            không bị che hoặc chặn pointer event từ các overlay phía trên.
          */}
          <PwaInstallPrompt />
          <MysticCursor />
          <Toaster />
        </AISettingsProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey!}
      proxyUrl={clerkProxyUrl}
      localization={viVN}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <AISettingsProvider>
            <AmbientBgGate />
            <Router />
            {/*
              Thứ tự mount cuối router (Requirement 5.9): `<PwaInstallPrompt />`
              và `<MysticCursor />` render trước `<Toaster />` để toast sonner
              (region `aria-live`) chiếm layer cuối cùng trong cây React.
              Nhờ đó toast luôn xuất hiện đè lên banner cài PWA và canvas cursor,
              không bị che hoặc chặn pointer event từ các overlay phía trên.
            */}
            <PwaInstallPrompt />
            <MysticCursor />
            <Toaster />
          </AISettingsProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <LazyMotion features={domAnimation}>
      <MotionConfig reducedMotion="user">
        <ThemeProvider>
          <RootErrorBoundary>
            <SkipLink />
            <WouterRouter base={basePath}>
              {isClerkEnabled ? <ClerkProviderWithRoutes /> : <AppContent />}
            </WouterRouter>
          </RootErrorBoundary>
        </ThemeProvider>
      </MotionConfig>
    </LazyMotion>
  );
}

export default App;
