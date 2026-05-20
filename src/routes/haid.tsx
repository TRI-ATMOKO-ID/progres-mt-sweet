import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Layout } from "@/components/app/Layout";
import { useAuth, useTargetUserId, useReadOnly } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Droplet, Trash2 } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/haid")({
  component: () => (
    <Layout>
      <HaidPage />
    </Layout>
  ),
});

function fmt(d: Date) { return d.toISOString().slice(0, 10); }

function HaidPage() {
  const { role, mutiaUserId } = useAuth();
  const targetId = useTargetUserId();
  const readOnly = useReadOnly();
  const navigate = useNavigate();
  const [cycles, setCycles] = useState<any[]>([]);
  const [start, setStart] = useState(fmt(new Date()));
  const [end, setEnd] = useState<string>("");
  const [notes, setNotes] = useState("");

  // Hanya untuk Mutia (atau Tri yang sedang melihat Mutia)
  useEffect(() => {
    if (role && role === "tri" && targetId !== mutiaUserId) {
      navigate({ to: "/" });
    }
  }, [role, targetId, mutiaUserId, navigate]);

  const load = async () => {
    if (!targetId) return;
    const { data } = await supabase.from("cycles").select("*")
      .eq("user_id", targetId).order("start_date", { ascending: false }).limit(12);
    setCycles(data ?? []);
  };
  useEffect(() => { load(); }, [targetId]);

  const add = async () => {
    if (readOnly || !targetId) return;
    if (!start) { toast.error("Tanggal mulai wajib"); return; }
    const { error } = await supabase.from("cycles").insert({
      user_id: targetId, start_date: start, end_date: end || null, notes: notes || null,
    });
    if (error) { toast.error(error.message); return; }
    setEnd(""); setNotes("");
    toast.success("Tercatat 🌸");
    load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("cycles").delete().eq("id", id);
    if (error) toast.error(error.message); else load();
  };

  const setEndToday = async (id: string) => {
    const { error } = await supabase.from("cycles").update({ end_date: fmt(new Date()) }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Selesai dicatat"); load(); }
  };

  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-br from-[oklch(0.78_0.18_18)] to-primary text-primary-foreground rounded-3xl p-5 shadow-[var(--shadow-sweet)]">
        <div className="flex items-center gap-2 text-xs opacity-90">
          <Droplet className="w-4 h-4" /> Catatan Siklus
        </div>
        <div className="font-display text-2xl mt-1">Khusus untuk Mutia 🌸</div>
        <p className="text-xs opacity-80 mt-2">
          Saat haid, tidak ada kewajiban sholat & puasa. Tercatat untuk membantumu mengingat siklus.
        </p>
      </div>

      {!readOnly && (
        <div className="bg-card rounded-3xl p-4 border border-border/60 space-y-3">
          <div className="font-display text-base">Catat siklus baru</div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted-foreground">Mulai</label>
              <input type="date" value={start} onChange={(e) => setStart(e.target.value)}
                className="w-full mt-1 rounded-xl border border-border bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Selesai (opsional)</label>
              <input type="date" value={end} onChange={(e) => setEnd(e.target.value)}
                className="w-full mt-1 rounded-xl border border-border bg-background px-3 py-2 text-sm" />
            </div>
          </div>
          <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Catatan (opsional)"
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" />
          <button onClick={add} className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl font-display">
            Simpan
          </button>
        </div>
      )}

      <div className="bg-card rounded-3xl p-4 border border-border/60">
        <div className="font-display text-sm mb-3">Riwayat siklus</div>
        {cycles.length === 0 && <div className="text-xs text-muted-foreground">Belum ada catatan</div>}
        <div className="space-y-2">
          {cycles.map((c) => {
            const ongoing = !c.end_date;
            return (
              <div key={c.id} className="flex items-center justify-between p-3 rounded-2xl bg-muted/40">
                <div>
                  <div className="font-display text-sm">
                    {new Date(c.start_date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                    {" — "}
                    {c.end_date
                      ? new Date(c.end_date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })
                      : <span className="text-primary">berlangsung</span>}
                  </div>
                  {c.notes && <div className="text-xs text-muted-foreground mt-0.5">{c.notes}</div>}
                </div>
                {!readOnly && (
                  <div className="flex items-center gap-1">
                    {ongoing && (
                      <button onClick={() => setEndToday(c.id)}
                        className="text-[10px] px-2 py-1 rounded-full bg-primary text-primary-foreground">
                        Selesai
                      </button>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button className="p-2 rounded-full hover:bg-destructive/10 text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Hapus catatan?</AlertDialogTitle>
                          <AlertDialogDescription>Catatan siklus ini akan dihapus permanen.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction onClick={() => remove(c.id)}>Hapus</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
