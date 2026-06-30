// Kinh Dịch (I Ching) — complete King Wen sequence of all 64 hexagrams.
//
// Each hexagram is composed from an upper and a lower trigram (Bát Quái). The
// six lines are *derived* from those trigrams (bottom-to-top), so the rendered
// line figure always matches the hexagram's name — unlike the previous
// implementation, where hexagrams 17–64 were placeholders whose lines were a
// modulo of the first 16 and therefore wrong.
//
// Line order convention: lines[0] is the bottom line, lines[5] the top line,
// matching the traditional bottom-up reading.

export type LineValue = "yin" | "yang";

export type TrigramKey =
  | "qian" // ☰ Heaven
  | "dui" // ☱ Lake
  | "li" // ☲ Fire
  | "zhen" // ☳ Thunder
  | "xun" // ☴ Wind
  | "kan" // ☵ Water
  | "gen" // ☶ Mountain
  | "kun"; // ☷ Earth

interface TrigramMeta {
  symbol: string;
  viet: string; // Bát Quái name
  element: string;
  /** bottom, middle, top */
  lines: [LineValue, LineValue, LineValue];
}

const Y: LineValue = "yang";
const N: LineValue = "yin";

export const TRIGRAMS: Record<TrigramKey, TrigramMeta> = {
  qian: { symbol: "☰", viet: "Càn (Trời)", element: "Kim", lines: [Y, Y, Y] },
  dui: { symbol: "☱", viet: "Đoài (Đầm)", element: "Kim", lines: [Y, Y, N] },
  li: { symbol: "☲", viet: "Ly (Lửa)", element: "Hoả", lines: [Y, N, Y] },
  zhen: { symbol: "☳", viet: "Chấn (Sấm)", element: "Mộc", lines: [Y, N, N] },
  xun: { symbol: "☴", viet: "Tốn (Gió)", element: "Mộc", lines: [N, Y, Y] },
  kan: { symbol: "☵", viet: "Khảm (Nước)", element: "Thuỷ", lines: [N, Y, N] },
  gen: { symbol: "☶", viet: "Cấn (Núi)", element: "Thổ", lines: [N, N, Y] },
  kun: { symbol: "☷", viet: "Khôn (Đất)", element: "Thổ", lines: [N, N, N] },
};

export interface Hexagram {
  index: number;
  name: string; // pinyin / romanised
  vietnameseName: string; // Hán-Việt
  symbol: string; // Unicode hexagram (King Wen order)
  /** lower trigram (bottom three lines) */
  lowerTrigram: TrigramKey;
  /** upper trigram (top three lines) */
  upperTrigram: TrigramKey;
  description: string;
  meaning: string;
  /** bottom → top */
  lines: LineValue[];
}

// Raw table: [index, pinyin, Hán-Việt, lower, upper, description, meaning]
type Row = [number, string, string, TrigramKey, TrigramKey, string, string];

const TABLE: Row[] = [
  [1, "Qian", "Bát Thuần Càn", "qian", "qian", "Sáng tạo, khởi nguồn, sức mạnh của trời.", "Năng lượng dương thuần khiết, sự khởi đầu mạnh mẽ và sáng tạo không ngừng. Giữ chính trực và kiên định thì thành công rực rỡ."],
  [2, "Kun", "Bát Thuần Khôn", "kun", "kun", "Bao dung, tiếp nhận, sức mạnh của đất.", "Sự thuần phục, nuôi dưỡng và bao dung. Thuận theo tự nhiên, nhẫn nại và hỗ trợ người khác sẽ đạt kết quả tốt đẹp."],
  [3, "Zhun", "Thủy Lôi Truân", "zhen", "kan", "Gian nan lúc khởi đầu, sự sinh trưởng khó khăn.", "Vạn vật khởi đầu đều gian nan. Hãy kiên nhẫn, tìm người trợ giúp, không vội tiến khi nền tảng chưa vững."],
  [4, "Meng", "Sơn Thủy Mông", "kan", "gen", "Mông muội, non nớt, cần được khai sáng.", "Sự thiếu hiểu biết cần người thầy dẫn dắt. Khiêm tốn học hỏi và kiên nhẫn tìm tri thức để thoát khỏi mông muội."],
  [5, "Xu", "Thủy Thiên Nhu", "qian", "kan", "Chờ đợi, kiên nhẫn, tích lũy năng lượng.", "Thời cơ chưa đến, cần chờ đợi. Bình tâm tích lũy năng lượng và tin vào tương lai tươi sáng sắp tới."],
  [6, "Song", "Thiên Thủy Tụng", "kan", "qian", "Tranh chấp, kiện tụng, bất hòa.", "Xung đột và mâu thuẫn. Nên nhượng bộ, tìm cách hòa giải; đôi co đến cùng sẽ dẫn đến tổn thất."],
  [7, "Shi", "Địa Thủy Sư", "kan", "kun", "Quân đội, đám đông, kỷ luật.", "Cần lãnh đạo sáng suốt và kỷ luật nghiêm. Tổ chức lực lượng, tuân thủ nguyên tắc để đạt mục tiêu chung."],
  [8, "Bi", "Thủy Địa Tỷ", "kun", "kan", "Gắn kết, liên minh, sự gần gũi.", "Hợp tác và tương trợ. Xây dựng quan hệ chân thành, tìm sự đồng thuận để cùng phát triển."],
  [9, "Xiao Xu", "Phong Thiên Tiểu Súc", "qian", "xun", "Tích lũy nhỏ, kiềm chế tạm thời.", "Khả năng chưa đủ làm việc lớn, chỉ tích lũy từng bước. Nhẫn nại làm tốt việc nhỏ trước mắt."],
  [10, "Lu", "Thiên Trạch Lý", "dui", "qian", "Giẫm bước cẩn trọng, lễ nghi.", "Hành động như bước trên băng mỏng. Tuân thủ lễ nghi, thận trọng từng bước để tránh rủi ro."],
  [11, "Tai", "Địa Thiên Thái", "qian", "kun", "Thái bình, hanh thông, giao hòa.", "Âm dương giao hòa, vạn vật phát triển. Báo hiệu thời kỳ hưng thịnh, mọi việc thuận lợi."],
  [12, "Pi", "Thiên Địa Bĩ", "kun", "qian", "Bế tắc, bĩ cực, không giao hòa.", "Âm dương cách biệt, mọi việc đình trệ. Kiên nhẫn chịu đựng, giữ vững đạo lý chờ thời."],
  [13, "Tong Ren", "Thiên Hỏa Đồng Nhân", "li", "qian", "Hòa đồng, đồng tâm hiệp lực.", "Đoàn kết và chung chí hướng. Mở lòng hợp tác với mọi người vì mục tiêu cao cả."],
  [14, "Da You", "Hỏa Thiên Đại Hữu", "qian", "li", "Sở hữu lớn, dồi dào, sung túc.", "Thời kỳ thịnh vượng, thành công rực rỡ. Khiêm tốn và biết chia sẻ để giữ phúc lộc."],
  [15, "Qian", "Địa Sơn Khiêm", "gen", "kun", "Khiêm tốn, nhún nhường.", "Khiêm tốn mang lại thành công bền vững. Hạ mình, không khoe khoang để tránh tai họa."],
  [16, "Yu", "Lôi Địa Dự", "kun", "zhen", "Vui vẻ, hưởng lạc, dự phòng.", "Hân hoan phấn khởi. Tận hưởng niềm vui nhưng đừng quên chuẩn bị cho khó khăn có thể đến."],
  [17, "Sui", "Trạch Lôi Tùy", "zhen", "dui", "Đi theo, tùy thuận thời thế.", "Thuận theo lẽ phải và thời thế. Biết tùy cơ ứng biến, đi theo điều đúng sẽ được hanh thông."],
  [18, "Gu", "Sơn Phong Cổ", "xun", "gen", "Trì trệ, hư hỏng cần chấn chỉnh.", "Mọi việc đã suy bại, cần cải tổ. Tìm gốc rễ hư hỏng để sửa chữa thì mới khôi phục được."],
  [19, "Lin", "Địa Trạch Lâm", "dui", "kun", "Tiến đến, lớn mạnh, giám sát.", "Năng lượng đang lớn dần, thời cơ thuận lợi đến gần. Tiến tới với lòng chân thành và bao dung."],
  [20, "Guan", "Phong Địa Quán", "kun", "xun", "Quan sát, chiêm nghiệm.", "Lùi lại quan sát toàn cục trước khi hành động. Tu dưỡng bản thân để làm gương cho người khác."],
  [21, "Shi He", "Hỏa Lôi Phệ Hạp", "zhen", "li", "Cắn xé, trừng phạt, phá vỡ trở ngại.", "Cần dứt khoát loại bỏ chướng ngại. Công minh xử lý vấn đề thì mọi việc mới thông suốt."],
  [22, "Bi", "Sơn Hỏa Bí", "li", "gen", "Trang sức, vẻ đẹp bên ngoài.", "Hình thức đẹp đẽ nhưng đừng quên nội dung. Trau chuốt bề ngoài phải đi cùng thực chất bên trong."],
  [23, "Bo", "Sơn Địa Bác", "kun", "gen", "Bóc lột, tan rã, suy đồi.", "Thời kỳ suy thoái, các lực bất lợi lấn át. Nên ẩn mình giữ gìn, chờ thời chứ không cưỡng cầu."],
  [24, "Fu", "Địa Lôi Phục", "zhen", "kun", "Trở lại, hồi phục, khởi đầu mới.", "Dương khí quay trở lại sau suy tàn. Một chu kỳ mới bắt đầu, cơ hội phục hồi và làm lại."],
  [25, "Wu Wang", "Thiên Lôi Vô Vọng", "zhen", "qian", "Vô tư, chân thật, không vọng tưởng.", "Hành động chân thành, thuận tự nhiên, không mưu cầu viển vông thì gặp may; trái lẽ thì gặp họa."],
  [26, "Da Xu", "Sơn Thiên Đại Súc", "qian", "gen", "Tích lũy lớn, nuôi dưỡng tiềm lực.", "Tích trữ tài năng và đức hạnh lớn. Kiên trì rèn luyện, thời cơ đến sẽ làm được việc lớn."],
  [27, "Yi", "Sơn Lôi Di", "zhen", "gen", "Nuôi dưỡng, dưỡng sinh.", "Chú trọng nuôi dưỡng thân và tâm. Lời nói và ăn uống cần tiết chế, nuôi đúng cách mới tốt."],
  [28, "Da Guo", "Trạch Phong Đại Quá", "xun", "dui", "Quá mức, gánh nặng vượt sức.", "Tình thế mất cân bằng, gánh nặng quá lớn. Cần bản lĩnh phi thường và hành động khác thường để vượt qua."],
  [29, "Kan", "Bát Thuần Khảm", "kan", "kan", "Hiểm trở chồng chất, vực sâu.", "Nguy hiểm trùng điệp. Giữ lòng thành tín và kiên định như nước chảy, ắt vượt qua được hiểm cảnh."],
  [30, "Li", "Bát Thuần Ly", "li", "li", "Sáng tỏ, bám víu, lệ thuộc.", "Ánh sáng và trí tuệ rực rỡ. Nương tựa vào điều chính đáng, giữ sáng suốt thì mọi việc hanh thông."],
  [31, "Xian", "Trạch Sơn Hàm", "gen", "dui", "Cảm ứng, giao cảm, hấp dẫn.", "Sự cảm ứng chân thành giữa đôi bên. Tốt cho tình duyên và hợp tác nếu xuất phát từ lòng thành."],
  [32, "Heng", "Lôi Phong Hằng", "xun", "zhen", "Bền lâu, kiên trì, ổn định.", "Sự bền vững và kiên trì lâu dài. Giữ vững đạo thường hằng, không đổi dời thì giữ được thành quả."],
  [33, "Dun", "Thiên Sơn Độn", "gen", "qian", "Ẩn lui, rút lui đúng lúc.", "Biết thời mà lui về ẩn mình. Rút lui đúng lúc để bảo toàn, chờ thời cơ thích hợp trở lại."],
  [34, "Da Zhuang", "Lôi Thiên Đại Tráng", "qian", "zhen", "Lớn mạnh, hùng tráng.", "Sức mạnh đang ở đỉnh cao. Dùng sức mạnh hợp lẽ phải, tránh hung hăng quá độ kẻo gặp trở ngại."],
  [35, "Jin", "Hỏa Địa Tấn", "kun", "li", "Tiến lên, thăng tiến rạng rỡ.", "Như mặt trời mọc lên khỏi mặt đất. Thời cơ thăng tiến, được tin dùng và phát triển công danh."],
  [36, "Ming Yi", "Địa Hỏa Minh Di", "li", "kun", "Ánh sáng bị che, tài năng bị vùi.", "Người hiền gặp thời tăm tối. Giấu tài, giữ chí, kiên nhẫn chịu đựng để bảo toàn trong nghịch cảnh."],
  [37, "Jia Ren", "Phong Hỏa Gia Nhân", "li", "xun", "Người trong nhà, gia đạo.", "Nề nếp gia đình là gốc. Mỗi người giữ đúng bổn phận, gia đạo hòa thuận thì mọi việc tốt đẹp."],
  [38, "Kui", "Hỏa Trạch Khuê", "dui", "li", "Chia lìa, trái nghịch, hiểu lầm.", "Bất đồng và xa cách. Trong khác biệt vẫn tìm điểm chung, hóa giải hiểu lầm bằng sự chân thành."],
  [39, "Jian", "Thủy Sơn Kiển", "gen", "kan", "Khó khăn, trắc trở, què quặt.", "Gặp hiểm trở phía trước. Nên dừng lại tìm trợ giúp, không liều lĩnh tiến vào chỗ nguy."],
  [40, "Jie", "Lôi Thủy Giải", "kan", "zhen", "Giải tỏa, tháo gỡ, cởi bỏ.", "Khó khăn được hóa giải. Mau chóng giải quyết tồn đọng, tha thứ lỗi nhỏ để mở ra cục diện mới."],
  [41, "Sun", "Sơn Trạch Tổn", "dui", "gen", "Giảm bớt, hao tổn, hi sinh.", "Bớt dưới thêm trên, chịu thiệt trước mắt. Giảm ham muốn, hy sinh hợp lý sẽ được lợi về sau."],
  [42, "Yi", "Phong Lôi Ích", "zhen", "xun", "Tăng thêm, lợi ích, giúp đỡ.", "Bớt trên thêm dưới, lợi cho số đông. Thời cơ tốt để hành động và làm việc thiện, gặp nhiều may mắn."],
  [43, "Guai", "Trạch Thiên Quải", "qian", "dui", "Quyết đoán, dứt khoát loại trừ.", "Cần dứt khoát loại bỏ điều xấu. Hành động quyết đoán nhưng quang minh, không dùng thủ đoạn ám muội."],
  [44, "Gou", "Thiên Phong Cấu", "xun", "qian", "Gặp gỡ bất ngờ, cám dỗ.", "Cuộc gặp gỡ không định trước. Cảnh giác với điều mềm mỏng len lỏi; phòng họa từ khi còn nhỏ."],
  [45, "Cui", "Trạch Địa Tụy", "kun", "dui", "Tụ họp, quy tụ.", "Quần chúng quy tụ về một mối. Có lãnh đạo chính danh và lòng thành thì tập hợp được sức mạnh lớn."],
  [46, "Sheng", "Địa Phong Thăng", "xun", "kun", "Thăng tiến, đi lên dần dần.", "Như mầm cây vươn lên khỏi đất. Tích lũy từng bước, tiến lên đều đặn thì đạt được mục tiêu cao."],
  [47, "Kun", "Trạch Thủy Khốn", "kan", "dui", "Khốn cùng, bế tắc, kiệt quệ.", "Gặp lúc khốn khó, tài lực cạn kiệt. Giữ vững lòng tin và phẩm chất, lời nói lúc này khó được tin nên trọng hành động."],
  [48, "Jing", "Thủy Phong Tỉnh", "xun", "kan", "Giếng nước, nuôi dưỡng cộng đồng.", "Giếng nuôi dân không cạn. Giữ nguồn lực trong sạch và sẵn sàng phục vụ; tu sửa cái gốc để dùng lâu dài."],
  [49, "Ge", "Trạch Hỏa Cách", "li", "dui", "Cách mạng, biến đổi, lột xác.", "Thời cơ thay cũ đổi mới. Cải cách đúng lúc và hợp lòng người thì được tin theo và thành công."],
  [50, "Ding", "Hỏa Phong Đỉnh", "xun", "li", "Cái đỉnh, ổn định, nuôi dưỡng hiền tài.", "Như cái vạc ba chân vững vàng. Thời ổn định để trọng dụng hiền tài, vun đắp sự nghiệp lớn."],
  [51, "Zhen", "Bát Thuần Chấn", "zhen", "zhen", "Sấm động, chấn động, kinh sợ.", "Biến động dồn dập gây kinh hãi. Giữ bình tĩnh và cẩn trọng giữa chấn động thì tai qua nạn khỏi."],
  [52, "Gen", "Bát Thuần Cấn", "gen", "gen", "Dừng lại, tĩnh tại, an định.", "Biết dừng đúng lúc, giữ tâm tĩnh lặng. Khi nên dừng thì dừng, khi nên đi thì đi, ắt không lỗi."],
  [53, "Jian", "Phong Sơn Tiệm", "gen", "xun", "Tiến dần theo trình tự.", "Tiến lên từ từ, có thứ tự như cây mọc trên núi. Kiên nhẫn theo trình tự sẽ vững bền."],
  [54, "Gui Mei", "Lôi Trạch Quy Muội", "dui", "zhen", "Thiếu nữ về nhà chồng, danh phận chưa chính.", "Quan hệ chưa đúng danh phận, dễ sinh trắc trở. Cần giữ đúng lễ và chừng mực để tránh hối tiếc."],
  [55, "Feng", "Lôi Hỏa Phong", "li", "zhen", "Thịnh vượng, sung mãn cực điểm.", "Đỉnh cao của sự dồi dào. Hưởng thịnh vượng nhưng nhớ lẽ thịnh suy, giữ sáng suốt khi đang lên."],
  [56, "Lu", "Hỏa Sơn Lữ", "gen", "li", "Lữ khách, xa nhà, phiêu bạt.", "Thân phận khách lạ nơi đất người. Khiêm nhường, cẩn trọng và giữ mình thì dù xa nhà vẫn an ổn."],
  [57, "Xun", "Bát Thuần Tốn", "xun", "xun", "Thuận theo, len lỏi, mềm mại.", "Như gió thấm vào mọi nơi. Khiêm thuận và bền bỉ tác động dần dần sẽ đạt mục đích."],
  [58, "Dui", "Bát Thuần Đoài", "dui", "dui", "Vui vẻ, hòa duyệt, giao tiếp.", "Niềm vui và sự hòa hợp. Vui mà giữ chính đạo, chân thành giao tiếp thì được lòng người và hanh thông."],
  [59, "Huan", "Phong Thủy Hoán", "kan", "xun", "Ly tán, phân tán, tan rã.", "Sự chia lìa cần được hóa giải. Khơi thông và quy tụ lòng người trở lại thì vượt qua được ly tán."],
  [60, "Jie", "Thủy Trạch Tiết", "dui", "kan", "Tiết chế, chừng mực, điều độ.", "Biết giới hạn và tiết độ. Chừng mực hợp lý thì hanh thông; tiết chế thái quá đến khổ sở thì không nên."],
  [61, "Zhong Fu", "Phong Trạch Trung Phu", "dui", "xun", "Lòng thành tín từ bên trong.", "Sự chân thành tự đáy lòng cảm hóa được cả vật và người. Giữ thành tín thì mọi việc tốt lành."],
  [62, "Xiao Guo", "Lôi Sơn Tiểu Quá", "gen", "zhen", "Vượt nhỏ, hơi quá mức.", "Chỉ nên làm việc nhỏ, vượt mức chút ít. Khiêm cung, cẩn thận trong việc nhỏ; không nên mưu việc quá lớn."],
  [63, "Ji Ji", "Thủy Hỏa Ký Tế", "li", "kan", "Đã hoàn thành, viên mãn.", "Mọi việc đã thành, mọi vật đúng chỗ. Nhưng thành rồi dễ sinh loạn, cần đề phòng và giữ gìn thành quả."],
  [64, "Wei Ji", "Hỏa Thủy Vị Tế", "kan", "li", "Chưa hoàn thành, dở dang.", "Việc còn dang dở, sắp thành mà chưa thành. Thận trọng đến phút cuối, đặt đúng vị trí thì sẽ tới đích."],
];

function buildLines(lower: TrigramKey, upper: TrigramKey): LineValue[] {
  // bottom-to-top: lower trigram first (lines 1-3), then upper (lines 4-6)
  return [...TRIGRAMS[lower].lines, ...TRIGRAMS[upper].lines];
}

export const HEXAGRAMS: Hexagram[] = TABLE.map(
  ([index, name, vietnameseName, lower, upper, description, meaning]) => ({
    index,
    name,
    vietnameseName,
    // The Unicode "Yijing Hexagram Symbols" block (U+4DC0–U+4DFF) is in King
    // Wen order, so the symbol maps directly from the index.
    symbol: String.fromCodePoint(0x4dc0 + index - 1),
    lowerTrigram: lower,
    upperTrigram: upper,
    description,
    meaning,
    lines: buildLines(lower, upper),
  }),
);

export function getHexagram(index: number): Hexagram {
  const hex = HEXAGRAMS.find((h) => h.index === index);
  if (!hex) throw new Error(`Hexagram ${index} not found`);
  return hex;
}

/** Look up a hexagram by its six lines (bottom-to-top). */
export function hexagramFromLines(lines: LineValue[]): Hexagram {
  const key = lines.join(",");
  const hex = HEXAGRAMS.find((h) => h.lines.join(",") === key);
  if (!hex) throw new Error(`No hexagram matches lines ${key}`);
  return hex;
}

export interface CastLine {
  /** Resolved line in the primary hexagram. */
  value: LineValue;
  /** True when this line is "moving" (changing) and flips in the transformed hexagram. */
  changing: boolean;
}

export interface CastResult {
  /** Six cast lines, bottom-to-top, with moving-line flags. */
  castLines: CastLine[];
  /** The primary hexagram (quẻ chính). */
  primary: Hexagram;
  /** The transformed hexagram (quẻ biến) if any line is moving, else null. */
  transformed: Hexagram | null;
  /** Indices (1-based, bottom=1) of moving lines. */
  movingLineNumbers: number[];
}

/**
 * Simulate the three-coin method for one line.
 *
 * Heads counts as 3, tails as 2 (common convention). Sum of three coins:
 *   6 = old yin   (yin, moving)
 *   7 = young yang (yang, static)
 *   8 = young yin  (yin, static)
 *   9 = old yang  (yang, moving)
 */
function castLine(rng: () => number): CastLine {
  let sum = 0;
  for (let i = 0; i < 3; i++) sum += rng() < 0.5 ? 3 : 2;
  switch (sum) {
    case 6:
      return { value: "yin", changing: true };
    case 9:
      return { value: "yang", changing: true };
    case 7:
      return { value: "yang", changing: false };
    default: // 8
      return { value: "yin", changing: false };
  }
}

/**
 * Cast a full reading using the three-coin method. Pass a custom `rng` (0–1)
 * for deterministic tests; defaults to Math.random.
 */
export function castReading(rng: () => number = Math.random): CastResult {
  const castLines: CastLine[] = Array.from({ length: 6 }, () => castLine(rng));
  const primaryLines = castLines.map((l) => l.value);
  const primary = hexagramFromLines(primaryLines);

  const movingLineNumbers = castLines
    .map((l, i) => (l.changing ? i + 1 : 0))
    .filter((n) => n > 0);

  let transformed: Hexagram | null = null;
  if (movingLineNumbers.length > 0) {
    const flipped = castLines.map((l) =>
      l.changing ? (l.value === "yin" ? "yang" : "yin") : l.value,
    ) as LineValue[];
    transformed = hexagramFromLines(flipped);
  }

  return { castLines, primary, transformed, movingLineNumbers };
}

/** Pick a uniformly random hexagram (no moving lines). */
export function randomHexagram(): Hexagram {
  return getHexagram(Math.floor(Math.random() * 64) + 1);
}
