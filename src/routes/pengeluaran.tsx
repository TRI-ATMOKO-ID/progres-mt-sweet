import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Layout } from "@/components/app/Layout";
import { useTargetUserId, useReadOnly } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, TrendingDown, TrendingUp, Wallet } from "lucide-react";
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

export const Route = createFileRoute("/pengeluaran")({
  component: () => (
    <Layout>
      <PengeluaranPage />
    </Layout>
  ),
});

const CATEGORIES = ["makan", "transport", "belanja", "tagihan", "hiburan", "kesehatan", "lainnya"];

function fmt(d: Date) {
  return d.toISOString().slice(0, 10);
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

function rupiah(n: number) {
  return "Rp" + Math.round(n).toLocaleString("id-ID");
}

function PengeluaranPage() {
  const targetId = useTargetUserId();
  const readOnly = useReadOnly();
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [rows, setRows] = useState<any[]>([]);

  // form
  const [date, setDate] = useState(fmt(new Date()));
  const [type, setType] = useState<"expense" | "income">("expense");
  const [desc, setDesc] = useState("");
  const [category, setCategory] = useState("makan");
  const [amount, setAmount] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const start = fmt(month);
  const end = fmt(endOfMonth(month));

  const load = async () => {
    if (!targetId) return;
    const { data } = await supabase
      .from("expenses")
      .select("*")
      .eq("user_id", targetId)
      .gte("date", start)
      .lte("date", end)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });
    setRows(data ?? []);
  };

  useEffect(() => {
    load();
  }, [targetId, start, end]);

  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const r of rows) {
      const a = Number(r.amount ?? 0);
      if ((r as any).type === "income") income += a;
      else expense += a;
    }
    return { income, expense, balance: income - expense };
  }, [rows]);

  const add = async () => {
    if (readOnly || !targetId) return;
    const d = desc.trim();
    const a = Number(amount);
    if (!d) return toast.error("Isi deskripsi");
    if (d.length > 120) return toast.error("Deskripsi terlalu panjang");
    if (!Number.isFinite(a) || a <= 0) return toast.error("Nominal tidak valid");
    if (a > 1_000_000_000) return toast.error("Nominal terlalu besar");
    setSaving(true);
    const { error } = await supabase.from("expenses").insert({
      user_id: targetId,
      date,
      description: d,
      category: type === "income" ? "pemasukan" : category,
      amount: a,
      type,
    } as any);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(type === "income" ? "Pemasukan tercatat 🍓" : "Pengeluaran tercatat 🍓");
    setDesc("");
    setAmount("");
    load();
  };

  const remove = async (id: string) => {
    if (readOnly) return;
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Dihapus");
    load();
  };

  const monthName = month.toLocaleDateString("id-ID", { month: "long", year: "numeric" });

  // Group by date for accountable view
  const grouped = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const r of rows) {
      if (!map.has(r.date)) map.set(r.date, []);
      map.get(r.date)!.push(r);
    }
    return Array.from(map.entries());
  }, [rows]);

  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-br from-primary to-[oklch(0.55_0.25_10)] text-primary-foreground rounded-3xl p-5 shadow-[var(--shadow-sweet)]">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs opacity-80">Saldo bulan ini</div>
            <div className="font-display text-3xl">{rupiah(totals.balance)}</div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
              className="px-2 py-1 rounded-full bg-white/15 text-xs"
            >
              ‹
            </button>
            <div className="text-xs px-2 capitalize">{monthName}</div>
            <button
              onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
              className="px-2 py-1 rounded-full bg-white/15 text-xs"
            >
              ›
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-4">
          <div className="bg-white/15 rounded-2xl p-3 backdrop-blur">
            <div className="text-[10px] opacity-80 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Pemasukan
            </div>
            <div className="font-display text-base mt-0.5">{rupiah(totals.income)}</div>
          </div>
          <div className="bg-white/15 rounded-2xl p-3 backdrop-blur">
            <div className="text-[10px] opacity-80 flex items-center gap-1">
              <TrendingDown className="w-3 h-3" /> Pengeluaran
            </div>
            <div className="font-display text-base mt-0.5">{rupiah(totals.expense)}</div>
          </div>
        </div>
      </div>

      {!readOnly && (
        <div className="bg-card rounded-3xl p-4 border border-border/60 shadow-sm space-y-3">
          <div className="font-display text-sm">Catat transaksi</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setType("expense")}
              className={
                "rounded-xl py-2 text-sm font-semibold border-2 transition-all flex items-center justify-center gap-1.5 " +
                (type === "expense"
                  ? "bg-primary/10 border-primary text-foreground"
                  : "bg-background border-border/50 text-muted-foreground")
              }
            >
              <TrendingDown className="w-4 h-4" /> Pengeluaran
            </button>
            <button
              onClick={() => setType("income")}
              className={
                "rounded-xl py-2 text-sm font-semibold border-2 transition-all flex items-center justify-center gap-1.5 " +
                (type === "income"
                  ? "bg-emerald-500/10 border-emerald-500 text-foreground"
                  : "bg-background border-border/50 text-muted-foreground")
              }
            >
              <TrendingUp className="w-4 h-4" /> Pemasukan
            </button>
          </div>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-xl border-2 border-border/60 bg-background px-3 py-2.5 text-sm focus:outline-none focus:border-primary"
          />
          <input
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Deskripsi (mis: kopi pagi)"
            maxLength={120}
            className="w-full rounded-xl border-2 border-border/60 bg-background px-3 py-2.5 text-sm focus:outline-none focus:border-primary"
          />
          {type === "expense" && (
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border-2 border-border/60 bg-background px-3 py-2.5 text-sm focus:outline-none focus:border-primary capitalize"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">Rp</span>
            <input
              type="number"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && add()}
              placeholder="0"
              min={0}
              className="w-full rounded-xl border-2 border-border/60 bg-background pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <button
            onClick={add}
            disabled={saving}
            className="w-full bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 shadow-[var(--shadow-sweet)]"
          >
            <Plus className="w-4 h-4" />
            {saving ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      )}

      <div className="bg-card rounded-3xl border border-border/60 overflow-hidden">
        <div className="px-4 py-3 border-b border-border/60 flex items-center gap-2">
          <Wallet className="w-4 h-4 text-primary" />
          <div className="font-display text-sm">Buku kas — {monthName}</div>
        </div>
        {grouped.length === 0 && (
          <div className="p-8 text-center text-sm text-muted-foreground">Belum ada transaksi bulan ini 🍓</div>
        )}
        <div className="divide-y divide-border/50">
          {grouped.map(([d, items]) => {
            const dayIn = items.filter((r) => (r as any).type === "income").reduce((s, r) => s + Number(r.amount), 0);
            const dayOut = items.filter((r) => (r as any).type !== "income").reduce((s, r) => s + Number(r.amount), 0);
            return (
              <div key={d}>
                <div className="px-4 py-2 bg-muted/40 flex justify-between text-xs">
                  <span className="font-semibold">
                    {new Date(d).toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" })}
                  </span>
                  <span className="text-muted-foreground">
                    {dayIn > 0 && <span className="text-emerald-600">+{rupiah(dayIn)} </span>}
                    {dayOut > 0 && <span className="text-primary">-{rupiah(dayOut)}</span>}
                  </span>
                </div>
                <div>
                  {items.map((r) => {
                    const isIncome = (r as any).type === "income";
                    return (
                      <div key={r.id} className="px-4 py-2.5 flex items-center gap-2 text-sm">
                        <div
                          className={
                            "w-8 h-8 rounded-full grid place-items-center text-xs " +
                            (isIncome ? "bg-emerald-500/15 text-emerald-600" : "bg-primary/15 text-primary")
                          }
                        >
                          {isIncome ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="truncate">{r.description}</div>
                          <div className="text-[10px] text-muted-foreground capitalize">{r.category}</div>
                        </div>
                        <div
                          className={
                            "tabular-nums font-semibold text-sm " +
                            (isIncome ? "text-emerald-600" : "text-primary")
                          }
                        >
                          {isIncome ? "+" : "-"}
                          {rupiah(Number(r.amount))}
                        </div>
                        {!readOnly && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <button className="text-muted-foreground hover:text-destructive p-1" aria-label="Hapus">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Hapus transaksi?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  "{r.description}" sebesar {rupiah(Number(r.amount))} akan dihapus permanen.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction onClick={() => remove(r.id)}>Hapus</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        {grouped.length > 0 && (
          <div className="px-4 py-3 border-t border-border/60 bg-muted/30 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Pemasukan</span>
              <span className="font-semibold text-emerald-600 tabular-nums">{rupiah(totals.income)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Pengeluaran</span>
              <span className="font-semibold text-primary tabular-nums">{rupiah(totals.expense)}</span>
            </div>
            <div className="flex justify-between border-t border-border/60 pt-1 mt-1">
              <span className="font-display">Saldo</span>
              <span className="font-display tabular-nums">{rupiah(totals.balance)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}