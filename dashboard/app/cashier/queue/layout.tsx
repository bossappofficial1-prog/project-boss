import { Toaster } from 'sonner'

export default function CashierQueueLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {children}
      <Toaster position="top-right" richColors />
    </>
  )
}
