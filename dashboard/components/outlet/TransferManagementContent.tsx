'use client'

import { ShieldAlert } from 'lucide-react'
import { TransferRequestsList } from './TransferRequestsList'
import { SectionHeader } from '../ui/section-header'

export default function TransferManagementContent() {
  return (
    <div className="space-y-6 animate-fadeIn">
      <SectionHeader
        title="Transfer Outlet"
        description="Kelola permintaan transfer kepemilikan outlet, baik yang Anda terima maupun yang Anda kirim ke pengguna lain."
      />
      <TransferRequestsList />
    </div>
  )
}
