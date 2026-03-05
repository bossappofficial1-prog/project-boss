import { ReusableForm } from "@/components/ui/reuseable-form";
import { fieldRegisterStep2, RegisterStep2Input, registerStep2Schema } from "./schema";

export function RegisterStep2({
    name,
    handleNext,
    handleLogout,
    logoutLoading,
    defaultValues
}: {
    name: string
    handleNext: (values: RegisterStep2Input) => void
    handleLogout: () => void
    logoutLoading: boolean
    defaultValues?: RegisterStep2Input
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

                <div className="pt-2 flex gap-3">
                    <button
                        type="button"
                        onClick={handleLogout}
                        disabled={logoutLoading}
                        className="px-6 h-12 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl transition-all duration-200"
                    >
                        Keluar
                    </button>
                    <button
                        className="flex-1 h-12 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-600/20 hover:shadow-red-600/30 hover:-translate-y-[1px] transition-all duration-200 flex items-center justify-center gap-2"
                        type='submit'
                        form='register-step-2'
                    >
                        Lanjut Pilih Paket
                    </button>
                </div>
            </div>
        </div>
    )
}