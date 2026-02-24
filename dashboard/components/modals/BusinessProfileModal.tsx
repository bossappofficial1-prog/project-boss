'use client'

import React, { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { businessApi } from '@/lib/api'
import { Textarea } from '../ui/textarea'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  businessId?: string
  onSuccess?: () => void
  onCreateRequested?: (data: { name: string; description?: string; defaultTransactionFeeBearer: 'CUSTOMER' | 'OWNER' }) => void
  // For update mode, allow prefilling values from existing business
  initialName?: string
  initialDescription?: string
  initialDefaultTransactionFeeBearer?: 'CUSTOMER' | 'OWNER'
}

export default function BusinessProfileModal({ open, onOpenChange, businessId, onSuccess, onCreateRequested, initialName, initialDescription, initialDefaultTransactionFeeBearer }: Props) {
  const [name, setName] = useState(initialName ?? '')
  const [description, setDescription] = useState(initialDescription ?? '')
  const [defaultTransactionFeeBearer, setDefaultTransactionFeeBearer] = useState<'CUSTOMER' | 'OWNER'>(initialDefaultTransactionFeeBearer ?? 'CUSTOMER')
  const [error, setError] = useState<string | null>(null)

  // Sync form values when opening in update mode or when initial props change
  // Ensures edit flow shows current values
  React.useEffect(() => {
    if (open) {
      setName(initialName ?? '')
      setDescription(initialDescription ?? '')
      setDefaultTransactionFeeBearer(initialDefaultTransactionFeeBearer ?? 'CUSTOMER')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialName, initialDescription, initialDefaultTransactionFeeBearer])

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      // only used for update flow; create flow is delegated to parent
      // Note: defaultTransactionFeeBearer is only applicable during creation (handled in BankAccountModal)
      // For update, backend expects basic fields only
      return businessApi.updateBusiness(businessId!, { name, description })
    },
    onSuccess: () => {
      onOpenChange(false)
      onSuccess?.()
    },
    onError: (e: any) => setError(e?.message || 'Gagal menyimpan profil bisnis')
  })

  const handleSubmit = () => {
    setError(null)
    if (!name) {
      setError('Nama bisnis wajib diisi')
      return
    }
    if (businessId) {
      mutate()
      return
    }
    // Create flow: delegate to parent to continue with bank info step
    onCreateRequested?.({ name, description, defaultTransactionFeeBearer })
    onOpenChange(false)
    onSuccess?.()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-xl max-h-[80vh] overflow-y-auto overflow-x-hidden">
        <DialogHeader>
          <DialogTitle>Lengkapi Profil Bisnis</DialogTitle>
          <DialogDescription>Isi informasi dasar bisnis Anda.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {error && (
            <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 px-3 py-2 text-sm">{error}</div>
          )}
          <div>
            <Label htmlFor="business-name">Nama Bisnis</Label>
            <Input id="business-name" placeholder="Contoh: Laundry Bersih Jaya" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="business-desc">Deskripsi</Label>
            <Textarea id="business-desc" placeholder="Deskripsi singkat bisnis Anda" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={isPending}>Batal</Button>
            <Button onClick={handleSubmit} disabled={isPending || !name}>{isPending ? 'Menyimpan...' : 'Lanjut'}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
