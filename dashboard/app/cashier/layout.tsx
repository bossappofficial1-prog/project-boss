'use client'

import { SocketProvider } from '@/components/providers/SocketProvider'
import { Toaster } from 'sonner'

/**
 * Layout khusus kasir - SocketProvider akan menerima outletId dari page
 * karena kasir tidak menggunakan OutletProvider global
 */
export default function CashierLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 5000,
        }}
      />
    </>
  )
}
