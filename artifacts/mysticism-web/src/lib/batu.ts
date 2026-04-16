export interface Pillar {
  thienCan: string;
  diaChi: string;
  nguHanh: string;
}

export interface NguyenHanhItem {
  element: string;
  percentage: number;
}

const thienCan = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'];
const diaChi = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];
const nguHanhCan = ['Mộc', 'Mộc', 'Hỏa', 'Hỏa', 'Thổ', 'Thổ', 'Kim', 'Kim', 'Thủy', 'Thủy'];
const nguHanhChi = ['Thủy', 'Thổ', 'Mộc', 'Mộc', 'Thổ', 'Hỏa', 'Hỏa', 'Thổ', 'Kim', 'Kim', 'Thổ', 'Thủy'];

export function computeBatu(dateStr: string, hourStr: string): { nam: Pillar, thang: Pillar, ngay: Pillar, gio: Pillar, nguHanhAnalysis: NguyenHanhItem[] } {
  // Mock simplified computation for demonstration purposes.
  // In a real application, this requires complex astronomical calculations based on solar terms.
  
  const [dd, mm, yyyy] = dateStr.split('/').map(Number);
  const hour = parseInt(hourStr.split(':')[0], 10) || 0;

  const yearIndexCan = (yyyy - 4) % 10;
  const yearIndexChi = (yyyy - 4) % 12;

  const monthIndexCan = (yearIndexCan * 2 + mm) % 10;
  const monthIndexChi = (mm + 1) % 12;

  // Simplified day approximation
  const dayIndexCan = (dd + mm) % 10;
  const dayIndexChi = (dd + mm) % 12;

  const hourIndexChi = Math.floor((hour + 1) / 2) % 12;
  const hourIndexCan = (dayIndexCan * 2 + hourIndexChi) % 10;

  const getCanIndex = (i: number) => (i + 10) % 10;
  const getChiIndex = (i: number) => (i + 12) % 12;

  const nam: Pillar = {
    thienCan: thienCan[getCanIndex(yearIndexCan)],
    diaChi: diaChi[getChiIndex(yearIndexChi)],
    nguHanh: nguHanhCan[getCanIndex(yearIndexCan)] + ' - ' + nguHanhChi[getChiIndex(yearIndexChi)]
  };

  const thang: Pillar = {
    thienCan: thienCan[getCanIndex(monthIndexCan)],
    diaChi: diaChi[getChiIndex(monthIndexChi)],
    nguHanh: nguHanhCan[getCanIndex(monthIndexCan)] + ' - ' + nguHanhChi[getChiIndex(monthIndexChi)]
  };

  const ngay: Pillar = {
    thienCan: thienCan[getCanIndex(dayIndexCan)],
    diaChi: diaChi[getChiIndex(dayIndexChi)],
    nguHanh: nguHanhCan[getCanIndex(dayIndexCan)] + ' - ' + nguHanhChi[getChiIndex(dayIndexChi)]
  };

  const gio: Pillar = {
    thienCan: thienCan[getCanIndex(hourIndexCan)],
    diaChi: diaChi[getChiIndex(hourIndexChi)],
    nguHanh: nguHanhCan[getCanIndex(hourIndexCan)] + ' - ' + nguHanhChi[getChiIndex(hourIndexChi)]
  };

  // Mock analysis
  const nguHanhAnalysis: NguyenHanhItem[] = [
    { element: 'Kim', percentage: 20 },
    { element: 'Mộc', percentage: 30 },
    { element: 'Thủy', percentage: 10 },
    { element: 'Hỏa', percentage: 15 },
    { element: 'Thổ', percentage: 25 },
  ];

  return { nam, thang, ngay, gio, nguHanhAnalysis };
}
