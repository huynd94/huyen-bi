/**
 * Form utilities & validators.
 *
 * Pure helpers used by Module_Page form layer:
 *  - parseVietnameseDate / formatVietnameseDate: round-trip dd/MM/yyyy ↔ Date
 *  - formatPhoneVN: idempotent display formatter (groups 4-3-3 with ".")
 *  - formatLicensePlate: idempotent VN plate formatter (e.g. "51A 12345" → "51A-123.45")
 *  - validateBirthDate / validateDay / validateMonth / validateYear / validateHour /
 *    validatePhoneNumber: component validators returning a discriminated union
 *
 * Round-trip / idempotence / range invariants are documented per function and
 * are intended to be checked by property tests in `form-utils.property.test.ts`
 * (see UX/UI upgrade design Properties 11–13).
 */

export const DIA_CHI_GIO = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];
export const GIO_RANGE   = ["23:00–01:00", "01:00–03:00", "03:00–05:00", "05:00–07:00", "07:00–09:00",
                             "09:00–11:00", "11:00–13:00", "13:00–15:00", "15:00–17:00", "17:00–19:00",
                             "19:00–21:00", "21:00–23:00"];

// Birth-date range (inclusive) shared by all validators.
const MIN_YEAR = 1900;
const MAX_YEAR = 2100;
const MIN_PHONE_DIGITS = 10;

/** Discriminated result for component-level validators. */
export type ValidationResult = { ok: true } | { ok: false; reason: string };

// ---------------------------------------------------------------------------
// Existing helpers (preserved for backward compatibility)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Date parsing & formatting (Property 12: round-trip)
// ---------------------------------------------------------------------------

/**
 * Parses a Vietnamese date string in `dd/MM/yyyy` form (leading zeros optional
 * on day/month) into a `Date` at midnight local time.
 *
 * Returns `null` for any input that:
 *  - is not a string, or
 *  - does not match the `d{1,2}/d{1,2}/d{4}` shape, or
 *  - encodes a non-existent calendar date (e.g. `31/02/2024`).
 *
 * The parser does NOT enforce the [1900, 2100] birth-date range — use
 * `validateBirthDate` on the result for that.
 */
export function parseVietnameseDate(input: string): Date | null {
  if (typeof input !== "string") return null;
  const match = /^\s*(\d{1,2})\/(\d{1,2})\/(\d{4})\s*$/.exec(input);
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);

  if (!Number.isFinite(day) || !Number.isFinite(month) || !Number.isFinite(year)) return null;
  if (day < 1 || day > 31) return null;
  if (month < 1 || month > 12) return null;

  const date = new Date(year, month - 1, day, 0, 0, 0, 0);
  // Reject overflow encodings such as 31/02 (which JS would silently roll over).
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

/**
 * Formats a `Date` as `dd/MM/yyyy` using its **local** calendar components.
 *
 * Returns an empty string for invalid `Date` inputs (NaN time) so callers can
 * safely interpolate the result into JSX without producing literal `"NaN"`s.
 *
 * Round-trip with `parseVietnameseDate`:
 *
 *   parseVietnameseDate(formatVietnameseDate(d)) ≡ d
 *     when `d` is at 00:00:00.000 local time.
 *
 *   formatVietnameseDate(parseVietnameseDate(s)) ≡ s
 *     when `s` is in canonical zero-padded `dd/MM/yyyy` form.
 */
export function formatVietnameseDate(d: Date): string {
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return "";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = String(d.getFullYear()).padStart(4, "0");
  return `${day}/${month}/${year}`;
}

// ---------------------------------------------------------------------------
// Phone & license-plate formatters (Property 13: idempotent + raw-preserving)
// ---------------------------------------------------------------------------

/**
 * Formats a Vietnamese phone number for display.
 *
 * Strips every non-digit, then groups as `NNNN.NNN.NNN` (4-3-3, the canonical
 * VN mobile layout). Shorter inputs get the prefix only; longer inputs keep
 * the trailing digits attached to the third group.
 *
 * Invariants:
 *  - `formatPhoneVN(s).replace(/\D/g, "") === s.replace(/\D/g, "")`  (raw preserved)
 *  - `formatPhoneVN(formatPhoneVN(s)) === formatPhoneVN(s)`          (idempotent)
 *
 * The formatter is independent of validation: it always produces output even
 * for inputs that would fail `validatePhoneNumber`, so the form layer can keep
 * the field readable while showing an error border.
 */
export function formatPhoneVN(raw: string): string {
  if (typeof raw !== "string") return "";
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 0) return "";
  if (digits.length <= 4) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 4)}.${digits.slice(4)}`;
  return `${digits.slice(0, 4)}.${digits.slice(4, 7)}.${digits.slice(7)}`;
}

/**
 * Formats a Vietnamese license plate for display.
 *
 * Normalises by uppercasing and stripping every non-alphanumeric, then splits
 * into a `prefix` (everything up to the final digit run) and a `suffix` (the
 * trailing digits). The suffix is grouped with a dot before its last two
 * digits, and the prefix and suffix are joined by `-`.
 *
 * Examples:
 *  - `"51A 12345"`   → `"51A-123.45"`
 *  - `"51A1234"`     → `"51A-12.34"`
 *  - `"29c1.12345"`  → `"29C1-123.45"`
 *
 * Invariants:
 *  - `formatLicensePlate(formatLicensePlate(s)) === formatLicensePlate(s)`  (idempotent)
 *  - alphanumeric content is preserved (case-insensitively).
 */
export function formatLicensePlate(raw: string): string {
  if (typeof raw !== "string") return "";
  const cleaned = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (cleaned.length === 0) return "";

  const match = /^(.*?)(\d+)$/.exec(cleaned);
  if (!match) {
    // No trailing digit run (input is letters-only); return as-is.
    return cleaned;
  }
  const prefix = match[1];
  const suffix = match[2];

  const groupedSuffix =
    suffix.length <= 2
      ? suffix
      : `${suffix.slice(0, suffix.length - 2)}.${suffix.slice(-2)}`;

  if (prefix.length === 0) return groupedSuffix;
  return `${prefix}-${groupedSuffix}`;
}

// ---------------------------------------------------------------------------
// Validators (Property 11: validation purity)
// ---------------------------------------------------------------------------

/**
 * Validates a birth date is a real `Date` whose year falls in [1900, 2100].
 *
 * Range rationale: matches the spec's birth-date constraint and avoids
 * accidental "year 0021" inputs from typos.
 */
export function validateBirthDate(date: Date): ValidationResult {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return { ok: false, reason: "Ngày sinh không hợp lệ." };
  }
  const year = date.getFullYear();
  if (year < MIN_YEAR) {
    return { ok: false, reason: `Năm sinh phải từ ${MIN_YEAR} trở lên.` };
  }
  if (year > MAX_YEAR) {
    return { ok: false, reason: `Năm sinh phải nhỏ hơn hoặc bằng ${MAX_YEAR}.` };
  }
  return { ok: true };
}

/** Validates a day-of-month integer is in [1, 31]. */
export function validateDay(day: number): ValidationResult {
  if (!Number.isInteger(day)) {
    return { ok: false, reason: "Ngày phải là số nguyên." };
  }
  if (day < 1 || day > 31) {
    return { ok: false, reason: "Ngày phải từ 1 đến 31." };
  }
  return { ok: true };
}

/** Validates a month integer is in [1, 12]. */
export function validateMonth(month: number): ValidationResult {
  if (!Number.isInteger(month)) {
    return { ok: false, reason: "Tháng phải là số nguyên." };
  }
  if (month < 1 || month > 12) {
    return { ok: false, reason: "Tháng phải từ 1 đến 12." };
  }
  return { ok: true };
}

/** Validates a year integer is in [1900, 2100]. */
export function validateYear(year: number): ValidationResult {
  if (!Number.isInteger(year)) {
    return { ok: false, reason: "Năm phải là số nguyên." };
  }
  if (year < MIN_YEAR || year > MAX_YEAR) {
    return { ok: false, reason: `Năm phải từ ${MIN_YEAR} đến ${MAX_YEAR}.` };
  }
  return { ok: true };
}

/** Validates an hour-of-day integer is in [0, 23]. */
export function validateHour(hour: number): ValidationResult {
  if (!Number.isInteger(hour)) {
    return { ok: false, reason: "Giờ phải là số nguyên." };
  }
  if (hour < 0 || hour > 23) {
    return { ok: false, reason: "Giờ phải từ 0 đến 23." };
  }
  return { ok: true };
}

/**
 * Validates a phone number string contains at least 10 digits.
 *
 * Counts only digit characters so display formatting (spaces, dots, dashes)
 * is ignored.
 */
export function validatePhoneNumber(raw: string): ValidationResult {
  if (typeof raw !== "string") {
    return { ok: false, reason: "Số điện thoại không hợp lệ." };
  }
  const digits = raw.replace(/\D/g, "");
  if (digits.length < MIN_PHONE_DIGITS) {
    return { ok: false, reason: `Số điện thoại phải có ít nhất ${MIN_PHONE_DIGITS} chữ số.` };
  }
  return { ok: true };
}
