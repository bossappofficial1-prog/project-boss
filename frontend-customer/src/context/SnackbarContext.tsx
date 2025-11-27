"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

export type SnackbarType = "success" | "error" | "warning" | "info";

export interface SnackbarMessage {
    id: string;
    message: string;
    type: SnackbarType;
    duration?: number;
}

interface SnackbarContextType {
    snackbars: SnackbarMessage[];
    showSnackbar: (
        message: string,
        type?: SnackbarType,
        duration?: number
    ) => void;
    hideSnackbar: (id: string) => void;
}

const SnackbarContext = createContext<SnackbarContextType | undefined>(
    undefined
);

export const useSnackbar = () => {
    const context = useContext(SnackbarContext);
    if (!context) {
        throw new Error("useSnackbar must be used within a SnackbarProvider");
    }
    return context;
};

export const SnackbarProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [snackbars, setSnackbars] = useState<SnackbarMessage[]>([]);

    const showSnackbar = useCallback(
        (message: string, type: SnackbarType = "info", duration: number = 3000) => {
            const id = Math.random().toString(36).substring(2, 9);
            const newSnackbar: SnackbarMessage = { id, message, type, duration };

            setSnackbars((prev) => [...prev, newSnackbar]);

            if (duration > 0) {
                setTimeout(() => {
                    hideSnackbar(id);
                }, duration);
            }
        },
        []
    );

    const hideSnackbar = useCallback((id: string) => {
        setSnackbars((prev) => prev.filter((snackbar) => snackbar.id !== id));
    }, []);

    return (
        <SnackbarContext.Provider value={{ snackbars, showSnackbar, hideSnackbar }}>
            {children}
        </SnackbarContext.Provider>
    );
};
