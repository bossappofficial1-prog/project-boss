import Link from "next/link"
import React from "react"

type NavItemProps = {
    href: string,
    label: string,
    children: React.ReactNode,
    ariaLabel?: string,
    highlight?: boolean,
}

export function NavItem({
    children,
    href,
    label,
    ariaLabel,
    highlight
}: NavItemProps) {
    return (
        <Link
            href={href}
            aria-label={ariaLabel ?? label}
            className={`
                flex flex-col items-center justify-center gap-1.5 
                p-2 rounded-xl text-xs font-medium
                transition-all duration-200 ease-in-out
                ${highlight
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }
            `}
        >
            <span className="inline-flex">{children}</span>
            <span className="hidden md:block">{label}</span>
        </Link>
    )
}