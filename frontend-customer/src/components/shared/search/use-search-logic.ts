import { useState, useRef } from 'react';
import { useRecentSearches } from '@/hooks/useRecentSearches';
import { useTranslations } from '@/hooks/useI18n';

interface UseSearchLogicProps {
    controlledValue?: string;
    onChange?: (value: string) => void;
    onSearch?: (query: string) => void;
    namespace?: string;
    size?: 'sm' | 'md' | 'lg';
}

export function useSearchLogic({
    controlledValue,
    onChange,
    onSearch,
    namespace = 'default',
    size = 'md'
}: UseSearchLogicProps) {
    const t = useTranslations('searchPage'); // Pastikan namespace ini benar
    const [internalValue, setInternalValue] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const value = controlledValue !== undefined ? controlledValue : internalValue;
    const setValue = controlledValue !== undefined ? onChange! : setInternalValue;

    const { recentSearches, addRecentSearch, removeRecentSearch, clearRecentSearches } = useRecentSearches(namespace);

    // FIX: Tambahkan .trim() untuk pencocokan yang lebih akurat dan hindari duplikasi
    const filteredSuggestions = recentSearches.filter(
        (rs) =>
            rs.query.toLowerCase().includes(value.trim().toLowerCase()) &&
            rs.query.trim().toLowerCase() !== value.trim().toLowerCase()
    ).slice(0, 10);

    const handleSearch = (query: string) => {
        const trimmedQuery = query.trim();
        if (trimmedQuery) {
            addRecentSearch(trimmedQuery);
            onSearch?.(trimmedQuery);
            inputRef.current?.blur();
        }
    };

    return {
        value,
        setValue,
        handleSearch,
        inputRef,
        recentSearches,
        removeRecentSearch,
        clearRecentSearches,
        filteredSuggestions,
        size,
        t,
    };
}