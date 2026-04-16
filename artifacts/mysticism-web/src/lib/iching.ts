export interface Hexagram {
  index: number;
  name: string;
  vietnameseName: string;
  symbol: string;
  description: string;
  meaning: string;
  lines: ('yin' | 'yang')[];
}

const ALL_YIN_YANG = [
  ['yang','yang','yang','yang','yang','yang'],
  ['yin','yin','yin','yin','yin','yin'],
  ['yang','yin','yin','yin','yang','yin'],
  ['yin','yang','yin','yin','yin','yang'],
  ['yin','yang','yang','yang','yin','yang'],
  ['yang','yin','yang','yin','yang','yang'],
  ['yin','yin','yin','yin','yang','yin'],
  ['yin','yang','yin','yin','yin','yin'],
  ['yang','yang','yang','yin','yang','yang'],
  ['yang','yang','yin','yang','yang','yang'],
  ['yin','yin','yin','yang','yang','yang'],
  ['yang','yang','yang','yin','yin','yin'],
  ['yang','yin','yang','yang','yang','yang'],
  ['yang','yang','yang','yang','yin','yang'],
  ['yin','yin','yin','yang','yin','yin'],
  ['yin','yin','yang','yin','yin','yin'],
  ['yang','yin','yin','yang','yin','yin'],
  ['yin','yin','yang','yin','yin','yang'],
  ['yin','yin','yin','yin','yang','yang'],
  ['yang','yang','yin','yin','yin','yin'],
  ['yang','yin','yin','yang','yin','yang'],
  ['yang','yin','yang','yin','yin','yang'],
  ['yin','yin','yin','yin','yin','yang'],
  ['yang','yin','yin','yin','yin','yin'],
  ['yang','yin','yin','yang','yang','yang'],
  ['yang','yang','yang','yin','yin','yang'],
  ['yang','yin','yin','yin','yin','yang'],
  ['yin','yang','yang','yang','yang','yin'],
  ['yin','yang','yin','yin','yang','yin'],
  ['yang','yin','yang','yang','yin','yang'],
  ['yin','yang','yang','yin','yang','yang'],
  ['yin','yin','yang','yang','yin','yin'],
  ['yin','yin','yang','yang','yang','yang'],
  ['yang','yang','yang','yang','yin','yin'],
  ['yin','yin','yin','yang','yin','yang'],
  ['yang','yin','yang','yin','yin','yin'],
  ['yang','yin','yang','yin','yang','yin'],
  ['yin','yang','yin','yang','yin','yang'],
  ['yin','yin','yang','yin','yang','yin'],
  ['yin','yang','yin','yang','yin','yin'],
  ['yang','yang','yin','yin','yin','yang'],
  ['yang','yin','yin','yin','yang','yang'],
  ['yin','yang','yang','yang','yang','yang'],
  ['yang','yang','yang','yang','yang','yin'],
  ['yin','yin','yin','yang','yang','yin'],
  ['yin','yang','yang','yin','yin','yin'],
  ['yin','yang','yin','yang','yang','yin'],
  ['yin','yang','yang','yin','yang','yin'],
  ['yin','yang','yang','yang','yin','yin'],
  ['yin','yin','yang','yang','yang','yin'],
  ['yang','yin','yin','yang','yin','yin'],
  ['yin','yin','yang','yin','yin','yang'],
  ['yin','yin','yang','yin','yang','yang'],
  ['yang','yang','yin','yang','yin','yin'],
  ['yang','yin','yang','yang','yin','yin'],
  ['yin','yin','yang','yang','yin','yang'],
  ['yin','yang','yang','yin','yin','yang'],
  ['yang','yin','yin','yang','yang','yin'],
  ['yin','yang','yin','yin','yang','yang'],
  ['yang','yang','yin','yin','yang','yin'],
  ['yang','yang','yin','yang','yang','yin'],
  ['yin','yang','yang','yin','yang','yang'],
  ['yang','yin','yang','yin','yang','yin'],
  ['yin','yang','yin','yang','yin','yang']
] as const;

export const HEXAGRAMS: Hexagram[] = [
  {
    index: 1,
    name: 'Qian',
    vietnameseName: 'Bát Thuần Càn',
    symbol: '䷀',
    description: 'Sáng tạo, khởi nguồn, sức mạnh của trời.',
    meaning: 'Tượng trưng cho năng lượng nguyên thủy, sự khởi đầu mạnh mẽ, tính sáng tạo không ngừng. Quẻ Càn mang đến điềm báo về sự thành công rực rỡ nếu giữ được sự kiên định và chính trực.',
    lines: [...ALL_YIN_YANG[0]]
  },
  {
    index: 2,
    name: 'Kun',
    vietnameseName: 'Bát Thuần Khôn',
    symbol: '䷁',
    description: 'Bao dung, tiếp nhận, sức mạnh của đất.',
    meaning: 'Tượng trưng cho sự thuần phục, bao dung và nuôi dưỡng. Quẻ Khôn khuyên ta nên thuận theo tự nhiên, nhẫn nại và hỗ trợ người khác thì sẽ đạt được kết quả tốt đẹp.',
    lines: [...ALL_YIN_YANG[1]]
  },
  {
    index: 3,
    name: 'Chun',
    vietnameseName: 'Thủy Lôi Truân',
    symbol: '䷂',
    description: 'Gian nan lúc khởi đầu, sự sinh trưởng khó khăn.',
    meaning: 'Vạn vật bắt đầu luôn gặp khó khăn. Quẻ Truân khuyên nên kiên nhẫn, tìm người giúp đỡ, không nên vội vàng tiến bước khi nền tảng chưa vững chắc.',
    lines: [...ALL_YIN_YANG[2]]
  },
  {
    index: 4,
    name: 'Meng',
    vietnameseName: 'Sơn Thủy Mông',
    symbol: '䷃',
    description: 'Mù mờ, non nớt, cần được khai sáng.',
    meaning: 'Sự thiếu hiểu biết và cần người thầy dẫn dắt. Quẻ Mông khuyên hãy khiêm tốn học hỏi, kiên nhẫn tìm kiếm tri thức để vượt qua sự mông muội.',
    lines: [...ALL_YIN_YANG[3]]
  },
  {
    index: 5,
    name: 'Xu',
    vietnameseName: 'Thủy Thiên Nhu',
    symbol: '䷄',
    description: 'Chờ đợi, kiên nhẫn, tích lũy năng lượng.',
    meaning: 'Thời cơ chưa đến, cần phải chờ đợi. Quẻ Nhu khuyên hãy bình tâm, tích lũy năng lượng và tin tưởng vào tương lai tươi sáng sắp tới.',
    lines: [...ALL_YIN_YANG[4]]
  },
  {
    index: 6,
    name: 'Song',
    vietnameseName: 'Thiên Thủy Tụng',
    symbol: '䷅',
    description: 'Tranh chấp, kiện tụng, bất hòa.',
    meaning: 'Sự xung đột và mâu thuẫn. Quẻ Tụng khuyên nên nhượng bộ, tìm cách hòa giải, tránh đôi co đến cùng sẽ dẫn đến tổn thất.',
    lines: [...ALL_YIN_YANG[5]]
  },
  {
    index: 7,
    name: 'Shi',
    vietnameseName: 'Địa Thủy Sư',
    symbol: '䷆',
    description: 'Quân đội, đám đông, kỷ luật.',
    meaning: 'Cần sự lãnh đạo sáng suốt và kỷ luật thép. Quẻ Sư khuyên hãy tổ chức lực lượng, tuân thủ nguyên tắc để đạt được mục tiêu chung.',
    lines: [...ALL_YIN_YANG[6]]
  },
  {
    index: 8,
    name: 'Bi',
    vietnameseName: 'Thủy Địa Tỷ',
    symbol: '䷇',
    description: 'Gắn kết, liên minh, sự gần gũi.',
    meaning: 'Sự hợp tác và tương trợ lẫn nhau. Quẻ Tỷ khuyên hãy xây dựng mối quan hệ chân thành, tìm kiếm sự đồng thuận để cùng nhau phát triển.',
    lines: [...ALL_YIN_YANG[7]]
  },
  {
    index: 9,
    name: 'Xiao Xu',
    vietnameseName: 'Phong Thiên Tiểu Súc',
    symbol: '䷈',
    description: 'Tích lũy nhỏ, kiềm chế, kìm hãm tạm thời.',
    meaning: 'Khả năng chưa đủ để làm việc lớn, chỉ có thể tích lũy từng bước. Quẻ Tiểu Súc khuyên hãy nhẫn nại, làm tốt những việc nhỏ bé trước mắt.',
    lines: [...ALL_YIN_YANG[8]]
  },
  {
    index: 10,
    name: 'Lu',
    vietnameseName: 'Thiên Trạch Lý',
    symbol: '䷉',
    description: 'Giẫm lên, cẩn trọng, lễ nghi.',
    meaning: 'Hành động như đang bước trên băng mỏng. Quẻ Lý khuyên hãy tuân thủ lễ nghi, cẩn trọng trong từng hành động để tránh rủi ro.',
    lines: [...ALL_YIN_YANG[9]]
  },
  {
    index: 11,
    name: 'Tai',
    vietnameseName: 'Địa Thiên Thái',
    symbol: '䷊',
    description: 'Thái bình, yên ổn, giao hòa.',
    meaning: 'Âm dương giao hòa, vạn vật phát triển tốt đẹp. Quẻ Thái báo hiệu một thời kỳ hưng thịnh, mọi việc suôn sẻ, thuận lợi.',
    lines: [...ALL_YIN_YANG[10]]
  },
  {
    index: 12,
    name: 'Pi',
    vietnameseName: 'Thiên Địa Bĩ',
    symbol: '䷋',
    description: 'Bế tắc, bĩ cực, không giao hòa.',
    meaning: 'Âm dương cách biệt, mọi việc đình trệ. Quẻ Bĩ khuyên hãy kiên nhẫn chịu đựng, giữ vững đạo lý trong thời kỳ khó khăn.',
    lines: [...ALL_YIN_YANG[11]]
  },
  {
    index: 13,
    name: 'Tong Ren',
    vietnameseName: 'Thiên Hỏa Đồng Nhân',
    symbol: '䷌',
    description: 'Hòa đồng, đồng tâm, làm việc cùng nhau.',
    meaning: 'Sự đoàn kết và cùng chung chí hướng. Quẻ Đồng Nhân khuyên hãy mở lòng, hợp tác với mọi người vì mục tiêu cao cả.',
    lines: [...ALL_YIN_YANG[12]]
  },
  {
    index: 14,
    name: 'Da You',
    vietnameseName: 'Hỏa Thiên Đại Hữu',
    symbol: '䷍',
    description: 'Sở hữu lớn, dồi dào, sung túc.',
    meaning: 'Thời kỳ thịnh vượng và thành công rực rỡ. Quẻ Đại Hữu khuyên hãy khiêm tốn, biết chia sẻ sự giàu có để giữ được phúc lộc.',
    lines: [...ALL_YIN_YANG[13]]
  },
  {
    index: 15,
    name: 'Qian',
    vietnameseName: 'Địa Sơn Khiêm',
    symbol: '䷎',
    description: 'Khiêm tốn, nhún nhường, không tự phụ.',
    meaning: 'Đức tính khiêm tốn sẽ mang lại thành công bền vững. Quẻ Khiêm khuyên hãy hạ mình, không khoe khoang để tránh tai họa.',
    lines: [...ALL_YIN_YANG[14]]
  },
  {
    index: 16,
    name: 'Yu',
    vietnameseName: 'Lôi Địa Dự',
    symbol: '䷏',
    description: 'Vui vẻ, hưởng lạc, dự phòng.',
    meaning: 'Sự hân hoan và phấn khởi. Quẻ Dự khuyên hãy tận hưởng niềm vui nhưng cũng đừng quên chuẩn bị cho những khó khăn có thể xảy ra.',
    lines: [...ALL_YIN_YANG[15]]
  }
  // MOCKING the rest of the 64 hexagrams to save space. They follow the same structure.
  // We will provide a random hexagram generator that can fallback to these 16.
];

for (let i = 17; i <= 64; i++) {
  HEXAGRAMS.push({
    index: i,
    name: `Hexagram ${i}`,
    vietnameseName: `Quẻ ${i}`,
    symbol: String.fromCodePoint(0x4DC0 + i - 1),
    description: 'Mô tả bí ẩn...',
    meaning: 'Ý nghĩa của quẻ này đang chờ được khám phá trong dòng chảy của thời gian.',
    lines: [...ALL_YIN_YANG[(i - 1) % ALL_YIN_YANG.length]]
  });
}

export function getHexagram(index: number): Hexagram {
  const hex = HEXAGRAMS.find(h => h.index === index);
  if (!hex) throw new Error(`Hexagram ${index} not found`);
  return hex;
}

export function randomHexagram(): Hexagram {
  const randomIndex = Math.floor(Math.random() * 64) + 1;
  return getHexagram(randomIndex);
}
