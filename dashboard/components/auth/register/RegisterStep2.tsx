import { ReusableForm } from "@/components/ui/reuseable-form";
import { fieldRegisterStep2, RegisterStep2Input, registerStep2Schema } from "./schema";
import { AlertCircle, Loader2 } from "lucide-react";

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
                <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Informasi Bisnis</h2>
                <p className="text-slate-500">
                    Halo <span className="font-semibold text-slate-900">{name}</span>, lengkapi data bisnis Anda.
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
                    <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                        <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-700 leading-snug">{businessNameError}</p>
                    </div>
                )}

                <div className="pt-2 flex gap-3">
                    <button
                        type="button"
                        onClick={handleLogout}
                        disabled={logoutLoading || isSubmitting}
                        className="px-6 h-12 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl transition-all duration-200 disabled:opacity-50"
                    >
                        {logoutLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : 'Keluar'}
                    </button>
                    <button
                        className="flex-1 h-12 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-600/20 hover:shadow-red-600/30 hover:-translate-y-[1px] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:hover:translate-y-0 disabled:shadow-none"
                        type='submit'
                        form='register-step-2'
                        disabled={isSubmitting}
                    >
                        {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                        {isSubmitting ? 'Memproses...' : 'Lanjut Pilih Paket'}
                    </button>
                </div>
            </div>
        </div>
    )
}