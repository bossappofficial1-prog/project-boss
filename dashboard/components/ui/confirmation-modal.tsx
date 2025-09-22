'use client'

import { ReactNode } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface ConfirmationModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    title: string
    description: string | ReactNode
    confirmText?: string
    cancelText?: string
    confirmVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
    onConfirm: () => void
    onCancel?: () => void
    icon?: ReactNode
    loading?: boolean
}

export default function ConfirmationModal({
    open,
    onOpenChange,
    title,
    description,
    confirmText = 'Konfirmasi',
    cancelText = 'Batal',
    confirmVariant = 'default',
    onConfirm,
    onCancel,
    icon,
    loading = false,
}: ConfirmationModalProps) {
    const handleCancel = () => {
        if (onCancel) {
            onCancel()
        } else {
            onOpenChange(false)
        }
    }

    const handleConfirm = () => {
        onConfirm()
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    {icon && (
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
                            {icon}
                        </div>
                    )}
                    <DialogTitle className="text-center font-poppins">
                        {title}
                    </DialogTitle>
                    <DialogDescription className="text-center font-poppins">
                        {description}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex space-x-2 sm:space-x-2">
                    <Button
                        variant="outline"
                        onClick={handleCancel}
                        disabled={loading}
                        className="flex-1 font-poppins"
                    >
                        {cancelText}
                    </Button>
                    <Button
                        variant={confirmVariant}
                        onClick={handleConfirm}
                        disabled={loading}
                        className="flex-1 font-poppins"
                    >
                        {loading ? (
                            <div className="flex items-center">
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Memproses...
                            </div>
                        ) : (
                            confirmText
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}