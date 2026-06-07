'use client';

import { useEffect } from 'react';
import { useOutletsQuery } from '@/hooks/use-outlets';
import { useOutletStore } from '@/stores/outlet.store';
import type { Outlet } from '@/types';

export function OutletSync({ children }: { children: React.ReactNode }) {
    const { data, isLoading } = useOutletsQuery();
    const { setOutlets, setLoading, setError } = useOutletStore();

    useEffect(() => {
        setLoading(isLoading);
    }, [isLoading, setLoading]);

    useEffect(() => {
        if (data?.outlets) {
            setOutlets(data.outlets as Outlet[]);
        }
    }, [data?.outlets, setOutlets]);

    useEffect(() => {
        if (!isLoading && !data) {
            setError('Gagal memuat data outlet');
        }
    }, [isLoading, data, setError]);

    return <>{children}</>;
}
