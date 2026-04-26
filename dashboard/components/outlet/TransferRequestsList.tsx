'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { outletTransferApi } from '@/lib/api'
import { DataTable } from '@/components/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { Check, X, Ban, Clock, ArrowRightLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export function TransferRequestsList() {
  const queryClient = useQueryClient()

  const { data: incoming, isLoading: loadingIncoming } = useQuery({
    queryKey: ['outlet-transfers', 'incoming'],
    queryFn: () => outletTransferApi.getIncoming(),
  })

  const { data: outgoing, isLoading: loadingOutgoing } = useQuery({
    queryKey: ['outlet-transfers', 'outgoing'],
    queryFn: () => outletTransferApi.getOutgoing(),
  })

  const { mutate: accept } = useMutation({
    mutationFn: (id: string) => outletTransferApi.accept(id),
    onSuccess: () => {
      toast.success('Transfer outlet berhasil diterima')
      queryClient.invalidateQueries({ queryKey: ['outlet-transfers'] })
      queryClient.invalidateQueries({ queryKey: ['outlets'] })
    },
    onError: (err: any) => toast.error(err.message || 'Gagal menerima transfer'),
  })

  const { mutate: reject } = useMutation({
    mutationFn: (id: string) => outletTransferApi.reject(id),
    onSuccess: () => {
      toast.success('Transfer outlet ditolak')
      queryClient.invalidateQueries({ queryKey: ['outlet-transfers'] })
    },
    onError: (err: any) => toast.error(err.message || 'Gagal menolak transfer'),
  })

  const { mutate: cancel } = useMutation({
    mutationFn: (id: string) => outletTransferApi.cancel(id),
    onSuccess: () => {
      toast.success('Permintaan transfer dibatalkan')
      queryClient.invalidateQueries({ queryKey: ['outlet-transfers'] })
    },
    onError: (err: any) => toast.error(err.message || 'Gagal membatalkan transfer'),
  })

  const incomingColumns: ColumnDef<any>[] = [
    {
      accessorKey: 'outlet.name',
      header: 'Outlet',
      cell: ({ row }) => <span className="font-bold text-foreground">{row.original.outlet.name}</span>,
    },
    {
      accessorKey: 'sender.name',
      header: 'Pengirim',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium text-sm">{row.original.sender.name}</span>
          <span className="text-[10px] text-muted-foreground font-mono">{row.original.sender.email}</span>
        </div>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Tanggal',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground font-medium">
          {format(new Date(row.original.createdAt), 'dd MMM yyyy, HH:mm')}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Aksi',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] uppercase tracking-wider"
            onClick={() => accept(row.original.id)}
          >
            <Check className="mr-1.5 h-3.5 w-3.5" />
            Terima
          </Button>
          <Button
            size="sm"
            variant="destructive"
            className="h-8 px-3 font-bold text-[10px] uppercase tracking-wider"
            onClick={() => reject(row.original.id)}
          >
            <X className="mr-1.5 h-3.5 w-3.5" />
            Tolak
          </Button>
        </div>
      ),
    },
  ]

  const outgoingColumns: ColumnDef<any>[] = [
    {
      accessorKey: 'outlet.name',
      header: 'Outlet',
      cell: ({ row }) => <span className="font-bold text-foreground">{row.original.outlet.name}</span>,
    },
    {
      accessorKey: 'receiver.name',
      header: 'Penerima',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium text-sm">{row.original.receiver.name}</span>
          <span className="text-[10px] text-muted-foreground font-mono">{row.original.receiver.email}</span>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status
        const variants: any = {
          PENDING: 'warning',
          ACCEPTED: 'success',
          REJECTED: 'destructive',
          CANCELLED: 'outline',
        }
        return (
          <Badge variant={variants[status] || 'outline'} className="uppercase text-[9px] font-black tracking-tighter px-2 py-0">
            {status}
          </Badge>
        )
      },
    },
    {
      id: 'actions',
      header: 'Aksi',
      cell: ({ row }) => (
        row.original.status === 'PENDING' && (
          <Button
            size="sm"
            variant="outline"
            className="h-8 px-3 font-bold text-[10px] uppercase tracking-wider border-border/60 hover:bg-muted/50"
            onClick={() => cancel(row.original.id)}
          >
            <Ban className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
            Batal
          </Button>
        )
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {incoming && incoming.length > 0 && (
        <Card className="border-border/80 gap-0 py-0 shadow-sm overflow-hidden rounded-md">
          <CardHeader className="bg-muted/30 border-b border-border/40 py-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-md bg-amber-500/10 text-amber-600 flex items-center justify-center border border-amber-500/20">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-sm font-black uppercase tracking-widest">Transfer Masuk</CardTitle>
                <CardDescription className="text-[10px] font-medium">Permintaan transfer yang membutuhkan persetujuan Anda.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <DataTable
              columns={incomingColumns}
              data={incoming}
              tableId="incoming-transfers"
              isLoading={loadingIncoming}
              emptyMessage="Tidak ada permintaan transfer masuk."
            />
          </CardContent>
        </Card>
      )}

      <Card className="border-border/80 gap-0 py-0 shadow-sm overflow-hidden rounded-md">
        <CardHeader className="bg-muted/30 border-b border-border/40 py-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-md bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
              <ArrowRightLeft className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-sm font-black uppercase tracking-widest">Riwayat Transfer Keluar</CardTitle>
              <CardDescription className="text-[10px] font-medium">Daftar outlet yang Anda transfer ke pengguna lain.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={outgoingColumns}
            data={outgoing || []}
            tableId="outgoing-transfers"
            isLoading={loadingOutgoing}
            emptyMessage="Anda belum pernah mengirim permintaan transfer."
          />
        </CardContent>
      </Card>
    </div>
  )
}
