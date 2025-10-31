"use client";

import React, { useEffect, useState } from "react";
import { X, CheckCircle2, XCircle, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSnackbar, type SnackbarMessage } from "@/context/SnackbarContext";

const iconMap = {
    success: CheckCircle2,
    error: XCircle,
    warning: AlertCircle,
    info: Info,
};

// Material Design style colors - solid backgrounds (matching Android/Flutter)
const colorMap = {
    success:
        "bg-[#4CAF50] dark:bg-[#4CAF50] text-white",
    error:
        "bg-[#F44336] dark:bg-[#F44336] text-white",
    warning:
        "bg-[#FF9800] dark:bg-[#FF9800] text-white",
    info: "bg-[#323232] dark:bg-[#323232] text-white",
};

const iconColorMap = {
    success: "text-white",
    error: "text-white",
    warning: "text-white",
    info: "text-white",
};

interface SnackbarItemProps {
    snackbar: SnackbarMessage;
    onClose: (id: string) => void;
}

const SnackbarItem: React.FC<SnackbarItemProps> = ({ snackbar, onClose }) => {
    const [isExiting, setIsExiting] = useState(false);
    const Icon = iconMap[snackbar.type];

    useEffect(() => {
        if (snackbar.duration && snackbar.duration > 0) {
            const timer = setTimeout(() => {
                setIsExiting(true);
                setTimeout(() => onClose(snackbar.id), 300);
            }, snackbar.duration - 300);

            return () => clearTimeout(timer);
        }
    }, [snackbar.duration, snackbar.id, onClose]);

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(() => onClose(snackbar.id), 300);
    };

    return (
        <div
            className={cn(
                "flex items-center gap-3 px-4 py-3.5 rounded shadow-[0_3px_5px_-1px_rgba(0,0,0,0.2),0_6px_10px_0_rgba(0,0,0,0.14),0_1px_18px_0_rgba(0,0,0,0.12)] transition-all duration-300 w-full min-h-[48px]",
                colorMap[snackbar.type],
                isExiting
                    ? "animate-out slide-out-to-bottom-full opacity-0"
                    : "animate-in slide-in-from-bottom-full"
            )}
            role="alert"
            aria-live="polite"
        >
            <Icon className={cn("size-5 shrink-0", iconColorMap[snackbar.type])} />
            <p className="flex-1 text-[14px] font-medium leading-[20px] tracking-[0.25px]">
                {snackbar.message}
            </p>
            <button
                onClick={handleClose}
                className="shrink-0 rounded hover:bg-white/10 active:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-white/30 p-1.5 -mr-1"
                aria-label="Close notification"
            >
                <X className="size-[18px]" />
            </button>
        </div>
    );
};

export const SnackbarContainer: React.FC = () => {
    const { snackbars, hideSnackbar } = useSnackbar();

    return (
        <div
            className="fixed left-0 right-0 z-[98] flex flex-col gap-2 p-4 pointer-events-none max-w-screen-sm mx-auto transition-[bottom] duration-300 ease-in-out"
            style={{
                bottom: "var(--bottomnav-height, 0px)",
            }}
            aria-live="polite"
            aria-atomic="true"
        >
            {snackbars.map((snackbar) => (
                <div key={snackbar.id} className="pointer-events-auto">
                    <SnackbarItem snackbar={snackbar} onClose={hideSnackbar} />
                </div>
            ))}
        </div>
    );
};
