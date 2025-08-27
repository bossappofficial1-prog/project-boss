"use client"

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from './button';
import { ArrowLeft } from 'lucide-react';

export default function BackButton({ label }: { label?: string }) {
    const router = useRouter();
    return (
        <Button variant="ghost" onClick={() => router.back()} className="inline-flex items-center gap-2">
            <ArrowLeft />
            {label && <span className="text-sm">{label}</span>}
        </Button>
    );
}
