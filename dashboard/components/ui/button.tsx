'use client'

import * as React from 'react'
import { clsx } from 'clsx'

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

export function Button({ className, variant = 'primary', size = 'md', ...props }: ButtonProps) {
  const base = 'inline-flex items-center justify-center rounded-xl font-semibold transition-all focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed'
  const variants: Record<string, string> = {
    primary: 'bg-red-600 hover:bg-red-700 text-white shadow-md px-4 py-2',
    secondary: 'bg-white border border-gray-200 hover:border-gray-300 text-gray-700 px-4 py-2',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 px-3 py-2'
  }
  const sizes: Record<string, string> = {
    sm: 'text-sm h-9',
    md: 'text-sm h-10',
    lg: 'text-base h-11'
  }
  return <button className={clsx(base, variants[variant], sizes[size], className)} {...props} />
}
