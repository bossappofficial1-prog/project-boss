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
  const isPreSubmitMode = !!operatingHoursData && !!onOperatingHoursChange

  const { data: fetchedHours, isLoading, error } = useOperatingHours(outletId)

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

  if (isLoading) return (
    <div className="p-6 sm:p-8 text-center">
      <div className="flex flex-col items-center gap-3">
        <div className="p-3 rounded-full bg-blue-50 dark:bg-blue-900/20">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600 dark:text-blue-400" />
        </div>
        <span className="text-sm sm:text-base text-gray-600 dark:text-gray-400 font-medium">Memuat jam operasional...</span>
      </div>
    </div>
  )

  if (error) return (
    <div className="p-6 sm:p-8 text-center">
      <div className="flex flex-col items-center gap-3">
        <div className="p-3 rounded-full bg-red-50 dark:bg-red-900/20">
          <Clock className="h-6 w-6 text-red-600 dark:text-red-400" />
        </div>
        <span className="text-sm sm:text-base text-red-600 dark:text-red-400 font-medium">
          {error.message}
        </span>
      </div>
    </div>
  )

  return DAYS_OF_WEEK.map(day => {
    const dayData = currentHours[day.value]
    const hasChanged = !isEqual(dayData, initialHours[day.value])

    if (!dayData) return null

    return (
      <div key={day.value} className="group relative">
        <div className="flex flex-col p-4 rounded-xl bg-gradient-to-r from-gray-50 to-gray-50/80 dark:from-gray-800/50 dark:to-gray-800/30 gap-3 sm:gap-4 border border-gray-100 dark:border-gray-700/50 hover:border-gray-200 dark:hover:border-gray-600 transition-all duration-200 hover:shadow-sm">

          {/* Change Indicator */}
          {hasChanged && (
            <div className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full shadow-sm" title="Ada perubahan" />
          )}

          <div className="flex justify-between items-center gap-3 sm:gap-4 min-w-0">
            <Label className="w-16 sm:w-20 font-semibold text-sm sm:text-base flex-shrink-0 text-gray-700 dark:text-gray-300">
              {day.label}
            </Label>

            <div className="flex items-center gap-3">
              <Switch
                checked={dayData.isOpen}
                onCheckedChange={(checked) => handleFieldChange(day.value, 'isOpen', checked)}
                className="data-[state=checked]:bg-green-500"
              />
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs sm:text-sm font-medium transition-colors ${dayData.isOpen
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                }`}>
                <div className={`w-2 h-2 rounded-full ${dayData.isOpen ? 'bg-green-500' : 'bg-gray-400'
                  }`} />
                {dayData.isOpen ? 'Buka' : 'Tutup'}
              </div>
            </div>
          </div>

          <div className={`flex items-center w-full gap-3 transition-all duration-300 ${dayData.isOpen
            ? 'opacity-100 translate-x-0'
            : 'opacity-30 pointer-events-none translate-x-2'
            }`}>
            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg p-2 border border-gray-200 dark:border-gray-600 shadow-sm">
              <Input
                type="time"
                className="w-24 sm:w-28 text-sm border-0 bg-transparent focus:ring-0 focus:outline-none"
                value={dayData.openTime}
                onChange={(e) => handleFieldChange(day.value, 'openTime', e.target.value)}
              />
              <span className="text-gray-400 font-medium">—</span>
              <Input
                type="time"
                className="w-24 sm:w-28 text-sm border-0 bg-transparent focus:ring-0 focus:outline-none"
                value={dayData.closeTime}
                onChange={(e) => handleFieldChange(day.value, 'closeTime', e.target.value)}
              />
            </div>
            <CopyDayPopover sourceDay={day.value} onCopyToDays={handleCopyToDays} />
          </div>
        </div>
      </div>
    )
  })
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
        <Button
          variant="ghost"
          size="icon"
          title="Salin ke hari lain"
          className="h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          <Copy className="h-3 w-3 sm:h-4 sm:w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-52 sm:w-60 p-0 border-0 shadow-xl bg-white dark:bg-gray-800">
        <div className="flex flex-col h-full min-h-0">
          <div className="flex items-center gap-2 p-4 pb-3 border-b border-gray-100 dark:border-gray-700">
            <div className="p-1.5 rounded-md bg-blue-50 dark:bg-blue-900/20">
              <Copy className="h-3 w-3 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Salin ke hari lain</p>
          </div>

          <div className="flex-1 px-4 py-2 min-h-0">
            <div className="space-y-1 overflow-y-scroll">
              {DAYS_OF_WEEK.filter(d => d.value !== sourceDay).map(day => (
                <div key={day.value} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <Checkbox
                    id={`day-${day.value}`}
                    onCheckedChange={(checked) => {
                      setSelectedDays(prev =>
                        checked ? [...prev, day.value] : prev.filter(d => d !== day.value)
                      )
                    }}
                    className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                  />
                  <Label
                    htmlFor={`day-${day.value}`}
                    className="text-sm font-medium cursor-pointer text-gray-700 dark:text-gray-300 flex-1"
                  >
                    {day.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 pt-3 border-t border-gray-100 dark:border-gray-700">
            <Button
              onClick={handleCopy}
              size="sm"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
              disabled={selectedDays.length === 0}
            >
              <Copy className="h-3 w-3 mr-2" />
              Terapkan ke {selectedDays.length} hari
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}