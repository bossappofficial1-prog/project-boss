'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { outletManagementApi } from '@/lib/api'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  businessId: string
  onSuccess?: () => void
}

export default function AddOutletModal({ open, onOpenChange, businessId, onSuccess }: Props) {
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [description, setDescription] = useState('')
  const [openingHours, setOpeningHours] = useState('')
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE')
  const [image, setImage] = useState('')
  const [latitude, setLatitude] = useState<string>('')
  const [longitude, setLongitude] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      if (!businessId) {
        throw new Error('Silakan buat profil bisnis terlebih dahulu sebelum menambah outlet')
      }
      // Build payload strictly with backend-supported fields to avoid 500 due to unknown args
      const payload = {
        name,
        address,
        phone,
        businessId,
        image: image || undefined,
        latitude: latitude ? Number(latitude) : undefined,
        longitude: longitude ? Number(longitude) : undefined,
      }
      return outletManagementApi.create(payload)
    },
    onSuccess: () => {
      onOpenChange(false)
      onSuccess?.()
    },
    onError: (e: any) => setError(e?.message || 'Gagal menambah outlet')
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-[92vw]">
        <DialogHeader>
          <DialogTitle>Tambah Outlet</DialogTitle>
          <DialogDescription>Isi informasi outlet baru Anda.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          {!businessId && (
            <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-400 px-3 py-2 text-sm">
              Anda perlu membuat profil bisnis terlebih dahulu sebelum menambah outlet.
            </div>
          )}
          {error && (
            <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 px-3 py-2 text-sm">{error}</div>
          )}
          <div>
            <Label htmlFor="outlet-name">Nama Outlet</Label>
            <Input id="outlet-name" placeholder="Contoh: Outlet Utama" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="outlet-address">Alamat</Label>
            <Input id="outlet-address" placeholder="Alamat lengkap" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="outlet-phone">No. Telepon</Label>
            <Input id="outlet-phone" placeholder="08xxxxxxxxxx" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="outlet-email">Email (opsional)</Label>
            <Input id="outlet-email" type="email" placeholder="email@outlet.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="outlet-desc">Deskripsi (opsional)</Label>
            <Input id="outlet-desc" placeholder="Deskripsi singkat outlet" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="outlet-hours">Jam Operasional (opsional)</Label>
            <Input id="outlet-hours" placeholder="Contoh: Senin-Jumat 08:00-17:00" value={openingHours} onChange={(e) => setOpeningHours(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="outlet-status">Status</Label>
            <select id="outlet-status" className="w-full rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-4 py-2.5 text-sm outline-none transition-all focus:border-red-500 dark:focus:border-red-400" value={status} onChange={(e) => setStatus(e.target.value as 'ACTIVE' | 'INACTIVE')}>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Catatan: Beberapa field opsional akan tersedia penuh setelah update backend. Saat ini data inti (nama, alamat, telepon, lokasi, gambar) akan disimpan.</p>
          <div>
            <Label htmlFor="outlet-image">Image URL (opsional)</Label>
            <Input id="outlet-image" placeholder="https://..." value={image} onChange={(e) => setImage(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="lat">Latitude (opsional)</Label>
              <Input id="lat" placeholder="-6.2" value={latitude} onChange={(e) => setLatitude(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="lng">Longitude (opsional)</Label>
              <Input id="lng" placeholder="106.8" value={longitude} onChange={(e) => setLongitude(e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={isPending}>Batal</Button>
            <Button onClick={() => mutate()} disabled={isPending || !name || !address || !phone || !businessId}>{isPending ? 'Menyimpan...' : 'Simpan'}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
