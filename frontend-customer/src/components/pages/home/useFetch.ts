"use client"

import { useEffect, useState } from "react";

export function useFetch<T = any>(url: string | null) {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<any>(null);

    useEffect(() => {
        let mounted = true;
        if (!url) return;
        setLoading(true);
        setError(null);
        fetch(url)
            .then((r) => {
                if (!r.ok) throw new Error("Network response was not ok");
                return r.json();
            })
            .then((json) => {
                if (!mounted) return;
                setData(json);
            })
            .catch((e) => {
                if (!mounted) return;
                setError(e);
            })
            .finally(() => {
                if (!mounted) return;
                setLoading(false);
            });
        return () => {
            mounted = false;
        };
    }, [url]);

    return { data, loading, error };
}

export default useFetch;
