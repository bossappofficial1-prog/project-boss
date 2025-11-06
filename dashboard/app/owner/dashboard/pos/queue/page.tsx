'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useOutletContext } from '@/components/providers/OutletProvider'
import { productApi, outletApi } from '@/lib/api'
import { apiClient } from '@/lib/apis/base'
import { resolveUploadImageUrl } from '@/lib/url'
import { toast } from 'sonner'

type Props = {}

interface Service {
  id: string
  name: string
  price: number
  serviceDurationMinutes: number
  image?: string
  type: 'SERVICE'
  status: 'ACTIVE' | 'INACTIVE'
}

interface BookingSlot {
  id: string
  startTime: string
  endTime: string
  status: 'AVAILABLE' | 'BOOKED'
}

interface OutletOperatingHours {
  id: string
  dayOfWeek: number // 0 = Sunday, 1 = Monday, etc.
  openTime: string
  closeTime: string
  isOpen: boolean
}

export default function POSQueuePage({ }: Props) {
  const router = useRouter()
  const { selectedOutlet } = useOutletContext()
  const [services, setServices] = React.useState<any[]>([])
  const [selectedService, setSelectedService] = React.useState<Service | null>(null)
  const [customerName, setCustomerName] = React.useState('')
  const [customerPhone, setCustomerPhone] = React.useState('')
  const [bookingDate, setBookingDate] = React.useState('')
  const [bookingTime, setBookingTime] = React.useState('')
  const [endTime, setEndTime] = React.useState('')
  const [availableSlots, setAvailableSlots] = React.useState<BookingSlot[]>([])
  const [allSlots, setAllSlots] = React.useState<BookingSlot[]>([])
  const [selectedSlotId, setSelectedSlotId] = React.useState('')
  const [operatingHours, setOperatingHours] = React.useState<OutletOperatingHours[]>([])
  const [loading, setLoading] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState('')

  // Fetch services
  React.useEffect(() => {
    if (selectedOutlet?.id) {
      fetchServices()
      fetchOperatingHours()
    }
  }, [selectedOutlet])

  // Auto-calculate end time when service or time changes
  React.useEffect(() => {
    if (selectedService && bookingTime) {
      const startTime = new Date(`${bookingDate}T${bookingTime}`)
      const endTime = new Date(startTime.getTime() + (selectedService.serviceDurationMinutes * 60000))
      setEndTime(endTime.toTimeString().slice(0, 5))
    }
  }, [selectedService, bookingTime, bookingDate])

  // Fetch available slots when date and service change
  React.useEffect(() => {
    if (selectedService?.id && bookingDate) {
      // Reset slot selection when changing service or date
      setSelectedSlotId('')
      fetchAvailableSlots()
    } else {
      // Clear slots if no service or date selected
      setAllSlots([])
      setAvailableSlots([])
      setSelectedSlotId('')
    }
  }, [selectedService, bookingDate])

  const fetchServices = async () => {
    try {
      const data = (await productApi.getByOutlet(selectedOutlet!.id, { search: searchQuery })).data
      setServices(data.filter((p) => p.type === 'SERVICE' && p.status === 'ACTIVE'))
    } catch (error) {
      console.error('Error fetching services:', error)
    }
  }

  const fetchOperatingHours = async () => {
    try {
      // Fetch outlet operating hours using the proper API method
      const hours = await outletApi.getBusinessHours(selectedOutlet!.id)
      // Convert BusinessHours to OutletOperatingHours format
      const operatingHours = hours.map(hour => ({
        id: hour.id,
        dayOfWeek: hour.dayOfWeek,
        openTime: hour.openTime,
        closeTime: hour.closeTime,
        isOpen: hour.isOpen
      }))
      setOperatingHours(operatingHours)
    } catch (error) {
      console.error('Error fetching operating hours:', error)
    }
  }

  const fetchAvailableSlots = async () => {
    try {
      const response = await apiClient.get(`/products/${selectedService!.id}/booking-slots?date=${bookingDate}`)
      const data = response.data.data
      // Simpan semua slot untuk ditampilkan
      setAllSlots(data)
      // Simpan hanya slot yang available untuk logika pemilihan
      setAvailableSlots(data.filter((slot: BookingSlot) => slot.status === 'AVAILABLE'))
    } catch (error) {
      console.error('Error fetching slots:', error)
      setAllSlots([])
      setAvailableSlots([])
    }
  }

  const isTimeWithinOperatingHours = (selectedTime: string, selectedDate: string): boolean => {
    if (!selectedTime || !selectedDate) return false

    const date = new Date(selectedDate)
    const dayOfWeek = date.getDay()

    const operatingHour = operatingHours.find(oh => oh.dayOfWeek === dayOfWeek && oh.isOpen)
    if (!operatingHour) return false

    const selectedDateTime = new Date(`${selectedDate}T${selectedTime}`)
    const openTime = new Date(`${selectedDate}T${operatingHour.openTime}`)
    const closeTime = new Date(`${selectedDate}T${operatingHour.closeTime}`)

    // Handle next day closing time
    if (closeTime <= openTime) {
      closeTime.setDate(closeTime.getDate() + 1)
    }

    const endDateTime = new Date(selectedDateTime.getTime() + (selectedService!.serviceDurationMinutes * 60000))

    return selectedDateTime >= openTime && endDateTime <= closeTime
  }

  const getOperatingHoursText = (): string => {
    if (!bookingDate || operatingHours.length === 0) return ''

    const date = new Date(bookingDate)
    const dayOfWeek = date.getDay()
    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

    const operatingHour = operatingHours.find(oh => oh.dayOfWeek === dayOfWeek)
    if (!operatingHour || !operatingHour.isOpen) {
      return `${dayNames[dayOfWeek]}: Tutup`
    }

    return `${dayNames[dayOfWeek]}: ${operatingHour.openTime.slice(0, 5)} - ${operatingHour.closeTime.slice(0, 5)}`
  }

  const handleTimeChange = (time: string) => {
    setBookingTime(time)
    setSelectedSlotId('') // Reset slot selection when manually entering time

    if (selectedService && bookingDate) {
      if (!isTimeWithinOperatingHours(time, bookingDate)) {
        toast.error('Waktu booking harus dalam jam operasional outlet')
        return
      }
    }
  }

  const handleSlotSelect = (slot: BookingSlot) => {
    setSelectedSlotId(slot.id)
    const startTime = new Date(slot.startTime)
    setBookingTime(startTime.toTimeString().slice(0, 5))
    setBookingDate(startTime.toISOString().split('T')[0])
  }

  const validateForm = (): string | null => {
    if (!selectedService) return 'Pilih layanan terlebih dahulu'
    if (!customerName.trim()) return 'Nama pelanggan wajib diisi'
    if (!customerPhone.trim()) return 'Nomor telepon wajib diisi'
    if (!bookingDate) return 'Tanggal booking wajib diisi'
    if (!bookingTime) return 'Waktu booking wajib diisi'

    // Validate phone format
    const phoneRegex = /^(\+62|62|0)8[1-9][0-9]{6,9}$/
    if (!phoneRegex.test(customerPhone.replace(/\s/g, ''))) {
      return 'Format nomor telepon tidak valid'
    }

    // Validate name format (letters and spaces only, 2-100 chars)
    const nameRegex = /^[a-zA-Z\s]{2,100}$/
    if (!nameRegex.test(customerName.trim())) {
      return 'Nama hanya boleh berisi huruf dan spasi (2-100 karakter)'
    }

    if (!isTimeWithinOperatingHours(bookingTime, bookingDate)) {
      return 'Waktu booking harus dalam jam operasional outlet'
    }

    return null
  }

  const handleSubmitQueue = async () => {
    const validation = validateForm()
    if (validation) {
      toast.error(validation)
      return
    }

    try {
      setLoading(true)

      // Use the slot startTime to ensure consistency with queue table display
      const bookingDateTime = selectedSlotId
        ? availableSlots.find(slot => slot.id === selectedSlotId)?.startTime
        : new Date(`${bookingDate}T${bookingTime}`).toISOString()

      const queueData = {
        guestCustomer: {
          name: customerName.trim(),
          phone: customerPhone.trim()
        },
        outletId: selectedOutlet!.id,
        items: [{
          productId: selectedService!.id,
          quantity: 1
        }],
        bookingDate: bookingDateTime,
        bookingSlotId: selectedSlotId || undefined,
        paymentMethod: 'cash' as 'cash' // Default for queue
      }

      console.log('Creating queue:', queueData)

      const { default: orderApi } = await import('@/lib/apis/order')
      const result = await orderApi.create(queueData)

      console.log('Queue created successfully:', result)

      // Reset form
      setSelectedService(null)
      setCustomerName('')
      setCustomerPhone('')
      setBookingDate('')
      setBookingTime('')
      setEndTime('')
      setSelectedSlotId('')
      setAllSlots([])
      setAvailableSlots([])

      toast.success(`Antrian berhasil dibuat! Order ID: ${result.order.id}`)
      router.push('/owner/dashboard/queue')

    } catch (error: any) {
      console.error('Error creating queue:', error)
      const errorMessage = error?.message || error?.response?.data?.message || 'Gagal membuat antrian'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  if (!selectedOutlet) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Pilih Outlet</h3>
            <p className="text-gray-500 dark:text-gray-400">Pilih outlet terlebih dahulu untuk menggunakan sistem antrian</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            POS - Tambah Antrian Baru
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Outlet: <span className="font-semibold">{selectedOutlet.name}</span>
          </p>
          {getOperatingHoursText() && (
            <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
              🕒 {getOperatingHoursText()}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Services Grid */}
          <div className="xl:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex flex-col sm:flex-row gap-4">
                  <input
                    type="text"
                    placeholder="Cari layanan..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                  <button
                    onClick={fetchServices}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors whitespace-nowrap"
                  >
                    Cari
                  </button>
                </div>
              </div>

              <div className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                  {services.map((service) => (
                    <div
                      key={service.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${selectedService?.id === service.id
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:shadow-md'
                        }`}
                      onClick={() => setSelectedService(service)}
                    >
                      <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg mb-3 overflow-hidden">
                        {service.image ? (
                          <img
                            src={resolveUploadImageUrl(service.image) || 'https://png.pngtree.com/png-vector/20230808/ourmid/pngtree-goods-and-services-vector-png-image_6891390.png'}
                            alt={service.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = 'https://png.pngtree.com/png-vector/20230808/ourmid/pngtree-goods-and-services-vector-png-image_6891390.png';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6.5" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1 line-clamp-2">{service.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Durasi: {service.serviceDurationMinutes} menit</p>
                      <p className="text-lg font-semibold text-red-600 dark:text-red-400">
                        Rp {service.price.toLocaleString('id-ID')}
                      </p>
                      {selectedService?.id === service.id && (
                        <div className="mt-2 text-sm text-red-600 dark:text-red-400 font-medium">
                          ✓ Terpilih
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Booking Form */}
          <div className="xl:col-span-1 space-y-6 xl:sticky xl:top-6 xl:max-h-screen xl:overflow-y-auto">
            {/* Customer Info */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Data Pelanggan</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nama *</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Nama pelanggan"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-base"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">No. HP *</label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="08xxx (wajib diisi)"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-base"
                  />
                </div>
              </div>
            </div>

            {/* Booking Time */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Waktu Booking</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tanggal *</label>
                  <input
                    type="date"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-base"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Waktu Mulai *</label>
                  <input
                    type="time"
                    value={bookingTime}
                    onChange={(e) => handleTimeChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-base"
                  />
                </div>
                {endTime && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estimasi Selesai</label>
                    <input
                      type="time"
                      value={endTime}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-600 text-gray-500 dark:text-gray-400 text-base"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Available Slots */}
            {(allSlots.length > 0 || (selectedService?.id && bookingDate)) && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Slot Waktu</h3>

                {allSlots.length > 0 && (
                  <>
                    {/* Legend */}
                    <div className="flex flex-wrap gap-4 mb-3 text-xs">
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
                        <span className="text-gray-600 dark:text-gray-400">Tersedia</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-red-100 border border-red-300 rounded"></div>
                        <span className="text-gray-600 dark:text-gray-400">Terisi</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-blue-100 border border-blue-500 rounded"></div>
                        <span className="text-gray-600 dark:text-gray-400">Dipilih</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                      {allSlots.map((slot) => {
                        const startTime = new Date(slot.startTime)
                        const timeStr = startTime.toTimeString().slice(0, 5)
                        const isAvailable = slot.status === 'AVAILABLE'
                        const isSelected = selectedSlotId === slot.id

                        return (
                          <button
                            key={slot.id}
                            onClick={() => isAvailable ? handleSlotSelect(slot) : null}
                            disabled={!isAvailable}
                            className={`p-2 text-sm rounded-lg border transition-colors relative ${isSelected
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                              : isAvailable
                                ? 'border-green-300 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/30 cursor-pointer'
                                : 'border-red-300 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 cursor-not-allowed'
                              }`}
                            title={isAvailable ? 'Klik untuk memilih slot ini' : 'Slot sudah terisi'}
                          >
                            {timeStr}
                            {!isAvailable && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-xs font-medium">✗</span>
                              </div>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </>
                )}

                {allSlots.length === 0 && selectedService?.id && bookingDate && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                    Tidak ada slot tersedia untuk tanggal ini
                  </p>
                )}

                {(!selectedService?.id || !bookingDate) && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                    Pilih layanan dan tanggal terlebih dahulu untuk melihat slot waktu
                  </p>
                )}
              </div>
            )}

            {/* Submit Button */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
              <button
                onClick={handleSubmitQueue}
                disabled={loading || !selectedService || !customerName.trim() || !customerPhone.trim() || !bookingDate || !bookingTime}
                className="w-full px-4 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed touch-manipulation text-base"
              >
                {loading ? 'Memproses...' : 'Buat Antrian'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}