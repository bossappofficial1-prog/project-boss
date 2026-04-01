"use client";

import { useEffect } from "react";

const SW_SCOPE = "/serwist/";
const SW_SCRIPT_URL = `/serwist/sw.js?v=${process.env.NEXT_PUBLIC_SW_VERSION ?? "20260401"}`;

export default function SerwistRegister() {
    useEffect(() => {
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker.register(SW_SCRIPT_URL, { scope: SW_SCOPE }).catch((err) => {
                console.error("SW registration failed:", err);
            });
        }
    }, []);

    return null;
}
