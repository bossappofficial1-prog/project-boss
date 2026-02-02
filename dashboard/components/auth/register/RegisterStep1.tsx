import { ReusableForm } from "@/components/ui/reuseable-form";
import { fieldRegisterStep1, RegisterStep1Input, registerStep1Schema } from "./schema";
import { Button } from "@/components/ui/button";
import { ArrowRight, Mail } from "lucide-react";

export function RegisterStep1({
    handleNext,
    isLoading,
    handleGoogleLogin
}: {
    isLoading: boolean,
    handleNext: (values: RegisterStep1Input) => void
    handleGoogleLogin: () => void
}) {
    return (
        <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center md:text-left mb-2">
                <h2 className="text-2xl font-bold text-slate-900">Buat Akun Owner</h2>
                <p className="text-slate-500 text-sm">Langkah pertama untuk digitalisasi bisnis Anda.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <button
                    onClick={handleGoogleLogin}
                    className="flex items-center justify-center w-full px-4 py-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700 bg-white"
                >
                    <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="h-5 w-5 mr-2" alt="Google" />
                    Google
                </button>
                <div className="flex items-center justify-center w-full px-4 py-2.5 border border-indigo-100 bg-indigo-50 rounded-lg text-sm font-medium text-indigo-700 cursor-default">
                    <Mail className="h-5 w-5 mr-2" />
                    Email
                </div>
            </div>

            <div className="relative">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-200"></span></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-500">Isi form manual</span></div>
            </div>
            <ReusableForm
                key={`register-step-1`}
                id={`register-step-1`}
                fields={fieldRegisterStep1}
                onSubmit={(values) => handleNext(values as RegisterStep1Input)}
                isDialogOpen={true}
                schema={registerStep1Schema}
                hideSubmitButton
            />

            <Button className="w-full" type='submit' form='register-step-1' disabled={isLoading}>
                Lanjut: Verifikasi Email <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <p className="text-xs text-center text-slate-400 mt-2">
                Kami akan mengirimkan kode OTP ke email Anda.
            </p>
        </div>
    )
}