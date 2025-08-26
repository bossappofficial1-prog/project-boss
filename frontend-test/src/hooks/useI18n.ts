"use client"

import { useSearchParams } from 'next/navigation';
import { useMemo } from 'react';

export function useLocale() {
    const searchParams = useSearchParams();
    const locale = searchParams.get('locale') || 'id';

    return locale;
}

export function useTranslations(namespace: string) {
    const locale = useLocale();

    const messages = useMemo(() => {
        // Import messages based on locale
        try {
            if (locale === 'en') {
                return require(`../messages/en.json`);
            } else {
                return require(`../messages/id.json`);
            }
        } catch (error) {
            console.error('Failed to load messages:', error);
            return require(`../messages/id.json`); // fallback
        }
    }, [locale]);

    return function t(key: string, interpolations?: Record<string, string | number>) {
        const keys = key.split('.');
        let value = messages;

        for (const k of keys) {
            value = value?.[k];
        }

        let result = value || key;

        // Handle interpolations
        if (interpolations && typeof result === 'string') {
            Object.entries(interpolations).forEach(([placeholder, replacement]) => {
                const regex = new RegExp(`\\{${placeholder}\\}`, 'g');
                result = result.replace(regex, String(replacement));
            });
        }

        return result;
    };
}
