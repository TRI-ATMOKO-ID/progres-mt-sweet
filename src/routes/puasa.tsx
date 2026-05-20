import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Layout } from "@/components/app/Layout";
import { useTargetUserId, useReadOnly } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Lock, Check, Trash2, BookOpen, Moon } from "lucide-react";
import { FAST_LABELS, FastType, getEventStatus } from "@/lib/event-rules";
import { useHijri } from "@/lib/use-hijri";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/puasa")({
  component: () => (
    <Layout>
      <PuasaPage />
    </Layout>
  ),
});

const TYPES: FastType[] = [
  "sunnah_senin_kamis",
  "sunnah_ayyamul_bidh",
  "sunnah_syawal",
  "sunnah_arafah",
  "sunnah_asyura",
  "ramadhan",
  "qadha",
];

function fmt(d: Date) { return d.toISOString().slice(0, 10); }

function PuasaPage() {
  const targetId = useTargetUserId();
  const readOnly = useReadOnly();
  const today = fmt(new Date());
  const hijri = useHijri();

  const [fasts, setFasts] = useState<any[]>([]);
  const [tadarus, setTadarus] = useState<any[]>([]);

  const [selectedType, setSelectedType] = useState<FastType>("sunnah_senin_kamis");
  const [notes, setNotes] = useState("");
  const [tarawih, setTarawih] = useState(false);

  // tadarus form
  const [surah, setSurah] = useState("");
  const [fromAyah, setFromAyah] = useState<string>("");
  const [toAyah, setToAyah] = useState<string>("");
  const [pages, setPages] = useState<string>("");

  const load = async () => {
    if (!targetId) return;
    const since = fmt(new Date(Date.now() - 30 * 86400000));
    const [f, t] = await Promise.all([
      supabase.from("fasts").select("*").eq("user_id", targetId).gte("date", since).order("date", { ascending: false }),
      supabase.from("tadarus").select("*").eq("user_id", targetId).gte("date", since).order("date", { ascending: false }),
    ]);
    setFasts(f.data ?? []);
    setTadarus(t.data ?? []);
  };
  useEffect(() => { load(); }, [targetId]);

  const statuses = useMemo(() => {
    const map: Record<string, ReturnType<typeof getEventStatus>> = {};
    if (!hijri) {
      TYPES.forEach((t) => (map[t] = { unlocked: false, reason: "Memuat tanggal Hijriah…" }));
      return map;
    }
    TYPES.forEach((t) => (map[t] = getEventStatus(t, hijri)));
    return map;
  }, [hijri]);

  const todayFast = fasts.find((f) => f.date === today && f.fast_type === selectedType);

  const addOrToggleFast = async () => {
    if (readOnly || !targetId) return;
    const status = statuses[selectedType];
    if (!status.unlocked) { toast.error("Event terkunci: " + status.reason); return; }
    if (todayFast) {
      const { error } = await supabase.from("fasts").update({
        completed: !todayFast.completed, tarawih: selectedType === "ramadhan" ? tarawih : todayFast.tarawih,
        notes: notes || todayFast.notes,
      }).eq("id", todayFast.id);
      if (error) { toast.error(error.message); return; }
    } else {
      const { error } = await supabase.from("fasts").insert({
        user_id: targetId, date: today, fast_type: selectedType,
        completed: true, tarawih: selectedType === "ramadhan" ? tarawih : false,
        notes: notes || null,
      });
      if (error) { toast.error(error.message); return; }
    }
    setNotes(""); setTarawih(false);
    toast.success("Tercatat 🌙");
    load();
  };

  const removeFast = async (id: string) => {
    const { error } = await supabase.from("fasts").delete().eq("id", id);
    if (error) toast.error(error.message); else load();
  };

  const addTadarus = async () => {
    if (readOnly || !targetId) return;
    if (!surah.trim()) { toast.error("Nama surah wajib"); return; }
    const { error } = await supabase.from("tadarus").insert({
      user_id: targetId, date: today, surah: surah.trim(),
      from_ayah: fromAyah ? Number(fromAyah) : null,
      to_ayah: toAyah ? Number(toAyah) : null,
      pages: pages ? Number(pages) : null,
    });
    if (error) { toast.error(error.message); return; }
    setSurah(""); setFromAyah(""); setToAyah(""); setPages("");
    toast.success("Tadarus tercatat 📖");
    load();
  };

  const removeTadarus = async (id: string) => {
    const { error } = await supabase.from("tadarus").delete().eq("id", id);
    if (error) toast.error(error.message); else load();
  };

  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-br from-[oklch(0.55_0.18_280)] to-primary text-primary-foreground rounded-3xl p-5 shadow-[var(--shadow-sweet)]">
        <div className="flex items-center gap-2 text-xs opacity-90">
          <Moon className="w-4 h-4" /> Event Ibadah
        </div>
        <div className="font-display text-2xl mt-1">Puasa & Tadarus 🌙</div>
        <p className="text-xs opacity-80 mt-2">
          {hijri
            ? `${hijri.day} ${hijri.monthName} ${hijri.year} H · event update otomatis`
            : "Memuat kalender Hijriah…"}
        </p>
      </div>

      {/* Pilih event */}
      <div className="bg-card rounded-3xl p-4 border border-border/60 space-y-3">
        <div className="font-display text-sm">Pilih event puasa</div>
        <div className="grid grid-cols-2 gap-2">
          {TYPES.map((t) => {
            const s = statuses[t];
            const active = selectedType === t;
            return (
              <button
                key={t}
                onClick={() => setSelectedType(t)}
                className={
                  "text-left rounded-2xl p-3 border-2 transition-all " +
                  (active ? "border-primary bg-primary/10" : "border-border/60 bg-muted/30 hover:border-primary/50")
                }
              >
                <div className="flex items-center justify-between">
                  <div className="font-display text-sm">{FAST_LABELS[t]}</div>
                  {!s.unlocked && <Lock className="w-3.5 h-3.5 text-muted-foreground" />}
                </div>
                <div className="text-[10px] text-muted-foreground mt-1">
                  {s.unlocked ? "Tersedia hari ini" : s.reason}
                </div>
              </button>
            );
          })}
        </div>

        {!readOnly && (
          <div className="space-y-2 pt-2 border-t border-border/60">
            {selectedType === "ramadhan" && statuses.ramadhan.unlocked && (
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={tarawih} onChange={(e) => setTarawih(e.target.checked)} />
                Tarawih malam ini
              </label>
            )}
            <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Catatan (opsional)"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" />
            <button onClick={addOrToggleFast} disabled={!statuses[selectedType].unlocked}
              className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl font-display disabled:opacity-50 disabled:cursor-not-allowed">
              {todayFast ? (todayFast.completed ? "Batal tandai" : "Tandai selesai") : "Catat puasa hari ini"}
            </button>
          </div>
        )}
      </div>

      {/* Riwayat puasa */}
      <div className="bg-card rounded-3xl p-4 border border-border/60">
        <div className="font-display text-sm mb-3">Riwayat puasa (30 hari)</div>
        {fasts.length === 0 && <div className="text-xs text-muted-foreground">Belum ada catatan</div>}
        <div className="space-y-2">
          {fasts.map((f) => (
            <div key={f.id} className="flex items-center justify-between p-3 rounded-2xl bg-muted/40">
              <div>
                <div className="text-sm font-display">{FAST_LABELS[f.fast_type as FastType] ?? f.fast_type}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(f.date).toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" })}
                  {f.tarawih && " · 🕌 tarawih"}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {f.completed ? <Check className="w-4 h-4 text-primary" /> : <span className="text-xs text-muted-foreground">belum</span>}
                {!readOnly && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button className="p-1.5 rounded-full hover:bg-destructive/10 text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Hapus catatan puasa?</AlertDialogTitle>
                        <AlertDialogDescription>Catatan akan dihapus permanen.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={() => removeFast(f.id)}>Hapus</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tadarus */}
      <div className="bg-gradient-to-br from-accent/40 to-secondary rounded-3xl p-4 border border-border/60 space-y-3">
        <div className="flex items-center gap-2 font-display text-sm">
          <BookOpen className="w-4 h-4" /> Tadarus Qur'an
          <span className="ml-auto text-[10px] text-muted-foreground">Selalu tersedia</span>
        </div>
        {!readOnly && (
          <div className="space-y-2">
            <input value={surah} onChange={(e) => setSurah(e.target.value)} placeholder="Surah (mis. Al-Baqarah)"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" />
            <div className="grid grid-cols-3 gap-2">
              <input value={fromAyah} onChange={(e) => setFromAyah(e.target.value)} placeholder="Dari ayat" type="number"
                className="rounded-xl border border-border bg-background px-3 py-2 text-sm" />
              <input value={toAyah} onChange={(e) => setToAyah(e.target.value)} placeholder="Sampai ayat" type="number"
                className="rounded-xl border border-border bg-background px-3 py-2 text-sm" />
              <input value={pages} onChange={(e) => setPages(e.target.value)} placeholder="Halaman" type="number" step="0.5"
                className="rounded-xl border border-border bg-background px-3 py-2 text-sm" />
            </div>
            <button onClick={addTadarus} className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl font-display">
              Catat Tadarus
            </button>
          </div>
        )}
        <div className="space-y-1.5">
          {tadarus.length === 0 && <div className="text-xs text-muted-foreground">Belum ada tadarus tercatat</div>}
          {tadarus.map((t) => (
            <div key={t.id} className="flex items-center justify-between p-3 rounded-2xl bg-card">
              <div>
                <div className="text-sm font-display">{t.surah}
                  {t.from_ayah && t.to_ayah && <span className="text-xs text-muted-foreground"> · ayat {t.from_ayah}-{t.to_ayah}</span>}
                  {t.pages && <span className="text-xs text-muted-foreground"> · {t.pages} hal</span>}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {new Date(t.date).toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" })}
                </div>
              </div>
              {!readOnly && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button className="p-1.5 rounded-full hover:bg-destructive/10 text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Hapus catatan tadarus?</AlertDialogTitle>
                      <AlertDialogDescription>Catatan akan dihapus permanen.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Batal</AlertDialogCancel>
                      <AlertDialogAction onClick={() => removeTadarus(t.id)}>Hapus</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
