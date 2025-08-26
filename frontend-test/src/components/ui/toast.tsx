"use client"

import { Toaster, toast } from 'react-hot-toast';
import React from 'react';

export function useToast() {
    return {
        push: (t: { title: string; description?: string }) => {
            toast(t.description ? `${t.title} — ${t.description}` : t.title);
        },
        raw: toast,
    };
}

export function AppToaster() {
    return <Toaster position="bottom-right" />;
}

export default useToast;
