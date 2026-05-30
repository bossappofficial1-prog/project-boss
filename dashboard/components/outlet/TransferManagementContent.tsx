'use client'

import { useState } from 'react'
import { ArrowRightLeft } from 'lucide-react'
import { TransferRequestsList } from './TransferRequestsList'
import { SectionHeader } from '../ui/section-header'
import { Button } from '@/components/ui/button'
import { TransferOutletDialog } from './TransferOutletDialog'

export default function TransferManagementContent() {
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false)

  return (
    <div className="space-y-6 animate-fadeIn">
      <SectionHeader
        title="Transfer Outlet"
        description="Kelola permintaan transfer kepemilikan outlet, baik yang Anda terima maupun yang Anda kirim ke pengguna lain."
        actions={
          <Button
            onClick={() => setIsTransferDialogOpen(true)}
            className="h-10 px-4 font-bold text-xs uppercase tracking-wider rounded-md shadow-sm transition-all cursor-pointer"
          >
            <ArrowRightLeft className="mr-2 h-4 w-4" />
            Transfer Outlet Baru
          </Button>
        }
      />
      <TransferRequestsList />

      <TransferOutletDialog
        isOpen={isTransferDialogOpen}
        onOpenChange={setIsTransferDialogOpen}
      />
    </div>
  )
}
