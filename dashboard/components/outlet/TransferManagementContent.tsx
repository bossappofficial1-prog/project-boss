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

      <div className="space-y-4 pt-4">
        <div className="flex items-center gap-3 px-2">
          <div className="h-8 w-8 rounded-md bg-amber-500/10 text-amber-600 flex items-center justify-center border border-amber-500/20">
            <ShieldAlert className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-foreground">Daftar Permintaan Transfer</h3>
            <p className="text-[10px] text-muted-foreground font-medium">Aksi transfer bersifat permanen setelah disetujui oleh penerima.</p>
          </div>
        </div>
        
        <TransferRequestsList />
      </div>
    </div>
  )
}
