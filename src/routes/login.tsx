import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

const ALLOWED = ["tri@strawberry.app", "mutia@strawberry.app"];

function LoginPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [who, setWho] = useState<"tri" | "mutia">("tri");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/" });
  }, [user, loading, navigate]);

  const email = who === "tri" ? "tri@strawberry.app" : "mutia@strawberry.app";

  const handle = async (mode: "in" | "up") => {
    if (!ALLOWED.includes(email)) return;
    if (password.length < 6) {
      toast.error("Password minimal 6 karakter");
      return;
    }
    setBusy(true);
    try {
      if (mode === "up") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Akun dibuat 🍓 silakan login");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/" });
      }
    } catch (e: any) {
      toast.error(e.message ?? "Gagal");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-6xl mb-2">🍓</div>
          <h1 className="font-display text-3xl text-primary">Strawberry Sweets</h1>
          <p className="text-sm text-muted-foreground mt-1">Buku progres Tri & Mutia</p>
        </div>

        <div className="bg-card rounded-3xl p-6 shadow-[var(--shadow-sweet)] border border-border/50">
          <Label className="text-xs">Siapa kamu?</Label>
          <div className="grid grid-cols-2 gap-2 mt-2 mb-4">
            {(["tri", "mutia"] as const).map((k) => (
              <button
                key={k}
                onClick={() => setWho(k)}
                className={
                  "py-3 rounded-2xl text-sm font-semibold transition-all border-2 " +
                  (who === k
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-transparent bg-muted text-muted-foreground")
                }
              >
                {k === "tri" ? "Tri Atmoko" : "Mutia Wati"}
              </button>
            ))}
          </div>

          <Label htmlFor="pw" className="text-xs">Password</Label>
          <Input
            id="pw"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••"
            className="mt-1 mb-4 rounded-xl"
          />

          <Button
            disabled={busy}
            onClick={() => handle("in")}
            className="w-full rounded-xl bg-gradient-to-r from-[oklch(0.78_0.18_18)] to-[oklch(0.62_0.24_12)] text-white shadow-[var(--shadow-sweet)] hover:opacity-90"
          >
            Masuk 🍓
          </Button>
          <button
            onClick={() => handle("up")}
            disabled={busy}
            className="w-full text-xs text-muted-foreground mt-3 hover:text-primary"
          >
            Pertama kali? Buat akun
          </button>
        </div>
        <p className="text-[11px] text-center text-muted-foreground mt-4">
          Hanya 2 akun yang diizinkan: Tri & Mutia
        </p>
      </div>
    </div>
  );
}