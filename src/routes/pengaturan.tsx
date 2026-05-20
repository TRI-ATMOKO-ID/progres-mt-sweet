import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Layout } from "@/components/app/Layout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { MapPin, KeyRound, Bell, Loader2 } from "lucide-react";
import { reverseGeocode } from "@/lib/prayer-times";
import { ensureNotificationPermission } from "@/lib/notifications";
import { changePartnerPassword } from "@/lib/admin.functions";

export const Route = createFileRoute("/pengaturan")({
  component: () => (
    <Layout>
      <SettingsPage />
    </Layout>
  ),
});

function SettingsPage() {
  const { user, role } = useAuth();
  const [city, setCity] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [sound, setSound] = useState(true);
  const [busyLoc, setBusyLoc] = useState(false);

  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [partnerPw, setPartnerPw] = useState("");
  const [busy, setBusy] = useState(false);

  const callChangePartner = useServerFn(changePartnerPassword);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("user_settings" as any)
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      const s: any = data;
      if (s) {
        setCity(s.city ?? "");
        setLat(s.latitude);
        setLng(s.longitude);
        setSound(s.sound_enabled ?? true);
      }
    })();
  }, [user]);

  const detectLocation = async () => {
    if (!navigator.geolocation) {
      toast.error("Browser tidak mendukung lokasi");
      return;
    }
    setBusyLoc(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const la = pos.coords.latitude;
        const ln = pos.coords.longitude;
        setLat(la);
        setLng(ln);
        const c = await reverseGeocode(la, ln);
        if (c) setCity(c);
        setBusyLoc(false);
        toast.success("Lokasi terdeteksi 📍");
      },
      (err) => {
        setBusyLoc(false);
        toast.error("Gagal: " + err.message);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const saveSettings = async () => {
    if (!user) return;
    setBusy(true);
    const { error } = await supabase
      .from("user_settings" as any)
      .upsert(
        { user_id: user.id, city, latitude: lat, longitude: lng, sound_enabled: sound },
        { onConflict: "user_id" },
      );
    setBusy(false);
    if (error) toast.error(error.message);
    else toast.success("Pengaturan tersimpan 🍓");
  };

  const changeOwn = async () => {
    if (pw.length < 6) return toast.error("Password minimal 6 karakter");
    if (pw !== pw2) return toast.error("Konfirmasi password tidak cocok");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Password berhasil diubah");
      setPw("");
      setPw2("");
    }
  };

  const changePartner = async () => {
    if (partnerPw.length < 6) return toast.error("Password minimal 6 karakter");
    setBusy(true);
    try {
      await callChangePartner({ data: { newPassword: partnerPw } });
      toast.success("Password Mutia berhasil diubah");
      setPartnerPw("");
    } catch (e: any) {
      toast.error(e?.message ?? "Gagal");
    } finally {
      setBusy(false);
    }
  };

  const askNotif = async () => {
    const ok = await ensureNotificationPermission();
    toast(ok ? "Notifikasi aktif 🔔" : "Notifikasi belum diizinkan");
  };

  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-br from-primary to-[oklch(0.55_0.25_10)] text-primary-foreground rounded-3xl p-5">
        <div className="font-display text-2xl">Pengaturan ⚙️</div>
        <p className="text-xs opacity-80 mt-1">Atur lokasi sholat, password, & notifikasi.</p>
      </div>

      {/* Lokasi */}
      <div className="bg-card rounded-3xl p-5 border border-border/60 space-y-3">
        <div className="flex items-center gap-2 font-display">
          <MapPin className="w-4 h-4" /> Lokasi (untuk jadwal sholat)
        </div>
        <div>
          <Label className="text-xs">Kota</Label>
          <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="mis. Jakarta" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">Latitude</Label>
            <Input value={lat ?? ""} onChange={(e) => setLat(e.target.value ? Number(e.target.value) : null)} type="number" step="any" />
          </div>
          <div>
            <Label className="text-xs">Longitude</Label>
            <Input value={lng ?? ""} onChange={(e) => setLng(e.target.value ? Number(e.target.value) : null)} type="number" step="any" />
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={detectLocation} disabled={busyLoc} variant="outline" className="flex-1">
            {busyLoc ? <Loader2 className="w-4 h-4 animate-spin" /> : "📍 Deteksi Otomatis"}
          </Button>
          <Button onClick={saveSettings} disabled={busy} className="flex-1">Simpan</Button>
        </div>
      </div>

      {/* Notifikasi */}
      <div className="bg-card rounded-3xl p-5 border border-border/60 space-y-3">
        <div className="flex items-center gap-2 font-display">
          <Bell className="w-4 h-4" /> Notifikasi
        </div>
        <label className="flex items-center justify-between text-sm">
          <span>Bunyi suara saat ada notifikasi</span>
          <input type="checkbox" checked={sound} onChange={(e) => setSound(e.target.checked)} />
        </label>
        <Button onClick={askNotif} variant="outline" className="w-full">
          🔔 Izinkan Notifikasi HP/Browser
        </Button>
        <p className="text-[11px] text-muted-foreground">
          Tip: Tambahkan aplikasi ini ke layar utama (Add to Home Screen) supaya notifikasi tetap berbunyi seperti aplikasi native.
        </p>
      </div>

      {/* Password sendiri */}
      <div className="bg-card rounded-3xl p-5 border border-border/60 space-y-3">
        <div className="flex items-center gap-2 font-display">
          <KeyRound className="w-4 h-4" /> Ganti Password Sendiri
        </div>
        <Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Password baru" />
        <Input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} placeholder="Ulangi password baru" />
        <Button onClick={changeOwn} disabled={busy} className="w-full">Ubah Password</Button>
      </div>

      {/* Password Mutia (khusus Tri) */}
      {role === "tri" && (
        <div className="bg-gradient-to-br from-primary/10 to-accent/30 rounded-3xl p-5 border border-primary/30 space-y-3">
          <div className="flex items-center gap-2 font-display text-primary">
            <KeyRound className="w-4 h-4" /> Ganti Password Mutia (khusus Suami)
          </div>
          <Input
            type="password"
            value={partnerPw}
            onChange={(e) => setPartnerPw(e.target.value)}
            placeholder="Password baru untuk Mutia"
          />
          <Button onClick={changePartner} disabled={busy} className="w-full">
            Ubah Password Mutia
          </Button>
          <p className="text-[11px] text-muted-foreground">
            Pastikan kamu kabari Mutia setelah mengubah passwordnya ya.
          </p>
        </div>
      )}
    </div>
  );
}