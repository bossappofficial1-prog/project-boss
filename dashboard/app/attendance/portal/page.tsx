"use client";

import React, { useEffect, useState, useRef, useCallback, Suspense } from "react";
import { useMutation } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  Clock,
  LogIn,
  LogOut,
  Camera,
  Settings,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Loader2,
  Search,
  ChevronRight,
  Fingerprint,
  Delete,
  Copy,
  Check,
} from "lucide-react";
import { toast, Toaster } from "sonner";

import { attendanceApi } from "@/lib/apis/attendance";
import { staffApi } from "@/lib/apis/staff";
import { apiClient } from "@/lib/apis/base";
import type { StaffMember } from "@/types/staff";
import {
  compareFaceDescriptors,
  getFaceDescriptorFromBase64,
  loadFaceApiModels,
} from "@/lib/utils/face-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

// ─── Types ────────────────────────────────────────────────────────────────────
type PortalStep = "setup" | "staff-list" | "pin-entry" | "face-verify" | "done";
type ClockType = "in" | "out";

interface KioskConfig {
  outletId: string;
  outletName: string;
}

interface ClockResult {
  success: boolean;
  type: ClockType;
  staffName: string;
  time: string;
  message: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function captureFrameBase64(video: HTMLVideoElement): string {
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;
  const ctx = canvas.getContext("2d");
  ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.9);
}

// ─── Live Clock ───────────────────────────────────────────────────────────────
function LiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="text-center select-none">
      <p className="font-mono text-5xl font-bold text-foreground tracking-tight">
        {format(now, "HH:mm:ss")}
      </p>
      <p className="text-sm text-muted-foreground mt-1 capitalize">
        {format(now, "EEEE, d MMMM yyyy", { locale: localeId })}
      </p>
    </div>
  );
}

// ─── Step 1: Setup ────────────────────────────────────────────────────────────
function SetupScreen({
  prefillOutletId,
  onDone,
}: {
  prefillOutletId?: string;
  onDone: (cfg: KioskConfig) => void;
}) {
  const [outletId, setOutletId] = useState(prefillOutletId ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  // Auto-verify jika ada prefill dari URL param
  useEffect(() => {
    if (prefillOutletId) handleVerify(prefillOutletId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleVerify = async (id?: string) => {
    const targetId = (id ?? outletId).trim();
    if (!targetId) { setError("Outlet ID wajib diisi"); return; }
    setLoading(true);
    setError("");
    try {
      // Fetch outlet info (public endpoint, tidak perlu login)
      const res = await apiClient.get(`/outlets/${targetId}`);
      const outletData = res.data?.data;
      const outletName = outletData?.name ?? "Outlet";

      localStorage.setItem("kiosk_outletId", targetId);
      localStorage.setItem("kiosk_outletName", outletName);
      onDone({ outletId: targetId, outletName });
    } catch {
      setError("Outlet ID tidak ditemukan. Pastikan ID sudah benar atau hubungi owner bisnis Anda.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyHowto = () => {
    const msg = "Cara mendapatkan Outlet ID:\n1. Login sebagai Owner atau Manager\n2. Buka menu Laporan Absensi\n3. Klik tombol \"Buka Portal Absensi\"\n4. Link yang terbuka sudah berisi Outlet ID secara otomatis";
    navigator.clipboard.writeText(msg).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-4">
        <Card className="rounded-xl border border-border shadow-sm">
          <CardContent className="p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-primary/10">
                <Settings className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground">Konfigurasi Kiosk Absensi</h1>
                <p className="text-xs text-muted-foreground">Cukup diatur sekali, data disimpan di perangkat ini</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Outlet ID <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="Contoh: OUT-XXXXXXXXXXXXXXXX"
                value={outletId}
                onChange={(e) => { setOutletId(e.target.value); setError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                className="font-mono"
                disabled={loading}
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/8 border border-destructive/20 rounded-lg px-3 py-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <Button onClick={() => handleVerify()} disabled={loading} className="w-full">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {loading ? "Memverifikasi outlet..." : "Mulai Portal Absensi"}
            </Button>
          </CardContent>
        </Card>

        {/* Petunjuk cara mendapatkan Outlet ID */}
        <Card className="rounded-xl border border-border bg-muted/30">
          <CardContent className="p-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Cara mendapatkan Outlet ID
            </p>
            <ol className="space-y-2">
              {[
                "Login sebagai Owner atau Manager di dashboard",
                "Buka menu Laporan Absensi",
                <>Klik tombol <span className="font-semibold text-foreground">\"Buka Portal Absensi\"</span> — link yang terbuka sudah berisi Outlet ID otomatis</>,
                "Buka link tersebut di perangkat kiosk (tablet/komputer konter)",
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-2.5 text-xs text-muted-foreground">
                  <span className="shrink-0 w-4 h-4 rounded-full bg-primary/20 text-primary text-[10px] font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
            <button
              onClick={handleCopyHowto}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {copied ? <Check className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
              {copied ? "Tersalin!" : "Salin panduan ini"}
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Staff Avatar ─────────────────────────────────────────────────────────────
function StaffAvatar({ staff, size = "md" }: { staff: StaffMember; size?: "md" | "lg" }) {
  const initials = staff.name.split(" ").slice(0, 2).map((n) => n[0]?.toUpperCase()).join("");
  const sizeClass = size === "lg" ? "w-16 h-16 text-xl" : "w-11 h-11 text-sm";
  const bgClass = staff.role === "MANAGER" ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground";

  return (
    <div className={`${sizeClass} ${bgClass} rounded-full flex items-center justify-center font-semibold shrink-0 overflow-hidden`}>
      {staff.faceImageUrl ? (
        <img src={staff.faceImageUrl} alt={staff.name} className="w-full h-full object-cover rounded-full" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}

// ─── Step 2: Staff List ───────────────────────────────────────────────────────
function StaffListScreen({
  config,
  clockType,
  onSelectStaff,
  onChangeClockType,
  onOpenSetup,
}: {
  config: KioskConfig;
  clockType: ClockType;
  onSelectStaff: (staff: StaffMember) => void;
  onChangeClockType: (t: ClockType) => void;
  onOpenSetup: () => void;
}) {
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const handleLoad = useCallback(() => {
    setLoading(true);
    staffApi
      .listByOutlet(config.outletId)
      .then((d) => setStaffList(d.filter((s) => s.status === "ACTIVE")))
      .catch(() => toast.error("Gagal memuat daftar staf. Periksa koneksi."))
      .finally(() => setLoading(false));
  }, [config.outletId]);

  useEffect(() => { handleLoad(); }, [handleLoad]);

  const filtered = staffList.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Bar */}
      <div className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">{config.outletName}</h1>
          <p className="text-xs text-muted-foreground">Portal Absensi Staf</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={handleLoad} title="Refresh daftar staf">
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onOpenSetup} title="Pengaturan kiosk">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col max-w-3xl w-full mx-auto px-6 py-6 space-y-6">
        {/* Clock */}
        <LiveClock />

        {/* Clock Type Selector */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onChangeClockType("in")}
            className={`flex items-center justify-center gap-2.5 py-3.5 rounded-lg border font-semibold text-sm transition-colors ${
              clockType === "in"
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
            }`}
          >
            <LogIn className="w-4 h-4" />
            Absen Masuk
          </button>
          <button
            onClick={() => onChangeClockType("out")}
            className={`flex items-center justify-center gap-2.5 py-3.5 rounded-lg border font-semibold text-sm transition-colors ${
              clockType === "out"
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
            }`}
          >
            <LogOut className="w-4 h-4" />
            Absen Pulang
          </button>
        </div>

        {/* Instruction */}
        <div className="bg-muted/50 rounded-lg px-4 py-3 flex items-center gap-3 border border-border">
          <div className="p-1.5 rounded-md bg-primary/10 shrink-0">
            <Fingerprint className="w-4 h-4 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">
            Pilih mode di atas, lalu <strong className="text-foreground">ketuk nama Anda</strong> dari daftar di bawah
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Cari nama staf..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Staff List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="w-7 h-7 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Memuat daftar staf...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <p className="text-sm font-medium text-foreground">
              {search ? `Tidak ada staf dengan nama "${search}"` : "Belum ada staf aktif di outlet ini"}
            </p>
            <p className="text-xs text-muted-foreground">Hubungi owner untuk menambahkan staf</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((staff) => (
              <button
                key={staff.id}
                onClick={() => onSelectStaff(staff)}
                className="w-full flex items-center gap-4 px-4 py-3.5 rounded-lg border border-border bg-card hover:border-primary/40 hover:bg-primary/5 transition-colors text-left group"
              >
                <StaffAvatar staff={staff} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">{staff.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">
                      {staff.role === "MANAGER"
                        ? "Manager"
                        : staff.role === "CASHIER"
                        ? "Kasir"
                        : staff.role === "WAITER"
                        ? "Waiter"
                        : staff.role === "KITCHEN"
                        ? "Kitchen"
                        : "Staf"}
                    </span>
                    {staff.faceDescriptor && (
                      <Badge variant="outline" className="text-xs px-1.5 py-0 h-4 border-primary/30 text-primary">
                        <Camera className="w-2.5 h-2.5 mr-1" />
                        Wajah terdaftar
                      </Badge>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Step 3: PIN Entry ────────────────────────────────────────────────────────
function PinEntryScreen({
  staff,
  clockType,
  onConfirm,
  onBack,
}: {
  staff: StaffMember;
  clockType: ClockType;
  onConfirm: (pin: string) => void;
  onBack: () => void;
}) {
  const [pin, setPin] = useState("");
  const [shaking, setShaking] = useState(false);

  const handleDigit = (d: string) => {
    if (pin.length >= 6) return;
    const next = pin + d;
    setPin(next);
    if (next.length === 6) setTimeout(() => onConfirm(next), 150);
  };

  const handleBackspace = () => setPin((p) => p.slice(0, -1));

  const numpad = ["1","2","3","4","5","6","7","8","9","","0","⌫"];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="border-b border-border px-6 py-4 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <span className="text-sm text-muted-foreground">Kembali ke daftar staf</span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        <div className="w-full max-w-xs space-y-8">
          <div className="flex flex-col items-center gap-3 text-center">
            <StaffAvatar staff={staff} size="lg" />
            <div>
              <p className="font-semibold text-foreground">{staff.name}</p>
              <Badge variant={clockType === "in" ? "default" : "outline"} className="mt-1 text-xs">
                {clockType === "in" ? <LogIn className="w-3 h-3 mr-1" /> : <LogOut className="w-3 h-3 mr-1" />}
                {clockType === "in" ? "Absen Masuk" : "Absen Pulang"}
              </Badge>
            </div>
          </div>

          <div>
            <p className="text-center text-sm text-muted-foreground mb-4">Masukkan PIN 6 digit Anda</p>
            <div className={`flex justify-center gap-3 ${shaking ? "animate-[shake_0.5s_ease-in-out]" : ""}`}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-100 ${
                    i < pin.length ? "bg-primary border-primary scale-110" : "bg-transparent border-border"
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {numpad.map((d, idx) => {
              if (d === "") return <div key={idx} />;
              if (d === "⌫") return (
                <button key={idx} onClick={handleBackspace} className="h-14 rounded-lg border border-border bg-card hover:bg-muted flex items-center justify-center transition-colors active:scale-95">
                  <Delete className="w-5 h-5 text-muted-foreground" />
                </button>
              );
              return (
                <button key={idx} onClick={() => handleDigit(d)} className="h-14 rounded-lg border border-border bg-card hover:bg-muted text-foreground font-semibold text-lg transition-colors active:scale-95">
                  {d}
                </button>
              );
            })}
          </div>

          <p className="text-center text-xs text-muted-foreground">
            PIN akan otomatis dikonfirmasi setelah 6 digit dimasukkan
          </p>
        </div>
      </div>

      <style>{`@keyframes shake { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-6px)} 40%,80%{transform:translateX(6px)} }`}</style>
    </div>
  );
}

// ─── Step 4: Face Verify ──────────────────────────────────────────────────────
function FaceVerifyScreen({
  staff, clockType, pin, outletId, onDone, onBack,
}: {
  staff: StaffMember; clockType: ClockType; pin: string;
  outletId: string; onDone: (r: ClockResult) => void; onBack: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const previewRef = useRef<HTMLImageElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [modelsReady, setModelsReady] = useState(false);
  const [loadingModels, setLoadingModels] = useState(true);
  const [phase, setPhase] = useState<"ready" | "verifying" | "confirm-register" | "uploading">("ready");
  const [error, setError] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [capturedBase64, setCapturedBase64] = useState<string | null>(null);
  const [capturedDescriptor, setCapturedDescriptor] = useState<Float32Array | null>(null);

  useEffect(() => { loadFaceApiModels().then((ok) => { setModelsReady(ok); setLoadingModels(false); }); }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, timeout: 5000 },
    );
  }, []);

  useEffect(() => {
    let active = true;
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: 640, height: 480 } })
      .then((s) => { if (!active) { s.getTracks().forEach((t) => t.stop()); return; } setStream(s); if (videoRef.current) videoRef.current.srcObject = s; })
      .catch(() => setError("Kamera tidak dapat diakses. Periksa izin browser."));
    return () => { active = false; };
  }, []);

  useEffect(() => () => { stream?.getTracks().forEach((t) => t.stop()); }, [stream]);

  const clockMutation = useMutation({
    mutationFn: (params: { faceImageUrl?: string; registerFaceDescriptor?: string; latitude?: number; longitude?: number }) =>
      attendanceApi.portalClock({ staffId: staff.id, pin, outletId, type: clockType, faceImageUrl: params.faceImageUrl, latitude: params.latitude, longitude: params.longitude, registerFaceDescriptor: params.registerFaceDescriptor }),
    onSuccess: () => onDone({ success: true, type: clockType, staffName: staff.name, time: format(new Date(), "HH:mm"), message: clockType === "in" ? "Absen masuk berhasil dicatat" : "Absen pulang berhasil dicatat" }),
    onError: (err: any) => onDone({ success: false, type: clockType, staffName: staff.name, time: format(new Date(), "HH:mm"), message: err?.response?.data?.message ?? "Gagal mencatat absensi." }),
  });

  const uploadPhoto = useCallback(async (base64: string): Promise<string | undefined> => {
    try {
      const byteStr = atob(base64.split(",")[1]);
      const mime = base64.split(",")[0].split(":")[1].split(";")[0];
      const ab = new ArrayBuffer(byteStr.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteStr.length; i++) ia[i] = byteStr.charCodeAt(i);
      const blob = new Blob([ab], { type: mime });
      const fd = new FormData();
      fd.append("image", blob, `absen-${Date.now()}.jpg`);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:1234/api/v1"}/upload/image`, { method: "POST", body: fd });
      const data = await res.json();
      return data.success && data.data?.url ? data.data.url : undefined;
    } catch { return undefined; }
  }, []);

  const submitAttendance = useCallback(async (faceImageUrl?: string, registerFaceDescriptor?: string) => {
    clockMutation.mutate({ faceImageUrl, registerFaceDescriptor, latitude: coords?.lat, longitude: coords?.lng });
  }, [clockMutation, coords]);

  const handleCapture = useCallback(async () => {
    if (!videoRef.current) return;
    setError(""); setPhase("verifying");
    try {
      const base64 = captureFrameBase64(videoRef.current);
      stream?.getTracks().forEach((t) => t.stop());

      if (staff.faceDescriptor && modelsReady) {
        const captured = await getFaceDescriptorFromBase64(base64);
        if (!captured) {
          setError("Wajah tidak terdeteksi. Pastikan wajah terlihat jelas dan pencahayaan cukup.");
          setPhase("ready");
          const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
          setStream(s); if (videoRef.current) videoRef.current.srcObject = s;
          return;
        }
        const { match } = compareFaceDescriptors(JSON.parse(staff.faceDescriptor) as number[], captured);
        if (!match) {
          setError("Wajah tidak cocok dengan data yang terdaftar. Coba lagi atau hubungi manager.");
          setPhase("ready");
          const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
          setStream(s); if (videoRef.current) videoRef.current.srcObject = s;
          return;
        }
      }

      // If staff has no registered face, show confirmation
      if (!staff.faceDescriptor && modelsReady) {
        const descriptor = await getFaceDescriptorFromBase64(base64);
        setCapturedBase64(base64);
        setCapturedDescriptor(descriptor);
        setPhase("confirm-register");
        return;
      }

      setPhase("uploading");
      const faceImageUrl = await uploadPhoto(base64);
      submitAttendance(faceImageUrl);
    } catch { setError("Terjadi kesalahan. Silakan coba lagi."); setPhase("ready"); }
  }, [staff, modelsReady, stream, clockType, pin, outletId, uploadPhoto, submitAttendance]);

  const handleConfirmRegister = useCallback(async () => {
    if (!capturedBase64) return;
    setPhase("uploading");
    const faceImageUrl = await uploadPhoto(capturedBase64);
    const registerFaceDescriptor = capturedDescriptor
      ? JSON.stringify(Array.from(capturedDescriptor))
      : undefined;
    submitAttendance(faceImageUrl, registerFaceDescriptor);
  }, [capturedBase64, capturedDescriptor, uploadPhoto, submitAttendance]);

  const handleDeclineRegister = useCallback(async () => {
    if (!capturedBase64) return;
    setPhase("uploading");
    const faceImageUrl = await uploadPhoto(capturedBase64);
    submitAttendance(faceImageUrl);
  }, [capturedBase64, uploadPhoto, submitAttendance]);

  const handleSkip = () => { stream?.getTracks().forEach((t) => t.stop()); submitAttendance(); };
  const isBusy = phase !== "ready" && phase !== "confirm-register" || clockMutation.isPending;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="border-b border-border px-6 py-4 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} disabled={isBusy}><ArrowLeft className="w-4 h-4" /></Button>
        <div>
          <p className="text-sm font-medium text-foreground">Verifikasi Wajah</p>
          <p className="text-xs text-muted-foreground">{staff.name} · {clockType === "in" ? "Absen Masuk" : "Absen Pulang"}</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        <div className="w-full max-w-sm space-y-5">
          {phase === "confirm-register" ? (
            <>
              <p className="text-center text-sm font-medium text-foreground">
                Daftarkan Wajah sebagai Pengenal?
              </p>

              <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-border bg-muted">
                <img ref={previewRef} src={capturedBase64 ?? ""} alt="Preview" className="w-full h-full object-cover" />
              </div>

              <div className="flex items-start gap-2 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
                <div className="space-y-1">
                  <p className="font-medium">Foto ini akan disimpan sebagai pengenal wajah Anda</p>
                  <p className="text-amber-700">
                    Pastikan wajah terlihat jelas dengan pencahayaan cukup. Data ini digunakan untuk verifikasi absensi selanjutnya.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={handleConfirmRegister} className="flex-1 gap-2">
                  <Camera className="w-4 h-4" />Simpan & Absen
                </Button>
                <Button variant="outline" onClick={handleDeclineRegister}>
                  Lewati
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-center text-sm text-muted-foreground">
                {staff.faceDescriptor ? "Hadapkan wajah ke kamera, pastikan pencahayaan cukup" : "Ambil foto selfie sebagai bukti kehadiran"}
              </p>

              <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-border bg-muted">
                <video ref={(el) => { videoRef.current = el; if (el && stream) el.srcObject = stream; }} autoPlay muted playsInline className="w-full h-full object-cover" />
                {phase === "ready" && !loadingModels && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-40 h-52 border-2 border-dashed border-primary/60 rounded-full" />
                  </div>
                )}
                {(isBusy || loadingModels) && (
                  <div className="absolute inset-0 bg-background/70 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-sm text-foreground font-medium">
                      {loadingModels ? "Memuat model AI..." : phase === "verifying" ? "Menganalisis wajah..." : "Menyimpan absensi..."}
                    </p>
                  </div>
                )}
              </div>

              {error && (
                <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/8 border border-destructive/20 rounded-lg px-3 py-2.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />{error}
                </div>
              )}

              {!isBusy && !loadingModels && (
                <div className="flex gap-3">
                  <Button onClick={handleCapture} className="flex-1 gap-2">
                    <Camera className="w-4 h-4" />Ambil Foto & Absen
                  </Button>
                  {!staff.faceDescriptor && (
                    <Button variant="outline" onClick={handleSkip}>Lewati</Button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Step 5: Done ─────────────────────────────────────────────────────────────
function DoneScreen({ result, onBack }: { result: ClockResult; onBack: () => void }) {
  const [countdown, setCountdown] = useState(5);
  useEffect(() => {
    const t = setInterval(() => setCountdown((c) => { if (c <= 1) { clearInterval(t); onBack(); return 0; } return c - 1; }), 1000);
    return () => clearInterval(t);
  }, [onBack]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-sm text-center space-y-6">
        <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center ${result.success ? "bg-primary/10" : "bg-destructive/10"}`}>
          {result.success ? <CheckCircle2 className="w-10 h-10 text-primary" /> : <XCircle className="w-10 h-10 text-destructive" />}
        </div>
        <div className="space-y-1">
          <h2 className={`text-2xl font-semibold ${result.success ? "text-foreground" : "text-destructive"}`}>
            {result.success ? "Absensi Tercatat!" : "Gagal"}
          </h2>
          <p className="text-lg font-medium text-foreground">{result.staffName}</p>
          <p className="text-sm text-muted-foreground">{result.message}</p>
        </div>
        {result.success && (
          <div className="inline-flex items-center gap-2 bg-muted rounded-lg px-4 py-2.5 border border-border">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="font-mono text-xl font-semibold text-foreground">{result.time}</span>
            <Badge variant="outline" className="text-xs">{result.type === "in" ? "Masuk" : "Pulang"}</Badge>
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          Kembali otomatis dalam <span className="font-mono font-semibold">{countdown}</span> detik
        </p>
        <Button variant="outline" onClick={onBack} className="w-full">Kembali ke Beranda</Button>
      </div>
    </div>
  );
}

// ─── Inner component (needs useSearchParams) ──────────────────────────────────
function PortalInner() {
  const searchParams = useSearchParams();
  const urlOutletId = searchParams.get("outletId") ?? undefined;

  const [step, setStep] = useState<PortalStep>("setup");
  const [config, setConfig] = useState<KioskConfig | null>(null);
  const [clockType, setClockType] = useState<ClockType>("in");
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [confirmedPin, setConfirmedPin] = useState("");
  const [result, setResult] = useState<ClockResult | null>(null);

  useEffect(() => {
    // Jika ada URL param, langsung setup; jika tidak, cek localStorage
    if (urlOutletId) return; // ditangani di SetupScreen dengan auto-verify

    const savedId = localStorage.getItem("kiosk_outletId");
    if (savedId) {
      setConfig({ outletId: savedId, outletName: localStorage.getItem("kiosk_outletName") ?? "Outlet" });
      setStep("staff-list");
    }
  }, [urlOutletId]);

  const handleSetupDone = (cfg: KioskConfig) => { setConfig(cfg); setStep("staff-list"); };
  const handleSelectStaff = (staff: StaffMember) => { setSelectedStaff(staff); setStep("pin-entry"); };
  const handlePinConfirm = (pin: string) => { setConfirmedPin(pin); setStep("face-verify"); };
  const handleFaceDone = (res: ClockResult) => { setResult(res); setStep("done"); };
  const handleReset = () => { setSelectedStaff(null); setConfirmedPin(""); setResult(null); setStep("staff-list"); };

  // Jika URL param ada, mulai dari setup (akan auto-verify)
  const showSetup = step === "setup" || (!!urlOutletId && !config);

  return (
    <>
      {showSetup && (
        <SetupScreen prefillOutletId={urlOutletId} onDone={handleSetupDone} />
      )}
      {step === "staff-list" && config && (
        <StaffListScreen config={config} clockType={clockType} onSelectStaff={handleSelectStaff} onChangeClockType={setClockType} onOpenSetup={() => setStep("setup")} />
      )}
      {step === "pin-entry" && selectedStaff && (
        <PinEntryScreen staff={selectedStaff} clockType={clockType} onConfirm={handlePinConfirm} onBack={handleReset} />
      )}
      {step === "face-verify" && selectedStaff && config && (
        <FaceVerifyScreen staff={selectedStaff} clockType={clockType} pin={confirmedPin} outletId={config.outletId} onDone={handleFaceDone} onBack={() => setStep("pin-entry")} />
      )}
      {step === "done" && result && (
        <DoneScreen result={result} onBack={handleReset} />
      )}
    </>
  );
}

// ─── Root export (wrap Suspense untuk useSearchParams) ────────────────────────
export default function AttendancePortalPage() {
  return (
    <>
      <Toaster richColors position="top-center" />
      <Suspense fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      }>
        <PortalInner />
      </Suspense>
    </>
  );
}
