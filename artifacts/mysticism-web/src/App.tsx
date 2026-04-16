import { lazy, Suspense, useEffect, useRef } from "react";
import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { ClerkProvider, Show, useClerk, useUser } from "@clerk/react";
import { viVN } from "@clerk/localizations";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { isClerkEnabled } from "@/lib/auth-config";
import { Toaster } from "@/components/ui/toaster";
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
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </>
  );
}

function AppContent() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AISettingsProvider>
          <Router />
          <Toaster />
          <PwaInstallPrompt />
          <MysticCursor />
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
            <Router />
            <Toaster />
            <PwaInstallPrompt />
            <MysticCursor />
          </AISettingsProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <ThemeProvider>
      <WouterRouter base={basePath}>
        {isClerkEnabled ? <ClerkProviderWithRoutes /> : <AppContent />}
      </WouterRouter>
    </ThemeProvider>
  );
}

export default App;
