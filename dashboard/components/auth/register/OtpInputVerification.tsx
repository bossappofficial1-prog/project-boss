import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { cn } from "@/lib/utils";
import { Check, Smartphone } from "lucide-react";
import { useState } from "react";

export function OtpInputVerification() {
    const [step, setStep] = useState(1);
    const [verificationCode, setVerificationCode] = useState<string>()

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 text-center">
            <div className="flex justify-center mb-4">
                <div className="h-16 w-16 bg-red-50 rounded-full flex items-center justify-center">
                    <Smartphone className="h-8 w-8 text-red-600" />
                </div>
            </div>
            <div>
                <h2 className="text-2xl font-bold text-slate-900">Verifikasi Email</h2>
                <p className="text-slate-500 text-sm mt-2">
                    Masukkan 6 digit kode yang telah kami kirimkan ke <strong>{ }</strong>
                </p>
            </div>

            <div className="flex justify-center gap-2">
                <InputOTP
                    maxLength={6}
                    value={verificationCode}
                    onChange={(value) => setVerificationCode(value)}
                >
                    <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                    </InputOTPGroup>
                </InputOTP>
            </div>

            <div className="text-sm text-slate-600">
                Belum terima kode?{' '}
                {/* {timer > 0 ? (
                    <span className="text-slate-400 font-medium">Kirim ulang dalam {timer}s</span>
                ) : (
                    <button
                        onClick={() => { setTimer(60); alert("Kode dikirim ulang!"); }}
                        className="text-indigo-600 font-semibold hover:underline"
                    >
                        Kirim Ulang
                    </button>
                )} */}
            </div>

            <div className="flex flex-col gap-3 pt-2">
                <Button className="w-full" onClick={() => { }} disabled={false}>
                    Verifikasi & Lanjut
                </Button>
                {/* <Button variant="ghost" onClick={() => setShowOtpInput(false)}>
                                        Ganti Email / Nomor
                                    </Button> */}
            </div>
        </div>
    )
}