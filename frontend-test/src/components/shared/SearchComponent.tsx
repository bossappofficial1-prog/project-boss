"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Clock, X } from 'lucide-react';
import { useRecentSearches } from '@/hooks/useRecentSearches';
import { useTranslations } from '@/hooks/useI18n';

interface SearchComponentProps {
    placeholder?: string;
    value?: string;
    onChange?: (value: string) => void;
    onSearch?: (query: string) => void;
    onFocus?: () => void;
    onBlur?: () => void;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
    showSuggestions?: boolean;
    autoFocus?: boolean;
    disabled?: boolean;
    namespace?: string; // untuk recent searches yang berbeda per halaman
}

export function SearchComponent({
    placeholder,
    value: controlledValue,
    onChange,
    onSearch,
    onFocus,
    onBlur,
    className = '',
    size = 'md',
    showSuggestions = true,
    autoFocus = false,
    disabled = false,
    namespace = 'default'
}: SearchComponentProps) {
    const t = useTranslations('searchPage');
    const [internalValue, setInternalValue] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Use controlled or uncontrolled value
    const value = controlledValue !== undefined ? controlledValue : internalValue;
    const setValue = controlledValue !== undefined ? onChange : setInternalValue;

    const {
        recentSearches,
        addRecentSearch,
        removeRecentSearch,
        clearRecentSearches
    } = useRecentSearches(namespace);

    // Filter recent searches based on current input
    const filteredSuggestions = recentSearches.filter(recentSearch =>
        recentSearch.query.toLowerCase().includes(value.toLowerCase()) &&
        recentSearch.query.toLowerCase() !== value.toLowerCase()
    ).slice(0, 10);

    // Size configurations
    const sizeConfig = {
        sm: {
            input: 'pl-8 pr-8 py-2 text-sm',
            icon: 'h-4 w-4',
            clearBtn: 'h-5 w-5',
            iconPos: 'left-2',
            clearPos: 'right-1'
        },
        md: {
            input: 'pl-10 pr-10 py-3 text-base',
            icon: 'h-5 w-5',
            clearBtn: 'h-6 w-6',
            iconPos: 'left-3',
            clearPos: 'right-2'
        },
        lg: {
            input: 'pl-12 pr-12 py-4 text-lg',
            icon: 'h-6 w-6',
            clearBtn: 'h-7 w-7',
            iconPos: 'left-4',
            clearPos: 'right-3'
        }
    };

    const config = sizeConfig[size];

    // Handle input change
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setValue?.(newValue);
        if (showSuggestions) {
            setShowDropdown(true);
        }
    };

    // Handle search execution
    const handleSearch = (query: string) => {
        if (query.trim()) {
            addRecentSearch(query.trim());
            onSearch?.(query.trim());
            setShowDropdown(false);
        }
    };

    // Handle suggestion click
    const handleSuggestionClick = (query: string) => {
        setValue?.(query);
        handleSearch(query);
    };

    // Handle clear
    const handleClear = () => {
        setValue?.('');
        setShowDropdown(false);
        inputRef.current?.focus();
    };

    // Handle focus
    const handleFocus = () => {
        if (showSuggestions) {
            setShowDropdown(true);
        }
        onFocus?.();
    };

    // Handle blur
    const handleBlur = () => {
        // Delay hiding dropdown to allow click events
        setTimeout(() => {
            setShowDropdown(false);
        }, 150);
        onBlur?.();
    };

    // Handle key press
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch(value);
        } else if (e.key === 'Escape') {
            setShowDropdown(false);
            inputRef.current?.blur();
        }
    };

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node) &&
                inputRef.current &&
                !inputRef.current.contains(event.target as Node)
            ) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className={`relative ${className}`}>
            {/* Search Input */}
            <div className="relative">
                <Search className={`absolute ${config.iconPos} top-1/2 transform -translate-y-1/2 text-gray-400 ${config.icon} z-10`} />
                <Input
                    ref={inputRef}
                    placeholder={placeholder || t('searchPage').searchPlaceholder}
                    value={value}
                    onChange={handleInputChange}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyPress}
                    className={`${config.input} ${className}`}
                    autoFocus={autoFocus}
                    disabled={disabled}
                />
                {value && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className={`absolute ${config.clearPos} top-1/2 transform -translate-y-1/2 ${config.clearBtn} p-0 z-10`}
                        onClick={handleClear}
                        disabled={disabled}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && showDropdown && (value.length > 0 || recentSearches.length > 0) && (
                <div
                    ref={dropdownRef}
                    className="absolute top-full left-0 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-b-md shadow-lg z-50 max-h-80 overflow-y-auto mt-1"
                >
                    {/* Current search option */}
                    {value.length > 0 && (
                        <div
                            className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-600"
                            onClick={() => handleSearch(value)}
                        >
                            <div className="flex items-center gap-3">
                                <Search className="h-4 w-4 text-gray-400" />
                                <span className="text-sm">
                                    {t('searchPage').for} "<span className="font-medium">{value}</span>"
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Filtered suggestions */}
                    {filteredSuggestions.length > 0 && (
                        <>
                            {filteredSuggestions.map((suggestion) => (
                                <div
                                    key={suggestion.id}
                                    className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer group"
                                    onClick={() => handleSuggestionClick(suggestion.query)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Clock className="h-4 w-4 text-gray-400" />
                                            <span className="text-sm">{suggestion.query}</span>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeRecentSearch(suggestion.id);
                                            }}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </>
                    )}

                    {/* All recent searches when input is empty */}
                    {value.length === 0 && recentSearches.length > 0 && (
                        <>
                            <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-600">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                        {t('searchPage').recentSearches}
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={clearRecentSearches}
                                        className="text-xs text-gray-500 hover:text-red-600 h-auto p-1"
                                    >
                                        {t('searchPage').clearAll}
                                    </Button>
                                </div>
                            </div>
                            {recentSearches.slice(0, 10).map((suggestion) => (
                                <div
                                    key={suggestion.id}
                                    className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer group"
                                    onClick={() => handleSuggestionClick(suggestion.query)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Clock className="h-4 w-4 text-gray-400" />
                                            <span className="text-sm">{suggestion.query}</span>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeRecentSearch(suggestion.id);
                                            }}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
