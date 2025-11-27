"use client"

import { ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface DateGroupHeaderProps {
    label: string
    count: number
    isCollapsed?: boolean
    onToggle?: () => void
}

export default function DateGroupHeader({ label, count, isCollapsed = false, onToggle }: DateGroupHeaderProps) {
    return (
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <Button
                variant="ghost"
                className={cn(
                    "w-full justify-between hover:bg-muted/50 px-4 py-6 h-auto rounded-md",
                    "border-b border-border"
                )}
                onClick={onToggle}
            >
                <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm">{label}</h3>
                    <span className="text-xs text-muted-foreground">({count})</span>
                </div>
                {onToggle && (
                    <ChevronDown
                        className={cn(
                            "w-4 h-4 text-muted-foreground transition-transform duration-200",
                            isCollapsed && "-rotate-90"
                        )}
                    />
                )}
            </Button>
        </div>
    )
}
