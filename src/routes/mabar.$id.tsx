import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Layout } from "@/components/app/Layout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { playDing } from "@/lib/notifications";
import { Ludo } from "@/components/games/Ludo";
import { Catur } from "@/components/games/Catur";

export const Route = createFileRoute("/mabar/$id")({
  component: () => (
    <Layout>
      <GamePage />
    </Layout>
  ),
});

function GamePage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const [s, setS] = useState<any>(null);

  // Redirect game eksternal lebih awal tanpa menunggu data sesi
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("game_sessions" as any)
        .select("game_type")
        .eq("id", id)
        .maybeSingle();
      const gt = (data as any)?.game_type;
      if (typeof window === "undefined") return;
      if (gt === "catur") {
        window.location.replace(`https://chess-tri-mutia.lovable.app/room/${id}`);
      } else if (gt === "ludo") {
        window.location.replace(`https://ludo-mt.lovable.app/mabar/${id}`);
      } else if (gt === "tictactoe") {
        window.location.replace(`https://tictactoe-mt.lovable.app/mabar/7aece522-1f75-479c-a85d-2d526a51926f`);
      } else if (gt === "tebakkata") {
        window.location.replace(`https://tebakkata-mt.lovable.app/mabar/${id}`);
      }
    })();
  }, [id]);

  const load = async () => {
    const { data } = await supabase.from("game_sessions" as any).select("*").eq("id", id).maybeSingle();
    setS(data);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("game-" + id)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "game_sessions", filter: `id=eq.${id}` },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [id]);

  if (!s || !user) return <div className="text-center py-12">Memuat…</div>;

  // Game eksternal dialihkan ke aplikasi terpisah
  if (s.game_type === "catur" || s.game_type === "ludo" || s.game_type === "tictactoe" || s.game_type === "tebakkata") {
    const url =
      s.game_type === "catur"
        ? `https://chess-tri-mutia.lovable.app/room/${id}`
        : s.game_type === "ludo"
        ? `https://ludo-mt.lovable.app/mabar/${id}`
        : s.game_type === "tictactoe"
        ? `https://tictactoe-mt.lovable.app/mabar/7aece522-1f75-479c-a85d-2d526a51926f`
        : `https://tebakkata-mt.lovable.app/mabar/${id}`;
    const appName =
      s.game_type === "catur"
        ? "chess-tri-mutia"
        : s.game_type === "ludo"
        ? "ludo-mt"
        : s.game_type === "tictactoe"
        ? "tictactoe-mt"
        : "tebakkata-mt";
    if (typeof window !== "undefined") {
      window.location.replace(url);
    }
    return (
      <div className="space-y-4 text-center py-12">
        <div className="font-display text-lg">Mengarahkan ke ruang {s.game_type}…</div>
        <a
          href={url}
          className="inline-block bg-primary text-primary-foreground px-6 py-2.5 rounded-full font-display"
        >
          Buka {appName}
        </a>
        <div>
          <Link to="/mabar" className="text-xs text-muted-foreground underline">
            Kembali ke lobi
          </Link>
        </div>
      </div>
    );
  }

  const isMyTurn = s.current_turn === user.id && s.status === "active";
  const partnerLabel = s.invited_by === user.id ? "Pasangan" : "Pengajak";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link to="/mabar" className="p-2 rounded-full hover:bg-muted">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="font-display text-lg">
          {s.game_type === "tictactoe"
            ? "Tic-Tac-Toe"
            : s.game_type === "tebakkata"
            ? "Tebak Tebakan"
            : s.game_type === "catur"
            ? "Catur"
            : "Ludo"}
        </div>
        <div className="ml-auto text-xs text-muted-foreground">
          {s.status === "finished"
            ? s.winner_id === user.id
              ? "🏆 Kamu menang!"
              : s.winner_id
              ? "😢 Pasangan menang"
              : "🤝 Seri"
            : isMyTurn
            ? "🎯 Giliranmu"
            : `⏳ Menunggu ${partnerLabel}`}
        </div>
      </div>

      {s.game_type === "tictactoe" && <TicTacToe session={s} userId={user.id} reload={load} />}
      {s.game_type === "tebakangka" && <TebakAngka session={s} userId={user.id} reload={load} />}
      {s.game_type === "catur" && <Catur session={s} userId={user.id} reload={load} />}
      {s.game_type === "ludo" && <Ludo session={s} userId={user.id} reload={load} />}
    </div>
  );
}

/* ============== TIC-TAC-TOE ============== */
const WINS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];
function checkWin(board: string[]) {
  for (const line of WINS) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  }
  return null;
}

function TicTacToe({ session, userId, reload }: any) {
  const board: string[] = session.state.board ?? Array(9).fill("");
  const symbols: Record<string, string> = session.state.symbols ?? {};
  const mySymbol = symbols[userId] ?? "?";
  const partnerId = session.invited_by === userId ? session.invited_to : session.invited_by;

  const click = async (i: number) => {
    if (session.status !== "active") return;
    if (session.current_turn !== userId) return toast.error("Bukan giliranmu");
    if (board[i]) return;
    const next = [...board];
    next[i] = mySymbol;
    const winner = checkWin(next);
    const full = next.every((c) => c);
    const newState: any = { ...session.state, board: next };
    const updates: any = {
      state: newState,
      current_turn: partnerId,
    };
    if (winner) {
      updates.status = "finished";
      updates.winner_id = userId;
      playDing("love");
    } else if (full) {
      updates.status = "finished";
      updates.winner_id = null;
    }
    const { error } = await supabase.from("game_sessions" as any).update(updates).eq("id", session.id);
    if (error) toast.error(error.message);
    else reload();
  };

  const reset = async () => {
    await supabase
      .from("game_sessions" as any)
      .update({
        status: "active",
        winner_id: null,
        current_turn: userId,
        state: { board: Array(9).fill(""), symbols },
      })
      .eq("id", session.id);
    reload();
  };

  return (
    <div className="space-y-4">
      <div className="text-center text-sm text-muted-foreground">
        Simbol kamu: <span className="font-display text-2xl text-primary">{mySymbol}</span>
      </div>
      <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
        {board.map((c, i) => (
          <button
            key={i}
            onClick={() => click(i)}
            disabled={!!c || session.status !== "active"}
            className="aspect-square bg-card rounded-2xl border-2 border-border/60 hover:border-primary text-5xl font-display text-primary disabled:opacity-90 disabled:cursor-not-allowed transition-all"
          >
            {c}
          </button>
        ))}
      </div>
      {session.status === "finished" && (
        <button
          onClick={reset}
          className="mx-auto block bg-primary text-primary-foreground px-6 py-2.5 rounded-full font-display flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" /> Main lagi
        </button>
      )}
    </div>
  );
}

/* ============== TEBAK ANGKA ============== */
function TebakAngka({ session, userId, reload }: any) {
  const [guess, setGuess] = useState("");
  const isHost = session.invited_by === userId; // host yang taruh angka
  const guesses: { user_id: string; guess: number; hint: string }[] = session.state.guesses ?? [];
  const secret: number = session.state.secret;

  const submit = async () => {
    if (session.status !== "active") return;
    if (session.current_turn !== userId) return toast.error("Bukan giliranmu menebak");
    if (isHost) return toast.error("Kamu host — pasanganmu yang menebak");
    const g = Number(guess);
    if (!g || g < 1 || g > 100) return toast.error("Angka 1-100");
    const hint = g === secret ? "🎯 Tepat!" : g < secret ? "⬆️ Lebih besar" : "⬇️ Lebih kecil";
    const newGuesses = [...guesses, { user_id: userId, guess: g, hint }];
    const updates: any = {
      state: { ...session.state, guesses: newGuesses },
    };
    if (g === secret) {
      updates.status = "finished";
      updates.winner_id = userId;
      playDing("love");
    } else if (newGuesses.length >= 10) {
      updates.status = "finished";
      updates.winner_id = session.invited_by;
    }
    setGuess("");
    const { error } = await supabase.from("game_sessions" as any).update(updates).eq("id", session.id);
    if (error) toast.error(error.message);
    else reload();
  };

  const reset = async () => {
    await supabase
      .from("game_sessions" as any)
      .update({
        status: "active",
        winner_id: null,
        current_turn: session.invited_to,
        state: { secret: 1 + Math.floor(Math.random() * 100), guesses: [] },
      })
      .eq("id", session.id);
    reload();
  };

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-3xl p-5 border border-border/60 text-center">
        <div className="text-xs text-muted-foreground">
          {isHost ? "Pasanganmu menebak angka rahasia (1-100). Kamu lihat saja." : "Tebak angka 1-100 (max 10 kali)"}
        </div>
        {isHost && <div className="font-display text-3xl mt-2 text-primary">🤫 {secret}</div>}
        <div className="text-xs mt-2">
          Percobaan: <span className="font-display text-primary">{guesses.length}/10</span>
        </div>
      </div>

      {!isHost && session.status === "active" && (
        <div className="flex gap-2">
          <input
            type="number"
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            min={1}
            max={100}
            className="flex-1 rounded-full border border-border bg-card px-4 py-3 text-center font-display text-lg"
            placeholder="1-100"
          />
          <button onClick={submit} className="px-6 rounded-full bg-primary text-primary-foreground font-display">
            Tebak
          </button>
        </div>
      )}

      <div className="space-y-1.5">
        {guesses.slice().reverse().map((g, i) => (
          <div key={i} className="flex justify-between p-3 bg-muted/40 rounded-xl text-sm">
            <span className="font-display text-primary">{g.guess}</span>
            <span>{g.hint}</span>
          </div>
        ))}
      </div>

      {session.status === "finished" && (
        <button
          onClick={reset}
          className="mx-auto block bg-primary text-primary-foreground px-6 py-2.5 rounded-full font-display flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" /> Main lagi
        </button>
      )}
    </div>
  );
}