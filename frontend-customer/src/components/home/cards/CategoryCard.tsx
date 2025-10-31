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
            className="group flex flex-col gap-2 rounded-md border border-border/60 bg-card p-4 transition hover:border-primary/50 hover:shadow-md"
        >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
            </span>
            <span className="text-sm font-semibold text-foreground">{category.title}</span>
            {category.description && (
                <span className="text-xs leading-snug text-muted-foreground line-clamp-2">{category.description}</span>
            )}
        </Link>
    )
}

export default React.memo(CategoryCard)
