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
import { gooeyToast } from "goey-toast"
import { useOperatingHours, useUpsertOperatingHours } from '@/hooks/use-operating-hours'
import { isEqual } from 'lodash'

interface OperatingHoursData {
  id?: string
  outletId: string
  dayOfWeek: number
  openTime: string
  closeTime: string
  breakStart?: string | null
  breakEnd?: string | null
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
  closeTime: '06:00',
  breakStart: null,
  breakEnd: null,
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
            breakStart: existing.breakStart ? new Date(existing.breakStart).toTimeString().slice(0, 5) : null,
            breakEnd: existing.breakEnd ? new Date(existing.breakEnd).toTimeString().slice(0, 5) : null,
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

  const handleMultipleFieldsChange = (day: number, fields: Partial<OperatingHoursData>) => {
    const newData = {
      ...currentHours,
      [day]: { ...currentHours[day], ...fields },
    }
    setCurrentHours(newData)

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
        breakStart: sourceData.breakStart,
        breakEnd: sourceData.breakEnd,
      }
      return acc
    }, {} as Record<number, OperatingHoursData>)

    const newData = { ...currentHours, ...updates }
    setCurrentHours(newData)

    // Jika dalam mode pre-submit, update juga external state
    if (isPreSubmitMode && onOperatingHoursChange) {
      onOperatingHoursChange(newData)
    }

    gooeyToast.success(`Jam operasional disalin ke ${targetDays.length} hari.`)
  }

  if (isLoading) return (
    <div className="p-6 text-center">
      <div className="flex flex-col items-center gap-3">
        <div className="p-3 rounded-full bg-muted">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
        <span className="text-sm text-muted-foreground font-medium">Memuat jam operasional...</span>
      </div>
    </div>
  )

  if (error) return (
    <div className="p-6 text-center">
      <div className="flex flex-col items-center gap-3">
        <div className="p-3 rounded-full bg-destructive/10">
          <Clock className="h-6 w-6 text-destructive" />
        </div>
        <span className="text-sm text-destructive font-medium">
          {error.message}
        </span>
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      {DAYS_OF_WEEK.map(day => {
        const dayData = currentHours[day.value]
        const hasChanged = !isEqual(dayData, initialHours[day.value])

        if (!dayData) return null

        return (
          <div key={day.value} className="group relative">
            <div className="flex flex-col p-4 rounded-lg bg-card border border-border hover:border-muted-foreground/30 hover:shadow-sm transition-all duration-200 gap-3 sm:gap-4">

              {/* Change Indicator */}
              {hasChanged && (
                <div className="absolute -left-px top-1/2 transform -translate-y-1/2 w-1 h-8 bg-primary rounded-r-md shadow-sm" title="Ada perubahan" />
              )}

              <div className="flex justify-between items-center gap-3 sm:gap-4 min-w-0">
                <Label className="w-16 sm:w-20 font-semibold text-sm flex-shrink-0 text-foreground">
                  {day.label}
                </Label>

                <div className="flex items-center gap-3">
                  <Switch
                    checked={dayData.isOpen}
                    onCheckedChange={(checked) => handleFieldChange(day.value, 'isOpen', checked)}
                    className="data-[state=checked]:bg-primary"
                  />
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-sm text-xs font-semibold border transition-all duration-200 ${dayData.isOpen
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30'
                    : 'bg-muted text-muted-foreground border-border'
                    }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${dayData.isOpen ? 'bg-emerald-500' : 'bg-muted-foreground/40'}`} />
                    {dayData.isOpen ? 'Buka' : 'Tutup'}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div className={`flex items-center w-full gap-3 mt-1 transition-all duration-300 ${dayData.isOpen
                  ? 'opacity-100 translate-x-0'
                  : 'opacity-30 pointer-events-none translate-x-2'
                  }`}>
                  <div className="flex items-center gap-2 bg-card rounded-md p-1 px-3 border border-input shadow-sm focus-within:ring-1 focus-within:ring-ring transition-all duration-200">
                    <Input
                      type="time"
                      className="w-20 sm:w-24 text-sm border-0 bg-transparent p-0 h-auto focus:ring-0 focus:outline-none text-foreground"
                      value={dayData.openTime}
                      onChange={(e) => handleFieldChange(day.value, 'openTime', e.target.value)}
                    />
                    <span className="text-muted-foreground text-sm font-medium">—</span>
                    <Input
                      type="time"
                      className="w-20 sm:w-24 text-sm border-0 bg-transparent p-0 h-auto focus:ring-0 focus:outline-none text-foreground"
                      value={dayData.closeTime}
                      onChange={(e) => handleFieldChange(day.value, 'closeTime', e.target.value)}
                    />
                  </div>
                  {dayData.isOpen && dayData.closeTime < dayData.openTime && (
                    <span className="text-[10px] sm:text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded-sm border border-amber-200/50 dark:border-amber-900/30">
                      Melewati Tengah Malam
                    </span>
                  )}
                  <CopyDayPopover sourceDay={day.value} onCopyToDays={handleCopyToDays} />
                </div>

                {dayData.isOpen && (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-3 mt-1 border-t border-dashed border-border/80">
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Switch
                        checked={!!(dayData.breakStart && dayData.breakEnd)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            handleMultipleFieldsChange(day.value, { breakStart: '12:00', breakEnd: '13:00' })
                          } else {
                            handleMultipleFieldsChange(day.value, { breakStart: null, breakEnd: null })
                          }
                        }}
                        className="scale-75 data-[state=checked]:bg-primary"
                      />
                      <span className="text-xs font-semibold text-muted-foreground">Atur Jam Istirahat</span>
                    </div>

                    {!!(dayData.breakStart && dayData.breakEnd) && (
                      <div className="flex items-center gap-2 bg-muted/30 rounded-md p-1 px-3 border border-border shadow-sm w-fit transition-all duration-200">
                        <span className="text-xs font-semibold text-muted-foreground">Istirahat:</span>
                        <Input
                          type="time"
                          className="w-16 text-xs border-0 bg-transparent p-0 h-auto focus:ring-0 focus:outline-none font-medium text-foreground"
                          value={dayData.breakStart || '12:00'}
                          onChange={(e) => handleFieldChange(day.value, 'breakStart', e.target.value)}
                        />
                        <span className="text-muted-foreground text-xs font-medium">—</span>
                        <Input
                          type="time"
                          className="w-16 text-xs border-0 bg-transparent p-0 h-auto focus:ring-0 focus:outline-none font-medium text-foreground"
                          value={dayData.breakEnd || '13:00'}
                          onChange={(e) => handleFieldChange(day.value, 'breakEnd', e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
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
        <Button
          variant="ghost"
          size="icon"
          title="Salin ke hari lain"
          className="h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <Copy className="h-3 w-3 sm:h-4 sm:w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-52 sm:w-60 p-0 border-0 shadow-xl bg-card">
        <div className="flex flex-col h-full min-h-0">
          <div className="flex items-center gap-2 p-4 pb-3 border-b border-border">
            <div className="p-1.5 rounded-md bg-primary/10 text-primary">
              <Copy className="h-3 w-3" />
            </div>
            <p className="text-sm font-semibold text-foreground">Salin ke hari lain</p>
          </div>

          <div className="flex-1 px-4 py-2 min-h-0">
            <div className="space-y-1 overflow-y-scroll max-h-60">
              {DAYS_OF_WEEK.filter(d => d.value !== sourceDay).map(day => (
                <div key={day.value} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted transition-colors">
                  <Checkbox
                    id={`day-${day.value}`}
                    onCheckedChange={(checked) => {
                      setSelectedDays(prev =>
                        checked ? [...prev, day.value] : prev.filter(d => d !== day.value)
                      )
                    }}
                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <Label
                    htmlFor={`day-${day.value}`}
                    className="text-sm font-medium cursor-pointer text-foreground flex-1"
                  >
                    {day.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 pt-3 border-t border-border">
            <Button
              onClick={handleCopy}
              size="sm"
              className="w-full bg-primary hover:bg-primary/95 text-primary-foreground shadow-sm font-semibold"
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