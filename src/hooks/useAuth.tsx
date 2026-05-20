import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type CoupleRole = "tri" | "mutia";

interface AuthCtx {
  user: User | null;
  session: Session | null;
  role: CoupleRole | null;
  loading: boolean;
  signOut: () => Promise<void>;
  // For Tri only: which user is being viewed
  viewingRole: CoupleRole;
  setViewingRole: (r: CoupleRole) => void;
  // user_id of mutia (for Tri to query her data)
  mutiaUserId: string | null;
}

const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<CoupleRole | null>(null);
  const [mutiaUserId, setMutiaUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewingRole, setViewingRole] = useState<CoupleRole>("tri");

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (!s) {
        setRole(null);
        setMutiaUserId(null);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("user_roles").select("user_id, role");
      if (!data) return;
      const me = data.find((r) => r.user_id === user.id);
      if (me) {
        setRole(me.role as CoupleRole);
        setViewingRole(me.role as CoupleRole);
      }
      const mutia = data.find((r) => r.role === "mutia");
      setMutiaUserId(mutia?.user_id ?? null);
    })();
  }, [user]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{ user, session, role, loading, signOut, viewingRole, setViewingRole, mutiaUserId }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

/** Returns the user_id whose data should currently be displayed. */
export function useTargetUserId(): string | null {
  const { user, role, viewingRole, mutiaUserId } = useAuth();
  if (!user) return null;
  if (role === "tri" && viewingRole === "mutia") return mutiaUserId;
  return user.id;
}

/** True if currently viewing in read-only partner mode. */
export function useReadOnly(): boolean {
  const { role, viewingRole } = useAuth();
  return role === "tri" && viewingRole === "mutia";
}