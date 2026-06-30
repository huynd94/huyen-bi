// Daily fortune builder — pure, DOM-free. Used by the notification worker to
// render the "vận hôm nay" push payload, and reusable by the web app for an
// in-app widget.

import { solarToLunar, getCanChi } from "./lunar-calendar";
import { computeAnnualStars } from "./sao-han";

export interface DailyFortuneInput {
  /** The date to compute for (defaults to "today" in the caller's timezone). */
  date: Date;
  /** Optional birth year — enables the sao-hạn line when present. */
  birthYear?: number;
  /** Optional display name for a personalized greeting. */
  name?: string;
}

export interface DailyFortune {
  /** Solar date label, e.g. "30/06/2026". */
  solarLabel: string;
  /** Lunar date label, e.g. "15/5 (Bính Ngọ)". */
  lunarLabel: string;
  /** Can Chi of the day, e.g. "Giáp Tý". */
  canChiDay: string;
  /** Short fortune headline suitable for a push title. */
  title: string;
  /** One-to-two sentence body suitable for a push body. */
  body: string;
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/**
 * Build a concise daily fortune. Deterministic for a given input so the same
 * day always yields the same message (important for the worker's idempotency).
 */
export function buildDailyFortune(input: DailyFortuneInput): DailyFortune {
  const { date, birthYear, name } = input;
  const d = date.getDate();
  const m = date.getMonth() + 1;
  const y = date.getFullYear();

  const lunar = solarToLunar(d, m, y);
  const canChiDay = getCanChi(lunar.jd, "day");
  const canChiYear = getCanChi(lunar.jd, "year", lunar.month, lunar.year);

  const solarLabel = `${pad2(d)}/${pad2(m)}/${y}`;
  const lunarLabel = `${lunar.day}/${lunar.month}${lunar.leap ? " (nhuận)" : ""} (${canChiYear})`;

  const greeting = name ? `${name}, ` : "";
  const title = `Vận hôm nay — ngày ${canChiDay}`;

  let body = `${greeting}hôm nay ngày ${canChiDay}, âm lịch ${lunar.day}/${lunar.month}.`;

  if (typeof birthYear === "number" && Number.isFinite(birthYear)) {
    const stars = computeAnnualStars(birthYear, y);
    body += ` Sao chiếu mệnh năm ${stars.canChi}: ${stars.mainStar.name} (${stars.overallLuck}).`;
  }

  return { solarLabel, lunarLabel, canChiDay, title, body };
}
