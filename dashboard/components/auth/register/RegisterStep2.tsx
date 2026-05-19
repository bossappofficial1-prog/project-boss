import { ReusableForm } from "@/components/ui/reuseable-form";
import { fieldRegisterStep2, RegisterStep2Input, registerStep2Schema } from "./schema";
import { AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RegisterStep2({
    name,
    handleNext,
    handleLogout,
    logoutLoading,
    defaultValues,
    isSubmitting,
    businessNameError,
}: {
    name: string
    handleNext: (values: RegisterStep2Input) => void
    handleLogout: () => void
    logoutLoading: boolean
    defaultValues?: RegisterStep2Input
    isSubmitting?: boolean
    businessNameError?: string | null
}) {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2 text-center lg:text-left">
                <h2 className="text-2xl font-semibold tracking-tight">Informasi Bisnis</h2>
                <p className="text-sm text-muted-foreground">
                    Halo <span className="font-semibold text-foreground">{name}</span>, lengkapi data bisnis Anda.
                </p>
            </div>

            <div className="space-y-5">
                <ReusableForm
                    key={`register-step-2`}
                    id={`register-step-2`}
                    defaultValues={defaultValues}
                    fields={fieldRegisterStep2}
                    onSubmit={handleNext as any}
                    schema={registerStep2Schema}
                    hideSubmitButton
                />

                {/* Bug 4 fix: tampilkan error nama bisnis sudah dipakai secara inline */}
                {businessNameError && (
                    <div className="flex items-start gap-2.5 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3">
                        <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-destructive leading-snug">{businessNameError}</p>
                    </div>
                )}

                <div className="pt-2 flex gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleLogout}
                        disabled={logoutLoading || isSubmitting}
                        className="h-11"
                    >
                        {logoutLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : 'Keluar'}
                    </Button>
                    <Button
                        type='submit'
                        form='register-step-2'
                        disabled={isSubmitting}
                        className="flex-1 h-11"
                    >
                        {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                        {isSubmitting ? 'Memproses...' : 'Lanjut Pilih Paket'}
                    </Button>
                </div>
            </div>
        </div>
    )
}