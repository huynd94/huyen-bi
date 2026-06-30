// SEO landing content for static prerendered pages.
//
// Build-time data (no JSX, no DOM) consumed by scripts/prerender-seo.ts to emit
// fully-rendered HTML under dist/public/kb/. Each entry maps to an existing SPA
// route; the static page is the crawlable counterpart that links into the SPA
// for the interactive lookup.

export interface FaqItem {
  q: string;
  a: string;
}

export interface SeoLandingPage {
  /** URL slug under /kb/, e.g. "than-so-hoc". */
  slug: string;
  /** The interactive SPA route this page promotes, e.g. "/than-so-hoc". */
  appPath: string;
  /** <title> and H1. */
  title: string;
  /** Meta description (≤160 chars ideally). */
  description: string;
  /** Lead paragraphs rendered as visible body text. */
  intro: string[];
  /** Sections with heading + paragraphs. */
  sections: { heading: string; paragraphs: string[] }[];
  /** FAQ rendered visibly + as FAQPage JSON-LD. */
  faq: FaqItem[];
}

const SITE = "https://huyenbi.io.vn";

export const SITE_ORIGIN = SITE;

export const SEO_LANDING_PAGES: SeoLandingPage[] = [
  {
    slug: "than-so-hoc",
    appPath: "/than-so-hoc",
    title: "Thần Số Học — Tra cứu Số Đường Đời, Linh Hồn, Sứ Mệnh",
    description:
      "Tra cứu Thần Số Học theo hệ Pythagore: Số Đường Đời, Linh Hồn, Sứ Mệnh, Nhân Cách và năm cá nhân. Nhập tên và ngày sinh để nhận luận giải chi tiết.",
    intro: [
      "Thần số học (Numerology) là bộ môn nghiên cứu mối liên hệ giữa các con số với tính cách, vận mệnh và các giai đoạn cuộc đời. Hệ thống được dùng phổ biến nhất là Pythagore, do nhà toán học Pythagoras (580–495 TCN) xây dựng.",
      "Từ họ tên và ngày sinh dương lịch, Thần Số Học tính ra các chỉ số cốt lõi: Số Đường Đời, Số Linh Hồn, Số Sứ Mệnh, Số Nhân Cách và Số Trưởng Thành — mỗi chỉ số soi chiếu một khía cạnh khác nhau của con người.",
    ],
    sections: [
      {
        heading: "Các chỉ số chính trong Thần Số Học",
        paragraphs: [
          "Số Đường Đời (Life Path) tính từ ngày sinh, phản ánh con đường và bài học lớn nhất của cuộc đời.",
          "Số Sứ Mệnh (Destiny) tính từ toàn bộ họ tên, cho biết mục tiêu và sứ mệnh bạn hướng tới.",
          "Số Linh Hồn (Soul) tính từ các nguyên âm trong tên, thể hiện khát khao và động lực bên trong.",
          "Số Nhân Cách (Personality) tính từ các phụ âm, là hình ảnh bạn thể hiện ra bên ngoài.",
        ],
      },
      {
        heading: "Số Master 11, 22, 33",
        paragraphs: [
          "Khi tổng trung gian rơi vào 11, 22 hoặc 33, ta giữ nguyên không thu gọn — đây là các Số Master mang năng lượng mạnh và tiềm năng đặc biệt, đi kèm thử thách lớn hơn.",
        ],
      },
    ],
    faq: [
      {
        q: "Thần số học dùng lịch âm hay lịch dương?",
        a: "Thần số học theo hệ Pythagore dùng ngày sinh dương lịch (Tây lịch) để tính các chỉ số.",
      },
      {
        q: "Tên có dấu tiếng Việt tính thế nào?",
        a: "Dấu tiếng Việt được chuẩn hóa về dạng Latin trước khi tra bảng chữ - số (ă→a, đ→d, ơ→o, ư→u, v.v.).",
      },
    ],
  },
  {
    slug: "bat-tu",
    appPath: "/bat-tu",
    title: "Bát Tự Tứ Trụ — Lập lá số Can Chi, cân bằng Ngũ Hành",
    description:
      "Lập Bát Tự Tứ Trụ (Tứ Trụ Mệnh Lý): bốn trụ Năm – Tháng – Ngày – Giờ theo Can Chi, phân tích cân bằng Ngũ Hành và dự báo Đại Vận.",
    intro: [
      "Bát Tự (八字), còn gọi là Tứ Trụ, là phương pháp luận mệnh cổ học phương Đông dựa trên bốn trụ Năm, Tháng, Ngày, Giờ sinh — mỗi trụ gồm một Thiên Can và một Địa Chi, tổng cộng tám chữ (bát tự).",
      "Qua tương quan Ngũ Hành (Kim, Mộc, Thủy, Hỏa, Thổ) giữa các trụ, Bát Tự cho biết điểm mạnh - yếu của bản mệnh và các giai đoạn Đại Vận trong đời.",
    ],
    sections: [
      {
        heading: "Bốn trụ trong Bát Tự",
        paragraphs: [
          "Trụ Năm đại diện cho tổ tiên, gốc gác và giai đoạn thiếu thời.",
          "Trụ Tháng đại diện cho cha mẹ, anh em và sự nghiệp.",
          "Trụ Ngày (Nhật Chủ) là bản thân người xem — trục trung tâm của lá số.",
          "Trụ Giờ đại diện cho con cái và hậu vận.",
        ],
      },
      {
        heading: "Cân bằng Ngũ Hành",
        paragraphs: [
          "Lá số Bát Tự lý tưởng là Ngũ Hành cân bằng. Hành bị thiếu hoặc thừa cho biết khuynh hướng cần bổ trợ hoặc tiết chế trong cuộc sống, phong thủy và lựa chọn nghề nghiệp.",
        ],
      },
    ],
    faq: [
      {
        q: "Cần biết giờ sinh chính xác không?",
        a: "Giờ sinh quyết định trụ Giờ và ảnh hưởng lớn đến hậu vận, nên biết càng chính xác thì lá số càng đúng.",
      },
      {
        q: "Bát Tự khác Tử Vi thế nào?",
        a: "Bát Tự dựa trên Can Chi và Ngũ Hành của bốn trụ; Tử Vi Đẩu Số dựa trên 12 cung và hệ thống sao. Hai phương pháp bổ trợ cho nhau.",
      },
    ],
  },
  {
    slug: "xem-que",
    appPath: "/xem-que",
    title: "Xem Quẻ Kinh Dịch (I Ching) — Gieo quẻ và luận giải 64 quẻ",
    description:
      "Gieo quẻ Kinh Dịch (I Ching) online: 64 quẻ với hào âm - dương, luận giải ý nghĩa và lời khuyên cho câu hỏi của bạn.",
    intro: [
      "Kinh Dịch (易經, I Ching) là một trong những bộ kinh điển cổ nhất của văn minh phương Đông, dùng hệ thống 64 quẻ — mỗi quẻ gồm sáu hào âm hoặc dương — để mô tả mọi trạng thái biến dịch của vạn vật.",
      "Khi gieo quẻ với một câu hỏi cụ thể, quẻ nhận được cùng các hào động cho biết tình thế hiện tại và hướng vận động sắp tới.",
    ],
    sections: [
      {
        heading: "Hào âm và hào dương",
        paragraphs: [
          "Mỗi quẻ gồm sáu hào, đọc từ dưới lên. Hào dương (vạch liền) tượng trưng cho sự chủ động, cương; hào âm (vạch đứt) tượng trưng cho sự tiếp nhận, nhu.",
          "Tổ hợp sáu hào tạo thành một trong 64 quẻ, mỗi quẻ mang một tên và thông điệp riêng.",
        ],
      },
    ],
    faq: [
      {
        q: "Nên hỏi Kinh Dịch như thế nào?",
        a: "Hãy đặt một câu hỏi rõ ràng, tập trung vào tình huống hiện tại thay vì câu hỏi có/không quá chung chung, rồi gieo quẻ với tâm thế tĩnh.",
      },
    ],
  },
  {
    slug: "phong-thuy",
    appPath: "/phong-thuy",
    title: "Phong Thủy Bát Trạch — Tính Mệnh Quái và hướng tốt xấu",
    description:
      "Tính Mệnh Quái (cung phi) theo Bát Trạch, xác định Đông/Tây Tứ Mệnh và bốn hướng tốt – bốn hướng xấu cho nhà ở, phòng ngủ, bàn làm việc.",
    intro: [
      "Phong Thủy Bát Trạch (八宅) chia con người thành hai nhóm Đông Tứ Mệnh và Tây Tứ Mệnh dựa trên Mệnh Quái (cung phi) tính từ năm sinh và giới tính.",
      "Mỗi nhóm có bốn hướng tốt (Sinh Khí, Thiên Y, Diên Niên, Phục Vị) và bốn hướng xấu (Họa Hại, Lục Sát, Ngũ Quỷ, Tuyệt Mệnh), dùng để bố trí nhà cửa hài hòa.",
    ],
    sections: [
      {
        heading: "Bốn hướng tốt trong Bát Trạch",
        paragraphs: [
          "Sinh Khí: hướng tốt nhất cho tài lộc, thăng tiến và sinh con.",
          "Thiên Y: hướng tốt cho sức khỏe và quý nhân.",
          "Diên Niên: hướng tốt cho hôn nhân và các mối quan hệ.",
          "Phục Vị: hướng tốt cho học hành, thi cử và sự ổn định.",
        ],
      },
    ],
    faq: [
      {
        q: "Mệnh Quái tính theo năm âm hay năm dương?",
        a: "Mệnh Quái Bát Trạch tính theo năm sinh âm lịch; nếu sinh đầu năm dương lịch cần lưu ý mốc Lập Xuân.",
      },
    ],
  },
];
