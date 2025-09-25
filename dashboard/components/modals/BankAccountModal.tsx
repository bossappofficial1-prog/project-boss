'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useMutation } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { businessApi } from '@/lib/api'
import { useDashboardData } from '@/hooks/useDashboardData'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  businessId?: string
  // When creating a new business, we need basic fields from step 1
  createPayload?: { name: string; description?: string; defaultTransactionFeeBearer: 'CUSTOMER' | 'OWNER' }
  onSuccess?: () => void
}

export default function BankAccountModal({ open, onOpenChange, businessId, createPayload, onSuccess }: Props) {
  const { business } = useDashboardData()
  const [bankName, setBankName] = useState<string>('')
  const [bankAccount, setBankAccount] = useState<string>('')
  const [accountHolder, setAccountHolder] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [showBankSuggestions, setShowBankSuggestions] = useState(false)
  const [accountError, setAccountError] = useState<string | null>(null)
  const [highlightIndex, setHighlightIndex] = useState<number>(-1)
  const BANK_LOGOS: Record<string, string> = require('@/data/bank_logos.json')
  const [failedLogos, setFailedLogos] = useState<Record<string, boolean>>({})


  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
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
      toast.success('Informasi rekening berhasil disimpan')
    },
    onError: (e: any) => setError(e?.message || 'Gagal menyimpan informasi bank')
  })


  const BANKS: Array<{ code: string; name: string; display: string; minLength?: number; maxLength?: number }> = require('@/data/banks.json')

  const normalizedQuery = bankName.trim().toLowerCase()
  const POPULAR_COUNT = 5
  const searchList = normalizedQuery
    ? BANKS.filter((b) => `${b.display} ${b.name}`.toLowerCase().includes(normalizedQuery))
    : BANKS.slice(0, POPULAR_COUNT)

  const filteredBanks = searchList
    // sort: exact/prefix matches first when searching
    .sort((a, b) => {
      if (!normalizedQuery) return 0
      const aStarts = `${a.display} ${a.name}`.toLowerCase().startsWith(normalizedQuery) ? 0 : 1
      const bStarts = `${b.display} ${b.name}`.toLowerCase().startsWith(normalizedQuery) ? 0 : 1
      return aStarts - bStarts
    })

  const validateAccountNumber = (value: string) => {
    if (!value) return 'Nomor rekening harus diisi'
    if (!/^\d+$/.test(value)) return 'Nomor rekening hanya boleh berisi angka'
    if (value.length < 6) return 'Nomor rekening terlalu pendek'
    if (value.length > 20) return 'Nomor rekening terlalu panjang'
    return null
  }

  useEffect(() => {
    setAccountError(validateAccountNumber(bankAccount))
  }, [bankAccount])

  // validate bankName against available banks
  const isBankValid = !!BANKS.find((b) => b.display.toLowerCase() === bankName.trim().toLowerCase())


  useEffect(() => {
    if (!open || !businessId || !business) return;

    setBankName(business?.bankName!)
    setAccountHolder(business?.accountHolder!)
    setBankAccount(business?.bankAccount!)
  }, [open, businessId, business])

  if (!open) return;

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
            <div className="relative">
              <Input
                id="bank-name"
                placeholder="BCA / BNI / Mandiri"
                value={bankName}
                onFocus={() => setShowBankSuggestions(true)}
                onBlur={() => setTimeout(() => { setShowBankSuggestions(false); setHighlightIndex(-1) }, 150)}
                onChange={(e) => { setBankName(e.target.value); setHighlightIndex(-1) }}
                onKeyDown={(e) => {
                  if (!showBankSuggestions) return
                  if (e.key === 'ArrowDown') {
                    e.preventDefault()
                    setHighlightIndex((i) => Math.min(i + 1, filteredBanks.length - 1))
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault()
                    setHighlightIndex((i) => Math.max(i - 1, 0))
                  } else if (e.key === 'Enter') {
                    e.preventDefault()
                    const sel = filteredBanks[highlightIndex >= 0 ? highlightIndex : 0]
                    if (sel) { setBankName(sel.display); setShowBankSuggestions(false); setHighlightIndex(-1) }
                  } else if (e.key === 'Escape') {
                    setShowBankSuggestions(false); setHighlightIndex(-1)
                  }
                }}
                autoComplete="off"
              />
              {/* Selected bank badge */}
              {bankName && (
                <div className="absolute -top-3 right-0">
                  <div className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                    <span className="font-medium">{bankName}</span>
                  </div>
                </div>
              )}
              {showBankSuggestions && filteredBanks.length > 0 && (
                <div className="absolute z-50 mt-1 w-full rounded-lg border bg-white/95 dark:bg-gray-800/95 shadow-lg overflow-hidden border-gray-200 dark:border-gray-700">
                  {/* bank validation error moved above list for better visibility */}
                  {!isBankValid && bankName && (
                    <div className="px-3 pt-2 text-xs text-red-600 dark:text-red-400">Nama bank tidak valid. Pilih dari daftar yang tersedia.</div>
                  )}
                  <div className="max-h-48 overflow-y-auto">{/* compact list */}
                    {filteredBanks.map((b, idx) => (
                      <button
                        key={b.code}
                        type="button"
                        onMouseDown={() => { setBankName(b.display); setShowBankSuggestions(false); setHighlightIndex(-1) }}
                        className={`w-full text-left px-3 py-2 text-sm flex items-center gap-3 transition-colors ${highlightIndex === idx ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
                      >
                        {/* bank logo with lazy loading and onError fallback */}
                        <div className="flex-shrink-0 h-8 w-8 rounded-full overflow-hidden bg-white dark:bg-gray-700 flex items-center justify-center">
                          {!failedLogos[b.code] ? (
                            <img
                              src={BANK_LOGOS[b.code] || `https://ui-avatars.com/api/?name=${encodeURIComponent(b.display)}&size=64&background=ffffff&color=111827&rounded=true`}
                              alt={b.display}
                              className="h-8 w-8 object-cover"
                              loading="lazy"
                              decoding="async"
                              onError={() => setFailedLogos((p) => ({ ...p, [b.code]: true }))}
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                              {b.display.split(' ').map(s => s[0]).slice(0, 2).join('')}
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-sm text-gray-900 dark:text-gray-100">{b.display}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{b.name}</div>
                        </div>
                        <div className="text-xs text-gray-400 dark:text-gray-300">{b.code}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div>
            <Label htmlFor="bank-account">Nomor Rekening</Label>
            <Input id="bank-account" placeholder="1234567890" value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} className={accountError ? 'border-red-500' : ''} />
            {accountError && <div className="text-xs text-red-600 mt-1">{accountError}</div>}
            {/* show bank-specific helper if bank matched */}
            {bankName && (() => {
              const matched = BANKS.find((b) => b.display.toLowerCase() === bankName.toLowerCase())
              if (matched) {
                return <div className="text-xs text-gray-500 mt-1">Panjang nomor untuk {matched.display}: {matched.minLength ?? '—'}–{matched.maxLength ?? '—'} digit</div>
              }
              return null
            })()}
          </div>
          <div>
            <Label htmlFor="account-holder">Nama Pemilik Rekening</Label>
            <Input id="account-holder" placeholder="Nama sesuai buku tabungan" value={accountHolder} onChange={(e) => setAccountHolder(e.target.value)} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={isPending}>Batal</Button>
            <Button onClick={() => mutate()} disabled={isPending || !bankName || !!accountError || !accountHolder || !isBankValid}>{isPending ? 'Menyimpan...' : 'Simpan'}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
