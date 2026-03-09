"use client";

import { LanguageType } from "@/constants";
import { useMemo, useCallback, useSyncExternalStore, useEffect, useRef } from "react";
import enMessages from "../messages/en.json";

const VALID_LOCALES: LanguageType[] = ["id", "en"];

function getLocaleCookie(): LanguageType {
    if (typeof document === "undefined") return "id";
    const match = document.cookie.match(/(?:^|;\s*)locale=([^;]*)/);
    const val = match?.[1];
    return VALID_LOCALES.includes(val as LanguageType) ? (val as LanguageType) : "id";
}

function setLocaleCookie(locale: LanguageType) {
    document.cookie = `locale=${locale}; path=/; max-age=31536000`;
}

// Subscribe to cookie changes via a custom event
const LOCALE_CHANGE_EVENT = "locale-change";

function subscribeLocale(callback: () => void) {
    window.addEventListener(LOCALE_CHANGE_EVENT, callback);
    return () => window.removeEventListener(LOCALE_CHANGE_EVENT, callback);
}

function getLocaleSnapshot(): LanguageType {
    return getLocaleCookie();
}

function getLocaleServerSnapshot(): LanguageType {
    return "id";
}

export function setLocale(locale: LanguageType) {
    setLocaleCookie(locale);
    window.dispatchEvent(new Event(LOCALE_CHANGE_EVENT));
}

export function useLocale(): LanguageType {
    const hasHydratedRef = useRef(false);
    const getClientSnapshot = useCallback(
        () => (hasHydratedRef.current ? getLocaleSnapshot() : getLocaleServerSnapshot()),
        []
    );

    useEffect(() => {
        hasHydratedRef.current = true;
    }, []);

    // Keep the very first client render aligned with the server snapshot to prevent hydration errors
    // when the locale cookie differs between server and client. Subsequent renders rely on the
    // external store to reflect cookie changes.
    return useSyncExternalStore(
        subscribeLocale,
        getClientSnapshot,
        getLocaleServerSnapshot
    );
}

export function useLocalizedPath() {
    return useCallback((href: string) => {
        if (!href) return "/";

        if (/^https?:\/\//i.test(href)) {
            return href;
        }

        const [pathPart, queryPart] = href.split("?");
        const normalizedPath = pathPart.startsWith("/") ? pathPart : `/${pathPart}`;

        return queryPart ? `${normalizedPath}?${queryPart}` : normalizedPath;
    }, []);
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
