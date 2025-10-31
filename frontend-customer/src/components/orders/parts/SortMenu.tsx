"use client"

import { ArrowUpDown, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { useTranslations } from "@/hooks/useI18n"

export type SortOption = 'newest' | 'oldest' | 'price-high' | 'price-low'

interface SortMenuProps {
    value: SortOption
    onChange: (value: SortOption) => void
}

export default function SortMenu({ value, onChange }: SortMenuProps) {
    const t = useTranslations('orders')

    const sortOptions: { value: SortOption; label: string }[] = [
        { value: 'newest', label: t('sort.newest') },
        { value: 'oldest', label: t('sort.oldest') },
        { value: 'price-high', label: t('sort.priceHigh') },
        { value: 'price-low', label: t('sort.priceLow') },
    ]

    const currentLabel = sortOptions.find(opt => opt.value === value)?.label || sortOptions[0].label

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 h-10 rounded-md">
                    <ArrowUpDown className="w-4 h-4" />
                    <span className="hidden sm:inline">{currentLabel}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                {sortOptions.map((option) => (
                    <DropdownMenuItem
                        key={option.value}
                        onClick={() => onChange(option.value)}
                        className="flex items-center justify-between cursor-pointer"
                    >
                        <span>{option.label}</span>
                        {value === option.value && (
                            <Check className="w-4 h-4 text-primary" />
                        )}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
