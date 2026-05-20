// Aturan event puasa berbasis tanggal Hijriah dinamis.
// Tanggal Hijriah didapat real-time dari Aladhan API, sehingga otomatis
// update tiap pergantian bulan/tahun tanpa hardcode.

export type FastType =
  | "sunnah_senin_kamis"
  | "sunnah_ayyamul_bidh"
  | "sunnah_syawal"
  | "sunnah_arafah"
  | "sunnah_asyura"
  | "ramadhan"
  | "qadha";

export interface EventStatus {
  unlocked: boolean;
  reason?: string;
}

export interface HijriContext {
  day: number;       // 1..30
  month: number;     // 1..12 (1=Muharram, 9=Ramadhan, 10=Syawal, 12=Dzulhijjah)
  monthName?: string;
  year: number;
  weekday: number;   // 0..6 (Sun..Sat) Gregorian
}

export function getEventStatus(type: FastType, ctx: HijriContext): EventStatus {
  const { day, month, weekday } = ctx;
  switch (type) {
    case "sunnah_senin_kamis":
      return weekday === 1 || weekday === 4
        ? { unlocked: true }
        : { unlocked: false, reason: "Hanya hari Senin & Kamis" };
    case "ramadhan":
      return month === 9
        ? { unlocked: true }
        : { unlocked: false, reason: "Hanya bulan Ramadhan" };
    case "sunnah_syawal":
      return month === 10 && day >= 2 && day <= 8
        ? { unlocked: true }
        : { unlocked: false, reason: "Puasa 6 hari Syawal (2-7 Syawal)" };
    case "sunnah_arafah":
      return month === 12 && day === 9
        ? { unlocked: true }
        : { unlocked: false, reason: "9 Dzulhijjah" };
    case "sunnah_asyura":
      return month === 1 && (day === 9 || day === 10)
        ? { unlocked: true }
        : { unlocked: false, reason: "9 atau 10 Muharram" };
    case "sunnah_ayyamul_bidh":
      return day >= 13 && day <= 15 && month !== 9
        ? { unlocked: true }
        : { unlocked: false, reason: "Tanggal 13-15 Hijriah" };
    case "qadha":
      return month === 9
        ? { unlocked: false, reason: "Qadha tidak dilakukan saat Ramadhan" }
        : { unlocked: true };
  }
}

export const FAST_LABELS: Record<FastType, string> = {
  sunnah_senin_kamis: "Puasa Senin & Kamis",
  sunnah_ayyamul_bidh: "Puasa Ayyamul Bidh",
  sunnah_syawal: "Puasa Syawal",
  sunnah_arafah: "Puasa Arafah",
  sunnah_asyura: "Puasa Asyura",
  ramadhan: "Puasa Ramadhan",
  qadha: "Qadha Puasa",
};
