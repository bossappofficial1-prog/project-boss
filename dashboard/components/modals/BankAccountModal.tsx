'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { businessApi } from '@/lib/api'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  businessId?: string
  // When creating a new business, we need basic fields from step 1
  createPayload?: { name: string; description?: string; defaultTransactionFeeBearer: 'CUSTOMER' | 'OWNER' }
  onSuccess?: () => void
}

export default function BankAccountModal({ open, onOpenChange, businessId, createPayload, onSuccess }: Props) {
  const [bankName, setBankName] = useState('')
  const [bankAccount, setBankAccount] = useState('')
  const [accountHolder, setAccountHolder] = useState('')
  const [error, setError] = useState<string | null>(null)

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      // Create new business if businessId is not provided, else update bank info
      if (!businessId) {
        if (!createPayload) throw new Error('Data profil bisnis tidak lengkap')
        return businessApi.createBusiness({
          name: createPayload.name,
          description: createPayload.description,
          defaultTransactionFeeBearer: createPayload.defaultTransactionFeeBearer,
          bankName,
          bankAccount,
          accountHolder,
        })
      }
      // Update existing business bank account
      return businessApi.updateBankAccount(businessId, { bankName, bankAccount, accountHolder })
    },
    onSuccess: () => {
      onOpenChange(false)
      onSuccess?.()
    },
    onError: (e: any) => setError(e?.message || 'Gagal menyimpan informasi bank')
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Informasi Pemilik Rekening</DialogTitle>
          <DialogDescription>
            {businessId ? 'Perbarui' : 'Lengkapi'} data rekening untuk penarikan dana.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {error && (
            <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 px-3 py-2 text-sm">{error}</div>
          )}
          <div>
            <Label htmlFor="bank-name">Nama Bank</Label>
            <Input id="bank-name" placeholder="BCA / BNI / Mandiri" value={bankName} onChange={(e) => setBankName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="bank-account">Nomor Rekening</Label>
            <Input id="bank-account" placeholder="1234567890" value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="account-holder">Nama Pemilik Rekening</Label>
            <Input id="account-holder" placeholder="Nama sesuai buku tabungan" value={accountHolder} onChange={(e) => setAccountHolder(e.target.value)} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={isPending}>Batal</Button>
            <Button onClick={() => mutate()} disabled={isPending || !bankName || !bankAccount || !accountHolder}>{isPending ? 'Menyimpan...' : 'Simpan'}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
