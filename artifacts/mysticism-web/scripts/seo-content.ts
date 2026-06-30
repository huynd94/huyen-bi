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
  {
    slug: "xem-ten",
    appPath: "/xem-ten",
    title: "Xem Tên Theo Ngũ Cách — Phân tích Thiên, Nhân, Địa, Ngoại, Tổng Cách",
    description:
      "Phân tích họ tên theo Ngũ Cách (Thiên Cách, Nhân Cách, Địa Cách, Ngoại Cách, Tổng Cách) và Ngũ Hành của tên, đánh giá cát hung cho từng cách.",
    intro: [
      "Xem tên theo Ngũ Cách (五格剖象) là phương pháp phân tích họ tên dựa trên số nét bút của từng chữ, chia thành năm cách phản ánh các giai đoạn và khía cạnh khác nhau của cuộc đời.",
      "Mỗi cách được quy về một con số và một hành trong Ngũ Hành, từ đó luận cát hung và mức độ tương sinh - tương khắc giữa các cách.",
    ],
    sections: [
      {
        heading: "Năm cách trong phân tích tên",
        paragraphs: [
          "Thiên Cách: đại diện tổ tiên, dòng họ — ảnh hưởng gián tiếp.",
          "Nhân Cách: cách quan trọng nhất, phản ánh tính cách và vận mệnh chủ đạo.",
          "Địa Cách: vận thời thiếu niên, tiền vận trước 30 tuổi.",
          "Ngoại Cách: quan hệ xã hội, quý nhân và môi trường bên ngoài.",
          "Tổng Cách: hậu vận, tổng kết toàn bộ cuộc đời sau trung niên.",
        ],
      },
    ],
    faq: [
      {
        q: "Tên đệm có được tính trong Ngũ Cách không?",
        a: "Có. Toàn bộ họ và tên (gồm tên đệm) đều được dùng để tính số nét và phân chia thành năm cách.",
      },
    ],
  },
  {
    slug: "tu-vi",
    appPath: "/tu-vi",
    title: "Tử Vi Đẩu Số — Lập lá số 12 cung, chính tinh và Mệnh Cục",
    description:
      "Lập lá số Tử Vi Đẩu Số: an 12 cung, định vị 14 chính tinh, xác định Mệnh Cục và luận giải vận mệnh theo cổ học phương Đông.",
    intro: [
      "Tử Vi Đẩu Số (紫微斗數) là một trong những hệ thống luận mệnh tinh vi nhất của phương Đông, dựa trên việc an sao vào 12 cung quanh lá số từ giờ, ngày, tháng, năm sinh.",
      "Lá số gồm 12 cung (Mệnh, Phụ Mẫu, Phúc Đức, Điền Trạch, Quan Lộc, Nô Bộc, Thiên Di, Tật Ách, Tài Bạch, Tử Tức, Phu Thê, Huynh Đệ) cùng hệ thống chính tinh và phụ tinh.",
    ],
    sections: [
      {
        heading: "14 chính tinh và Mệnh Cục",
        paragraphs: [
          "14 chính tinh (Tử Vi, Thiên Cơ, Thái Dương, Vũ Khúc, Thiên Đồng, Liêm Trinh, Thiên Phủ, Thái Âm, Tham Lang, Cự Môn, Thiên Tướng, Thiên Lương, Thất Sát, Phá Quân) là trục chính để luận tính cách và vận thế.",
          "Mệnh Cục (Thủy Nhị Cục, Mộc Tam Cục, Kim Tứ Cục, Thổ Ngũ Cục, Hỏa Lục Cục) quy định cách tính đại vận và độ mạnh yếu của lá số.",
        ],
      },
    ],
    faq: [
      {
        q: "Tử Vi cần giờ sinh chính xác đến mức nào?",
        a: "Giờ sinh quyết định vị trí an cung Mệnh và nhiều sao, nên cần biết chính xác theo canh giờ (mỗi canh 2 tiếng).",
      },
    ],
  },
  {
    slug: "sao-han",
    appPath: "/sao-han",
    title: "Sao Hạn Hàng Năm — Tra cứu sao chiếu mệnh Thái Tuế, La Hầu, Thái Dương",
    description:
      "Tra cứu sao hạn chiếu mệnh theo năm: Thái Tuế, Thái Dương, La Hầu, Kế Đô, Phúc Tinh... cùng mức cát hung và cách hóa giải cho từng tuổi.",
    intro: [
      "Sao hạn hàng năm dựa trên tương quan giữa Địa Chi năm sinh và năm xem, xác định ngôi sao chiếu mệnh và mức độ cát hung trong năm đó.",
      "Mỗi năm có một sao chính chiếu mệnh cùng các sao phụ, cho biết nên thận trọng hay tận dụng cơ hội ở từng lĩnh vực: sức khỏe, tài lộc, công danh, pháp lý.",
    ],
    sections: [
      {
        heading: "Các sao cát và hung tiêu biểu",
        paragraphs: [
          "Sao cát: Thái Dương, Thái Âm, Thiên Đức, Nguyệt Đức, Phúc Tinh — mang quý nhân, may mắn, tài lộc.",
          "Sao hung: La Hầu, Kế Đô, Thái Tuế, Tuế Phá, Kiếp Sát — dễ gặp thị phi, hao tài, sức khỏe sa sút, cần hóa giải.",
        ],
      },
    ],
    faq: [
      {
        q: "Sao hạn xấu có hóa giải được không?",
        a: "Theo quan niệm dân gian, năm gặp sao hung nên sống thiện, cẩn trọng trong quyết định lớn và làm việc phúc đức để giảm nhẹ. Đây là góc nhìn tham khảo.",
      },
    ],
  },
  {
    slug: "xem-ngay-tot",
    appPath: "/xem-ngay-tot",
    title: "Xem Ngày Tốt — Chọn ngày Hoàng Đạo theo mục đích (cưới, khai trương...)",
    description:
      "Tìm ngày Hoàng Đạo phù hợp theo mục đích: cưới hỏi, khai trương, động thổ, xuất hành, ký kết. Tra cứu giờ Hoàng Đạo và Can Chi của ngày.",
    intro: [
      "Xem ngày tốt (chọn ngày Hoàng Đạo) là việc lựa chọn thời điểm thuận lợi để tiến hành các việc trọng đại, dựa trên hệ thống ngày Hoàng Đạo - Hắc Đạo và Can Chi.",
      "Mỗi mục đích (cưới hỏi, khai trương, động thổ, nhập trạch, xuất hành...) có những ngày và giờ phù hợp riêng theo lịch can chi và các sao tốt - xấu trong ngày.",
    ],
    sections: [
      {
        heading: "Ngày Hoàng Đạo và Hắc Đạo",
        paragraphs: [
          "Ngày Hoàng Đạo là ngày có sao tốt cai quản, thuận lợi để khởi sự việc quan trọng.",
          "Ngày Hắc Đạo là ngày có sao xấu, nên tránh các việc lớn như cưới hỏi, động thổ, khai trương.",
          "Ngoài ngày, cần chọn cả giờ Hoàng Đạo trong ngày để tăng phần thuận lợi.",
        ],
      },
    ],
    faq: [
      {
        q: "Chọn ngày tốt theo lịch âm hay lịch dương?",
        a: "Ngày tốt được luận theo lịch âm và hệ Can Chi, sau đó quy đổi sang ngày dương lịch tương ứng để tiện sắp xếp.",
      },
    ],
  },
  {
    slug: "hop-tuoi",
    appPath: "/hop-tuoi",
    title: "Hợp Tuổi & Duyên Số — Xem tương hợp vợ chồng, đối tác theo Mệnh Quái",
    description:
      "Xem hợp tuổi vợ chồng và đối tác qua Mệnh Quái, Thiên Can, Địa Chi và Ngũ Hành; chấm điểm tương hợp 0–100 với phân tích chi tiết.",
    intro: [
      "Xem hợp tuổi đánh giá mức tương hợp giữa hai người dựa trên nhiều tầng: Mệnh Quái (Đông/Tây Tứ Mệnh), Thiên Can, Địa Chi (tam hợp - tứ hành xung) và Ngũ Hành bản mệnh.",
      "Kết quả tổng hợp thành điểm tương hợp giúp tham khảo cho hôn nhân, hợp tác làm ăn hoặc các mối quan hệ quan trọng.",
    ],
    sections: [
      {
        heading: "Các yếu tố xét tương hợp",
        paragraphs: [
          "Tam hợp: ba con giáp hợp nhau thành nhóm (ví dụ Thân - Tý - Thìn).",
          "Tứ hành xung: các con giáp khắc nhau theo cặp (ví dụ Dần - Thân, Tý - Ngọ).",
          "Ngũ Hành bản mệnh: tương sinh thì thuận, tương khắc thì cần dung hòa.",
          "Mệnh Quái: cùng nhóm Đông hoặc Tây Tứ Mệnh thường hài hòa hơn.",
        ],
      },
    ],
    faq: [
      {
        q: "Tuổi xung khắc thì có nên cưới không?",
        a: "Tương hợp tuổi chỉ là một yếu tố tham khảo. Nhiều cặp tuổi được cho là xung vẫn hạnh phúc nhờ sự thấu hiểu; không nên xem đây là yếu tố quyết định.",
      },
    ],
  },
  {
    slug: "lich-van-nien",
    appPath: "/lich-van-nien",
    title: "Lịch Vạn Niên — Tra cứu lịch âm dương, Can Chi, ngày Hoàng Đạo",
    description:
      "Lịch Vạn Niên tra cứu âm lịch - dương lịch, Can Chi ngày tháng năm, ngày Hoàng Đạo/Hắc Đạo và giờ tốt từ năm 1900 đến 2100.",
    intro: [
      "Lịch Vạn Niên là công cụ tra cứu đối chiếu giữa dương lịch và âm lịch, kèm thông tin Can Chi của ngày, tháng, năm và các ngày tiết khí.",
      "Mỗi ngày được chú thích Hoàng Đạo hay Hắc Đạo cùng giờ tốt, hỗ trợ việc chọn ngày giờ cho các việc trong cuộc sống.",
    ],
    sections: [
      {
        heading: "Âm lịch, Can Chi và tiết khí",
        paragraphs: [
          "Âm lịch Việt Nam tính theo chu kỳ Mặt Trăng, có tháng nhuận để đồng bộ với năm dương lịch.",
          "Hệ Can Chi gồm 10 Thiên Can và 12 Địa Chi, kết hợp thành chu kỳ 60 năm (lục thập hoa giáp).",
          "24 tiết khí phản ánh sự vận động của Mặt Trời, quan trọng trong nông lịch và phong thủy.",
        ],
      },
    ],
    faq: [
      {
        q: "Vì sao âm lịch có tháng nhuận?",
        a: "Vì một năm âm lịch (12 tháng Mặt Trăng) ngắn hơn năm dương lịch khoảng 11 ngày, nên cứ vài năm phải thêm một tháng nhuận để hai lịch không lệch nhau.",
      },
    ],
  },
  {
    slug: "lich-ca-nhan",
    appPath: "/lich-ca-nhan",
    title: "Lịch Cá Nhân — Năm, Tháng, Ngày Cá Nhân theo Thần Số Học",
    description:
      "Tính Năm Cá Nhân, Tháng Cá Nhân và Ngày Cá Nhân theo Thần Số Học để nắm chu kỳ năng lượng và chọn thời điểm hành động phù hợp.",
    intro: [
      "Lịch Cá Nhân ứng dụng Thần Số Học để tính chu kỳ năng lượng riêng của mỗi người theo Năm Cá Nhân, Tháng Cá Nhân và Ngày Cá Nhân.",
      "Biết mình đang ở chu kỳ số nào giúp lựa chọn thời điểm khởi sự, nghỉ ngơi hay củng cố phù hợp với dòng năng lượng cá nhân.",
    ],
    sections: [
      {
        heading: "Chu kỳ 9 năm trong Thần Số Học",
        paragraphs: [
          "Năm Cá Nhân chạy theo chu kỳ 1 đến 9 rồi lặp lại — mỗi năm mang một chủ đề riêng.",
          "Năm 1 khởi đầu, gieo hạt; năm 5 biến động, thay đổi; năm 9 kết thúc, buông bỏ để chuẩn bị chu kỳ mới.",
        ],
      },
    ],
    faq: [
      {
        q: "Năm Cá Nhân đổi vào ngày nào?",
        a: "Tùy trường phái, Năm Cá Nhân thường được tính đổi vào ngày sinh nhật hoặc đầu năm dương lịch; công cụ nêu rõ cách tính đang dùng.",
      },
    ],
  },
  {
    slug: "cat-hung",
    appPath: "/cat-hung",
    title: "Cát Hung Số Điện Thoại & Biển Số — Phân tích theo quẻ số",
    description:
      "Phân tích cát hung số điện thoại và biển số xe theo quẻ số (Kinh Dịch số học), chấm điểm và gợi ý dãy số hợp mệnh hơn.",
    intro: [
      "Phân tích cát hung dãy số (số điện thoại, biển số xe) dựa trên phương pháp quẻ số — quy các cặp số về 81 quẻ và luận ý nghĩa cát hung.",
      "Mỗi dãy số được chấm điểm tổng thể cùng phân tích từng cặp số liền kề, giúp tham khảo khi chọn số điện thoại hay biển số.",
    ],
    sections: [
      {
        heading: "Quẻ số và ý nghĩa",
        paragraphs: [
          "Phương pháp quy dãy số về một trong 81 quẻ Linh Số, mỗi quẻ mang một thông điệp cát, hung hoặc bình.",
          "Các cặp số đẹp thường gắn với năng lượng sinh khí, tài lộc; cặp số xấu gắn với hao tổn, trắc trở.",
        ],
      },
    ],
    faq: [
      {
        q: "Cát hung số điện thoại có cơ sở khoa học không?",
        a: "Đây là quan niệm thuộc văn hóa số học - phong thủy, mang tính tham khảo và niềm tin cá nhân, không phải kết luận khoa học.",
      },
    ],
  },
  {
    slug: "tu-dien",
    appPath: "/tu-dien",
    title: "Từ Điển Huyền Học — Thiên Can, Địa Chi, Ngũ Hành, Bát Quái, Thần Số",
    description:
      "Từ điển tra cứu thuật ngữ huyền học: 10 Thiên Can, 12 Địa Chi, Ngũ Hành tương sinh tương khắc, Bát Quái và ý nghĩa các con số Thần Số Học.",
    intro: [
      "Từ Điển Huyền Học tổng hợp các khái niệm nền tảng của huyền học phương Đông và Thần Số Học, giúp tra cứu nhanh khi đọc luận giải.",
      "Nội dung gồm: 10 Thiên Can, 12 Địa Chi, quy luật Ngũ Hành, tám quẻ Bát Quái và ý nghĩa các con số chủ đạo.",
    ],
    sections: [
      {
        heading: "Các nhóm thuật ngữ chính",
        paragraphs: [
          "Thiên Can (Giáp, Ất, Bính, Đinh...) và Địa Chi (Tý, Sửu, Dần, Mão...) là nền tảng của hệ Can Chi.",
          "Ngũ Hành (Kim, Mộc, Thủy, Hỏa, Thổ) vận hành theo quy luật tương sinh và tương khắc.",
          "Bát Quái (Càn, Khảm, Cấn, Chấn, Tốn, Ly, Khôn, Đoài) là tám quẻ cơ bản của Kinh Dịch.",
        ],
      },
    ],
    faq: [
      {
        q: "Ngũ Hành tương sinh và tương khắc là gì?",
        a: "Tương sinh: Mộc sinh Hỏa, Hỏa sinh Thổ, Thổ sinh Kim, Kim sinh Thủy, Thủy sinh Mộc. Tương khắc: Mộc khắc Thổ, Thổ khắc Thủy, Thủy khắc Hỏa, Hỏa khắc Kim, Kim khắc Mộc.",
      },
    ],
  },
];
