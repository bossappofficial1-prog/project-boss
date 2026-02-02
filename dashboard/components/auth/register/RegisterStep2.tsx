import { ReusableForm } from "@/components/ui/reuseable-form";
import { fieldRegisterStep2, RegisterStep2Input, registerStep2Schema } from "./schema";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";

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
        <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center md:text-left mb-2">
                <h2 className="text-2xl font-bold text-slate-900">Informasi Bisnis</h2>
                <p className="text-slate-500 text-sm">
                    Halo {name}, lengkapi data bisnis Anda.
                </p>
            </div>

            <ReusableForm
                key={`register-step-2`}
                id={`register-step-2`}
                defaultValues={defaultValues}
                fields={fieldRegisterStep2}
                onSubmit={handleNext as any}
                schema={registerStep2Schema}
                hideSubmitButton
            />

            <div className="pt-4 flex gap-3">
                <Button variant="secondary" onClick={handleLogout} disabled={logoutLoading}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Keluar
                </Button>
                <Button className="flex-1" type='submit' form='register-step-2'>
                    Lanjut: Pilih Paket <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
        </div>
    )
}