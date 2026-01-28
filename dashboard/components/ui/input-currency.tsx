import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { formatCurrency } from "@/lib/utils"

interface InputCurrencyProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
    value?: number | null
    onValueChange?: (value: number) => void
}

export default function InputCurrency({ value, onValueChange, className, ...props }: InputCurrencyProps) {
    const [displayValue, setDisplayValue] = useState("")

    useEffect(() => {
        // Jika value ada, format. Jika 0 atau null
        const val = value !== undefined && value !== null ? value : 0;
        setDisplayValue(formatCurrency(val))
    }, [value])

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        // Ambil input mentah
        const inputValue = e.target.value

        // Bersihkan karakter non-digit
        const rawValue = inputValue.replace(/\D/g, "")

        // Convert ke number
        const numericValue = Number(rawValue)

        // Update tampilan ke user (Format Currency)
        setDisplayValue(formatCurrency(rawValue))

        // Kirim angka murni ke React Hook Form / Parent
        onValueChange?.(numericValue)
    }

    return (
        <Input
            {...props}
            className={className}
            inputMode="numeric"
            value={displayValue}
            onChange={handleChange}
        />
    )
}