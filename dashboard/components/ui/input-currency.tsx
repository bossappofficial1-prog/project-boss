import { useState } from "react"
import { Input } from "./input"
import { formatCurrency } from "@/lib/utils"

interface InputCurrencyProps extends React.InputHTMLAttributes<HTMLInputElement> {
    value?: number,
    onValueChange?: (value: number) => void
}

export default function InputCurrency({ value, onValueChange, ...props }: InputCurrencyProps) {
    const [displayValue, setDisplayValue] = useState(formatCurrency(value || 0))

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        const rawValue = e.target.value.replace(/\D/g, "")
        const numericValue = Number(rawValue)
        setDisplayValue(formatCurrency(rawValue))
        onValueChange?.(numericValue)
    }

    return <Input
        value={displayValue}
        onChange={handleChange}
        inputMode="numeric"
        className={props.className ?? ``}
        {...props}
    />
}