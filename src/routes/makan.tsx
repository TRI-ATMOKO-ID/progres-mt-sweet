import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Layout } from "@/components/app/Layout";
import { useTargetUserId, useReadOnly } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trash2, Plus } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/makan")({
  component: () => (
    <Layout>
      <MakanPage />
    </Layout>
  ),
});

const MEAL_TYPES = [
  { key: "sarapan", label: "Sarapan 🌅" },
  { key: "makan_siang", label: "Makan Siang ☀️" },
  { key: "makan_malam", label: "Makan Malam 🌙" },
  { key: "cemilan", label: "Cemilan 🍓" },
] as const;

function fmt(d: Date) {
  return d.toISOString().slice(0, 10);
}

// Heuristik kalori berdasarkan kata kunci nama lauk (otomatis tanpa input user)
const CALORIE_MAP: { kw: string; cal: number }[] = [
  { kw: "nasi goreng", cal: 540 },
  { kw: "nasi uduk", cal: 480 },
  { kw: "nasi kuning", cal: 460 },
  { kw: "nasi padang", cal: 650 },
  { kw: "nasi", cal: 250 },
  { kw: "mie ayam", cal: 450 },
  { kw: "mie goreng", cal: 520 },
  { kw: "mie", cal: 380 },
  { kw: "bakso", cal: 350 },
  { kw: "soto", cal: 320 },
  { kw: "rendang", cal: 470 },
  { kw: "ayam goreng", cal: 320 },
  { kw: "ayam bakar", cal: 280 },
  { kw: "ayam geprek", cal: 420 },
  { kw: "ayam", cal: 260 },
  { kw: "ikan goreng", cal: 230 },
  { kw: "ikan bakar", cal: 200 },
  { kw: "ikan", cal: 180 },
  { kw: "telur dadar", cal: 180 },
  { kw: "telur ceplok", cal: 95 },
  { kw: "telur", cal: 80 },
  { kw: "tempe", cal: 150 },
  { kw: "tahu", cal: 120 },
  { kw: "sayur", cal: 80 },
  { kw: "gado-gado", cal: 380 },
  { kw: "ketoprak", cal: 420 },
  { kw: "sate", cal: 320 },
  { kw: "pizza", cal: 285 },
  { kw: "burger", cal: 450 },
  { kw: "kentang", cal: 230 },
  { kw: "roti", cal: 250 },
  { kw: "donat", cal: 270 },
  { kw: "kue", cal: 280 },
  { kw: "coklat", cal: 230 },
  { kw: "buah", cal: 80 },
  { kw: "apel", cal: 80 },
  { kw: "pisang", cal: 105 },
  { kw: "jeruk", cal: 60 },
  { kw: "susu", cal: 150 },
  { kw: "kopi", cal: 50 },
  { kw: "teh", cal: 30 },
  { kw: "jus", cal: 120 },
  { kw: "es krim", cal: 280 },
  { kw: "salad", cal: 150 },
];

function estimateCalories(name: string): number {
  const n = name.toLowerCase().trim();
  if (!n) return 0;
  for (const item of CALORIE_MAP) {
    if (n.includes(item.kw)) return item.cal;
  }
  // fallback berbasis panjang kata (kira-kira 1 porsi standar)
  return 250;
}

function MakanPage() {
  const targetId = useTargetUserId();
  const readOnly = useReadOnly();
  const [date, setDate] = useState(fmt(new Date()));
  const [meals, setMeals] = useState<any[]>([]);
  const [type, setType] = useState<string>("sarapan");
  const [food, setFood] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!targetId) return;
    const { data } = await supabase
      .from("meals")
      .select("*")
      .eq("user_id", targetId)
      .eq("date", date)
      .order("created_at", { ascending: true });
    setMeals(data ?? []);
  };

  useEffect(() => {
    load();
  }, [targetId, date]);

  const add = async () => {
    if (readOnly || !targetId) return;
    const name = food.trim();
    if (!name) {
      toast.error("Isi nama lauk dulu ya 🍓");
      return;
    }
    if (name.length > 80) {
      toast.error("Nama lauk terlalu panjang");
      return;
    }
    setSaving(true);
    const calories = estimateCalories(name);
    const { error } = await supabase.from("meals").insert({
      user_id: targetId,
      date,
      meal_type: type,
      food_name: name,
      calories,
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Tercatat! ~${calories} kkal`);
    setFood("");
    load();
  };

  const remove = async (id: string) => {
    if (readOnly) return;
    const { error } = await supabase.from("meals").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    load();
  };

  const total = meals.reduce((s, m) => s + (m.calories ?? 0), 0);
  const preview = food.trim() ? estimateCalories(food) : 0;

  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-br from-primary to-[oklch(0.55_0.25_10)] text-primary-foreground rounded-3xl p-5 shadow-[var(--shadow-sweet)]">
        <div className="text-xs opacity-80">Total kalori hari ini</div>
        <div className="font-display text-3xl">{total.toLocaleString("id-ID")} kkal 🍓</div>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="mt-3 bg-white/15 backdrop-blur text-primary-foreground rounded-xl px-3 py-1.5 text-sm border border-white/20 [color-scheme:dark]"
        />
      </div>

      {!readOnly && (
        <div className="bg-card rounded-3xl p-4 border border-border/60 shadow-sm space-y-3">
          <div className="font-display text-sm">Tambah makan</div>
          <div className="grid grid-cols-2 gap-2">
            {MEAL_TYPES.map((t) => (
              <button
                key={t.key}
                onClick={() => setType(t.key)}
                className={
                  "rounded-xl py-2 px-3 text-sm border-2 transition-all " +
                  (type === t.key
                    ? "bg-primary/10 border-primary text-foreground"
                    : "bg-background border-border/50 text-muted-foreground hover:border-primary/50")
                }
              >
                {t.label}
              </button>
            ))}
          </div>
          <input
            value={food}
            onChange={(e) => setFood(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="Nama lauk (mis: nasi ayam goreng)"
            maxLength={80}
            className="w-full rounded-xl border-2 border-border/60 bg-background px-3 py-2.5 text-sm focus:outline-none focus:border-primary"
          />
          {preview > 0 && (
            <div className="text-xs text-muted-foreground">
              Estimasi otomatis: <span className="font-semibold text-primary">~{preview} kkal</span>
            </div>
          )}
          <button
            onClick={add}
            disabled={saving}
            className="w-full bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 shadow-[var(--shadow-sweet)]"
          >
            <Plus className="w-4 h-4" />
            {saving ? "Menyimpan..." : "Catat makan"}
          </button>
        </div>
      )}

      <div className="space-y-3">
        {MEAL_TYPES.map((t) => {
          const items = meals.filter((m) => m.meal_type === t.key);
          if (items.length === 0) return null;
          const sub = items.reduce((s, m) => s + (m.calories ?? 0), 0);
          return (
            <div key={t.key} className="bg-card rounded-3xl p-4 border border-border/60">
              <div className="flex items-center justify-between mb-2">
                <div className="font-display text-sm">{t.label}</div>
                <div className="text-xs font-semibold text-primary">{sub} kkal</div>
              </div>
              <div className="space-y-1.5">
                {items.map((m) => (
                  <div key={m.id} className="flex items-center justify-between gap-2 text-sm py-1.5 border-b border-border/40 last:border-0">
                    <div className="flex-1 truncate">{m.food_name}</div>
                    <div className="text-xs text-muted-foreground tabular-nums">{m.calories} kkal</div>
                    {!readOnly && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button className="text-muted-foreground hover:text-destructive p-1" aria-label="Hapus">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Hapus catatan ini?</AlertDialogTitle>
                            <AlertDialogDescription>
                              "{m.food_name}" ({m.calories} kkal) akan dihapus permanen.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction onClick={() => remove(m.id)}>Hapus</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {meals.length === 0 && (
          <div className="text-center text-sm text-muted-foreground py-8">
            Belum ada catatan makan untuk tanggal ini 🍓
          </div>
        )}
      </div>
    </div>
  );
}