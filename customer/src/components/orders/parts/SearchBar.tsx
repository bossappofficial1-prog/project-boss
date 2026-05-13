"use client"

import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useTranslations } from "@/hooks/useI18n"

interface SearchBarProps {
    value: string
    onChange: (value: string) => void
    placeholder?: string
    className?: string
}

export default function SearchBar({ value, onChange, placeholder, className }: SearchBarProps) {
    const t = useTranslations('orders')

    const handleClear = () => {
        onChange('')
    }

    return (
        <div className={cn("relative flex items-center gap-2", className)}>
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder || t('search.placeholder')}
                    className="pl-9 pr-9 h-10 text-sm rounded-md"
                />
                {value && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClear}
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 hover:bg-muted"
                    >
                        <X className="w-4 h-4" />
                    </Button>
                )}
            </div>
        </div>
    )
}
