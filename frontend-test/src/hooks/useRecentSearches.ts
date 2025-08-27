import { useState, useEffect } from 'react';

const MAX_RECENT_SEARCHES = 10;

export interface RecentSearch {
    id: string;
    query: string;
    timestamp: number;
}

export function useRecentSearches(namespace: string = 'default') {
    const RECENT_SEARCHES_KEY = `recent-searches-${namespace}`;
    const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);

    // Load recent searches from localStorage on mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            try {
                const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
                if (stored) {
                    const searches = JSON.parse(stored);
                    setRecentSearches(searches);
                }
            } catch (error) {
                console.error('Failed to load recent searches:', error);
            }
        }
    }, [RECENT_SEARCHES_KEY]);

    // Save recent searches to localStorage
    const saveToStorage = (searches: RecentSearch[]) => {
        if (typeof window !== 'undefined') {
            try {
                localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches));
            } catch (error) {
                console.error('Failed to save recent searches:', error);
            }
        }
    };

    // Add a new search to recent searches
    const addRecentSearch = (query: string) => {
        if (!query.trim()) return;

        const newSearch: RecentSearch = {
            id: Date.now().toString(),
            query: query.trim(),
            timestamp: Date.now()
        };

        setRecentSearches(prev => {
            // Remove duplicate if exists
            const filtered = prev.filter(search =>
                search.query.toLowerCase() !== query.toLowerCase()
            );

            // Add new search at the beginning
            const updated = [newSearch, ...filtered];

            // Keep only the most recent searches
            const limited = updated.slice(0, MAX_RECENT_SEARCHES);

            saveToStorage(limited);
            return limited;
        });
    };

    // Remove a specific recent search
    const removeRecentSearch = (id: string) => {
        setRecentSearches(prev => {
            const filtered = prev.filter(search => search.id !== id);
            saveToStorage(filtered);
            return filtered;
        });
    };

    // Clear all recent searches
    const clearRecentSearches = () => {
        setRecentSearches([]);
        if (typeof window !== 'undefined') {
            localStorage.removeItem(RECENT_SEARCHES_KEY);
        }
    };

    return {
        recentSearches,
        addRecentSearch,
        removeRecentSearch,
        clearRecentSearches
    };
}
