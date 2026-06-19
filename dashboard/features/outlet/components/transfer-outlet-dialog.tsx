'use client'

import { useMemo } from 'react'
import { z } from 'zod'
import { ReusableForm, FormFieldConfig } from '@/components/ui/reuseable-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { outletTransferApi } from '@/lib/api'
import { gooeyToast } from "goey-toast"
import { useOutletStore } from '@/stores/outlet.store'

const transferSchema = z.object({
  outletId: z.string().min(1, 'Outlet wajib dipilih'),
  receiverEmail: z.string().email('Format email tidak valid'),
  note: z.string().optional(),
})

type TransferFormValues = z.infer<typeof transferSchema>

interface TransferOutletDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function TransferOutletDialog({ isOpen, onOpenChange }: TransferOutletDialogProps) {
  const queryClient = useQueryClient()
  const { outlets } = useOutletStore()

  const { mutateAsync: createTransfer } = useMutation({
    mutationFn: (values: TransferFormValues) => {
      const { outletId, ...data } = values
      return outletTransferApi.createRequest(outletId, data)
    },
    onSuccess: (res) => {
      gooeyToast.success(res.message || 'Permintaan transfer berhasil dikirim')
      queryClient.invalidateQueries({ queryKey: ['outlet-transfers', 'outgoing'] })
      onOpenChange(false)
    },
    onError: (err: any) => {
      gooeyToast.error(err.response?.data?.message || 'Gagal mengirim permintaan transfer')
    },
  })

  const fields = useMemo<FormFieldConfig<TransferFormValues>[]>(() => [
    {
      name: 'outletId',
      label: 'Outlet yang akan Ditransfer',
      type: 'select',
      options: (outlets || []).map((outlet) => ({
        label: outlet.name,
        value: outlet.id,
      })),
      placeholder: 'Pilih outlet...',
      description: 'Pilih outlet Anda yang ingin ditransfer kepemilikannya.',
    },
    {
      name: 'receiverEmail',
      label: 'Email Penerima',
      type: 'email',
      placeholder: 'email@contoh.com',
      description: 'Pastikan email ini terdaftar dan memiliki profil bisnis.',
    },
    {
      name: 'note',
      label: 'Catatan (Opsional)',
      type: 'textarea',
      placeholder: 'Alasan transfer atau pesan untuk penerima...',
    },
  ], [outlets])

  return (
    <ReusableForm
      schema={transferSchema}
      defaultValues={{ outletId: '', receiverEmail: '', note: '' }}
      fields={fields}
      onSubmit={createTransfer}
      withDialog
      isDialogOpen={isOpen}
      onDialogOpenChange={onOpenChange}
      dialogTitle="Transfer Kepemilikan Outlet"
      dialogDescription="Kirim permintaan transfer outlet ke pengguna lain. Setelah diterima oleh penerima, Anda akan kehilangan akses ke outlet tersebut secara permanen."
      submitText="Kirim Permintaan"
      loadingText="Mengirim..."
    />
  )
}
