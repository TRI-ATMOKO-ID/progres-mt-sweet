import { useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ensureNotificationPermission, notify, playDing, todayAt } from "@/lib/notifications";
import { fetchPrayerTimes, PRAYER_DISPLAY } from "@/lib/prayer-times";
import { toast } from "sonner";

interface Reminder {
  at: Date;
  title: string;
  body: string;
  tag: string;
  kind: "love" | "alert" | "ping";
}

const MEAL_TIMES = [
  { time: "06:30", label: "Sarapan", body: "Saatnya sarapan ya 🍳 Catat lauk & kalorinya." },
  { time: "12:00", label: "Makan siang", body: "Jam makan siang 🍱 Jangan dilewat." },
  { time: "19:00", label: "Makan malam", body: "Makan malam 🍽️ Catat jangan lupa." },
];

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user, role } = useAuth();
  const timerRef = useRef<number[]>([]);

  // Request permission once user is logged in
  useEffect(() => {
    if (!user) return;
    ensureNotificationPermission();
  }, [user]);

  // Schedule today's reminders
  useEffect(() => {
    if (!user) return;
    const cleanup = () => {
      timerRef.current.forEach((t) => window.clearTimeout(t));
      timerRef.current = [];
    };
    cleanup();

    (async () => {
      const reminders: Reminder[] = [];

      // Prayer reminders — fetch from Aladhan based on saved location
      const { data: settings } = await supabase
        .from("user_settings" as any)
        .select("latitude, longitude, sound_enabled")
        .eq("user_id", user.id)
        .maybeSingle();
      const s: any = settings;
      if (s?.latitude && s?.longitude) {
        const data = await fetchPrayerTimes(s.latitude, s.longitude);
        if (data) {
          PRAYER_DISPLAY.forEach((p) => {
            const raw = (data.timings as any)[p.key] as string;
            if (!raw) return;
            const hhmm = raw.slice(0, 5);
            reminders.push({
              at: todayAt(hhmm),
              title: `🕌 Waktunya sholat ${p.label}`,
              body: `Jangan tunda ya, sholat tepat waktu insyaAllah berkah. (${hhmm})`,
              tag: `prayer-${p.key}`,
              kind: "alert",
            });
          });
        }
      }

      // Meal reminders
      MEAL_TIMES.forEach((m) =>
        reminders.push({
          at: todayAt(m.time),
          title: `🍓 ${m.label}`,
          body: m.body,
          tag: `meal-${m.time}`,
          kind: "ping",
        }),
      );

      // Daily expense check at 21:00
      reminders.push({
        at: todayAt("21:00"),
        title: "💸 Catat pengeluaran",
        body: "Sudah dicatat pengeluaran/pemasukan hari ini?",
        tag: "expense-21",
        kind: "ping",
      });

      const now = Date.now();
      reminders.forEach((r) => {
        const delay = r.at.getTime() - now;
        if (delay <= 0 || delay > 86400_000) return;
        const id = window.setTimeout(() => {
          notify(r.title, r.body, { tag: r.tag });
          if (s?.sound_enabled !== false) playDing(r.kind);
          toast(r.title, { description: r.body });
        }, delay);
        timerRef.current.push(id);
      });
    })();

    return cleanup;
  }, [user]);

  // Realtime: incoming messages
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel("notif-msg-" + user.id)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `receiver_id=eq.${user.id}` },
        (payload) => {
          const m: any = payload.new;
          notify("💌 Pesan baru dari pasangan", m.content, { tag: "msg-" + m.id });
          playDing("love");
          toast("💌 Pesan baru", { description: m.content });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user]);

  // Realtime: incoming game invites
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel("notif-game-" + user.id)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "game_sessions", filter: `invited_to=eq.${user.id}` },
        (payload) => {
          const g: any = payload.new;
          const partnerName = role === "tri" ? "Mutia" : "Tri";
          const gameLabel =
            g.game_type === "tictactoe"
              ? "Tic-Tac-Toe"
              : g.game_type === "tebakangka"
              ? "Tebak Angka"
              : g.game_type === "catur"
              ? "Catur"
              : g.game_type === "ludo"
              ? "Ludo"
              : "Water Girl & Fire Boy";
          notify(
            "🎮 Ajakan mabar!",
            `${partnerName} ngajak main ${gameLabel} nih!`,
            { tag: "game-" + g.id },
          );
          playDing("love");
          toast("🎮 Ajakan mabar", {
            description: `${partnerName} ngajak main ${gameLabel}`,
          });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user, role]);

  return <>{children}</>;
}