# Audit Evidence Directory

Thư mục này chứa toàn bộ output tooling và screenshot thu thập trong quá trình audit UX/UI frontend dự án Huyền Bí.

## Directory Layout

```
audit-evidence/
├── lighthouse/          # Lighthouse JSON output per route
├── axe/                 # axe-core JSON output per route
├── responsive/          # Responsive screenshot PNG (per route × viewport)
├── reduced-motion/      # Screenshot với prefers-reduced-motion: reduce
├── keyboard/            # Keyboard walkthrough logs (Markdown)
└── README.md            # File này
```

### lighthouse/

Chứa Lighthouse audit JSON output cho mỗi route. Bao gồm scores Performance, Accessibility, Best Practices, SEO.

### axe/

Chứa axe-core accessibility scan JSON output cho mỗi route. Bao gồm violations grouped theo impact (critical/serious/moderate/minor).

### responsive/

Chứa screenshot PNG kiểm tra responsive behavior trên 4 viewport sizes cho mỗi route.

### reduced-motion/

Chứa screenshot PNG kiểm tra hành vi khi `prefers-reduced-motion: reduce` được bật, trên các surface có animation rõ rệt.

### keyboard/

Chứa keyboard-only navigation walkthrough logs (Markdown) cho 3 luồng chính.

## Browser & Environment

| Item            | Value                          |
|-----------------|--------------------------------|
| Browser         | Chrome (version TBD)           |
| OS              | Windows                        |
| DevTools        | Chrome DevTools                |
| Lighthouse      | Built-in Chrome DevTools       |
| axe-core        | Version TBD                    |

## Viewport Sizes

| Name    | Width × Height | Use case         |
|---------|----------------|------------------|
| Mobile  | 360 × 800     | Smartphone       |
| Tablet  | 768 × 1024    | Tablet portrait  |
| Desktop | 1280 × 800    | Standard desktop |
| Large   | 1920 × 1080   | Large monitor    |

## Evidence File Naming Conventions

| Loại            | Pattern                                    | Ví dụ                              |
|-----------------|--------------------------------------------|------------------------------------|
| Lighthouse JSON | `lighthouse/{route-slug}.json`             | `lighthouse/than-so-hoc.json`      |
| axe JSON        | `axe/{route-slug}.json`                    | `axe/ai-chat.json`                 |
| Responsive PNG  | `responsive/{route-slug}-{w}x{h}.png`      | `responsive/home-360x800.png`      |
| Reduced motion  | `reduced-motion/{route-slug}-reduced.png`  | `reduced-motion/home-reduced.png`  |
| Keyboard log    | `keyboard/flow-{a|b|c}-{slug}.md`          | `keyboard/flow-a-home-to-module.md`|

### Route slug convention

- `/` → `home`
- `/than-so-hoc` → `than-so-hoc`
- `/bat-tu` → `bat-tu`
- `/tu-vi` → `tu-vi`
- `/ai-chat` → `ai-chat`
- `/profile` → `profile`
- `/lich-su` → `lich-su`
- `/sign-in` → `sign-in`

## Notes

- Mọi file evidence ≤ 5MB (PNG được optimize bằng pngquant/oxipng nếu cần).
- Nếu một route không chạy được tooling, file placeholder `{"error": "<message>"}` được tạo và ghi nhận trong `Methodology > Limitations` của audit report.
- Đường dẫn tham chiếu trong audit-report.md và audit-summary.json luôn dùng relative path: `./audit-evidence/<subfolder>/<file>`.
