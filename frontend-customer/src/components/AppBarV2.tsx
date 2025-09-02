"use client";

import React from 'react';
import { useAppBarV2 } from '@/context/AppBarContextV2';
import AppBar from './shared/AppBar';
import { usePathname } from 'next/navigation';

function AppBarV2() {
    const { appBarConfig } = useAppBarV2();
    const pathname = usePathname()

    const hiddenRoutes = [
        '/login',
        '/register',
        '/onboarding',
        '/splash',
        "/profile",
        "/payment/success",
        "/payment/processing",
        "/payment/failed",
        "/payment/cancelled",
        "/payment/expired",
        "/payment/pending",
    ];

    if (hiddenRoutes.includes(pathname)) return null;
    return <AppBar {...appBarConfig} />;
}

export default AppBarV2;