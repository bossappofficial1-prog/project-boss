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
            className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-full text-[0.66rem] transition-colors ${highlight
                ? "bg-primary text-white shadow-md hover:brightness-95"
                : "text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/6"
                }`}
        >
            <span className="inline-flex">{children}</span>
            <span className="sr-only">{label}</span>
        </Link>
    )
}