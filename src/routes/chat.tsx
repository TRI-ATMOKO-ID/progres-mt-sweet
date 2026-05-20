import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Layout } from "@/components/app/Layout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Send, Heart } from "lucide-react";

export const Route = createFileRoute("/chat")({
  component: () => (
    <Layout>
      <ChatPage />
    </Layout>
  ),
});

interface Msg {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
}

function ChatPage() {
  const { user, role, mutiaUserId } = useAuth();
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // Resolve partner
  useEffect(() => {
    if (!user) return;
    (async () => {
      if (role === "tri") {
        setPartnerId(mutiaUserId);
      } else {
        const { data } = await supabase.from("user_roles").select("user_id").eq("role", "tri").maybeSingle();
        setPartnerId(data?.user_id ?? null);
      }
    })();
  }, [user, role, mutiaUserId]);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("messages" as any)
      .select("*")
      .order("created_at", { ascending: true })
      .limit(200);
    setMsgs((data as any) ?? []);
    // mark unread as read
    await supabase
      .from("messages" as any)
      .update({ read_at: new Date().toISOString() })
      .eq("receiver_id", user.id)
      .is("read_at", null);
  };

  useEffect(() => {
    load();
    if (!user) return;
    const ch = supabase
      .channel("chat-" + user.id)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs.length]);

  const send = async () => {
    if (!user || !partnerId || !text.trim()) return;
    const content = text.trim();
    setText("");
    const { error } = await supabase
      .from("messages" as any)
      .insert({ sender_id: user.id, receiver_id: partnerId, content });
    if (error) {
      toast.error(error.message);
      setText(content);
    }
  };

  const partnerName = role === "tri" ? "Mutia Wati" : "Tri Atmoko";

  return (
    <div className="flex flex-col h-[calc(100vh-180px)]">
      <div className="bg-gradient-to-br from-primary to-[oklch(0.55_0.25_10)] text-primary-foreground rounded-3xl p-4 mb-3 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-white/20 grid place-items-center text-xl">
          {role === "tri" ? "👰" : "🤵"}
        </div>
        <div>
          <div className="font-display text-base">{partnerName}</div>
          <div className="text-xs opacity-80 flex items-center gap-1">
            <Heart className="w-3 h-3 fill-white" /> Pesan untuk berdua
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 px-1">
        {msgs.length === 0 && (
          <div className="text-center text-sm text-muted-foreground py-12">
            Belum ada pesan. Sapa pasanganmu yuk 🍓
          </div>
        )}
        {msgs.map((m) => {
          const mine = m.sender_id === user?.id;
          return (
            <div key={m.id} className={"flex " + (mine ? "justify-end" : "justify-start")}>
              <div
                className={
                  "max-w-[78%] px-4 py-2 rounded-2xl text-sm leading-snug " +
                  (mine
                    ? "bg-primary text-primary-foreground rounded-br-md shadow-[var(--shadow-sweet)]"
                    : "bg-card border border-border/60 rounded-bl-md")
                }
              >
                <div>{m.content}</div>
                <div className={"text-[10px] mt-1 " + (mine ? "opacity-70" : "text-muted-foreground")}>
                  {new Date(m.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                  {mine && (m.read_at ? " · ✓✓" : " · ✓")}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="mt-3 flex gap-2 sticky bottom-20">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Tulis pesan manis..."
          className="flex-1 rounded-full border border-border bg-card px-4 py-3 text-sm"
          maxLength={500}
        />
        <button
          onClick={send}
          disabled={!text.trim()}
          className="w-12 h-12 rounded-full bg-primary text-primary-foreground grid place-items-center disabled:opacity-50 shadow-[var(--shadow-sweet)]"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}