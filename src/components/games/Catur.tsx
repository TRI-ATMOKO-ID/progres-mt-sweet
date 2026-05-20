import { useMemo, useState } from "react";
import { Chess, Square } from "chess.js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { playDing } from "@/lib/notifications";

const PIECE: Record<string, string> = {
  wK: "♔", wQ: "♕", wR: "♖", wB: "♗", wN: "♘", wP: "♙",
  bK: "♚", bQ: "♛", bR: "♜", bB: "♝", bN: "♞", bP: "♟",
};

export function Catur({ session, userId, reload }: any) {
  const partnerId = session.invited_by === userId ? session.invited_to : session.invited_by;
  const myColor: "w" | "b" = session.state.colors[userId];
  const game = useMemo(() => new Chess(session.state.fen), [session.state.fen]);
  const [sel, setSel] = useState<Square | null>(null);

  const board = game.board(); // 8x8 from rank 8 to 1
  const flip = myColor === "b";

  const targets: Square[] = sel
    ? game.moves({ square: sel, verbose: true }).map((m: any) => m.to)
    : [];

  const click = async (sq: Square) => {
    if (session.status !== "active") return;
    if (session.current_turn !== userId) return toast.error("Bukan giliranmu");
    if (game.turn() !== myColor) return;

    const piece = game.get(sq);
    if (sel && targets.includes(sq)) {
      const move = game.move({ from: sel, to: sq, promotion: "q" });
      if (!move) {
        setSel(null);
        return;
      }
      const newFen = game.fen();
      const finished = game.isGameOver();
      const updates: any = {
        state: { ...session.state, fen: newFen, history: [...session.state.history, move.san] },
        current_turn: partnerId,
      };
      if (finished) {
        updates.status = "finished";
        if (game.isCheckmate()) {
          updates.winner_id = userId;
          playDing("love");
        } else {
          updates.winner_id = null;
        }
      }
      setSel(null);
      const { error } = await supabase.from("game_sessions" as any).update(updates).eq("id", session.id);
      if (error) toast.error(error.message);
      else reload();
      return;
    }
    if (piece && piece.color === myColor) setSel(sq);
    else setSel(null);
  };

  const reset = async () => {
    await supabase
      .from("game_sessions" as any)
      .update({
        status: "active",
        winner_id: null,
        current_turn: session.state.colors[userId] === "w" ? userId : partnerId,
        state: {
          ...session.state,
          fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
          history: [],
        },
      })
      .eq("id", session.id);
    reload();
  };

  const rows = flip ? [...board].reverse() : board;
  const files = flip ? ["h","g","f","e","d","c","b","a"] : ["a","b","c","d","e","f","g","h"];

  return (
    <div className="space-y-3">
      <div className="text-center text-xs text-muted-foreground">
        Kamu: <span className="font-display text-primary">{myColor === "w" ? "Putih" : "Hitam"}</span>
        {game.inCheck() && <span className="ml-2 text-destructive font-display">SKAK!</span>}
      </div>
      <div className="grid grid-cols-8 gap-0 max-w-md mx-auto rounded-xl overflow-hidden border-2 border-border/60">
        {rows.map((row, ri) =>
          (flip ? [...row].reverse() : row).map((cell, ci) => {
            const file = files[ci];
            const rank = flip ? ri + 1 : 8 - ri;
            const sq = (file + rank) as Square;
            const dark = (ri + ci) % 2 === 1;
            const isSel = sel === sq;
            const isTarget = targets.includes(sq);
            return (
              <button
                key={sq}
                onClick={() => click(sq)}
                className={`aspect-square text-3xl flex items-center justify-center transition-colors ${
                  dark ? "bg-[oklch(0.55_0.08_30)]" : "bg-[oklch(0.92_0.04_60)]"
                } ${isSel ? "ring-4 ring-primary ring-inset" : ""} ${
                  isTarget ? "ring-2 ring-primary/70 ring-inset" : ""
                }`}
              >
                {cell ? (
                  <span className={cell.color === "w" ? "text-white drop-shadow" : "text-black"}>
                    {PIECE[cell.color + cell.type.toUpperCase()]}
                  </span>
                ) : isTarget ? (
                  <span className="w-2 h-2 rounded-full bg-primary/70" />
                ) : null}
              </button>
            );
          })
        )}
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