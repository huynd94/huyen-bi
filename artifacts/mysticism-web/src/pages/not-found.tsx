import { Link } from "wouter";
import { AlertCircle } from "lucide-react";

import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Trang 404 — đồng bộ layout với toàn ứng dụng: Navbar đầu trang,
 * nội dung trong `<main>` theo design token (không hardcode màu sáng),
 * và Footer cuối trang.
 */
export default function NotFound() {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground">
      <Navbar />

      <main
        id="main"
        tabIndex={-1}
        className="flex-1 container mx-auto px-4 pt-24 pb-16 outline-none flex items-center justify-center"
      >
        <Card className="w-full max-w-md border-primary/15 bg-card/40">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <AlertCircle aria-hidden="true" className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold">404 — Không tìm thấy trang</h1>
            </div>

            <p className="text-sm text-muted-foreground">
              Trang bạn tìm không tồn tại hoặc đã được di chuyển.
            </p>

            <Button asChild>
              <Link href="/">Về trang chủ</Link>
            </Button>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
