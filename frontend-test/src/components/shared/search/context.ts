import { createContext, useContext } from 'react';

interface SearchContextType {
    value: string;
    setValue: (value: string) => void;
    handleSearch: (query: string) => void;
    inputRef: React.RefObject<HTMLInputElement>;
    recentSearches: { id: string; query: string }[];
    removeRecentSearch: (id: string) => void;
    clearRecentSearches: () => void;
    filteredSuggestions: { id: string; query: string }[];
    size: 'sm' | 'md' | 'lg';
    t: (key: string) => string;
}

export const SearchContext = createContext<SearchContextType | null>(null);

export function useSearchContext() {
    const context = useContext(SearchContext);
    if (!context) {
        throw new Error('useSearchContext must be used within a SearchProvider');
    }
    return context;
}