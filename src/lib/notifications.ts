// In-app sound + Browser Notification API helpers.
// Bekerja saat aplikasi terbuka (atau terinstall sebagai PWA aktif di background).

let audioCtx: AudioContext | null = null;

function getAudio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch {
      return null;
    }
  }
  return audioCtx;
}

export function playDing(kind: "love" | "alert" | "ping" = "ping") {
  const ctx = getAudio();
  if (!ctx) return;
  const now = ctx.currentTime;
  const notes =
    kind === "love"
      ? [659.25, 783.99, 1046.5] // E5 G5 C6
      : kind === "alert"
      ? [880, 660, 880]
      : [988, 1318]; // B5 E6
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now + i * 0.18);
    gain.gain.setValueAtTime(0.0001, now + i * 0.18);
    gain.gain.exponentialRampToValueAtTime(0.25, now + i * 0.18 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.18 + 0.32);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now + i * 0.18);
    osc.stop(now + i * 0.18 + 0.35);
  });
}

export async function ensureNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const r = await Notification.requestPermission();
  return r === "granted";
}

export function notify(title: string, body: string, opts?: { tag?: string; icon?: string }) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  try {
    new Notification(title, {
      body,
      tag: opts?.tag,
      icon:
        opts?.icon ??
        "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><rect width='64' height='64' rx='14' fill='%23ff6b9d'/><text x='32' y='46' font-size='40' text-anchor='middle'>🍓</text></svg>",
    });
  } catch {
    // ignore
  }
}

/** "04:32" -> minutes since midnight. */
export function hhmmToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/** Today at given HH:MM as Date. */
export function todayAt(hhmm: string): Date {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}