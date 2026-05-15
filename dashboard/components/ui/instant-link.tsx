'use client'

import React from 'react'
import Link from 'next/link'
import { useInstantNavigation } from '@/hooks/useInstantNavigation'

interface InstantLinkProps
    extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
    href: string
    children: React.ReactNode
    useTransition?: boolean
}

/**
 * Drop-in replacement for Link that provides instant visual feedback
 * Use this instead of Next.js Link when you want instant loading indication
 */
export function InstantLink({
    href,
    children,
    onClick,
    useTransition: useTransitionMode = true,
    ...props
}: InstantLinkProps) {
    const { push, prefetch } = useInstantNavigation()

    if (!useTransitionMode) {
        // Fallback to regular Link
        return (
            <Link href={href} {...props}>
                {children}
            </Link>
        )
    }

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault()
        onClick?.(e)
        push(href)
    }

    const handleMouseEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
        props.onMouseEnter?.(e)
        prefetch(href)
    }

    return (
        <a
            href={href}
            onClick={handleClick}
            onMouseEnter={handleMouseEnter}
            {...props}
        >
            {children}
        </a>
    )
}
