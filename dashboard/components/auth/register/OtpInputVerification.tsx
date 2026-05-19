import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { apiClient } from "@/lib/apis/base";
import { AxiosError } from "axios";
import { Smartphone } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const DURATION = 30; // detik

export function OtpInputVerification({ email, setStep }: { email: string, setStep?: (step: number) => void }) {
    const [verificationCode, setVerificationCode] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')
    const router = useRouter()
    const [successMessage, setSuccessMessage] = useState('')

    const [timer, setTimer] = useState(() => {
        if (typeof window === "undefined") return 0;

        const endTime = localStorage.getItem("timer_end");
        if (!endTime) return 0;

        const diff = Math.floor(
            (Number(endTime) - Date.now()) / 1000
        );

        return diff > 0 ? diff : 0;
    });

    // Timer logic
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (timer > 0) {
            interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
        }
        return () => clearInterval(interval);
    }, [timer]);

    const startTimer = () => {
        const endTime = Date.now() + DURATION * 1000;
        localStorage.setItem("timer_end", endTime.toString());
        setTimer(DURATION);
    };

    const handleResendVerificationCode = async () => {
        try {
            const result = await apiClient.post(`/auth/resend-verification`, { email })
            if (result.data.success) {
                setErrorMessage('')
                setSuccessMessage(result.data.message)
                startTimer()
            }
        } catch (error: unknown) {
            const errors = error as AxiosError
            setErrorMessage((errors.response?.data as any).message ?? 'Terjadi kendala saat mengirim otp')
        }
    }

    const handleVerifyOtp = async () => {
        try {
            setIsLoading(true)
            const res = await apiClient.post('/auth/verify', {
                email,
                code: verificationCode
            })
            // `/auth/register?step=2&isVerified=true&email=${email}`
            router.push(`/auth/register?step=2&isVerified=true&email=${email}`)

            setStep?.(2)
        } catch (error: unknown) {
            const axiosError = error as AxiosError;
            const errorMessage = (axiosError.response?.data as any).message as string;
            setErrorMessage(errorMessage.includes('Invalid input data.') ? 'Masukkan kode OTP' : errorMessage)
            setSuccessMessage('')
        } finally { setIsLoading(false) }
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 text-center">
            <div className="flex justify-center mb-4">
                <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center">
                    <Smartphone className="h-8 w-8 text-primary" />
                </div>
            </div>
            <div>
                <h2 className="text-2xl font-semibold tracking-tight">Verifikasi Email</h2>
                <p className="text-sm text-muted-foreground mt-2">
                    Masukkan 6 digit kode yang telah kami kirimkan ke <strong>{email}</strong>
                </p>
            </div>

            {errorMessage && <Alert variant="destructive">
                <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>}

            {successMessage && <Alert className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                <AlertDescription>{successMessage}</AlertDescription>
            </Alert>}

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

            <div className="text-sm text-muted-foreground">
                Belum terima kode?{' '}
                {timer > 0 ? (
                    <span className="text-muted-foreground/60 font-medium">Kirim ulang dalam {timer}s</span>
                ) : (
                    <button
                        onClick={() => {
                            handleResendVerificationCode()
                        }}
                        className="text-primary font-medium hover:underline"
                    >
                        Kirim Ulang
                    </button>
                )}
            </div>

            <div className="flex flex-col gap-3 pt-2">
                <Button
                    onClick={handleVerifyOtp}
                    disabled={verificationCode?.length! < 6 || isLoading}
                    className="w-full h-11"
                >
                    {isLoading ? 'Memproses...' : 'Verifikasi & Lanjut'}
                </Button>
            </div>
        </div>
    )
}