'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import OperatingHoursManager from '@/components/ui/operating-hours-manager'

interface OperatingHoursModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    outletId: string
    outletName?: string
}

export default function OperatingHoursModal({ open, onOpenChange, outletId, outletName }: OperatingHoursModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl flex flex-col">
                <DialogHeader className="pb-4 border-b">
                    <DialogTitle className="text-xl">
                        Kelola Jam Operasional
                    </DialogTitle>
                    <DialogDescription>
                        Atur jam buka dan tutup untuk outlet {outletName || 'terpilih'}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-grow overflow-y-auto">
                    <OperatingHoursManager
                        outletId={outletId}
                    />
                </div>
            </DialogContent>
        </Dialog>
    )
}