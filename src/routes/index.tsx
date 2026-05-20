import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Layout } from "@/components/app/Layout";
import { useAuth, useTargetUserId } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Heart, UtensilsCrossed, Wallet, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { dailyMessage } from "@/lib/daily-message";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export const Route = createFileRoute("/")({
  component: () => (
    <Layout>
      <Dashboard />
    </Layout>
  ),
});

const PRAYER_KEYS = ["subuh", "dzuhur", "ashar", "maghrib", "isya"] as const;

function fmt(d: Date) {
  return d.toISOString().slice(0, 10);
}

function Dashboard() {
  const { viewingRole, role } = useAuth();
  const targetId = useTargetUserId();
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [prayers, setPrayers] = useState<any[]>([]);
  const [meals, setMeals] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [selected, setSelected] = useState(fmt(new Date()));

  const start = fmt(month);
  const end = fmt(new Date(month.getFullYear(), month.getMonth() + 1, 0));

  useEffect(() => {
    if (!targetId) return;
    (async () => {
      const [p, m, e] = await Promise.all([
        supabase.from("prayers").select("*").eq("user_id", targetId).gte("date", start).lte("date", end),
        supabase.from("meals").select("*").eq("user_id", targetId).gte("date", start).lte("date", end),
        supabase.from("expenses").select("*").eq("user_id", targetId).gte("date", start).lte("date", end),
      ]);
      setPrayers(p.data ?? []);
      setMeals(m.data ?? []);
      setExpenses(e.data ?? []);
    })();
  }, [targetId, start, end, viewingRole]);

  const days = useMemo(() => {
    const first = new Date(month);
    const last = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    const out: { date: string; day: number }[] = [];
    for (let i = 1; i <= last.getDate(); i++) {
      const d = new Date(first.getFullYear(), first.getMonth(), i);
      out.push({ date: fmt(d), day: i });
    }
    return out;
  }, [month]);

  const startWeekday = new Date(month).getDay(); // 0..6 (Sun..Sat)

  const dayMeta = (date: string) => {
    const pr = prayers.find((p) => p.date === date);
    const prayerCount = pr ? PRAYER_KEYS.filter((k) => pr[k]).length : 0;
    const calories = meals.filter((m) => m.date === date).reduce((s, m) => s + (m.calories ?? 0), 0);
    const spend = expenses.filter((m) => m.date === date).reduce((s, m) => s + Number(m.amount ?? 0), 0);
    return { prayerCount, calories, spend };
  };

  const sel = dayMeta(selected);

  const monthName = month.toLocaleDateString("id-ID", { month: "long", year: "numeric" });

  // Pesan harian — tampil untuk Mutia, juga saat Tri sedang melihat Mutia.
  const showLoveMessage = role === "mutia" || (role === "tri" && viewingRole === "mutia");

  // Diagram pengeluaran per hari (bulan berjalan)
  const expenseChart = useMemo(() => {
    const map = new Map<string, { in: number; out: number }>();
    expenses.forEach((e) => {
      const k = e.date;
      const cur = map.get(k) ?? { in: 0, out: 0 };
      const amt = Number(e.amount ?? 0);
      if (e.type === "income") cur.in += amt; else cur.out += amt;
      map.set(k, cur);
    });
    return days.map((d) => {
      const v = map.get(d.date) ?? { in: 0, out: 0 };
      return { day: String(d.day), Masuk: v.in, Keluar: v.out };
    });
  }, [expenses, days]);

  const totalIn = expenseChart.reduce((s, d) => s + d.Masuk, 0);
  const totalOut = expenseChart.reduce((s, d) => s + d.Keluar, 0);

  return (
    <div className="space-y-5">
      {showLoveMessage && (
        <div className="bg-gradient-to-br from-accent/60 via-secondary to-card rounded-3xl p-5 border border-primary/20 shadow-[var(--shadow-sweet)] relative overflow-hidden">
          <div className="absolute -right-4 -top-4 text-6xl opacity-20">🍓</div>
          <div className="flex items-center gap-2 text-xs text-primary font-semibold">
            <Sparkles className="w-3.5 h-3.5" /> Pesan dari Tri Atmoko · {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long" })}
          </div>
          <p className="font-display text-base leading-snug mt-2 text-foreground/90">
            {dailyMessage()}
          </p>
          <div className="text-xs text-muted-foreground mt-3 italic">— Tri Atmoko ❤️</div>
        </div>
      )}

      <div className="bg-gradient-to-br from-primary to-[oklch(0.55_0.25_10)] text-primary-foreground rounded-3xl p-5 shadow-[var(--shadow-sweet)]">
        <div className="text-xs opacity-80">Hari ini</div>
        <div className="font-display text-2xl">
          {new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })}
        </div>
        <div className="grid grid-cols-3 gap-2 mt-4">
          <Stat label="Sholat" value={`${dayMeta(fmt(new Date())).prayerCount}/5`} />
          <Stat label="Kalori" value={`${dayMeta(fmt(new Date())).calories}`} />
          <Stat label="Pengeluaran" value={`Rp${dayMeta(fmt(new Date())).spend.toLocaleString("id-ID")}`} />
        </div>
      </div>

      <div className="bg-card rounded-3xl p-4 border border-border/60 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="p-2 rounded-full hover:bg-muted">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="font-display text-base capitalize">{monthName}</div>
          <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="p-2 rounded-full hover:bg-muted">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-[10px] text-center text-muted-foreground mb-1">
          {["M", "S", "S", "R", "K", "J", "S"].map((d, i) => (
            <div key={i}>{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: startWeekday }).map((_, i) => (
            <div key={"e" + i} />
          ))}
          {days.map((d) => {
            const meta = dayMeta(d.date);
            const isSel = d.date === selected;
            const isToday = d.date === fmt(new Date());
            return (
              <button
                key={d.date}
                onClick={() => setSelected(d.date)}
                className={
                  "aspect-square rounded-xl text-sm flex flex-col items-center justify-center gap-0.5 transition-all relative " +
                  (isSel
                    ? "bg-primary text-primary-foreground shadow-[var(--shadow-sweet)]"
                    : isToday
                    ? "bg-accent/40 text-foreground"
                    : "hover:bg-muted text-foreground")
                }
              >
                <span className="font-semibold">{d.day}</span>
                <div className="flex gap-0.5">
                  {meta.prayerCount > 0 && <Dot color="bg-pink-400" />}
                  {meta.calories > 0 && <Dot color="bg-amber-400" />}
                  {meta.spend > 0 && <Dot color="bg-emerald-400" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-card rounded-3xl p-5 border border-border/60">
        <div className="text-xs text-muted-foreground">Detail tanggal</div>
        <div className="font-display text-lg mb-3">
          {new Date(selected).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
        </div>
        <div className="grid grid-cols-3 gap-2">
          <DetailCard icon={<Heart className="w-4 h-4" />} label="Sholat" value={`${sel.prayerCount}/5`} to="/sholat" />
          <DetailCard icon={<UtensilsCrossed className="w-4 h-4" />} label="Kalori" value={`${sel.calories}`} to="/makan" />
          <DetailCard icon={<Wallet className="w-4 h-4" />} label="Uang" value={`Rp${sel.spend.toLocaleString("id-ID")}`} to="/pengeluaran" />
        </div>
      </div>

      <div className="bg-card rounded-3xl p-4 border border-border/60">
        <div className="flex items-center justify-between mb-3">
          <div className="font-display text-base">Diagram Keuangan · {monthName}</div>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
          <div className="bg-emerald-500/10 rounded-xl p-2">
            <div className="text-muted-foreground">Masuk</div>
            <div className="font-display text-emerald-600">Rp{totalIn.toLocaleString("id-ID")}</div>
          </div>
          <div className="bg-rose-500/10 rounded-xl p-2">
            <div className="text-muted-foreground">Keluar</div>
            <div className="font-display text-rose-600">Rp{totalOut.toLocaleString("id-ID")}</div>
          </div>
          <div className="bg-primary/10 rounded-xl p-2">
            <div className="text-muted-foreground">Saldo</div>
            <div className="font-display text-primary">Rp{(totalIn - totalOut).toLocaleString("id-ID")}</div>
          </div>
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={expenseChart} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.05 15)" />
              <XAxis dataKey="day" fontSize={10} stroke="oklch(0.55 0.08 15)" />
              <YAxis fontSize={10} stroke="oklch(0.55 0.08 15)" tickFormatter={(v) => v >= 1000 ? `${Math.round(v/1000)}k` : v} />
              <Tooltip
                contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }}
                formatter={(v: number) => `Rp${v.toLocaleString("id-ID")}`}
              />
              <Bar dataKey="Masuk" fill="oklch(0.7 0.18 145)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Keluar" fill="oklch(0.68 0.22 12)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/15 rounded-2xl p-2 backdrop-blur">
      <div className="text-[10px] opacity-80">{label}</div>
      <div className="font-display text-sm">{value}</div>
    </div>
  );
}

function Dot({ color }: { color: string }) {
  return <span className={"w-1 h-1 rounded-full " + color} />;
}

function DetailCard({ icon, label, value, to }: { icon: React.ReactNode; label: string; value: string; to: string }) {
  return (
    <Link to={to} className="bg-muted/50 rounded-2xl p-3 hover:bg-muted transition-colors">
      <div className="flex items-center gap-1 text-muted-foreground text-xs">
        {icon}
        {label}
      </div>
      <div className="font-display text-base mt-1">{value}</div>
    </Link>
  );
}
