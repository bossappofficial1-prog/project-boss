'use client'

import { z } from 'zod'
import { ReusableForm, FormFieldConfig } from '@/components/ui/reuseable-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { outletTransferApi } from '@/lib/api'
import { toast } from 'sonner'

const transferSchema = z.object({
  receiverEmail: z.string().email('Format email tidak valid'),
  note: z.string().optional(),
})

type TransferFormValues = z.infer<typeof transferSchema>

interface TransferOutletDialogProps {
  outletId: string
  outletName: string
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function TransferOutletDialog({ outletId, outletName, isOpen, onOpenChange }: TransferOutletDialogProps) {
  const queryClient = useQueryClient()

  const { mutateAsync: createTransfer } = useMutation({
    mutationFn: (values: TransferFormValues) => outletTransferApi.createRequest(outletId, values),
    onSuccess: (res) => {
      toast.success(res.message || 'Permintaan transfer berhasil dikirim')
      queryClient.invalidateQueries({ queryKey: ['outlet-transfers', 'outgoing'] })
      onOpenChange(false)
    },
  })

  const fields: FormFieldConfig<TransferFormValues>[] = [
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
  ]

  return (
    <ReusableForm
      schema={transferSchema}
      defaultValues={{ receiverEmail: '', note: '' }}
      fields={fields}
      onSubmit={createTransfer}
      withDialog
      isDialogOpen={isOpen}
      onDialogOpenChange={onOpenChange}
      dialogTitle="Transfer Kepemilikan Outlet"
      dialogDescription={`Anda akan mengirim permintaan transfer untuk "${outletName}". Setelah diterima oleh penerima, Anda akan kehilangan akses ke outlet ini.`}
      submitText="Kirim Permintaan"
      loadingText="Mengirim..."
    />
  )
}
