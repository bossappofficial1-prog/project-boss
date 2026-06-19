'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react'
import { outletManagementApi } from '@/lib/api'
import { GooeyToaster, gooeyToast } from "goey-toast"
import type { Outlet } from '@/types/dashboard'
import { AxiosError } from 'axios'
import { useTwoFactorGate } from '@/hooks/use-two-factor-gate'
import { TwoFactorVerifyDialog } from '@/components/ui/two-factor-verify-dialog'

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
    outlet: Outlet | null
    onSuccess?: () => void
}

export default function DeleteOutletModal({ open, onOpenChange, outlet, onSuccess }: Props) {
    const [confirmText, setConfirmText] = useState('')
    const { is2faEnabled, showVerify, require2FA, handleVerified, handleOpenChange } = useTwoFactorGate()

    const { mutateAsync, isPending: isDeleting } = useMutation({
        mutationFn: async () => {
            if (!outlet) {
                throw new Error('Outlet tidak ditemukan')
            }
            console.log('DELETE MUTATION FIRED')
            return outletManagementApi.delete(outlet.id)
        },
        onSuccess: () => {
            gooeyToast.success('Outlet berhasil dihapus!')
            onSuccess?.()
            onOpenChange(false)
            setConfirmText('')
        },
        onError: (e: any) => {
            gooeyToast.error(((e as AxiosError).response?.data as any).message || 'Gagal menghapus outlet. Coba lagi.')
        }
    })

    const handleDelete = async () => {
        if (confirmText !== outlet?.name) {
            gooeyToast.error('Konfirmasi nama outlet tidak sesuai')
            return
        }
        require2FA(() => mutateAsync())
    }

    const handleClose = () => {
        onOpenChange(false)
        setConfirmText('')
    }

    if (!outlet) return null

    return (
        <>
            <TwoFactorVerifyDialog
                open={showVerify}
                onOpenChange={handleOpenChange}
                onVerified={handleVerified}
                title="Verifikasi Hapus Outlet"
                description="Masukkan kode 2FA untuk menghapus outlet ini secara permanen."
            />
            <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center text-xl font-bold text-red-600">
                            <AlertTriangle className="w-6 h-6 mr-2" />
                            Hapus Outlet
                        </DialogTitle>
                        <DialogDescription className="text-gray-600 dark:text-gray-400">
                            Tindakan ini tidak dapat dibatalkan. Semua data terkait outlet ini akan dihapus secara permanen.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <div className="flex items-start space-x-3">
                                <div className="flex-shrink-0">
                                    <Trash2 className="w-5 h-5 text-red-500" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-red-800 dark:text-red-200">
                                        Outlet yang akan dihapus:
                                    </h4>
                                    <p className="text-sm text-red-700 dark:text-red-300 font-semibold mt-1">
                                        {outlet.name}
                                    </p>
                                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                                        {outlet.address}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Ketik nama outlet untuk konfirmasi: <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={confirmText}
                                onChange={(e) => setConfirmText(e.target.value)}
                                placeholder={`Ketik "${outlet.name}"`}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-gray-100"
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Tindakan ini akan menghapus semua produk, pesanan, dan data terkait outlet ini.
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={isDeleting}
                        >
                            Batal
                        </Button>
                        <Button
                            onClick={handleDelete}
                            disabled={isDeleting || confirmText !== outlet.name}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Menghapus...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Hapus Outlet
                                </>
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}