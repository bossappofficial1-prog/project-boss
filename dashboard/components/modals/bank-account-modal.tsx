'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { gooeyToast } from "goey-toast"
import { useMutation } from '@tanstack/react-query'
import { CreditCard, User } from 'lucide-react'
import { businessApi } from '@/lib/api'
import { useDashboardData } from '@/hooks/use-dashboard-data'
import { z } from 'zod'
import {
  ReusableForm,
  type FormFieldConfig,
} from '@/components/ui/reuseable-form'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

const bankSchema = z.object({
  bankName: z.string().min(1, 'Nama bank wajib diisi'),
  bankAccount: z
    .string()
    .min(1, 'Nomor rekening wajib diisi')
    .regex(/^\d+$/, 'Nomor rekening hanya boleh angka')
    .min(6, 'Nomor rekening terlalu pendek')
    .max(20, 'Nomor rekening terlalu panjang'),
  accountHolder: z.string().min(1, 'Nama pemilik rekening wajib diisi'),
})

type BankFormValues = z.infer<typeof bankSchema>

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  businessId?: string
  createPayload?: {
    name: string
    description?: string
    defaultTransactionFeeBearer: 'CUSTOMER' | 'OWNER'
  }
  onSuccess?: () => void
}

export default function BankAccountModal({
  open,
  onOpenChange,
  businessId,
  createPayload,
  onSuccess,
}: Props) {
  const { business } = useDashboardData()

  const [showBankSuggestions, setShowBankSuggestions] = useState(false)
  const [highlightIndex, setHighlightIndex] = useState(-1)
  const [failedLogos, setFailedLogos] = useState<Record<string, boolean>>({})

  const BANKS: Array<{
    code: string
    name: string
    display: string
    minLength?: number
    maxLength?: number
  }> = require('@/lib/banks.json')

  const BANK_LOGOS: Record<string, string> = require('@/lib/bank-logos.json')

  const { mutate, isPending } = useMutation({
    mutationFn: async (values: BankFormValues) => {
      if (!businessId) {
        if (!createPayload)
          throw new Error('Data profil bisnis tidak lengkap')
        return businessApi.createBusiness({
          name: createPayload.name,
          description: createPayload.description,
          bankName: values.bankName,
          bankAccount: values.bankAccount,
          accountHolder: values.accountHolder,
        })
      }
      return businessApi.updateBankAccount(businessId, {
        bankName: values.bankName,
        bankAccount: values.bankAccount,
        accountHolder: values.accountHolder,
      })
    },
    onSuccess: () => {
      gooeyToast.success('Informasi rekening berhasil disimpan')
      onOpenChange(false)
      onSuccess?.()
    },
    onError: (e: any) =>
      gooeyToast.error(e?.message || 'Gagal menyimpan informasi bank'),
  })

  const defaultValues: BankFormValues = {
    bankName: business?.bankName || '',
    bankAccount: business?.bankAccount || '',
    accountHolder: business?.accountHolder || '',
  }

  const handleSubmit = (values: BankFormValues) => {
    mutate(values)
  }

  const BankNameField = useCallback(
    ({ field }: { field: any }) => {
      const normalizedQuery = field.value?.trim().toLowerCase() || ''
      const POPULAR_COUNT = 5
      const searchList = normalizedQuery
        ? BANKS.filter((b) =>
            `${b.display} ${b.name}`
              .toLowerCase()
              .includes(normalizedQuery)
          )
        : BANKS.slice(0, POPULAR_COUNT)

      const filteredBanks = searchList.sort((a, b) => {
        if (!normalizedQuery) return 0
        const aStarts = `${a.display} ${a.name}`
          .toLowerCase()
          .startsWith(normalizedQuery)
          ? 0
          : 1
        const bStarts = `${b.display} ${b.name}`
          .toLowerCase()
          .startsWith(normalizedQuery)
          ? 0
          : 1
        return aStarts - bStarts
      })

      const isBankValid = !!BANKS.find(
        (b) =>
          b.display.toLowerCase() === field.value?.trim().toLowerCase()
      )

      return (
        <div className="relative">
          <Input
            placeholder="BCA / BNI / Mandiri"
            value={field.value || ''}
            onFocus={() => setShowBankSuggestions(true)}
            onBlur={() =>
              setTimeout(() => {
                setShowBankSuggestions(false)
                setHighlightIndex(-1)
              }, 150)
            }
            onChange={(e) => {
              field.onChange(e.target.value)
              setHighlightIndex(-1)
            }}
            onKeyDown={(e) => {
              if (!showBankSuggestions) return
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setHighlightIndex((i) =>
                  Math.min(i + 1, filteredBanks.length - 1)
                )
              } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setHighlightIndex((i) => Math.max(i - 1, 0))
              } else if (e.key === 'Enter') {
                e.preventDefault()
                const sel =
                  filteredBanks[highlightIndex >= 0 ? highlightIndex : 0]
                if (sel) {
                  field.onChange(sel.display)
                  setShowBankSuggestions(false)
                  setHighlightIndex(-1)
                }
              } else if (e.key === 'Escape') {
                setShowBankSuggestions(false)
                setHighlightIndex(-1)
              }
            }}
            autoComplete="off"
          />

          {showBankSuggestions && filteredBanks.length > 0 && (
            <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-popover shadow-lg overflow-hidden">
              {!isBankValid && field.value && (
                <div className="px-3 pt-2 text-xs text-destructive">
                  Nama bank tidak valid. Pilih dari daftar.
                </div>
              )}
              <div className="max-h-48 overflow-y-auto">
                {filteredBanks.map((b, idx) => (
                  <button
                    key={b.code}
                    type="button"
                    onMouseDown={() => {
                      field.onChange(b.display)
                      setShowBankSuggestions(false)
                      setHighlightIndex(-1)
                    }}
                    className={cn(
                      'w-full text-left px-3 py-2 text-sm flex items-center gap-3 transition-colors',
                      highlightIndex === idx
                        ? 'bg-accent'
                        : 'hover:bg-accent/50'
                    )}
                  >
                    <div className="flex-shrink-0 h-8 w-8 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                      {!failedLogos[b.code] ? (
                        <img
                          src={
                            BANK_LOGOS[b.code] ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(b.display)}&size=64&background=ffffff&color=111827&rounded=true`
                          }
                          alt={b.display}
                          className="h-8 w-8 object-cover"
                          loading="lazy"
                          decoding="async"
                          onError={() =>
                            setFailedLogos((p) => ({
                              ...p,
                              [b.code]: true,
                            }))
                          }
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                          {b.display
                            .split(' ')
                            .map((s) => s[0])
                            .slice(0, 2)
                            .join('')}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {b.display}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {b.name}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {b.code}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )
    },
    [BANKS, BANK_LOGOS, showBankSuggestions, highlightIndex, failedLogos]
  )

  const fields: FormFieldConfig<BankFormValues>[] = useMemo(
    () => [
      {
        name: 'bankName',
        label: 'Nama Bank',
        type: 'custom' as const,
        colSpan: 'full' as const,
        renderCustom: BankNameField,
      },
      {
        name: 'bankAccount',
        label: 'Nomor Rekening',
        type: 'text' as const,
        placeholder: '1234567890',
        icon: CreditCard,
        colSpan: 'full' as const,
      },
      {
        name: 'accountHolder',
        label: 'Nama Pemilik Rekening',
        type: 'text' as const,
        placeholder: 'Nama sesuai buku tabungan',
        icon: User,
        colSpan: 'full' as const,
      },
    ],
    [BankNameField]
  )

  return (
    <ReusableForm<BankFormValues>
      schema={bankSchema}
      fields={fields}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      isLoading={isPending}
      submitText="Simpan"
      gridCols={1}
      withDialog
      isDialogOpen={open}
      onDialogOpenChange={onOpenChange}
      dialogTitle="Informasi Pemilik Rekening"
      dialogDescription={
        businessId
          ? 'Perbarui data rekening untuk penarikan dana.'
          : 'Lengkapi data rekening untuk penarikan dana.'
      }
      resetFormOnClose
    />
  )
}
