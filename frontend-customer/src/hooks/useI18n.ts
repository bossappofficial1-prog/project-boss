"use client";

import { LanguageType } from "@/constants";
import { useSearchParams } from "next/navigation";
import { useMemo, useCallback } from "react";
import enMessages from "../messages/en.json";

export function useLocale(): LanguageType {
    const searchParams = useSearchParams();
    const locale = useMemo(() => (searchParams.get("locale") || "id") as LanguageType, [searchParams]);

    return locale;
}

export type Messages = typeof enMessages;
type NamespaceKeys = keyof Messages;

export type NestedKeyOf<ObjectType extends object> = {
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

    const t = useCallback(<K extends NestedKeyOf<Messages[N]>>(
        key: K,
        interpolations?: Record<string, string | number>
    ): string => {
        const getValue = (obj: any, path: string[]): any => {
            if (!obj || path.length === 0) return undefined;
            const [currentKey, ...rest] = path;
            return rest.length === 0 ? obj[currentKey] : getValue(obj[currentKey], rest);
        };

        const keys = (key as string).split(".");
        let value = getValue(messages[namespace], keys);

        let result = value || key;

        if (interpolations && typeof result === "string") {
            Object.entries(interpolations).forEach(([placeholder, replacement]) => {
                const regex = new RegExp(`\\{${placeholder}\\}`, "g");
                result = result.replace(regex, String(replacement));
            });
        }

        return result as string;
    }, [messages, namespace]);

    return t;
}