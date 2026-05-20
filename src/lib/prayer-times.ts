// Aladhan API integration for prayer times by location
// Method 20 = Kemenag RI (Indonesia)

export interface PrayerTimings {
  Fajr: string;   // "04:32"
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}

export interface HijriDate {
  day: string;
  month: { number: number; en: string };
  year: string;
}

export interface AladhanResponse {
  timings: PrayerTimings;
  date: { hijri: HijriDate; readable: string };
}

const cache = new Map<string, { ts: number; data: AladhanResponse }>();

export async function fetchPrayerTimes(
  lat: number,
  lng: number,
  date = new Date(),
  method = 20,
): Promise<AladhanResponse | null> {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  const key = `${lat.toFixed(3)}_${lng.toFixed(3)}_${dd}-${mm}-${yyyy}_${method}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.ts < 6 * 3600_000) return hit.data;
  try {
    const url = `https://api.aladhan.com/v1/timings/${dd}-${mm}-${yyyy}?latitude=${lat}&longitude=${lng}&method=${method}`;
    const r = await fetch(url);
    const j = await r.json();
    if (j?.code !== 200) return null;
    cache.set(key, { ts: Date.now(), data: j.data });
    return j.data;
  } catch {
    return null;
  }
}

export const PRAYER_DISPLAY: { key: keyof PrayerTimings; label: string; mapping: string }[] = [
  { key: "Fajr", label: "Subuh", mapping: "subuh" },
  { key: "Dhuhr", label: "Dzuhur", mapping: "dzuhur" },
  { key: "Asr", label: "Ashar", mapping: "ashar" },
  { key: "Maghrib", label: "Maghrib", mapping: "maghrib" },
  { key: "Isha", label: "Isya", mapping: "isya" },
];

export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&accept-language=id`,
    );
    const j = await r.json();
    return j?.address?.city || j?.address?.town || j?.address?.county || j?.address?.state || null;
  } catch {
    return null;
  }
}