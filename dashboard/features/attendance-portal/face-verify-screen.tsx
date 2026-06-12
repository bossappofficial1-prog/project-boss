"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  ArrowLeft,
  Camera,
  Loader2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

import { attendanceApi } from "@/lib/apis/attendance";
import {
  compareFaceDescriptors,
  getFaceDescriptorFromBase64,
  loadFaceApiModels,
} from "@/lib/utils/face-api";
import { Button } from "@/components/ui/button";

import { captureFrameBase64 } from "./utils";
import type { FaceVerifyScreenProps } from "./types";

export function FaceVerifyScreen({
  staff,
  clockType,
  pin,
  outletId,
  onDone,
  onBack,
}: FaceVerifyScreenProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const previewRef = useRef<HTMLImageElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [modelsReady, setModelsReady] = useState(false);
  const [loadingModels, setLoadingModels] = useState(true);
  const [phase, setPhase] = useState<
    "ready" | "verifying" | "confirm-register" | "uploading"
  >("ready");
  const [error, setError] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [capturedBase64, setCapturedBase64] = useState<string | null>(null);
  const [capturedDescriptor, setCapturedDescriptor] =
    useState<Float32Array | null>(null);

  useEffect(() => {
    loadFaceApiModels().then((ok) => {
      setModelsReady(ok);
      setLoadingModels(false);
    });
  }, []);

  const [locationError, setLocationError] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError(true);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {
        setLocationError(true);
      },
      { enableHighAccuracy: true, timeout: 5000 },
    );
  }, []);

  useEffect(() => {
    let active = true;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "user", width: 640, height: 480 } })
      .then((s) => {
        if (!active) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        setStream(s);
        if (videoRef.current) videoRef.current.srcObject = s;
      })
      .catch(() =>
        setError("Kamera tidak dapat diakses. Periksa izin browser."),
      );
    return () => {
      active = false;
    };
  }, []);

  useEffect(
    () => () => {
      stream?.getTracks().forEach((t) => t.stop());
    },
    [stream],
  );

  const clockMutation = useMutation({
    mutationFn: (params: {
      faceImageUrl?: string;
      registerFaceDescriptor?: string;
      latitude?: number;
      longitude?: number;
    }) =>
      attendanceApi.portalClock({
        staffId: staff.id,
        pin,
        outletId,
        type: clockType,
        faceImageUrl: params.faceImageUrl,
        latitude: params.latitude,
        longitude: params.longitude,
        registerFaceDescriptor: params.registerFaceDescriptor,
      }),
    onSuccess: () =>
      onDone({
        success: true,
        type: clockType,
        staffName: staff.name,
        time: format(new Date(), "HH:mm"),
        message:
          clockType === "in"
            ? "Absen masuk berhasil dicatat"
            : "Absen pulang berhasil dicatat",
      }),
    onError: (err: any) =>
      onDone({
        success: false,
        type: clockType,
        staffName: staff.name,
        time: format(new Date(), "HH:mm"),
        message: err?.response?.data?.message ?? "Gagal mencatat absensi.",
      }),
  });

  const uploadPhoto = useCallback(
    async (base64: string): Promise<string | undefined> => {
      try {
        const byteStr = atob(base64.split(",")[1]);
        const mime = base64.split(",")[0].split(":")[1].split(";")[0];
        const ab = new ArrayBuffer(byteStr.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteStr.length; i++) ia[i] = byteStr.charCodeAt(i);
        const blob = new Blob([ab], { type: mime });
        const fd = new FormData();
        fd.append("image", blob, `absen-${Date.now()}.jpg`);
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:1234/api/v1"}/upload/image`,
          { method: "POST", body: fd },
        );
        const data = await res.json();
        return data.success && data.data?.url ? data.data.url : undefined;
      } catch {
        return undefined;
      }
    },
    [],
  );

  const submitAttendance = useCallback(
    async (faceImageUrl?: string, registerFaceDescriptor?: string) => {
      clockMutation.mutate({
        faceImageUrl,
        registerFaceDescriptor,
        latitude: coords?.lat,
        longitude: coords?.lng,
      });
    },
    [clockMutation, coords],
  );

  const handleCapture = useCallback(async () => {
    if (!videoRef.current) return;
    setError("");
    setPhase("verifying");
    try {
      const base64 = captureFrameBase64(videoRef.current);
      stream?.getTracks().forEach((t) => t.stop());

      if (staff.faceDescriptor && modelsReady) {
        const captured = await getFaceDescriptorFromBase64(base64);
        if (!captured) {
          setError(
            "Wajah tidak terdeteksi. Pastikan wajah terlihat jelas dan pencahayaan cukup.",
          );
          setPhase("ready");
          const s = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "user" },
          });
          setStream(s);
          if (videoRef.current) videoRef.current.srcObject = s;
          return;
        }
        const { match } = compareFaceDescriptors(
          JSON.parse(staff.faceDescriptor) as number[],
          captured,
        );
        if (!match) {
          setError(
            "Wajah tidak cocok dengan data yang terdaftar. Coba lagi atau hubungi manager.",
          );
          setPhase("ready");
          const s = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "user" },
          });
          setStream(s);
          if (videoRef.current) videoRef.current.srcObject = s;
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
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
      setPhase("ready");
    }
  }, [
    staff,
    modelsReady,
    stream,
    clockType,
    pin,
    outletId,
    uploadPhoto,
    submitAttendance,
  ]);

  const handleConfirmRegister = useCallback(async () => {
    if (!capturedBase64) return;
    setPhase("uploading");
    const faceImageUrl = await uploadPhoto(capturedBase64);
    const registerFaceDescriptor = capturedDescriptor
      ? JSON.stringify(Array.from(capturedDescriptor))
      : undefined;
    submitAttendance(faceImageUrl, registerFaceDescriptor);
  }, [capturedBase64, capturedDescriptor, uploadPhoto, submitAttendance]);

  const handleRetake = useCallback(async () => {
    setCapturedBase64(null);
    setCapturedDescriptor(null);
    setError("");
    setPhase("ready");
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
      });
      setStream(s);
      if (videoRef.current) videoRef.current.srcObject = s;
    } catch {
      setError("Kamera tidak dapat diakses. Periksa izin browser.");
    }
  }, []);

  const isBusy =
    (phase !== "ready" && phase !== "confirm-register") ||
    clockMutation.isPending;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="border-b border-border px-6 py-4 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} disabled={isBusy}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <p className="text-sm font-medium text-foreground">
            Verifikasi Wajah
          </p>
          <p className="text-xs text-muted-foreground">
            {staff.name} · {clockType === "in" ? "Absen Masuk" : "Absen Pulang"}
          </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        <div className="w-full max-w-sm space-y-4">
          {phase === "confirm-register" ? (
            <>
              <p className="text-center text-sm font-medium text-foreground">
                Daftarkan Wajah sebagai Pengenal?
              </p>

              <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-border bg-muted">
                <img
                  ref={previewRef}
                  src={capturedBase64 ?? ""}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex items-start gap-2 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
                <div className="space-y-1">
                  <p className="font-medium">
                    Foto ini akan disimpan sebagai pengenal wajah Anda
                  </p>
                  <p className="text-amber-700">
                    Pastikan wajah terlihat jelas dengan pencahayaan cukup. Data
                    ini digunakan untuk verifikasi absensi selanjutnya.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleRetake}
                  className="gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Ambil Ulang
                </Button>
                <Button
                  onClick={handleConfirmRegister}
                  className="flex-1 gap-2"
                >
                  <Camera className="w-4 h-4" />
                  Simpan & Absen
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-center text-sm text-muted-foreground">
                {staff.faceDescriptor
                  ? "Hadapkan wajah ke kamera, pastikan pencahayaan cukup"
                  : "Ambil foto selfie sebagai bukti kehadiran"}
              </p>

              <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-border bg-muted">
                <video
                  ref={(el) => {
                    videoRef.current = el;
                    if (el && stream) el.srcObject = stream;
                  }}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
                {phase === "ready" && !loadingModels && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-40 h-52 border-2 border-dashed border-primary/60 rounded-full" />
                  </div>
                )}
                {(isBusy || loadingModels) && (
                  <div className="absolute inset-0 bg-background/70 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-sm text-foreground font-medium">
                      {loadingModels
                        ? "Memuat model AI..."
                        : phase === "verifying"
                          ? "Menganalisis wajah..."
                          : "Menyimpan absensi..."}
                    </p>
                  </div>
                )}
              </div>

              {error && (
                <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/8 border border-destructive/20 rounded-lg px-3 py-2.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              {locationError && !error && (
                <div className="flex items-start gap-2 text-sm text-yellow-600 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    Lokasi tidak tersedia. Aktifkan GPS untuk verifikasi kehadiran.
                    Absensi tetap dapat dilakukan tanpa lokasi.
                  </span>
                </div>
              )}

              {!isBusy && !loadingModels && (
                <div className="flex gap-3">
                  <Button onClick={handleCapture} className="flex-1 gap-2">
                    <Camera className="w-4 h-4" />
                    Ambil Foto & Absen
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
