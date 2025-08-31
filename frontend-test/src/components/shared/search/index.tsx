"use client";

import React, { forwardRef, ReactNode } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Search as SearchIcon, Clock, X } from 'lucide-react';
import { useSearchContext, SearchContext } from './context';
import { useSearchLogic } from './use-search-logic';
import { searchInputVariants, searchIconVariants, clearButtonVariants } from './variants';
import { useTranslations } from '@/hooks/useI18n';

// Props untuk Komponen Utama (Provider)
interface SearchProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
    value?: string;
    onChange?: (value: string) => void;
    onSearch?: (query: string) => void;
    namespace?: string;
    size?: 'sm' | 'md' | 'lg';
}

// Komponen Utama: Wrapper yang menyediakan Context
const Search = ({ value, onChange, onSearch, namespace, size, children, className }: SearchProps & { children: React.ReactNode }) => {
    const logic = useSearchLogic({ controlledValue: value, onChange, onSearch, namespace, size });

    const providerValue = {
        ...logic,
        t: (logic.t as unknown) as (key: string) => string,
        inputRef: logic.inputRef as React.RefObject<HTMLInputElement>,
    };

    return (
        <SearchContext.Provider value={providerValue}>
            <Popover>
                <div className={`relative ${className}`}>{children}</div>
            </Popover>
        </SearchContext.Provider>
    );
};

// Sub-Komponen: Input Pencarian
const SearchInput = forwardRef<HTMLInputElement, Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>>((props, ref) => {
    const { value, setValue, handleSearch, size, inputRef } = useSearchContext();
    const handleKeyPress = (e: React.KeyboardEvent) => e.key === 'Enter' && handleSearch(value);

    return (
        <PopoverTrigger asChild>
            <div className="relative group">
                <SearchIcon className={searchIconVariants({ size })} />
                <Input
                    ref={ref}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={handleKeyPress}
                    {...props}
                    className={`${searchInputVariants({ size })} ${props.className}`}
                />
                {value && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className={clearButtonVariants({ size })}
                        onClick={() => setValue('')}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </div>
        </PopoverTrigger>
    );
});
SearchInput.displayName = 'SearchInput';

// Sub-Komponen: Dropdown Saran Pencarian
const SearchDropdown = () => {
    const { value, handleSearch, recentSearches, filteredSuggestions, removeRecentSearch } = useSearchContext();
    const t = useTranslations("searchPage")

    const showCurrentSearch = value.trim().length > 0;
    const hasFilteredSuggestions = filteredSuggestions.length > 0;
    const showRecentSearches = value.length === 0 && recentSearches.length > 0;

    if (!showCurrentSearch && !showRecentSearches && !hasFilteredSuggestions) {
        return null;
    }

    return (
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-2 shadow-xl border-border/50" onOpenAutoFocus={(e) => e.preventDefault()}>
            <div className="flex flex-col max-h-[70vh] overflow-y-auto">
                {showCurrentSearch && (
                    <SuggestionItem
                        icon={<SearchIcon size={16} />}
                        text={<span>{t('for')} "<span className="font-semibold">{value}</span>"</span>}
                        onClick={() => handleSearch(value)}
                    />
                )}

                {hasFilteredSuggestions && (
                    <div className={showCurrentSearch ? "mt-2 pt-2 border-t border-border/50" : ""}>
                        {filteredSuggestions.map((s) => (
                            <SuggestionItem
                                key={s.id}
                                icon={<Clock size={16} />}
                                query={s.query}
                                highlight={value}
                                onClick={() => handleSearch(s.query)}
                                onRemove={() => removeRecentSearch(s.id)}
                            />
                        ))}
                    </div>
                )}

                {showRecentSearches && (
                    <>
                        <RecentSearchesHeader />
                        {recentSearches.map((s) => (
                            <SuggestionItem
                                key={s.id}
                                icon={<Clock size={16} />}
                                query={s.query}
                                onClick={() => handleSearch(s.query)}
                                onRemove={() => removeRecentSearch(s.id)}
                            />
                        ))}
                    </>
                )}
            </div>
        </PopoverContent>
    );
};

const RecentSearchesHeader = () => {
    const { clearRecentSearches } = useSearchContext();
    const t = useTranslations("searchPage")
    return (
        <div className="px-2 pt-2 pb-1.5 flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground capitalize tracking-wider">{t('recentSearches')}</span>
            <Button variant="ghost" size="sm" onClick={clearRecentSearches} className="text-xs h-auto p-1 text-muted-foreground hover:text-destructive">{t('clearAll')}</Button>
        </div>
    );
};

interface SuggestionItemProps {
    icon: ReactNode;
    onClick: () => void;
    onRemove?: () => void;
    text?: ReactNode;
    query?: string;
    highlight?: string;
}

const SuggestionItem = ({ icon, text, query, highlight, onClick, onRemove }: SuggestionItemProps) => {
    const getHighlightedText = () => {
        if (!query || !highlight || !query.toLowerCase().includes(highlight.toLowerCase())) {
            return query;
        }
        const parts = query.split(new RegExp(`(${highlight})`, 'gi'));
        return (
            <span>
                {parts.map((part, index) =>
                    part.toLowerCase() === highlight.toLowerCase() ? (
                        <strong key={index} className="font-bold">{part}</strong>
                    ) : (
                        part
                    )
                )}
            </span>
        );
    };

    return (
        <div className="flex items-center justify-between text-sm w-full cursor-pointer group rounded-md hover:bg-accent px-2 py-2" onClick={onClick}>
            <div className="flex items-center gap-3 overflow-hidden">
                <span className="text-muted-foreground flex-shrink-0">{icon}</span>
                <span className="truncate">{text || getHighlightedText()}</span>
            </div>
            {onRemove && (
                <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 flex-shrink-0"
                    onClick={(e) => { e.stopPropagation(); onRemove(); }}
                >
                    <X className="h-3.5 w-3.5" />
                </Button>
            )}
        </div>
    );
};


export { Search, SearchInput, SearchDropdown };