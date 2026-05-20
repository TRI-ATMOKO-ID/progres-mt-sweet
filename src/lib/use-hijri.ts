import { useEffect, useState } from "react";
import { fetchPrayerTimes } from "./prayer-times";
import type { HijriContext } from "./event-rules";

// Default: Mecca lat/lng — used only as fallback for hijri date computation.
// Hijri date is essentially the same worldwide for our purposes.
const FALLBACK_LAT = 21.4225;
const FALLBACK_LNG = 39.8262;

export function useHijri(lat?: number | null, lng?: number | null): HijriContext | null {
  const [ctx, setCtx] = useState<HijriContext | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const data = await fetchPrayerTimes(
        lat ?? FALLBACK_LAT,
        lng ?? FALLBACK_LNG,
        new Date(),
      );
      if (cancelled || !data) return;
      const h = data.date.hijri;
      setCtx({
        day: Number(h.day),
        month: h.month.number,
        monthName: h.month.en,
        year: Number(h.year),
        weekday: new Date().getDay(),
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [lat, lng]);
  return ctx;
}