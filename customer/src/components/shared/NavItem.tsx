import Link from "next/link"
import React from "react"

type NavItemProps = {
    href: string,
    label: string,
    children: React.ReactNode,
    ariaLabel?: string,
    highlight?: boolean,
    guideTarget?: string,
}

export function NavItem({
    children,
    href,
    label,
    ariaLabel,
    highlight,
    guideTarget,
}: NavItemProps) {
    return (
        <Link
            href={href}
            aria-label={ariaLabel ?? label}
            data-guide-target={guideTarget}
            className={`
                relative flex flex-col items-center justify-center gap-1
                px-3 py-2.5 rounded-xl text-xs font-semibold
                transition-all duration-300 ease-in-out select-none
                ${highlight
                    ? "text-primary scale-105"
                    : "text-muted-foreground hover:text-foreground active:scale-95"
                }
            `}
        >
            <span className="inline-flex relative z-10 transition-transform duration-300">{children}</span>
            <span className="hidden md:block relative z-10">{label}</span>
            {highlight && (
                <span className="absolute bottom-1 w-1.5 h-1.5 bg-primary rounded-full animate-in zoom-in-50 duration-300" />
            )}
        </Link>
    )
}