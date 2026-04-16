export const DIA_CHI_GIO = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];
export const GIO_RANGE   = ["23:00–01:00", "01:00–03:00", "03:00–05:00", "05:00–07:00", "07:00–09:00",
                             "09:00–11:00", "11:00–13:00", "13:00–15:00", "15:00–17:00", "17:00–19:00",
                             "19:00–21:00", "21:00–23:00"];

export function hourToCanChi(hour: number): string {
  const idx = Math.floor((hour + 1) / 2) % 12;
  return `Giờ ${DIA_CHI_GIO[idx]} (${GIO_RANGE[idx]})`;
}

export function dateInputToDisplay(val: string): string {
  if (!val) return "";
  const [y, m, d] = val.split("-");
  return `${d}/${m}/${y}`;
}

export function displayToDateInput(val: string): string {
  if (!val || !val.includes("/")) return "";
  const parts = val.split("/");
  if (parts.length !== 3) return "";
  const [d, m, y] = parts;
  if (!d || !m || !y || y.length !== 4) return "";
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

export function formatPhoneDisplay(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length <= 4) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 4)} ${digits.slice(4)}`;
  return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 10)}`;
}

export function validateName(name: string): string {
  if (!name.trim()) return "Vui lòng nhập họ và tên.";
  if (name.trim().length < 2) return "Tên quá ngắn.";
  if (!/[a-zA-ZÀ-ỹ]/.test(name)) return "Tên không hợp lệ.";
  return "";
}

export function validateDateDisplay(dob: string): string {
  if (!dob) return "Vui lòng chọn ngày sinh.";
  const parts = dob.split("/");
  if (parts.length !== 3) return "Định dạng không đúng DD/MM/YYYY.";
  const [d, m, y] = parts.map(Number);
  if (!d || !m || !y) return "Ngày sinh không hợp lệ.";
  if (m < 1 || m > 12) return "Tháng phải từ 1–12.";
  if (d < 1 || d > 31) return "Ngày phải từ 1–31.";
  if (y < 1900 || y > new Date().getFullYear()) return "Năm không hợp lệ.";
  return "";
}
