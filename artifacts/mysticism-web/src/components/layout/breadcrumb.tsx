import { Link, useLocation } from "wouter";
import {
  Breadcrumb as BreadcrumbRoot,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

/**
 * Một mục trong breadcrumb của Module_Page hoặc trang đặc biệt.
 *
 * - `group` xác định nhóm điều hướng (Số Học, Mệnh Lý…). Khi `null`, mục
 *   không có cấp giữa và breadcrumb chỉ hiển thị `Trang chủ → [label]`.
 *   Profile và lịch sử dùng dạng này.
 */
interface RouteMeta {
  /** Tên hiển thị của trang ở mục cuối breadcrumb. */
  label: string;
  /** Nhóm điều hướng cha; null khi trang không thuộc nhóm. */
  group: { label: string; anchor: string } | null;
}

const GROUPS = {
  soHoc: { label: "Số Học", anchor: "/#nhom-so-hoc" },
  menhLy: { label: "Mệnh Lý", anchor: "/#nhom-menh-ly" },
  tienTri: { label: "Tiên Tri", anchor: "/#nhom-tien-tri" },
  traCuu: { label: "Tra Cứu", anchor: "/#nhom-tra-cuu" },
  troLyAi: { label: "Trợ Lý AI", anchor: "/#nhom-tro-ly-ai" },
} as const;

/**
 * Map đường dẫn route -> nhãn hiển thị + nhóm điều hướng. Phủ toàn bộ
 * 15 Module_Page + ai-chat + profile/lịch sử theo thiết kế ở
 * `requirements.md` mục 7 và `design.md` "Breadcrumb component".
 *
 * Các route ngoài map này (home, sign-in, sign-up, share, …) không
 * render breadcrumb.
 */
const ROUTE_MAP: Record<string, RouteMeta> = {
  // Số Học
  "/than-so-hoc": { label: "Thần Số Học", group: GROUPS.soHoc },
  "/xem-ten": { label: "Xem Tên", group: GROUPS.soHoc },

  // Mệnh Lý
  "/bat-tu": { label: "Bát Tự Tứ Trụ", group: GROUPS.menhLy },
  "/tu-vi": { label: "Tử Vi Đẩu Số", group: GROUPS.menhLy },
  "/sao-han": { label: "Sao Hạn Hàng Năm", group: GROUPS.menhLy },

  // Tiên Tri
  "/xem-que": { label: "Xem Quẻ I Ching", group: GROUPS.tienTri },
  "/xem-ngay-tot": { label: "Xem Ngày Tốt", group: GROUPS.tienTri },
  "/hop-tuoi": { label: "Hợp Tuổi & Duyên Số", group: GROUPS.tienTri },

  // Tra Cứu
  "/lich-van-nien": { label: "Lịch Vạn Niên", group: GROUPS.traCuu },
  "/lich-ca-nhan": { label: "Lịch Cá Nhân", group: GROUPS.traCuu },
  "/cat-hung": { label: "Cát Hung", group: GROUPS.traCuu },
  "/phong-thuy": { label: "Phong Thuỷ Bát Trạch", group: GROUPS.traCuu },
  "/tu-dien": { label: "Từ Điển Huyền Học", group: GROUPS.traCuu },

  // Trợ Lý AI
  "/ai-chat": { label: "Trợ Lý AI", group: GROUPS.troLyAi },

  // Trang đặc biệt — không có cấp nhóm
  "/profile": { label: "Hồ sơ", group: null },
  "/lich-su": { label: "Lịch sử", group: null },
};

/**
 * Chuẩn hoá pathname để tra cứu trong `ROUTE_MAP`: bỏ query string,
 * fragment và dấu `/` ở cuối (trừ khi pathname chính là `/`).
 */
function normalizePath(path: string): string {
  const withoutQuery = path.split("?")[0].split("#")[0];
  if (withoutQuery.length > 1 && withoutQuery.endsWith("/")) {
    return withoutQuery.slice(0, -1);
  }
  return withoutQuery;
}

/**
 * Breadcrumb điều hướng: `Trang chủ → [Nhóm] → [Mô-đun]`.
 *
 * - Sử dụng wouter `useLocation` để lấy path hiện tại; route ngoài
 *   `ROUTE_MAP` sẽ không render gì.
 * - Mỗi separator `→` có `aria-hidden="true"` (đã được wrap bởi
 *   primitive `BreadcrumbSeparator` của shadcn).
 * - "Trang chủ" và mục nhóm là link (`<a>`) tới `/` và `/#nhom-...`.
 * - Mục cuối có `aria-current="page"` và không phải link.
 *
 * Validates: Requirements 7.4.
 */
export function Breadcrumb() {
  const [location] = useLocation();
  const meta = ROUTE_MAP[normalizePath(location)];

  if (!meta) {
    return null;
  }

  return (
    <BreadcrumbRoot>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild className="text-muted-foreground hover:text-primary">
            <Link href="/">Trang chủ</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        {meta.group && (
          <>
            <BreadcrumbSeparator aria-hidden="true">→</BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbLink asChild className="text-muted-foreground hover:text-primary">
                <Link href={meta.group.anchor}>{meta.group.label}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
          </>
        )}

        <BreadcrumbSeparator aria-hidden="true">→</BreadcrumbSeparator>
        <BreadcrumbItem>
          <BreadcrumbPage className="text-primary font-medium">
            {meta.label}
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </BreadcrumbRoot>
  );
}

export { ROUTE_MAP, GROUPS };
