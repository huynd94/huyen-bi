export interface DigitInfo {
  digit: number;
  meaning: string;
  element: string;
  score: number;
  level: "great" | "good" | "neutral" | "bad" | "terrible";
}

export interface Combination {
  pattern: string;
  name: string;
  meaning: string;
  score: number;
  level: "great" | "good" | "neutral" | "bad" | "terrible";
}

export interface CatHungResult {
  digits: DigitInfo[];
  combinations: Combination[];
  totalScore: number;
  verdict: "dai-cat" | "cat" | "binh-thuong" | "hung" | "dai-hung";
  verdictLabel: string;
  verdictColor: string;
  verdictDescription: string;
}

const DIGIT_MAP: Omit<DigitInfo, "digit">[] = [
  {
    meaning: "Không - Trống rỗng, vô cực",
    element: "Thủy",
    score: 0,
    level: "neutral",
  },
  {
    meaning: "Nhất - Khởi đầu, thủ lĩnh",
    element: "Dương",
    score: 1.5,
    level: "good",
  },
  {
    meaning: "Nhị - Cân bằng, đôi lứa",
    element: "Âm Dương",
    score: 0.5,
    level: "neutral",
  },
  {
    meaning: "Tam - Sinh sôi, thịnh vượng",
    element: "Mộc",
    score: 1,
    level: "good",
  },
  {
    meaning: "Tứ - Tử, suy giảm",
    element: "Âm Kim",
    score: -2,
    level: "bad",
  },
  {
    meaning: "Ngũ - Ngũ hành, biến hóa",
    element: "Thổ",
    score: 0,
    level: "neutral",
  },
  {
    meaning: "Lục - Lộc, tài vận dồi dào",
    element: "Thủy",
    score: 2,
    level: "good",
  },
  {
    meaning: "Thất - Thất bại, trắc trở",
    element: "Âm",
    score: -0.5,
    level: "neutral",
  },
  {
    meaning: "Bát - Phát, phú quý vô biên",
    element: "Kim",
    score: 2.5,
    level: "great",
  },
  {
    meaning: "Cửu - Cửu, trường tồn viên mãn",
    element: "Hỏa",
    score: 1.5,
    level: "good",
  },
];

const TRIPLE_COMBOS: Array<{ patterns: string[]; name: string; meaning: string; score: number; level: Combination["level"] }> = [
  {
    patterns: ["888"],
    name: "Tam Phát",
    meaning: "Phát tài, phát lộc, phát phúc - cực kỳ may mắn",
    score: 7,
    level: "great",
  },
  {
    patterns: ["168"],
    name: "Nhất Lộc Phát",
    meaning: "Nhất sinh lộc phát - khởi đầu thuận lợi, giàu sang phú quý",
    score: 6,
    level: "great",
  },
  {
    patterns: ["668"],
    name: "Song Lộc Phát",
    meaning: "Lộc lộc phát - tài lộc đôi đường, vượng phát",
    score: 6,
    level: "great",
  },
  {
    patterns: ["689"],
    name: "Lộc Phát Cửu",
    meaning: "Lộc phát trường thọ - giàu sang lâu bền",
    score: 5,
    level: "great",
  },
  {
    patterns: ["698"],
    name: "Lộc Cửu Phát",
    meaning: "Lộc cửu phát - vận lộc dài lâu, phát tài bền vững",
    score: 5,
    level: "great",
  },
  {
    patterns: ["666"],
    name: "Tam Lộc",
    meaning: "Lộc lộc lộc - đại vượng tài lộc",
    score: 6,
    level: "great",
  },
  {
    patterns: ["999"],
    name: "Tam Cửu",
    meaning: "Cửu cửu cửu - trường tồn vĩnh cửu",
    score: 3,
    level: "good",
  },
  {
    patterns: ["899"],
    name: "Phát Song Cửu",
    meaning: "Phát tài trường thọ - giàu có và sống lâu",
    score: 4,
    level: "great",
  },
  {
    patterns: ["189"],
    name: "Nhất Phát Cửu",
    meaning: "Khởi đầu phát tài, sống lâu",
    score: 4,
    level: "great",
  },
  {
    patterns: ["196"],
    name: "Nhất Cửu Lộc",
    meaning: "Đứng đầu, trường thọ, lộc vượng",
    score: 3,
    level: "good",
  },
  {
    patterns: ["444"],
    name: "Tam Tử",
    meaning: "Tam tứ - cực kỳ hung, tuyệt không nên dùng",
    score: -9,
    level: "terrible",
  },
  {
    patterns: ["144", "414", "441"],
    name: "Nhất Tam Tử",
    meaning: "Khởi đầu gặp nhiều vận hạn, suy sụp",
    score: -6,
    level: "terrible",
  },
  {
    patterns: ["744", "474", "447"],
    name: "Thất Tử Hung",
    meaning: "Thất bại và suy vong, đại hung",
    score: -6,
    level: "terrible",
  },
];

const PAIR_COMBOS: Array<{ patterns: string[]; name: string; meaning: string; score: number; level: Combination["level"] }> = [
  {
    patterns: ["88"],
    name: "Song Phát",
    meaning: "Phát tài song đôi - vượng phát cực mạnh",
    score: 4,
    level: "great",
  },
  {
    patterns: ["68", "86"],
    name: "Lộc Phát",
    meaning: "Lộc phát song toàn - tài lộc hanh thông",
    score: 4,
    level: "great",
  },
  {
    patterns: ["66"],
    name: "Song Lộc",
    meaning: "Lộc lộc - tài vận đôi chiều, thịnh vượng",
    score: 3.5,
    level: "great",
  },
  {
    patterns: ["69", "96"],
    name: "Lộc Cửu",
    meaning: "Lộc cửu - tài lộc bền lâu, phúc thọ",
    score: 3,
    level: "good",
  },
  {
    patterns: ["89", "98"],
    name: "Phát Cửu",
    meaning: "Phát tài trường thọ - giàu có lâu bền",
    score: 3,
    level: "good",
  },
  {
    patterns: ["99"],
    name: "Song Cửu",
    meaning: "Cửu cửu - trường thọ, vĩnh cửu",
    score: 2.5,
    level: "good",
  },
  {
    patterns: ["18", "81"],
    name: "Khởi Phát",
    meaning: "Nhất phát - khởi đầu vượng phát",
    score: 2.5,
    level: "good",
  },
  {
    patterns: ["16", "61"],
    name: "Nhất Lộc",
    meaning: "Nhất lộc - đứng đầu về tài lộc",
    score: 2.5,
    level: "good",
  },
  {
    patterns: ["19", "91"],
    name: "Nhất Cửu",
    meaning: "Khởi đầu viên mãn, trường thọ",
    score: 2,
    level: "good",
  },
  {
    patterns: ["13", "31"],
    name: "Nhất Tam",
    meaning: "Khởi đầu sinh sôi, phát triển",
    score: 1.5,
    level: "good",
  },
  {
    patterns: ["38", "83"],
    name: "Tam Phát",
    meaning: "Sinh sôi phát tài",
    score: 2,
    level: "good",
  },
  {
    patterns: ["36", "63"],
    name: "Tam Lộc",
    meaning: "Sinh sôi hưởng lộc",
    score: 2,
    level: "good",
  },
  {
    patterns: ["44"],
    name: "Song Tử",
    meaning: "Song tứ - đại hung, thất bại nặng nề",
    score: -6,
    level: "terrible",
  },
  {
    patterns: ["14", "41"],
    name: "Nhất Tử",
    meaning: "Khởi đầu gặp họa, suy sụp",
    score: -4,
    level: "terrible",
  },
  {
    patterns: ["24", "42"],
    name: "Nhị Tử",
    meaning: "Dễ chết - hung, bất lợi đôi đường",
    score: -4,
    level: "bad",
  },
  {
    patterns: ["74", "47"],
    name: "Thất Tử",
    meaning: "Thất bại và suy vong",
    score: -4,
    level: "bad",
  },
  {
    patterns: ["04", "40"],
    name: "Không Tử",
    meaning: "Hao tài, dễ gặp nạn",
    score: -3,
    level: "bad",
  },
  {
    patterns: ["54", "45"],
    name: "Ngũ Tử",
    meaning: "Biến đổi tiêu cực, cần đề phòng",
    score: -3,
    level: "bad",
  },
  {
    patterns: ["34", "43"],
    name: "Tam Tử",
    meaning: "Phát triển gặp trở ngại",
    score: -2.5,
    level: "bad",
  },
];

function detectCombinations(numStr: string): Combination[] {
  const found: Combination[] = [];
  const usedPositions = new Set<string>();

  for (const combo of TRIPLE_COMBOS) {
    for (const pattern of combo.patterns) {
      let idx = numStr.indexOf(pattern);
      while (idx !== -1) {
        const posKey = `${idx}-${idx + pattern.length - 1}`;
        if (![...Array(pattern.length).keys()].some((k) => usedPositions.has(`${idx + k}`))) {
          found.push({ pattern, name: combo.name, meaning: combo.meaning, score: combo.score, level: combo.level });
          for (let k = 0; k < pattern.length; k++) usedPositions.add(`${idx + k}`);
          break;
        }
        idx = numStr.indexOf(pattern, idx + 1);
      }
    }
  }

  for (const combo of PAIR_COMBOS) {
    for (const pattern of combo.patterns) {
      let idx = numStr.indexOf(pattern);
      while (idx !== -1) {
        if (![...Array(pattern.length).keys()].some((k) => usedPositions.has(`${idx + k}`))) {
          found.push({ pattern, name: combo.name, meaning: combo.meaning, score: combo.score, level: combo.level });
          for (let k = 0; k < pattern.length; k++) usedPositions.add(`${idx + k}`);
          break;
        }
        idx = numStr.indexOf(pattern, idx + 1);
      }
    }
  }

  return found;
}

export function analyzeCatHung(numStr: string): CatHungResult {
  const digits: DigitInfo[] = numStr.split("").map((ch) => {
    const d = parseInt(ch, 10);
    return { digit: d, ...DIGIT_MAP[d] };
  });

  const combinations = detectCombinations(numStr);

  const digitScore = digits.reduce((sum, d) => sum + d.score, 0);
  const comboScore = combinations.reduce((sum, c) => sum + c.score, 0);
  const totalScore = digitScore + comboScore;

  let verdict: CatHungResult["verdict"];
  let verdictLabel: string;
  let verdictColor: string;
  let verdictDescription: string;

  if (totalScore >= 8) {
    verdict = "dai-cat";
    verdictLabel = "Đại Cát";
    verdictColor = "text-yellow-400";
    verdictDescription = "Vô cùng may mắn và thịnh vượng. Con số này mang lại tài lộc, phúc khí và vận hội tuyệt vời.";
  } else if (totalScore >= 4) {
    verdict = "cat";
    verdictLabel = "Cát";
    verdictColor = "text-green-400";
    verdictDescription = "May mắn, thuận lợi. Con số mang năng lượng tích cực, hỗ trợ cuộc sống và sự nghiệp.";
  } else if (totalScore >= 0) {
    verdict = "binh-thuong";
    verdictLabel = "Bình Thường";
    verdictColor = "text-blue-400";
    verdictDescription = "Trung bình, không đặc biệt tốt cũng không xấu. Kết quả phụ thuộc vào nỗ lực bản thân.";
  } else if (totalScore >= -4) {
    verdict = "hung";
    verdictLabel = "Hung";
    verdictColor = "text-orange-400";
    verdictDescription = "Có một số yếu tố bất lợi. Nên cẩn trọng và bổ sung các yếu tố may mắn khác trong cuộc sống.";
  } else {
    verdict = "dai-hung";
    verdictLabel = "Đại Hung";
    verdictColor = "text-red-500";
    verdictDescription = "Nhiều yếu tố bất lợi, cần thận trọng. Nên xem xét thay đổi để tránh vận hạn.";
  }

  return { digits, combinations, totalScore, verdict, verdictLabel, verdictColor, verdictDescription };
}

export function extractLastFourDigits(phone: string): string {
  const digitsOnly = phone.replace(/\D/g, "");
  return digitsOnly.slice(-4);
}

export function extractLastSixDigits(phone: string): string {
  const digitsOnly = phone.replace(/\D/g, "");
  return digitsOnly.slice(-6);
}

export function validateLicensePlate(num: string): string {
  return num.replace(/\D/g, "").slice(0, 5);
}

const VIET_NORM: Record<string, string> = {
  à:"a",á:"a",â:"a",ã:"a",ả:"a",ạ:"a",ă:"a",ắ:"a",ặ:"a",ằ:"a",ẳ:"a",ẵ:"a",
  ấ:"a",ầ:"a",ẩ:"a",ẫ:"a",ậ:"a",
  è:"e",é:"e",ê:"e",ế:"e",ề:"e",ể:"e",ễ:"e",ệ:"e",ẻ:"e",ẽ:"e",ẹ:"e",
  ì:"i",í:"i",ỉ:"i",ĩ:"i",ị:"i",
  ò:"o",ó:"o",ô:"o",ố:"o",ồ:"o",ổ:"o",ỗ:"o",ộ:"o",ơ:"o",ớ:"o",ờ:"o",ở:"o",ỡ:"o",ợ:"o",ỏ:"o",õ:"o",ọ:"o",
  ù:"u",ú:"u",ư:"u",ứ:"u",ừ:"u",ử:"u",ữ:"u",ự:"u",ủ:"u",ũ:"u",ụ:"u",
  ỳ:"y",ý:"y",ỷ:"y",ỹ:"y",ỵ:"y",
  đ:"d",
};

const LETTER_VALUES: Record<string, number> = {
  a:1,b:2,c:3,d:4,e:5,f:6,g:7,h:8,i:9,
  j:1,k:2,l:3,m:4,n:5,o:6,p:7,q:8,r:9,
  s:1,t:2,u:3,v:4,w:5,x:6,y:7,z:8,
};

function normalizeVietnamese(str: string): string {
  return str.toLowerCase().split("").map(ch => VIET_NORM[ch] ?? ch).join("");
}

function reduceToSingle(n: number): number {
  while (n > 9) {
    n = String(n).split("").reduce((s, d) => s + parseInt(d), 0);
  }
  return n;
}

export function computeNameNumber(name: string): number {
  const normalized = normalizeVietnamese(name);
  const sum = normalized.split("").reduce((s, ch) => {
    const val = LETTER_VALUES[ch];
    return val ? s + val : s;
  }, 0);
  return reduceToSingle(sum);
}

export function computePhoneEnergyNumber(digits: string): number {
  const sum = digits.split("").reduce((s, d) => s + parseInt(d), 0);
  return reduceToSingle(sum);
}

export interface CompatibilityResult {
  nameNumber: number;
  phoneNumber: number;
  level: "perfect" | "good" | "neutral" | "clash";
  label: string;
  labelColor: string;
  description: string;
}

const COMPATIBILITY_MAP: Record<number, { friends: number[]; clash: number[] }> = {
  1: { friends: [1, 3, 5, 9],  clash: [6, 8]    },
  2: { friends: [2, 4, 6, 8],  clash: [5, 7]    },
  3: { friends: [1, 3, 6, 9],  clash: [4, 8]    },
  4: { friends: [2, 4, 8],     clash: [1, 3, 7]  },
  5: { friends: [1, 5, 7, 9],  clash: [2, 4, 6] },
  6: { friends: [2, 3, 6, 9],  clash: [1, 5, 7] },
  7: { friends: [5, 7, 9],     clash: [2, 4, 6] },
  8: { friends: [2, 4, 8],     clash: [3, 7, 9] },
  9: { friends: [1, 3, 5, 6, 9], clash: [4, 8]  },
};

const NUMBER_NAME: Record<number, string> = {
  1:"Nhất",2:"Nhị",3:"Tam",4:"Tứ",5:"Ngũ",6:"Lục",7:"Thất",8:"Bát",9:"Cửu"
};

export function analyzeCompatibility(name: string, digits: string): CompatibilityResult {
  const nameNumber = computeNameNumber(name);
  const phoneNumber = computePhoneEnergyNumber(digits);

  let level: CompatibilityResult["level"];
  let label: string;
  let labelColor: string;
  let description: string;

  if (nameNumber === phoneNumber) {
    level = "perfect";
    label = "Tuyệt Đối Tương Hợp";
    labelColor = "text-yellow-400";
    description = `Số mệnh ${NUMBER_NAME[nameNumber]} của chủ nhân cộng hưởng hoàn toàn với năng lượng ${NUMBER_NAME[phoneNumber]} của số điện thoại. Đây là sự kết hợp lý tưởng — số này như được sinh ra để dành cho bạn.`;
  } else if (COMPATIBILITY_MAP[nameNumber]?.friends.includes(phoneNumber)) {
    level = "good";
    label = "Tương Hợp";
    labelColor = "text-green-400";
    description = `Số mệnh ${NUMBER_NAME[nameNumber]} hòa hợp với năng lượng ${NUMBER_NAME[phoneNumber]} của số điện thoại. Hai luồng năng lượng hỗ trợ nhau, giúp chủ nhân phát huy tối đa tiềm năng.`;
  } else if (COMPATIBILITY_MAP[nameNumber]?.clash.includes(phoneNumber)) {
    level = "clash";
    label = "Xung Khắc";
    labelColor = "text-red-400";
    description = `Số mệnh ${NUMBER_NAME[nameNumber]} xung với năng lượng ${NUMBER_NAME[phoneNumber]} của số điện thoại. Hai luồng năng lượng đối nghịch có thể gây cản trở. Nên bổ sung vật phẩm phong thủy để hóa giải.`;
  } else {
    level = "neutral";
    label = "Trung Tính";
    labelColor = "text-blue-400";
    description = `Số mệnh ${NUMBER_NAME[nameNumber]} và năng lượng ${NUMBER_NAME[phoneNumber]} của số điện thoại không đặc biệt tương hợp cũng không xung khắc. Hiệu quả phụ thuộc vào nỗ lực bản thân.`;
  }

  return { nameNumber, phoneNumber, level, label, labelColor, description };
}

export function extractAllPhoneDigits(phone: string): string {
  return phone.replace(/\D/g, "").slice(0, 10);
}

export function computeLifePathFromDOB(dob: string): number {
  const digits = dob.replace(/\D/g, "").split("").map(Number);
  if (digits.length < 8) return 0;
  let sum = digits.reduce((a, b) => a + b, 0);
  while (sum > 9) {
    sum = String(sum).split("").reduce((s, d) => s + parseInt(d), 0);
  }
  return sum;
}

export interface FullPhoneAnalysis {
  allDigits: string;
  prefixDigits: string;
  subscriberDigits: string;
  prefixResult: CatHungResult;
  subscriberResult: CatHungResult;
  fullResult: CatHungResult;
  energyNumber: number;
}

export function analyzeFullPhone(phone: string): FullPhoneAnalysis {
  const allDigits = extractAllPhoneDigits(phone);
  const prefixDigits = allDigits.slice(0, 4);
  const subscriberDigits = allDigits.slice(4);
  return {
    allDigits,
    prefixDigits,
    subscriberDigits,
    prefixResult: analyzeCatHung(prefixDigits),
    subscriberResult: analyzeCatHung(subscriberDigits),
    fullResult: analyzeCatHung(allDigits),
    energyNumber: computePhoneEnergyNumber(allDigits),
  };
}

export function analyzeCompatibilityWithDOB(dob: string, digits: string): CompatibilityResult {
  const lifePathNumber = computeLifePathFromDOB(dob);
  const phoneNumber = computePhoneEnergyNumber(digits);

  let level: CompatibilityResult["level"];
  let label: string;
  let labelColor: string;
  let description: string;

  const effectiveLP = lifePathNumber === 0 ? 1 : lifePathNumber;

  if (effectiveLP === phoneNumber) {
    level = "perfect";
    label = "Tuyệt Đối Tương Hợp";
    labelColor = "text-yellow-400";
    description = `Số đường đời ${NUMBER_NAME[effectiveLP]} hoàn toàn cộng hưởng với năng lượng ${NUMBER_NAME[phoneNumber]} của số điện thoại. Đây là sự kết hợp thiên định — số này như được vũ trụ trao tặng riêng cho bạn.`;
  } else if (COMPATIBILITY_MAP[effectiveLP]?.friends.includes(phoneNumber)) {
    level = "good";
    label = "Tương Hợp";
    labelColor = "text-green-400";
    description = `Số đường đời ${NUMBER_NAME[effectiveLP]} hòa hợp với năng lượng ${NUMBER_NAME[phoneNumber]} của số điện thoại. Hai nguồn năng lượng bổ trợ nhau, giúp cuộc sống hanh thông hơn.`;
  } else if (COMPATIBILITY_MAP[effectiveLP]?.clash.includes(phoneNumber)) {
    level = "clash";
    label = "Xung Khắc";
    labelColor = "text-red-400";
    description = `Số đường đời ${NUMBER_NAME[effectiveLP]} xung với năng lượng ${NUMBER_NAME[phoneNumber]} của số điện thoại. Sự đối lập này có thể tạo ra ma sát vô hình. Nên đeo vật phẩm phong thủy tương ứng để hóa giải.`;
  } else {
    level = "neutral";
    label = "Trung Tính";
    labelColor = "text-blue-400";
    description = `Số đường đời ${NUMBER_NAME[effectiveLP]} và năng lượng ${NUMBER_NAME[phoneNumber]} của số điện thoại không đặc biệt tương hợp cũng không xung khắc. Tự thân nỗ lực là yếu tố quyết định thành công.`;
  }

  return { nameNumber: effectiveLP, phoneNumber, level, label, labelColor, description };
}

export const LEVEL_CONFIG: Record<DigitInfo["level"], { bg: string; border: string; text: string; badge: string }> = {
  great:   { bg: "bg-yellow-500/10", border: "border-yellow-500/40", text: "text-yellow-400", badge: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40" },
  good:    { bg: "bg-green-500/10",  border: "border-green-500/40",  text: "text-green-400",  badge: "bg-green-500/20 text-green-300 border-green-500/40"  },
  neutral: { bg: "bg-blue-500/10",   border: "border-blue-500/30",   text: "text-blue-400",   badge: "bg-blue-500/20 text-blue-300 border-blue-500/30"    },
  bad:     { bg: "bg-orange-500/10", border: "border-orange-500/40", text: "text-orange-400", badge: "bg-orange-500/20 text-orange-300 border-orange-500/40"},
  terrible:{ bg: "bg-red-500/10",    border: "border-red-500/40",    text: "text-red-400",    badge: "bg-red-500/20 text-red-300 border-red-500/40"        },
};
