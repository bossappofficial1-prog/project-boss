'use client'

import ConfirmationModal from '@/components/ui/confirmation-modal'

type BackNavigationConfirmModalProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    onConfirm: () => void
    onCancel: () => void
}

export default function BackNavigationConfirmModal({
    open,
    onOpenChange,
    onConfirm,
    onCancel
}: BackNavigationConfirmModalProps) {
    return (
        <ConfirmationModal
            open={open}
            onOpenChange={onOpenChange}
            title="Konfirmasi Kembali"
            description="Anda akan kembali ke awal proses registrasi dan kehilangan kode verifikasi yang sudah dikirim. Apakah Anda yakin ingin melanjutkan?"
            confirmText="Ya, Kembali"
            cancelText="Batal"
            confirmVariant="destructive"
            onConfirm={onConfirm}
            onCancel={onCancel}
            icon={
                <svg className="h-8 w-8 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
            }
        />
    )
}