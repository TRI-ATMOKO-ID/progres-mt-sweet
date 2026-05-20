import { ReactNode, useEffect } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { Calendar, Heart, UtensilsCrossed, Wallet, LogOut, Eye, Moon, Droplet, MessageCircle, Gamepad2, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Beranda", icon: Calendar },
  { to: "/sholat", label: "Sholat", icon: Heart },
  { to: "/makan", label: "Makan", icon: UtensilsCrossed },
  { to: "/chat", label: "Chat", icon: MessageCircle },
  { to: "/mabar", label: "Mabar", icon: Gamepad2 },
  { to: "/puasa", label: "Puasa", icon: Moon },
  { to: "/pengeluaran", label: "Uang", icon: Wallet },
  { to: "/pengaturan", label: "Setelan", icon: Settings },
];

export function Layout({ children }: { children: ReactNode }) {
  const { user, loading, role, viewingRole, setViewingRole, signOut, mutiaUserId } = useAuth();
  const navigate = useNavigate();
  const { location } = useRouterState();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  if (loading || !user) {
    return (
      <div className="min-h-screen grid place-items-center text-primary font-display">
        🍓 memuat...
      </div>
    );
  }

  const myName = role === "tri" ? "Tri Atmoko" : role === "mutia" ? "Mutia Wati" : "";
  const showHaid = role === "mutia" || (role === "tri" && viewingRole === "mutia" && !!mutiaUserId);

  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-30 backdrop-blur-md bg-background/70 border-b border-border/60">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div>
            <div className="font-display text-lg leading-none text-primary">🍓 Strawberry Sweets</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Hai, <span className="font-semibold text-foreground">{myName}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {role === "tri" && (
              <button
                onClick={() => setViewingRole(viewingRole === "tri" ? "mutia" : "tri")}
                className={cn(
                  "text-xs font-semibold px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5",
                  viewingRole === "mutia"
                    ? "bg-primary text-primary-foreground border-primary shadow-[var(--shadow-sweet)]"
                    : "bg-card text-foreground border-border hover:border-primary"
                )}
              >
                <Eye className="w-3.5 h-3.5" />
                {viewingRole === "mutia" ? "Lihat Mutia" : "Lihatku"}
              </button>
            )}
            <Button size="icon" variant="ghost" onClick={signOut} aria-label="Keluar">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
        {role === "tri" && viewingRole === "mutia" && (
          <div className="bg-gradient-to-r from-primary/15 to-accent/30 text-center text-xs py-1.5 text-primary font-semibold">
            👀 Mode lihat: Mutia Wati (read-only)
          </div>
        )}
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">{children}</main>

      <nav className="fixed bottom-0 inset-x-0 z-30 border-t border-border/60 bg-background/90 backdrop-blur-md overflow-x-auto">
        <div className="max-w-2xl mx-auto flex">
          {[...NAV, ...(showHaid ? [{ to: "/haid" as const, label: "Haid", icon: Droplet }] : [])].map((n) => {
            const active = location.pathname === n.to;
            const Icon = n.icon;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "flex-1 min-w-[64px] flex flex-col items-center gap-1 py-3 text-[10px] transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className={cn("w-4 h-4", active && "fill-primary/20")} />
                {n.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}