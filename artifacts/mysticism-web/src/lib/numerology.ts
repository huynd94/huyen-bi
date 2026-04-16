export function computeLifePathNumber(dob: string): number {
  // dob expected in DD/MM/YYYY
  const digits = dob.replace(/\D/g, '').split('').map(Number);
  return reduceToSingleDigitOrMaster(digits.reduce((a, b) => a + b, 0));
}

function reduceToSingleDigitOrMaster(num: number): number {
  if (num === 11 || num === 22 || num === 33) return num;
  if (num < 10) return num;
  const sum = num.toString().split('').map(Number).reduce((a, b) => a + b, 0);
  return reduceToSingleDigitOrMaster(sum);
}

export function computeSoulNumber(name: string): number {
  const vowels = ['A', 'E', 'I', 'O', 'U'];
  return computeNameNumber(name, (char) => vowels.includes(char.toUpperCase()));
}

export function computePersonalityNumber(name: string): number {
  const vowels = ['A', 'E', 'I', 'O', 'U'];
  return computeNameNumber(name, (char) => !vowels.includes(char.toUpperCase()) && /[A-Z]/i.test(char));
}

export function computeDestinyNumber(name: string): number {
  return computeNameNumber(name, (char) => /[A-Z]/i.test(char));
}

function computeNameNumber(name: string, filter: (char: string) => boolean): number {
  const charValues: Record<string, number> = {
    A: 1, J: 1, S: 1,
    B: 2, K: 2, T: 2,
    C: 3, L: 3, U: 3,
    D: 4, M: 4, V: 4,
    E: 5, N: 5, W: 5,
    F: 6, O: 6, X: 6,
    G: 7, P: 7, Y: 7,
    H: 8, Q: 8, Z: 8,
    I: 9, R: 9
  };

  const str = name.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  let sum = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (filter(char) && charValues[char]) {
      sum += charValues[char];
    }
  }
  return reduceToSingleDigitOrMaster(sum);
}

export function computeMaturityNumber(lifePath: number, destiny: number): number {
  return reduceToSingleDigitOrMaster(lifePath + destiny);
}

export function computePersonalYearNumber(dob: string, year: number): number {
  // dob: DD/MM/YYYY
  const parts = dob.split("/");
  const day = parseInt(parts[0]);
  const month = parseInt(parts[1]);
  const yearDigits = year.toString().split("").map(Number).reduce((a, b) => a + b, 0);
  return reduceToSingleDigitOrMaster(day + month + yearDigits);
}

export function getNumberMeaning(n: number): { title: string, description: string, strengths: string[], challenges: string[] } {
  const meanings: Record<number, any> = {
    1: {
      title: "Số 1 - Người Tiên Phong",
      description: "Số 1 đại diện cho sự khởi đầu, tính độc lập, khả năng lãnh đạo và sự tiên phong. Những người mang số 1 thường tự tin và quyết đoán.",
      strengths: ["Sáng tạo", "Độc lập", "Quyết đoán"],
      challenges: ["Ích kỷ", "Độc đoán", "Cố chấp"]
    },
    2: {
      title: "Số 2 - Người Kết Nối",
      description: "Số 2 tượng trưng cho sự hòa bình, hợp tác và ngoại giao. Họ là những người nhạy cảm và biết lắng nghe.",
      strengths: ["Nhạy bén", "Hòa giải", "Thấu hiểu"],
      challenges: ["Quá nhạy cảm", "Thiếu quyết đoán", "Phụ thuộc"]
    },
    3: {
      title: "Số 3 - Người Truyền Cảm Hứng",
      description: "Số 3 mang năng lượng của sự sáng tạo, giao tiếp và biểu đạt. Họ có sức hút tự nhiên và lan tỏa niềm vui.",
      strengths: ["Lạc quan", "Sáng tạo", "Linh hoạt"],
      challenges: ["Hời hợt", "Phân tán", "Thiếu tập trung"]
    },
    4: {
      title: "Số 4 - Người Xây Dựng",
      description: "Số 4 đại diện cho sự kiên định, thực tế và nền tảng vững chắc. Họ là những người đáng tin cậy và có tổ chức.",
      strengths: ["Thực tế", "Kiên nhẫn", "Có trách nhiệm"],
      challenges: ["Bảo thủ", "Thiếu linh hoạt", "Cứng nhắc"]
    },
    5: {
      title: "Số 5 - Người Tự Do",
      description: "Số 5 là con số của sự phiêu lưu, thay đổi và trải nghiệm. Họ yêu thích sự tự do và khám phá.",
      strengths: ["Thích nghi", "Dũng cảm", "Năng động"],
      challenges: ["Cả thèm chóng chán", "Thiếu kỷ luật", "Bốc đồng"]
    },
    6: {
      title: "Số 6 - Người Nuôi Dưỡng",
      description: "Số 6 mang năng lượng của tình yêu thương, gia đình và trách nhiệm. Họ luôn quan tâm và chăm sóc người khác.",
      strengths: ["Bao dung", "Trách nhiệm", "Ấm áp"],
      challenges: ["Bao đồng", "Lo âu thái quá", "Can thiệp sâu"]
    },
    7: {
      title: "Số 7 - Người Tìm Kiếm Chân Lý",
      description: "Số 7 là con số của tâm linh, triết lý và sự phân tích sâu sắc. Họ thích sự yên tĩnh và suy ngẫm.",
      strengths: ["Thông thái", "Trực giác", "Phân tích"],
      challenges: ["Khép kín", "Hoài nghi", "Lạnh lùng"]
    },
    8: {
      title: "Số 8 - Người Điều Hành",
      description: "Số 8 đại diện cho quyền lực, tài chính và sự thành công vật chất. Họ có tham vọng và năng lực tổ chức lớn.",
      strengths: ["Thực tế", "Lãnh đạo", "Tham vọng"],
      challenges: ["Thực dụng", "Áp đặt", "Cuồng việc"]
    },
    9: {
      title: "Số 9 - Người Vị Tha",
      description: "Số 9 là con số của lòng nhân đạo, sự kết thúc và sự phát triển tâm thức cao nhất. Họ có tấm lòng bao dung.",
      strengths: ["Vị tha", "Rộng lượng", "Cảm thông"],
      challenges: ["Thơ ngây", "Dễ thất vọng", "Bao đồng"]
    },
    11: {
      title: "Số 11 - Người Khai Sáng",
      description: "Số 11 là số Master, mang trực giác nhạy bén và khả năng truyền cảm hứng mạnh mẽ.",
      strengths: ["Trực giác", "Cảm hứng", "Tâm linh"],
      challenges: ["Căng thẳng", "Cực đoan", "Nhạy cảm quá mức"]
    },
    22: {
      title: "Số 22 - Kiến Trúc Sư Vĩ Đại",
      description: "Số 22 biến ước mơ lớn thành hiện thực với năng lực thực thi xuất chúng.",
      strengths: ["Tầm nhìn", "Lãnh đạo", "Thực thi"],
      challenges: ["Áp lực", "Cứng nhắc", "Độc đoán"]
    },
    33: {
      title: "Số 33 - Bậc Thầy Chữa Lành",
      description: "Số 33 đại diện cho tình yêu vô điều kiện và sự hy sinh lớn lao vì cộng đồng.",
      strengths: ["Tình yêu thương", "Chữa lành", "Bao dung"],
      challenges: ["Gánh nặng", "Hy sinh thái quá", "Quá tải"]
    }
  };
  return meanings[n] || meanings[1];
}
