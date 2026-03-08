"use client"

import React from 'react'
import Link from 'next/link'
import { LayoutGrid, UtensilsCrossed, CupSoda, ShoppingBag, Sparkles, type LucideIcon } from 'lucide-react'
import type { HomeCategory } from '@/types/home'

const categoryIcons: Record<string, LucideIcon> = {
    food: UtensilsCrossed,
    drink: CupSoda,
    shop: ShoppingBag,
    service: Sparkles,
}

interface CategoryCardProps {
    category: HomeCategory
}

function CategoryCard({ category }: CategoryCardProps) {
    const Icon = categoryIcons[category.slug] ?? LayoutGrid
    return (
        <Link
            href={`/search?q=${encodeURIComponent(category.slug)}`}
            className="flex flex-none flex-col items-center gap-1.5 px-3 py-2 rounded-xl transition-colors hover:bg-muted/50 active:scale-95 min-w-[72px]"
        >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
            </span>
            <span className="line-clamp-1 text-center text-xs font-medium leading-tight text-foreground">{category.title}</span>
        </Link>
    )
}

export default React.memo(CategoryCard)
