import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Layout } from "@/components/app/Layout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Gamepad2, Plus, Hash, Grid3x3, Trash2, Crown, Dice5 } from "lucide-react";

export const Route = createFileRoute("/mabar")({
  component: () => (
    <Layout>
      <MabarLobby />
    </Layout>
  ),
});

const GAMES = [
  { id: "tictactoe", label: "Tic-Tac-Toe", icon: Grid3x3, desc: "X & O, 3 berderet menang" },
  { id: "tebakkata", label: "Tebak Tebakan", icon: Hash, desc: "Tebak kata dari petunjuk" },
  { id: "catur", label: "Catur", icon: Crown, desc: "Catur klasik 8x8, putih vs hitam" },
  { id: "ludo", label: "Ludo", icon: Dice5, desc: "Lempar dadu, balap 4 pion ke finish" },
] as const;

function MabarLobby() {
  const { user, role, mutiaUserId } = useAuth();
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    (async () => {
      if (role === "tri") setPartnerId(mutiaUserId);
      else {
        const { data } = await supabase.from("user_roles").select("user_id").eq("role", "tri").maybeSingle();
        setPartnerId(data?.user_id ?? null);
      }
    })();
  }, [user, role, mutiaUserId]);

  const load = async () => {
    const { data } = await supabase
      .from("game_sessions" as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    setSessions((data as any) ?? []);
  };

  useEffect(() => {
    load();
    if (!user) return;
    const ch = supabase
      .channel("mabar-lobby-" + user.id)
      .on("postgres_changes", { event: "*", schema: "public", table: "game_sessions" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user]);

  const invite = async (gameId: string) => {
    if (!user || !partnerId) {
      toast.error("Pasangan belum tersedia");
      return;
    }
    let initialState: any;
    let firstTurn = user.id;
    if (gameId === "tictactoe") {
      initialState = { board: Array(9).fill(""), symbols: { [user.id]: "X", [partnerId]: "O" } };
    } else if (gameId === "tebakkata") {
      initialState = { guesses: [] };
      firstTurn = partnerId;
    } else if (gameId === "catur") {
      initialState = {
        fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        colors: { [user.id]: "w", [partnerId]: "b" },
        history: [],
      };
    } else if (gameId === "ludo") {
      initialState = {
        // 4 pawns each, position -1 = home, 0..51 = track, 52..56 = finish lane, 57 = goal
        pawns: { [user.id]: [-1, -1, -1, -1], [partnerId]: [-1, -1, -1, -1] },
        colors: { [user.id]: "merah", [partnerId]: "biru" },
        starts: { [user.id]: 0, [partnerId]: 26 },
        dice: 0,
        rolled: false,
      };
    }
    const { data, error } = await supabase
      .from("game_sessions" as any)
      .insert({
        game_type: gameId,
        invited_by: user.id,
        invited_to: partnerId,
        status: "active",
        current_turn: firstTurn,
        state: initialState,
      })
      .select()
      .single();
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Ajakan terkirim! 🎮");
    const newId = (data as any).id;
    if (gameId === "catur") {
      window.location.href = `https://chess-tri-mutia.lovable.app/room/${newId}`;
      return;
    }
    if (gameId === "ludo") {
      window.location.href = `https://ludo-mt.lovable.app/mabar/${newId}`;
      return;
    }
    if (gameId === "tictactoe") {
      window.location.href = `https://tictactoe-mt.lovable.app/mabar/7aece522-1f75-479c-a85d-2d526a51926f`;
      return;
    }
    if (gameId === "tebakkata") {
      window.location.href = `https://tebakkata-mt.lovable.app/mabar/${newId}`;
      return;
    }
    navigate({ to: "/mabar/$id", params: { id: newId } });
  };

  const remove = async (id: string) => {
    await supabase.from("game_sessions" as any).delete().eq("id", id);
    load();
  };

  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-br from-[oklch(0.55_0.18_280)] to-primary text-primary-foreground rounded-3xl p-5">
        <div className="flex items-center gap-2 text-xs opacity-90">
          <Gamepad2 className="w-4 h-4" /> Mabar Berdua
        </div>
        <div className="font-display text-2xl mt-1">Yuk main bareng 🎮</div>
        <p className="text-xs opacity-80 mt-2">
          Pilih game, ajak pasangan, lalu main realtime.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {GAMES.map((g) => {
          const Icon = g.icon;
          return (
            <button
              key={g.id}
              onClick={() => invite(g.id)}
              className="bg-card rounded-3xl p-5 border border-border/60 hover:border-primary hover:shadow-[var(--shadow-sweet)] transition-all text-left"
            >
              <Icon className="w-8 h-8 text-primary" />
              <div className="font-display mt-2">{g.label}</div>
              <div className="text-xs text-muted-foreground mt-1">{g.desc}</div>
              <div className="mt-3 inline-flex items-center gap-1 text-xs text-primary font-semibold">
                <Plus className="w-3 h-3" /> Ajak main
              </div>
            </button>
          );
        })}
      </div>

      <div className="bg-card rounded-3xl p-4 border border-border/60">
        <div className="font-display text-sm mb-3">Riwayat & sesi aktif</div>
        {sessions.length === 0 && (
          <div className="text-xs text-muted-foreground">Belum ada sesi. Ajak pasangan main yuk!</div>
        )}
        <div className="space-y-2">
          {sessions.map((s) => {
            const label =
              s.game_type === "tictactoe"
                ? "Tic-Tac-Toe"
                : s.game_type === "tebakkata"
                ? "Tebak Tebakan"
                : s.game_type === "catur"
                ? "Catur"
                : s.game_type === "ludo"
                ? "Ludo"
                : s.game_type;
            const youHost = s.invited_by === user?.id;
            return (
              <div key={s.id} className="flex items-center gap-2 p-3 rounded-2xl bg-muted/40">
                <div className="flex-1">
                  <div className="text-sm font-display">{label}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {youHost ? "Kamu yang ngajak" : "Pasanganmu yang ngajak"} ·{" "}
                    {s.status === "finished"
                      ? s.winner_id === user?.id
                        ? "🏆 Kamu menang"
                        : s.winner_id
                        ? "Pasangan menang"
                        : "Seri"
                      : s.status}
                  </div>
                </div>
                {s.game_type === "catur" || s.game_type === "ludo" || s.game_type === "tictactoe" || s.game_type === "tebakkata" ? (
                  <a
                    href={
                      s.game_type === "catur"
                        ? `https://chess-tri-mutia.lovable.app/room/${s.id}`
                        : s.game_type === "ludo"
                        ? `https://ludo-mt.lovable.app/mabar/${s.id}`
                        : s.game_type === "tictactoe"
                        ? `https://tictactoe-mt.lovable.app/mabar/7aece522-1f75-479c-a85d-2d526a51926f`
                        : `https://tebakkata-mt.lovable.app/mabar/${s.id}`
                    }
                    className="text-xs px-3 py-1.5 rounded-full bg-primary text-primary-foreground"
                  >
                    {s.status === "finished" ? "Lihat" : "Buka"}
                  </a>
                ) : (
                  <Link
                    to="/mabar/$id"
                    params={{ id: s.id }}
                    className="text-xs px-3 py-1.5 rounded-full bg-primary text-primary-foreground"
                  >
                    {s.status === "finished" ? "Lihat" : "Buka"}
                  </Link>
                )}
                {youHost && (
                  <button onClick={() => remove(s.id)} className="p-1.5 text-destructive">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}