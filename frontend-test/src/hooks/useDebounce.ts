import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        // Atur timer untuk memperbarui nilai setelah delay
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        // Bersihkan timer jika nilai berubah (misalnya saat pengguna masih mengetik)
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]); // Hanya jalankan ulang efek jika nilai atau delay berubah

    return debouncedValue;
}