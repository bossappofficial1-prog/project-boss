import RegistrationContent from "@/components/auth/register/RegisterContent";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: 'Registrasi'
}

export default function RegisterPage() {
    return (<RegistrationContent />)
}