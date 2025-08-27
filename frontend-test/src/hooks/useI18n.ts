"use client";

import { LanguageType } from "@/constants";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import enMessages from "../messages/en.json";

export function useLocale(): LanguageType {
    const searchParams = useSearchParams();
    const locale = (searchParams.get("locale") || "id") as LanguageType;

    return locale;
}

type Messages = typeof enMessages; // Ambil tipe dari file JSON
type NamespaceKeys = keyof Messages; // Ambil namespace (level pertama dari JSON)

// Utility untuk membuat union dari nested key
type NestedKeyOf<ObjectType extends object> = {
    [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`;
}[keyof ObjectType & (string | number)];

export function useTranslations<N extends NamespaceKeys>(namespace: N) {
    const locale = useLocale();

    const messages = useMemo(() => {
        try {
            if (locale === "en") {
                return require(`../messages/en.json`);
            } else {
                return require(`../messages/id.json`);
            }
        } catch (error) {
            console.error("Failed to load messages:", error);
            return require(`../messages/id.json`); // fallback
        }
    }, [locale]);

    return function t<K extends NestedKeyOf<Messages[N]>>(
        key: K,
        interpolations?: Record<string, string | number>
    ): string {
        // Rekursif untuk mengakses nilai berdasarkan key
        const getValue = (obj: any, path: string[]): any => {
            if (!obj || path.length === 0) return undefined;
            const [currentKey, ...rest] = path;
            return rest.length === 0 ? obj[currentKey] : getValue(obj[currentKey], rest);
        };

        const keys = key.split(".");
        let value = getValue(messages[namespace], keys);

        let result = value || key;

        // Handle interpolations
        if (interpolations && typeof result === "string") {
            Object.entries(interpolations).forEach(([placeholder, replacement]) => {
                const regex = new RegExp(`\\{${placeholder}\\}`, "g");
                result = result.replace(regex, String(replacement));
            });
        }

        return result as string;
    };
}