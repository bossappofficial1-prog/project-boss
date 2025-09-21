'use client'

import * as React from 'react'
import { clsx } from 'clsx'

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={clsx('block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5', className)} {...props} />
  )
}
