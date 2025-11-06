import { useEffect, useState } from "react";

export function useDebounce<T>(value: T, delay: number): T {
    const [debounceValue, setDebaounceValue] = useState(value)

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebaounceValue(value)
        }, delay)

        return () => {
            clearTimeout(handler)
        }
    }, [value, delay])

    return debounceValue
}