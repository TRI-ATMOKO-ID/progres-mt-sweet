import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dices, RefreshCw } from "lucide-react";
import { playDing } from "@/lib/notifications";

/**
 * Ludo sederhana 2 pemain.
 * Track 0..51 (52 kotak loop). Tiap pemain start beda (0 dan 26).
 * Dari start setelah 51 langkah masuk finish lane (52..56) lalu goal (57).
 * Pion mulai dari -1 (rumah). Keluar rumah hanya jika lempar 6.
 * Lempar 6 dapat giliran lagi. Sampai goal duluan semua 4 pion = menang.
 */
export function Ludo({ session, userId, reload }: any) {
  const partnerId = session.invited_by === userId ? session.invited_to : session.invited_by;
  const isMyTurn = session.current_turn === userId && session.status === "active";
  const myPawns: number[] = session.state.pawns[userId];
  const oppPawns: number[] = session.state.pawns[partnerId];
  const myStart: number = session.state.starts[userId];
  const oppStart: number = session.state.starts[partnerId];
  const myColor: string = session.state.colors[userId];
  const oppColor: string = session.state.colors[partnerId];
  const dice: number = session.state.dice;
  const rolled: boolean = session.state.rolled;

  const absPos = (start: number, p: number) => {
    if (p < 0 || p > 57) return -1;
    if (p >= 52) return -1; // di finish lane (tidak di track umum)
    return (start + p) % 52;
  };

  const canMove = (p: number, d: number) => {
    if (session.status !== "active") return false;
    if (p === 57) return false;
    if (p < 0) return d === 6;
    const next = p === -1 ? 0 : p + d;
    return next <= 57;
  };

  const anyMovable = (d: number) => myPawns.some((p) => canMove(p, d));

  const roll = async () => {
    if (!isMyTurn) return toast.error("Bukan giliranmu");
    if (rolled) return toast.error("Sudah lempar, gerakkan pion dulu");
    const d = 1 + Math.floor(Math.random() * 6);
    const newState = { ...session.state, dice: d, rolled: true };
    const updates: any = { state: newState };
    // Jika tidak ada gerakan yang mungkin → giliran berakhir
    const movable = myPawns.some((p) => {
      if (p === 57) return false;
      if (p < 0) return d === 6;
      return p + d <= 57;
    });
    if (!movable) {
      updates.state = { ...newState, dice: 0, rolled: false };
      updates.current_turn = partnerId;
    }
    await supabase.from("game_sessions" as any).update(updates).eq("id", session.id);
    reload();
  };

  const move = async (idx: number) => {
    if (!isMyTurn) return toast.error("Bukan giliranmu");
    if (!rolled || dice === 0) return toast.error("Lempar dadu dulu");
    const p = myPawns[idx];
    if (!canMove(p, dice)) return toast.error("Pion ini tidak bisa jalan");
    const newPos = p < 0 ? 0 : p + dice;
    const newMy = [...myPawns];
    newMy[idx] = newPos;

    // Tangkap lawan jika di posisi sama di track umum
    let newOpp = [...oppPawns];
    const myAbs = absPos(myStart, newPos);
    if (myAbs >= 0) {
      newOpp = newOpp.map((op) => (absPos(oppStart, op) === myAbs ? -1 : op));
    }

    const won = newMy.every((x) => x === 57);
    const got6 = dice === 6;
    const updates: any = {
      state: {
        ...session.state,
        pawns: { [userId]: newMy, [partnerId]: newOpp },
        dice: got6 && !won ? 0 : 0,
        rolled: false,
      },
    };
    if (won) {
      updates.status = "finished";
      updates.winner_id = userId;
      playDing("love");
    } else if (!got6) {
      updates.current_turn = partnerId;
    }
    await supabase.from("game_sessions" as any).update(updates).eq("id", session.id);
    reload();
  };

  const reset = async () => {
    await supabase
      .from("game_sessions" as any)
      .update({
        status: "active",
        winner_id: null,
        current_turn: userId,
        state: {
          ...session.state,
          pawns: { [userId]: [-1, -1, -1, -1], [partnerId]: [-1, -1, -1, -1] },
          dice: 0,
          rolled: false,
        },
      })
      .eq("id", session.id);
    reload();
  };

  const PawnLabel = ({ p }: { p: number }) =>
    p < 0 ? <>🏠</> : p === 57 ? <>🏁</> : p >= 52 ? <>🛬{p - 51}</> : <>{p}</>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card rounded-2xl p-3 border border-border/60">
          <div className="text-[10px] text-muted-foreground">Kamu ({myColor})</div>
          <div className="grid grid-cols-4 gap-1 mt-2">
            {myPawns.map((p, i) => (
              <button
                key={i}
                onClick={() => move(i)}
                disabled={!isMyTurn || !rolled || !canMove(p, dice)}
                className="aspect-square rounded-lg bg-[oklch(0.6_0.18_15)] text-white text-xs font-display flex items-center justify-center disabled:opacity-40"
              >
                <PawnLabel p={p} />
              </button>
            ))}
          </div>
        </div>
        <div className="bg-card rounded-2xl p-3 border border-border/60">
          <div className="text-[10px] text-muted-foreground">Pasangan ({oppColor})</div>
          <div className="grid grid-cols-4 gap-1 mt-2">
            {oppPawns.map((p, i) => (
              <div
                key={i}
                className="aspect-square rounded-lg bg-[oklch(0.55_0.18_240)] text-white text-xs font-display flex items-center justify-center"
              >
                <PawnLabel p={p} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-card rounded-2xl p-4 border border-border/60 text-center">
        <div className="text-xs text-muted-foreground">Dadu</div>
        <div className="font-display text-5xl text-primary my-2">{dice || "—"}</div>
        <button
          onClick={roll}
          disabled={!isMyTurn || rolled || session.status !== "active"}
          className="bg-primary text-primary-foreground px-5 py-2 rounded-full font-display inline-flex items-center gap-2 disabled:opacity-50"
        >
          <Dices className="w-4 h-4" /> Lempar
        </button>
        {rolled && !anyMovable(dice) && (
          <div className="text-xs text-muted-foreground mt-2">Tidak ada langkah, giliran lewat…</div>
        )}
      </div>

      <div className="text-[10px] text-muted-foreground text-center">
        Aturan: keluar rumah dgn dadu 6 · 6 dapat giliran lagi · 0→51 keliling, 52-56 finish lane, 57 goal · injak lawan = lawan pulang.
      </div>

      {session.status === "finished" && (
        <button
          onClick={reset}
          className="mx-auto bg-primary text-primary-foreground px-6 py-2.5 rounded-full font-display flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" /> Main lagi
        </button>
      )}
    </div>
  );
}