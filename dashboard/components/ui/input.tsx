'use client'

import * as React from 'react'
import { clsx } from 'clsx'

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={clsx(
        'w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-2.5 text-sm outline-none transition-all',
        'focus:border-red-500 focus:ring-0',
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
        'w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-2.5 text-sm outline-none transition-all min-h-28',
        'focus:border-red-500 focus:ring-0',
        className
      )}
      {...props}
    />
  )
)
Textarea.displayName = 'Textarea'
