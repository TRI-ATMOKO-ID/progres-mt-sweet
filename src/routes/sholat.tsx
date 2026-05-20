import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Layout } from "@/components/app/Layout";
import { useTargetUserId, useReadOnly, useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Check, Droplet } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { fetchPrayerTimes, PRAYER_DISPLAY } from "@/lib/prayer-times";

export const Route = createFileRoute("/sholat")({
  component: () => (
    <Layout>
      <SholatPage />
    </Layout>
  ),
});

const PRAYERS = [
  { key: "subuh", label: "Subuh", time: "04:30" },
  { key: "dzuhur", label: "Dzuhur", time: "12:00" },
  { key: "ashar", label: "Ashar", time: "15:30" },
  { key: "maghrib", label: "Maghrib", time: "18:00" },
  { key: "isya", label: "Isya", time: "19:15" },
] as const;

function fmt(d: Date) {
  return d.toISOString().slice(0, 10);
}

function SholatPage() {
  const { role, viewingRole } = useAuth();
  const targetId = useTargetUserId();
  const readOnly = useReadOnly();
  const [date, setDate] = useState(fmt(new Date()));
  const [row, setRow] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [haid, setHaid] = useState<any | null>(null);
  const [times, setTimes] = useState<Record<string, string>>({});
  const [city, setCity] = useState<string>("");

  const isFemale = role === "mutia" || (role === "tri" && viewingRole === "mutia");

  const load = async () => {
    if (!targetId) return;
    const { data } = await supabase.from("prayers").select("*").eq("user_id", targetId).eq("date", date).maybeSingle();
    setRow(data);
    const { data: h } = await supabase
      .from("prayers")
      .select("*")
      .eq("user_id", targetId)
      .order("date", { ascending: false })
      .limit(7);
    setHistory(h ?? []);
    if (isFemale) {
      const { data: c } = await supabase
        .from("cycles").select("*").eq("user_id", targetId)
        .lte("start_date", date).order("start_date", { ascending: false }).limit(1);
      const cyc = c?.[0];
      if (cyc && (!cyc.end_date || cyc.end_date >= date)) setHaid(cyc); else setHaid(null);
    } else setHaid(null);
    // Prayer times for the target user's location
    const { data: settings } = await supabase
      .from("user_settings" as any)
      .select("city, latitude, longitude")
      .eq("user_id", targetId)
      .maybeSingle();
    const s: any = settings;
    setCity(s?.city ?? "");
    if (s?.latitude && s?.longitude) {
      const t = await fetchPrayerTimes(s.latitude, s.longitude, new Date(date));
      if (t) {
        const map: Record<string, string> = {};
        PRAYER_DISPLAY.forEach((p) => {
          map[p.mapping] = (t.timings as any)[p.key]?.slice(0, 5);
        });
        setTimes(map);
      }
    } else {
      setTimes({});
    }
  };

  useEffect(() => {
    load();
  }, [targetId, date, isFemale]);

  const toggle = async (key: string) => {
    if (readOnly || !targetId) return;
    const current = row?.[key] ?? false;
    const updates: any = { user_id: targetId, date, [key]: !current };
    const { error } = await supabase.from("prayers").upsert(updates, { onConflict: "user_id,date" });
    if (error) {
      toast.error(error.message);
      return;
    }
    load();
  };

  const count = row ? PRAYERS.filter((p) => row[p.key]).length : 0;

  return (
    <div className="space-y-5">
      {haid && (
        <Link to="/haid" className="block bg-gradient-to-r from-[oklch(0.78_0.18_18)]/30 to-primary/20 border border-primary/30 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-primary font-display text-sm">
            <Droplet className="w-4 h-4" /> Sedang haid
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Tidak ada kewajiban sholat hari ini. Tetap berdzikir dan istirahat ya 🌸
          </p>
        </Link>
      )}
      <div className="bg-gradient-to-br from-primary to-[oklch(0.55_0.25_10)] text-primary-foreground rounded-3xl p-5 shadow-[var(--shadow-sweet)]">
        <div className="text-xs opacity-80">Sholat hari ini</div>
        <div className="font-display text-3xl">{haid ? "—" : `${count} / 5`} 🍓</div>
        <div className="text-xs opacity-80 mt-1">
          📍 {city || "Lokasi belum di-set"}{" "}
          {!city && (
            <Link to="/pengaturan" className="underline">Atur sekarang</Link>
          )}
        </div>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="mt-3 bg-white/15 backdrop-blur text-primary-foreground rounded-xl px-3 py-1.5 text-sm border border-white/20 [color-scheme:dark]"
        />
      </div>

      <div className="space-y-2">
        {PRAYERS.map((p) => {
          const done = !!row?.[p.key];
          const realTime = times[p.key];
          return (
            <button
              key={p.key}
              onClick={() => toggle(p.key)}
              disabled={readOnly || !!haid}
              className={
                "w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all " +
                (done
                  ? "bg-primary/10 border-primary"
                  : "bg-card border-border/50 hover:border-primary/50") +
                (readOnly || haid ? " opacity-60 cursor-not-allowed" : "")
              }
            >
              <div className="text-left">
                <div className="font-display text-base">{p.label}</div>
                <div className="text-xs text-muted-foreground">
                  {realTime ? `🕰️ ${realTime}` : `~ ${p.time}`}
                </div>
              </div>
              <div
                className={
                  "w-8 h-8 rounded-full grid place-items-center transition-all " +
                  (done ? "bg-primary text-primary-foreground" : "bg-muted")
                }
              >
                {done && <Check className="w-4 h-4" />}
              </div>
            </button>
          );
        })}
      </div>

      <div className="bg-card rounded-3xl p-4 border border-border/60">
        <div className="font-display text-sm mb-3">Riwayat 7 hari</div>
        <div className="space-y-1.5">
          {history.length === 0 && <div className="text-xs text-muted-foreground">Belum ada catatan</div>}
          {history.map((h) => {
            const c = PRAYERS.filter((p) => h[p.key]).length;
            return (
              <div key={h.id} className="flex justify-between text-sm">
                <span>{new Date(h.date).toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" })}</span>
                <span className="font-semibold text-primary">{c}/5</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}