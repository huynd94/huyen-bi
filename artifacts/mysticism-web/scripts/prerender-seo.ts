#!/usr/bin/env tsx
/**
 * Prerender static SEO landing pages.
 *
 * Emits one fully-rendered, crawlable HTML file per entry in seo-content.ts into
 * `dist/public/kb/<slug>.html`. These pages contain the actual content (not a
 * collapsed SPA shell) plus FAQPage + Article JSON-LD, and link into the SPA
 * for the interactive lookup. Run AFTER `vite build` so dist/public exists.
 *
 * Also (re)writes `dist/public/sitemap.xml` to include the /kb/ URLs alongside
 * the SPA routes.
 *
 * Usage: tsx scripts/prerender-seo.ts
 */

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SEO_LANDING_PAGES, SITE_ORIGIN, type SeoLandingPage } from "./seo-content";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT_DIR = join(ROOT, "dist", "public");
const KB_DIR = join(OUT_DIR, "kb");

/** Minimal HTML escaper for text interpolated into markup. */
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderArticleJsonLd(page: SeoLandingPage): string {
  const data = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: page.title,
    description: page.description,
    inLanguage: "vi-VN",
    isPartOf: { "@type": "WebSite", name: "Huyền Bí", url: SITE_ORIGIN },
    mainEntityOfPage: `${SITE_ORIGIN}/kb/${page.slug}`,
  };
  return `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
}

function renderFaqJsonLd(page: SeoLandingPage): string {
  if (page.faq.length === 0) return "";
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: page.faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  return `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
}

function renderBreadcrumbJsonLd(page: SeoLandingPage): string {
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Trang chủ", item: SITE_ORIGIN + "/" },
      { "@type": "ListItem", position: 2, name: page.title, item: `${SITE_ORIGIN}/kb/${page.slug}` },
    ],
  };
  return `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
}

function renderPage(page: SeoLandingPage): string {
  const canonical = `${SITE_ORIGIN}/kb/${page.slug}`;
  const intro = page.intro.map((p) => `<p>${esc(p)}</p>`).join("\n      ");
  const sections = page.sections
    .map(
      (s) => `      <section>
        <h2>${esc(s.heading)}</h2>
        ${s.paragraphs.map((p) => `<p>${esc(p)}</p>`).join("\n        ")}
      </section>`,
    )
    .join("\n");
  const faq =
    page.faq.length > 0
      ? `      <section>
        <h2>Câu hỏi thường gặp</h2>
        ${page.faq
          .map((f) => `<details open><summary><strong>${esc(f.q)}</strong></summary><p>${esc(f.a)}</p></details>`)
          .join("\n        ")}
      </section>`
      : "";

  return `<!DOCTYPE html>
<html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${esc(page.title)} | Huyền Bí</title>
    <meta name="description" content="${esc(page.description)}" />
    <link rel="canonical" href="${canonical}" />
    <meta property="og:type" content="article" />
    <meta property="og:title" content="${esc(page.title)}" />
    <meta property="og:description" content="${esc(page.description)}" />
    <meta property="og:locale" content="vi_VN" />
    <meta property="og:url" content="${canonical}" />
    ${renderArticleJsonLd(page)}
    ${renderFaqJsonLd(page)}
    ${renderBreadcrumbJsonLd(page)}
    <style>
      body { font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; max-width: 760px; margin: 0 auto; padding: 24px; line-height: 1.7; color: #1a1a1a; background: #fbf8f1; }
      h1 { font-size: 1.8rem; } h2 { font-size: 1.25rem; margin-top: 2rem; }
      a.cta { display: inline-block; margin: 1.5rem 0; padding: 12px 20px; background: #a07c10; color: #fff; border-radius: 8px; text-decoration: none; font-weight: 600; }
      nav.bc { font-size: 0.85rem; margin-bottom: 1rem; } nav.bc a { color: #a07c10; }
      details { margin: 0.5rem 0; } footer { margin-top: 3rem; font-size: 0.8rem; color: #666; }
    </style>
  </head>
  <body>
    <nav class="bc"><a href="/">Trang chủ</a> / ${esc(page.title)}</nav>
    <main>
      <h1>${esc(page.title)}</h1>
      ${intro}
      <a class="cta" href="${esc(page.appPath)}">Tra cứu ${esc(page.title)} ngay →</a>
${sections}
${faq}
    </main>
    <footer>
      <p>Nội dung mang tính tham khảo. © Huyền Bí.</p>
      <p><a href="${esc(page.appPath)}">Vào công cụ tra cứu tương tác</a></p>
    </footer>
  </body>
</html>
`;
}

// The interactive SPA routes that should appear in the sitemap (mirrors the
// app's public pages). Kept here so the sitemap has a single source of truth.
const SPA_ROUTES: { path: string; priority: string; changefreq: string }[] = [
  { path: "/", priority: "1.0", changefreq: "weekly" },
  { path: "/than-so-hoc", priority: "0.8", changefreq: "monthly" },
  { path: "/xem-ten", priority: "0.8", changefreq: "monthly" },
  { path: "/bat-tu", priority: "0.8", changefreq: "monthly" },
  { path: "/tu-vi", priority: "0.8", changefreq: "monthly" },
  { path: "/sao-han", priority: "0.8", changefreq: "monthly" },
  { path: "/xem-que", priority: "0.8", changefreq: "monthly" },
  { path: "/xem-ngay-tot", priority: "0.8", changefreq: "monthly" },
  { path: "/hop-tuoi", priority: "0.8", changefreq: "monthly" },
  { path: "/lich-van-nien", priority: "0.7", changefreq: "monthly" },
  { path: "/lich-ca-nhan", priority: "0.7", changefreq: "monthly" },
  { path: "/cat-hung", priority: "0.7", changefreq: "monthly" },
  { path: "/phong-thuy", priority: "0.8", changefreq: "monthly" },
  { path: "/tu-dien", priority: "0.7", changefreq: "monthly" },
  { path: "/ai-chat", priority: "0.9", changefreq: "monthly" },
];

/**
 * Write dist/public/sitemap.xml combining the interactive SPA routes with the
 * prerendered /kb/ landing pages. Single source of truth so the sitemap never
 * drifts from what actually exists.
 */
function writeSitemap(): void {
  const urls: string[] = [];
  for (const r of SPA_ROUTES) {
    urls.push(
      `  <url><loc>${SITE_ORIGIN}${r.path}</loc><changefreq>${r.changefreq}</changefreq><priority>${r.priority}</priority></url>`,
    );
  }
  for (const page of SEO_LANDING_PAGES) {
    urls.push(
      `  <url><loc>${SITE_ORIGIN}/kb/${page.slug}</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>`,
    );
  }
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>
`;
  writeFileSync(join(OUT_DIR, "sitemap.xml"), xml, "utf8");
  console.log(`[prerender-seo] wrote sitemap.xml (${urls.length} urls)`);
}

function main(): void {
  if (!existsSync(OUT_DIR)) {
    console.error(`[prerender-seo] dist/public not found at ${OUT_DIR}. Run "vite build" first.`);
    process.exit(1);
  }
  mkdirSync(KB_DIR, { recursive: true });

  for (const page of SEO_LANDING_PAGES) {
    const html = renderPage(page);
    writeFileSync(join(KB_DIR, `${page.slug}.html`), html, "utf8");
    console.log(`[prerender-seo] wrote kb/${page.slug}.html`);
  }

  writeSitemap();

  console.log(`[prerender-seo] done — ${SEO_LANDING_PAGES.length} pages.`);
}

main();
