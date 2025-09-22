'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { Clock, Save, Loader2, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { useOperatingHours, useUpsertOperatingHours } from '@/hooks/useOperatingHours'
import { isEqual } from 'lodash'

interface OperatingHoursData {
  id?: string
  outletId: string
  dayOfWeek: number
  openTime: string
  closeTime: string
  isOpen: boolean
}

interface OperatingHoursManagerProps {
  outletId: string
  operatingHoursData?: Record<number, OperatingHoursData>
  onOperatingHoursChange?: (data: Record<number, OperatingHoursData>) => void
}

const DAYS_OF_WEEK = [
  { value: 1, label: 'Senin' },
  { value: 2, label: 'Selasa' },
  { value: 3, label: 'Rabu' },
  { value: 4, label: 'Kamis' },
  { value: 5, label: 'Jumat' },
  { value: 6, label: 'Sabtu' },
  { value: 0, label: 'Minggu' },
]

// Helper untuk membuat data default
const createDefaultHour = (day: number, outletId: string): OperatingHoursData => ({
  dayOfWeek: day,
  outletId,
  isOpen: false,
  openTime: '09:00',
  closeTime: '17:00',
})

export default function OperatingHoursManager({ outletId, operatingHoursData, onOperatingHoursChange }: OperatingHoursManagerProps) {
  const [initialHours, setInitialHours] = useState<Record<number, OperatingHoursData>>({})
  const [currentHours, setCurrentHours] = useState<Record<number, OperatingHoursData>>({})

  // Mode: external state (untuk pre-submit) vs internal state (untuk existing outlet)
  const isPreSubmitMode = operatingHoursData !== undefined && onOperatingHoursChange !== undefined

  const { data: fetchedHours, isLoading, error } = useOperatingHours(outletId)
  const { mutate: upsertHours, isPending } = useUpsertOperatingHours()

  // 1. Inisialisasi state
  useEffect(() => {
    if (isPreSubmitMode) {
      // Mode pre-submit: gunakan data dari props atau default
      const hoursMap: Record<number, OperatingHoursData> = {}
      DAYS_OF_WEEK.forEach(day => {
        const existing = operatingHoursData?.[day.value]
        if (existing) {
          hoursMap[day.value] = existing
        } else {
          hoursMap[day.value] = createDefaultHour(day.value, outletId)
        }
      })
      setInitialHours(hoursMap)
      setCurrentHours(hoursMap)
    } else {
      // Mode existing outlet: gunakan data dari server
      const hoursMap: Record<number, OperatingHoursData> = {}
      DAYS_OF_WEEK.forEach(day => {
        const existing = fetchedHours?.find((h: any) => h.dayOfWeek === day.value)
        if (existing) {
          hoursMap[day.value] = {
            ...existing,
            openTime: new Date(existing.openTime).toTimeString().slice(0, 5),
            closeTime: new Date(existing.closeTime).toTimeString().slice(0, 5),
          }
        } else {
          hoursMap[day.value] = createDefaultHour(day.value, outletId)
        }
      })
      setInitialHours(hoursMap)
      setCurrentHours(hoursMap)
    }
  }, [fetchedHours, outletId, isPreSubmitMode, operatingHoursData])

  // 2. Cek apakah ada perubahan yang belum disimpan
  const hasUnsavedChanges = useMemo(() => !isEqual(initialHours, currentHours), [initialHours, currentHours])

  const handleFieldChange = (day: number, field: keyof OperatingHoursData, value: any) => {
    const newData = {
      ...currentHours,
      [day]: { ...currentHours[day], [field]: value },
    }
    setCurrentHours(newData)

    // Jika dalam mode pre-submit, update juga external state
    if (isPreSubmitMode && onOperatingHoursChange) {
      onOperatingHoursChange(newData)
    }
  }

  // 3. Fitur "Salin Waktu"
  const handleCopyToDays = (sourceDay: number, targetDays: number[]) => {
    const sourceData = currentHours[sourceDay]
    const updates = targetDays.reduce((acc, day) => {
      acc[day] = {
        ...currentHours[day],
        isOpen: sourceData.isOpen,
        openTime: sourceData.openTime,
        closeTime: sourceData.closeTime,
      }
      return acc
    }, {} as Record<number, OperatingHoursData>)

    const newData = { ...currentHours, ...updates }
    setCurrentHours(newData)

    // Jika dalam mode pre-submit, update juga external state
    if (isPreSubmitMode && onOperatingHoursChange) {
      onOperatingHoursChange(newData)
    }

    toast.success(`Jam operasional disalin ke ${targetDays.length} hari.`)
  }

  const handleSaveAll = () => {
    if (isPreSubmitMode) {
      // Dalam mode pre-submit, penyimpanan dilakukan di parent component
      toast.info('Jam operasional akan disimpan bersama data outlet.')
      return
    }

    const changedData = Object.values(currentHours).filter(
      (current, index) => !isEqual(current, initialHours[current.dayOfWeek])
    )

    if (changedData.length === 0) return

    const payload = changedData.map(data => ({
      ...data,
      openTime: new Date(`1970-01-01T${data.openTime}:00Z`),
      closeTime: new Date(`1970-01-01T${data.closeTime}:00Z`),
    }))

    upsertHours(payload as any, {
      onSuccess: (updatedData) => {
        const updatedArray = Array.isArray(updatedData) ? updatedData : [updatedData]
        const newInitialState = { ...initialHours }
        updatedArray.forEach((item: any) => {
          const day = item.dayOfWeek
          newInitialState[day] = {
            ...item,
            openTime: new Date(item.openTime).toTimeString().slice(0, 5),
            closeTime: new Date(item.closeTime).toTimeString().slice(0, 5),
          }
        })
        setInitialHours(newInitialState)
        setCurrentHours(newInitialState)
        toast.success('Jam operasional berhasil diperbarui!')
      },
      onError: (e: any) => toast.error(e.message || 'Gagal menyimpan perubahan.'),
    })
  }

  if (isLoading) return <div className="p-8 text-center"> <Loader2 className="inline-block h-6 w-6 animate-spin" /> Memuat...</div>
  if (error) return <div className="p-8 text-center text-red-500">{error.message}</div>

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          Atur Jam Operasional
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {DAYS_OF_WEEK.map(day => {
          const dayData = currentHours[day.value]
          const hasChanged = !isEqual(dayData, initialHours[day.value])

          if (!dayData) return null // Tampilkan saat data sudah siap

          return (
            <div key={day.value} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
              <div className="flex items-center gap-4">
                {/* 4. Indikator Perubahan */}
                <div className={`h-2 w-2 rounded-full transition-opacity ${hasChanged ? 'bg-blue-500 opacity-100' : 'opacity-0'}`} title="Ada perubahan" />
                <Label className="w-16 font-semibold">{day.label}</Label>
                <Switch
                  checked={dayData.isOpen}
                  onCheckedChange={(checked) => handleFieldChange(day.value, 'isOpen', checked)}
                />
                <span className={`text-sm font-medium ${dayData.isOpen ? 'text-green-600' : 'text-gray-500'}`}>
                  {dayData.isOpen ? 'Buka' : 'Tutup'}
                </span>
              </div>

              <div className={`flex items-center gap-2 transition-opacity ${dayData.isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <Input
                  type="time"
                  className="w-32"
                  value={dayData.openTime}
                  onChange={(e) => handleFieldChange(day.value, 'openTime', e.target.value)}
                />
                <span>-</span>
                <Input
                  type="time"
                  className="w-32"
                  value={dayData.closeTime}
                  onChange={(e) => handleFieldChange(day.value, 'closeTime', e.target.value)}
                />
                <CopyDayPopover sourceDay={day.value} onCopyToDays={handleCopyToDays} />
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

function CopyDayPopover({ sourceDay, onCopyToDays }: { sourceDay: number, onCopyToDays: (sourceDay: number, targetDays: number[]) => void }) {
  const [selectedDays, setSelectedDays] = useState<number[]>([])

  const handleCopy = () => {
    if (selectedDays.length > 0) {
      onCopyToDays(sourceDay, selectedDays)
    }
  }

  return (
    <Popover onOpenChange={() => setSelectedDays([])}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" title="Salin ke hari lain">
          <Copy className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56">
        <div className="space-y-3">
          <p className="text-sm font-semibold">Salin ke...</p>
          <div className="space-y-2">
            {DAYS_OF_WEEK.filter(d => d.value !== sourceDay).map(day => (
              <div key={day.value} className="flex items-center gap-2">
                <Checkbox
                  id={`day-${day.value}`}
                  onCheckedChange={(checked) => {
                    setSelectedDays(prev =>
                      checked ? [...prev, day.value] : prev.filter(d => d !== day.value)
                    )
                  }}
                />
                <Label htmlFor={`day-${day.value}`} className="text-sm font-normal">{day.label}</Label>
              </div>
            ))}
          </div>
          <Button onClick={handleCopy} size="sm" className="w-full" disabled={selectedDays.length === 0}>
            Terapkan
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}