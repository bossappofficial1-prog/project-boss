'use client'

import { type ReactNode } from 'react'

import { ConfirmDialog } from '@/components/ui/confirm-dialog'

type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'

interface ConfirmationModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    title: ReactNode
    description?: ReactNode
    confirmText?: ReactNode
    cancelText?: ReactNode
    confirmVariant?: ButtonVariant
    cancelVariant?: ButtonVariant
    onConfirm?: () => void | boolean | Promise<void | boolean>
    onCancel?: () => void
    icon?: ReactNode
    loading?: boolean
    hideCancel?: boolean
    disableAutoClose?: boolean
    children?: ReactNode
    showCloseButton?: boolean
    align?: 'left' | 'center'
    contentClassName?: string
    headerClassName?: string
    bodyClassName?: string
    footerClassName?: string
    confirmDisabled?: boolean
    confirmLoadingLabel?: ReactNode
}

export default function ConfirmationModal({
    open,
    onOpenChange,
    title,
    description,
    confirmText = 'Konfirmasi',
    cancelText = 'Batal',
    confirmVariant = 'default',
    cancelVariant = 'outline',
    onConfirm,
    onCancel,
    icon,
    loading = false,
    hideCancel,
    disableAutoClose = true,
    children,
    showCloseButton,
    align = 'center',
    contentClassName,
    headerClassName,
    bodyClassName,
    footerClassName,
    confirmDisabled,
    confirmLoadingLabel,
}: ConfirmationModalProps) {
    return (
        <ConfirmDialog
            open={open}
            onOpenChange={onOpenChange}
            title={title}
            description={description}
            icon={icon}
            confirmLabel={confirmText}
            confirmVariant={confirmVariant}
            confirmDisabled={confirmDisabled}
            confirmLoading={loading}
            confirmLoadingLabel={confirmLoadingLabel}
            onConfirm={onConfirm}
            preventCloseOnConfirm={disableAutoClose}
            cancelLabel={cancelText}
            cancelVariant={cancelVariant}
            hideCancel={hideCancel}
            onCancel={onCancel}
            showCloseButton={showCloseButton}
            align={align}
            contentClassName={contentClassName}
            headerClassName={headerClassName}
            bodyClassName={bodyClassName}
            footerClassName={footerClassName}
        >
            {children}
        </ConfirmDialog>
    )
}