'use client'

import * as React from 'react'
import { clsx } from 'clsx'

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={clsx(
        'w-full rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-sm outline-none transition-all',
        'text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400',
        'focus:border-red-500 dark:focus:border-red-400 focus:ring-0',
        className
      )}
      {...props}
    />
  )
)
Input.displayName = 'Input'

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={clsx(
        'w-full rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-sm outline-none transition-all min-h-28',
        'text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400',
        'focus:border-red-500 dark:focus:border-red-400 focus:ring-0',
        className
      )}
      {...props}
    />
  )
)
Textarea.displayName = 'Textarea'
