'use client'

import React from 'react'
import { AlertTriangle, Calendar, Clock, Copy, Minus, Plus, ShoppingBag } from 'lucide-react'
import { toast } from 'sonner'

import { useOutletContext } from '@/components/providers/OutletProvider'
import QRISViewModal from '@/components/modals/QRISViewModal'
import { ProductGridSection } from '@/components/owner/dashboard/pos/ProductGridSection'
import { CustomerFormCard } from '@/components/owner/dashboard/pos/CustomerFormCard'
import { PaymentMethodCard } from '@/components/owner/dashboard/pos/PaymentMethodCard'
import { ServiceScheduleDialog, ServiceScheduleSelection } from '@/components/owner/dashboard/pos/ServiceScheduleDialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { orderApi, productApi } from '@/lib/api'
import type { CreateOrderRequest, OnlinePaymentChannel, PosCashSummary } from '@/lib/apis/order'
import { useSocketContext } from '@/components/providers/SocketProvider'
import { usePosOnlinePayment } from '@/hooks/usePosOnlinePayment'
import { ONLINE_PAYMENT_LABELS } from '@/constants/pos'
import type { POSProduct, POSCartLine, PaymentMethod, POSCustomerMode } from '@/types/pos'

const formatDateTime = (value?: string | null) => {
  if (!value) return '-'

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsed)
}

const currencyFormatter = new Intl.NumberFormat('id-ID')
const slotDateFormatter = new Intl.DateTimeFormat('id-ID', {
  weekday: 'long',
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})
const slotTimeFormatter = new Intl.DateTimeFormat('id-ID', {
  hour: '2-digit',
  minute: '2-digit',
})

export default function POSOrdersPage() {
  const { selectedOutlet } = useOutletContext()

  const [products, setProducts] = React.useState<POSProduct[]>([])
  const [searchQuery, setSearchQuery] = React.useState('')
  const [activeFilter, setActiveFilter] = React.useState<'ALL' | 'GOODS' | 'SERVICE'>('ALL')
  const [cart, setCart] = React.useState<Record<string, POSCartLine>>({})
  const [isLoadingProducts, setIsLoadingProducts] = React.useState(false)
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>('cash')
  const [customerMode, setCustomerMode] = React.useState<POSCustomerMode>('identified')
  const [customerName, setCustomerName] = React.useState('')
  const [customerPhone, setCustomerPhone] = React.useState('')
  const [cashReceived, setCashReceived] = React.useState(0)
  const [onlineChannel, setOnlineChannel] = React.useState<OnlinePaymentChannel>('qris_dynamic')
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [showQRISModal, setShowQRISModal] = React.useState(false)
  const [scheduleDialogData, setScheduleDialogData] = React.useState<{
    product: POSProduct
    selection?: ServiceScheduleSelection | null
  } | null>(null)
  const [cashSummary, setCashSummary] = React.useState<PosCashSummary | null>(null)

  const outletId = selectedOutlet?.id
  const qrisImage = selectedOutlet?.manualQrImageUrl || selectedOutlet?.qrisImage
  const { socket, isConnected } = useSocketContext()

  const fetchProducts = React.useCallback(
    async (query?: string) => {
      if (!outletId) return
      setIsLoadingProducts(true)
      try {
        const data = (await productApi.getByOutlet(outletId, {
          search: query?.trim() ? query.trim() : undefined,
          limit: 120,
        }, "CASHIER")).data
        setProducts(data as POSProduct[])
      } catch (error) {
        console.error('Gagal mengambil produk POS:', error)
        toast.error('Tidak dapat memuat produk outlet')
      } finally {
        setIsLoadingProducts(false)
      }
    },
    [outletId]
  )

  const {
    onlinePaymentResult,
    isPaymentSettled,
    isPaymentRejected,
    handleOrderCreated,
    resetPaymentState,
  } = usePosOnlinePayment({
    socket,
    isConnected,
    outletId,
    fetchProducts,
    searchQuery,
  })

  const fetchCashSummary = React.useCallback(async () => {
    if (!outletId) {
      setCashSummary(null)
      return
    }

    try {
      const summary = await orderApi.getPosCashSummary(outletId)
      setCashSummary(summary)
    } catch (error) {
      console.error('Gagal memuat ringkasan kas POS:', error)
    }
  }, [outletId])

  const handleSearch = React.useCallback(() => {
    fetchProducts(searchQuery)
  }, [fetchProducts, searchQuery])

  const paymentChannelLabel = React.useMemo(() => {
    const channelFromResult = onlinePaymentResult?.transaction.midtrans?.channel
    if (channelFromResult && channelFromResult in ONLINE_PAYMENT_LABELS) {
      return ONLINE_PAYMENT_LABELS[channelFromResult as OnlinePaymentChannel]
    }
    return ONLINE_PAYMENT_LABELS[onlineChannel]
  }, [onlinePaymentResult?.transaction.midtrans?.channel, onlineChannel])

  React.useEffect(() => {
    setSearchQuery('')
    setCart({})
    setScheduleDialogData(null)
    if (outletId) {
      fetchProducts()
    }
    fetchCashSummary()
  }, [fetchProducts, fetchCashSummary, outletId])

  React.useEffect(() => {
    fetchCashSummary()
  }, [fetchCashSummary])

  const cartQuantities = React.useMemo(() => {
    const map: Record<string, number> = {}
    Object.entries(cart).forEach(([productId, line]) => {
      map[productId] = line.quantity
    })
    return map
  }, [cart])

  const filteredProducts = React.useMemo(() => {
    const list = activeFilter === 'ALL' ? products : products.filter((item) => item.type === activeFilter)
    if (!searchQuery.trim()) {
      return list
    }
    const query = searchQuery.trim().toLowerCase()
    return list.filter((item) => item.name.toLowerCase().includes(query))
  }, [activeFilter, products, searchQuery])

  const cartItems = React.useMemo(() => Object.values(cart), [cart])

  const hasUnscheduledService = React.useMemo(
    () =>
      cartItems.some(
        (line) =>
          line.product.type === 'SERVICE' && (
            !line.bookingSlotId ||
            !line.bookingStart ||
            !line.bookingEnd ||
            !line.staffId
          )
      ),
    [cartItems]
  )

  const subtotal = React.useMemo(
    () => cartItems.reduce((total, line) => total + line.product.price * line.quantity, 0),
    [cartItems]
  )

  const membershipDiscount = 0
  const promoDiscount = 0
  const baseTotal = React.useMemo(
    () => Math.max(subtotal - membershipDiscount - promoDiscount, 0),
    [subtotal, membershipDiscount, promoDiscount]
  )
  const onlineApplicationFee = React.useMemo(
    () => (paymentMethod === 'online' ? Math.ceil(baseTotal * 0.03) : 0),
    [paymentMethod, baseTotal]
  )
  const onlineTransactionFee = React.useMemo(
    () => (paymentMethod === 'online' ? Math.ceil(baseTotal * 0.02) : 0),
    [paymentMethod, baseTotal]
  )
  const total = baseTotal + onlineApplicationFee + onlineTransactionFee
  const cashChange = paymentMethod === 'cash' ? Number(cashReceived || 0) - total : 0

  const handleAddProduct = (product: POSProduct) => {
    if (product.type === 'SERVICE') {
      const serviceLines = Object.values(cart).filter((line) => line.product.type === 'SERVICE')
      const otherService = serviceLines.find((line) => line.product.id !== product.id)

      if (otherService) {
        toast.error('Saat ini hanya satu layanan yang dapat diproses per transaksi POS')
        return
      }

      const existingLine = cart[product.id]
      const selection = existingLine?.bookingSlotId && existingLine.bookingStart && existingLine.bookingEnd && existingLine.staffId && existingLine.staffName
        ? {
          slotId: existingLine.bookingSlotId,
          startTimeIso: existingLine.bookingStart,
          endTimeIso: existingLine.bookingEnd,
          staffId: existingLine.staffId,
          staffName: existingLine.staffName,
        }
        : null

      setScheduleDialogData({ product, selection })
      return
    }

    setCart((prev) => {
      const current = prev[product.id]?.quantity ?? 0
      const nextQty = current + 1
      if (product.quantity != null && nextQty > product.quantity) {
        toast.error('Stok produk tidak mencukupi')
        return prev
      }
      return {
        ...prev,
        [product.id]: {
          product,
          quantity: nextQty,
        },
      }
    })
  }

  const handleDecreaseProduct = (productId: string) => {
    setCart((prev) => {
      const line = prev[productId]
      if (!line) return prev
      const nextQty = line.quantity - 1
      if (nextQty <= 0) {
        const { [productId]: _removed, ...rest } = prev
        return rest
      }
      return {
        ...prev,
        [productId]: { ...line, quantity: nextQty },
      }
    })
  }

  const handleRemoveProduct = (productId: string) => {
    setCart((prev) => {
      if (!(productId in prev)) return prev
      const { [productId]: _removed, ...rest } = prev
      return rest
    })
  }

  const handleResetCart = () => {
    setCart({})
    setScheduleDialogData(null)
  }

  const handleCopyToClipboard = async (value: string) => {
    if (!value) return

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value)
        toast.success('Disalin ke clipboard')
      } else {
        throw new Error('Clipboard tidak tersedia')
      }
    } catch (error) {
      console.error('Gagal menyalin ke clipboard:', error)
      toast.error('Tidak dapat menyalin teks')
    }
  }

  const openScheduleEditor = (line: POSCartLine) => {
    const selection = line.bookingSlotId && line.bookingStart && line.bookingEnd && line.staffId && line.staffName
      ? {
        slotId: line.bookingSlotId,
        startTimeIso: line.bookingStart,
        endTimeIso: line.bookingEnd,
        staffId: line.staffId,
        staffName: line.staffName,
      }
      : null

    setScheduleDialogData({ product: line.product, selection })
  }

  const handleScheduleConfirm = (selection: ServiceScheduleSelection) => {
    const targetProduct = scheduleDialogData?.product
    if (!targetProduct) {
      setScheduleDialogData(null)
      return
    }

    setCart((prev) => ({
      ...prev,
      [targetProduct.id]: {
        product: targetProduct,
        quantity: 1,
        bookingSlotId: selection.slotId,
        bookingStart: selection.startTimeIso,
        bookingEnd: selection.endTimeIso,
        staffId: selection.staffId,
        staffName: selection.staffName,
      },
    }))

    setScheduleDialogData(null)
    toast.success('Jadwal layanan tersimpan')
  }

  const handleCloseScheduleDialog = () => {
    setScheduleDialogData(null)
  }

  const canSubmit = React.useMemo(() => {
    if (!cartItems.length) return false
    if (!outletId) return false
    if (hasUnscheduledService) return false
    if (customerMode === 'identified') {
      if (!customerName.trim() || !customerPhone.trim()) return false
    }
    if (paymentMethod === 'cash' && cashReceived) {
      return Number(cashReceived) >= total
    }
    if (paymentMethod === 'cash' && !cashReceived) {
      return false
    }
    if (paymentMethod === 'online' && !onlineChannel) {
      return false
    }
    return true
  }, [
    cartItems.length,
    outletId,
    hasUnscheduledService,
    customerMode,
    customerName,
    customerPhone,
    paymentMethod,
    cashReceived,
    total,
    onlineChannel,
  ])

  const buildGuestCustomer = () => {
    if (customerMode === 'walkin') {
      return {
        name: 'Walk-in Customer',
        phone: '0000000000',
      }
    }
    return {
      name: customerName.trim(),
      phone: customerPhone.trim(),
    }
  }

  const handleSubmitOrder = async () => {
    if (!outletId) {
      toast.error('Pilih outlet terlebih dahulu')
      return
    }
    if (!cartItems.length) {
      toast.error('Tambahkan minimal satu item ke keranjang')
      return
    }
    if (customerMode === 'identified') {
      if (!customerName.trim()) {
        toast.error('Nama pelanggan wajib diisi')
        return
      }
      if (!customerPhone.trim()) {
        toast.error('Nomor telepon wajib diisi')
        return
      }
    }
    if (paymentMethod === 'cash') {
      if (!cashReceived) {
        toast.error('Masukkan nominal cash yang diterima')
        return
      }
      if (Number(cashReceived) < total) {
        toast.error('Nominal cash kurang dari total pembayaran')
        return
      }
    }
    if (paymentMethod === 'online' && !onlineChannel) {
      toast.error('Pilih kanal pembayaran online terlebih dahulu')
      return
    }

    const serviceLines = cartItems.filter((line) => line.product.type === 'SERVICE')
    if (serviceLines.length > 1) {
      toast.error('Saat ini hanya dapat membuat satu layanan per transaksi POS')
      return
    }

    const serviceLine = serviceLines[0]
    if (serviceLine && (!serviceLine.bookingSlotId || !serviceLine.bookingStart || !serviceLine.bookingEnd)) {
      toast.error('Pilih jadwal layanan sebelum membuat pesanan')
      return
    }
    if (serviceLine && !serviceLine.staffId) {
      toast.error('Pilih staff layanan sebelum membuat pesanan')
      return
    }

    try {
      setIsSubmitting(true)

      const payload: CreateOrderRequest = {
        guestCustomer: buildGuestCustomer(),
        outletId,
        items: cartItems.map((line) => ({
          productId: line.product.id,
          quantity: line.product.type === 'SERVICE' ? 1 : line.quantity,
        })),
        paymentMethod,
      }

      if (paymentMethod === 'online') {
        payload.onlinePaymentChannel = onlineChannel
      }

      if (serviceLine) {
        payload.bookingSlotId = serviceLine.bookingSlotId
        payload.bookingDate = serviceLine.bookingStart
        payload.staffId = serviceLine.staffId
      }

      const response = await orderApi.create(payload)

      toast.success(`Pesanan berhasil dibuat (Order ID: ${response.order.id})`)

      handleOrderCreated(response, paymentMethod === 'online')

      setCart({})
      setScheduleDialogData(null)
      setCustomerName('')
      setCustomerPhone('')
      setCustomerMode('identified')
      setPaymentMethod('cash')
      setCashReceived(0)
      setOnlineChannel('qris_dynamic')

      // Tetap pada halaman POS agar kasir dapat memproses transaksi berikutnya
      fetchProducts()
      await fetchCashSummary()
    } catch (error: unknown) {
      console.error('Gagal membuat pesanan POS:', error)
      toast.error('Gagal membuat pesanan, coba lagi')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!selectedOutlet) {
    return (
      <div className="min-h-screen text-slate-900 transition-colors dark:text-slate-50">
        <div className="flex h-[70vh] flex-col items-center justify-center gap-3 text-center">
          <ShoppingBag className="h-10 w-10 text-red-500" />
          <p className="text-lg font-semibold">Pilih outlet terlebih dahulu</p>
          <p className="max-w-sm text-sm text-slate-600 dark:text-slate-400">
            Fitur POS hanya aktif setelah kamu memilih outlet yang ingin dipakai.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen text-slate-900 transition-colors dark:text-slate-100">
      <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-4">
        <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {selectedOutlet.name} · {selectedOutlet.address || 'Alamat belum diisi'}
            </p>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
            <span>Metode aktif:</span>
            <Badge
              variant="secondary"
              className="bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-200"
            >
              {paymentMethod.toUpperCase()}
            </Badge>
          </div>
        </header>

        {cashSummary && (
          <Card className="border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
            <CardContent className="flex flex-col gap-1 py-4">
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Kas tunai hari ini</p>
              <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                Rp {currencyFormatter.format(cashSummary.totalAmount)}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {cashSummary.transactionsCount} transaksi cash • {new Date(cashSummary.startTime).toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <ProductGridSection
            filteredProducts={filteredProducts}
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            onSearch={handleSearch}
            activeFilter={activeFilter}
            onFilterChange={(filter) => setActiveFilter(filter)}
            isLoading={isLoadingProducts}
            onAddProduct={handleAddProduct}
            cartQuantities={cartQuantities}
          />

          <section className="flex flex-col gap-4">
            <CustomerFormCard
              mode={customerMode}
              onModeChange={(mode) => setCustomerMode(mode)}
              customerName={customerName}
              onCustomerNameChange={setCustomerName}
              customerPhone={customerPhone}
              onCustomerPhoneChange={setCustomerPhone}
            />

            <PaymentMethodCard
              paymentMethod={paymentMethod}
              onPaymentMethodChange={(method) => setPaymentMethod(method)}
              cashReceived={cashReceived}
              onCashReceivedChange={setCashReceived}
              cashChange={cashChange}
              qrisImage={qrisImage}
              onShowQRISModal={() => setShowQRISModal(true)}
              onlineChannel={onlineChannel}
              onOnlineChannelChange={(channel) => setOnlineChannel(channel)}
            />

            <Card className="flex flex-1 flex-col border-slate-200 bg-white shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Keranjang</CardTitle>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Atur kuantitas item sebelum membuat pesanan.
                </p>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-4">
                <div className="space-y-3">
                  {cartItems.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 py-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-400">
                      Keranjang kosong. Tambahkan produk terlebih dahulu.
                    </div>
                  ) : (
                    cartItems.map((line) => {
                      const lineTotal = line.product.price * line.quantity
                      const hasSchedule = line.product.type === 'SERVICE' && line.bookingStart && line.bookingEnd
                      const scheduleDate = hasSchedule ? slotDateFormatter.format(new Date(line.bookingStart!)) : null
                      const scheduleTime = hasSchedule
                        ? `${slotTimeFormatter.format(new Date(line.bookingStart!))} - ${slotTimeFormatter.format(new Date(line.bookingEnd!))}`
                        : null

                      return (
                        <div
                          key={line.product.id}
                          className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-950/60"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{line.product.name}</p>
                              <p className="text-xs text-slate-600 dark:text-slate-400">
                                Rp {currencyFormatter.format(line.product.price)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                Rp {currencyFormatter.format(lineTotal)}
                              </p>
                              {line.quantity > 1 && (
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  {line.quantity} × Rp {currencyFormatter.format(line.product.price)}
                                </p>
                              )}
                            </div>
                          </div>

                          {line.product.type === 'SERVICE' ? (
                            <div className="flex flex-col gap-2">
                              {hasSchedule ? (
                                <div className="rounded-md border border-slate-200 bg-slate-50 p-2 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300">
                                  <p className="mb-1 flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-200">
                                    <Calendar className="h-3.5 w-3.5" />
                                    {scheduleDate}
                                  </p>
                                  <p className="flex items-center gap-1 text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                    <Clock className="h-3 w-3" />
                                    {scheduleTime}
                                  </p>
                                  {line.staffName && (
                                    <p className="mt-1 text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                      Staff: {line.staffName}
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 rounded-md border border-dashed border-amber-400 bg-amber-50 p-2 text-xs text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
                                  <AlertTriangle className="h-3.5 w-3.5" />
                                  Jadwal layanan belum dipilih
                                </div>
                              )}
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  className="flex-1 border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-transparent dark:text-slate-200 dark:hover:bg-slate-800"
                                  onClick={() => openScheduleEditor(line)}
                                >
                                  Atur Jadwal
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="flex-none text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400"
                                  onClick={() => handleRemoveProduct(line.product.id)}
                                >
                                  Hapus
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <Button
                                  size="icon"
                                  variant="secondary"
                                  className="h-8 w-8 border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-transparent dark:text-slate-200 dark:hover:bg-slate-800"
                                  onClick={() => handleDecreaseProduct(line.product.id)}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="w-6 text-center text-sm font-semibold text-slate-900 dark:text-slate-100">
                                  {line.quantity}
                                </span>
                                <Button
                                  size="icon"
                                  variant="secondary"
                                  className="h-8 w-8 border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-transparent dark:text-slate-200 dark:hover:bg-slate-800"
                                  onClick={() => handleAddProduct(line.product)}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400"
                                onClick={() => handleRemoveProduct(line.product.id)}
                              >
                                ×
                              </Button>
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>

                <Separator className="border-slate-200 dark:border-slate-800" />

                <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                    <span>Subtotal</span>
                    <span>Rp {currencyFormatter.format(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                    <span>Diskon membership</span>
                    <span>- Rp {currencyFormatter.format(membershipDiscount)}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                    <span>Diskon promo</span>
                    <span>- Rp {currencyFormatter.format(promoDiscount)}</span>
                  </div>
                  {paymentMethod === 'online' && (
                    <>
                      <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                        <span>Biaya aplikasi (3%)</span>
                        <span>+ Rp {currencyFormatter.format(onlineApplicationFee)}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                        <span>Biaya transaksi (2%)</span>
                        <span>+ Rp {currencyFormatter.format(onlineTransactionFee)}</span>
                      </div>
                    </>
                  )}
                  <Separator className="border-slate-200 dark:border-slate-800" />
                  <div className="flex items-center justify-between text-base font-semibold text-slate-900 dark:text-slate-100">
                    <span>Total bayar</span>
                    <span>Rp {currencyFormatter.format(total)}</span>
                  </div>
                </div>

                <div className="mt-auto flex flex-col gap-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleResetCart}
                      disabled={!cartItems.length}
                      className="border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:border-slate-200 disabled:text-slate-400 dark:border-slate-700 dark:bg-transparent dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      Reset
                    </Button>
                    <Button
                      type="button"
                      onClick={handleSubmitOrder}
                      disabled={!canSubmit || isSubmitting}
                      className="bg-red-600 hover:bg-red-500"
                    >
                      {isSubmitting ? 'Memproses...' : 'Buat Pesanan'}
                    </Button>
                  </div>
                  {!canSubmit && cartItems.length > 0 && (
                    <p className="text-xs text-red-500 dark:text-red-400">
                      Pastikan data pelanggan, jadwal layanan, dan pembayaran sudah lengkap sebelum membuat pesanan.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>

      <ServiceScheduleDialog
        open={Boolean(scheduleDialogData)}
        product={scheduleDialogData?.product ?? null}
        existingSelection={scheduleDialogData?.selection}
        onClose={handleCloseScheduleDialog}
        onConfirm={handleScheduleConfirm}
      />

      <QRISViewModal
        open={showQRISModal}
        onOpenChange={setShowQRISModal}
        outletId={selectedOutlet.id}
        outletName={selectedOutlet.name}
        qrisImageUrl={qrisImage ?? undefined}
      />

      <Dialog open={Boolean(onlinePaymentResult)} onOpenChange={(value) => !value && resetPaymentState()}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Instruksi Pembayaran Online</DialogTitle>
            <DialogDescription>
              Bagikan instruksi berikut ke pelanggan dan pantau status pembayaran secara real-time dari dashboard.
            </DialogDescription>
          </DialogHeader>

          {onlinePaymentResult ? (
            <div className="space-y-6">
              {(isPaymentSettled || isPaymentRejected) && (
                <section
                  className={`rounded-lg border p-4 ${isPaymentSettled ? 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200' : 'border-red-300 bg-red-50 text-red-900 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200'}`}
                >
                  <p className="font-semibold">
                    {isPaymentSettled ? 'Pembayaran berhasil! Pesanan siap diproses.' : 'Pembayaran gagal. Silakan bantu pelanggan memilih opsi lain.'}
                  </p>
                  <p className="text-sm">
                    {isPaymentSettled
                      ? 'Modal akan menutup otomatis setelah beberapa detik. Kamu bisa lanjut melayani pelanggan berikutnya.'
                      : 'Tutup modal ini lalu bantu pelanggan memilih metode pembayaran lain atau ulangi proses.'}
                  </p>
                </section>
              )}

              <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60 sm:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Order ID</p>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                    {onlinePaymentResult.order.id}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Dibuat {formatDateTime(onlinePaymentResult.order.createdAt)}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Metode</p>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                    {paymentChannelLabel}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Total bayar termasuk fee: Rp {currencyFormatter.format(onlinePaymentResult.order.totalAmount)}
                  </p>
                </div>
              </section>

              {onlinePaymentResult.transaction.midtrans ? (
                <section className="space-y-4">
                  {onlinePaymentResult.transaction.midtrans.qrUrl && (
                    <div className="rounded-lg border border-slate-200 bg-white p-4 text-center dark:border-slate-800 dark:bg-slate-900/60">
                      <p className="mb-3 text-sm font-medium text-slate-700 dark:text-slate-300">QRIS Dinamis</p>
                      <div className="mx-auto inline-flex rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-950">
                        <img
                          src={onlinePaymentResult.transaction.midtrans.qrUrl}
                          alt="QRIS Dinamis"
                          className="h-56 w-56 object-contain"
                        />
                      </div>
                      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                        Tunjukkan QR ini ke pelanggan untuk discan melalui aplikasi e-wallet.
                      </p>
                    </div>
                  )}

                  {onlinePaymentResult.transaction.midtrans.paymentCode && (
                    <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Kode Pembayaran</p>
                          <p className="text-2xl font-semibold tracking-wider text-slate-900 dark:text-slate-100">
                            {onlinePaymentResult.transaction.midtrans.paymentCode}
                          </p>
                        </div>
                        <Button
                          variant="secondary"
                          onClick={() => handleCopyToClipboard(onlinePaymentResult.transaction.midtrans?.paymentCode ?? '')}
                          className="border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                          <Copy className="mr-2 h-4 w-4" /> Salin kode
                        </Button>
                      </div>
                      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Berikan kode ini kepada pelanggan untuk disalin ke aplikasi pembayaran.</p>
                    </div>
                  )}

                  {onlinePaymentResult.transaction.midtrans.vaNumbers?.length ? (
                    <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Virtual Account</p>
                      {onlinePaymentResult.transaction.midtrans.vaNumbers.map((va) => (
                        <div key={`${va.bank}-${va.vaNumber}`} className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-950">
                          <div>
                            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{va.bank}</p>
                            <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{va.vaNumber}</p>
                          </div>
                          <Button
                            variant="ghost"
                            onClick={() => handleCopyToClipboard(va.vaNumber)}
                            className="text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400"
                          >
                            <Copy className="mr-2 h-4 w-4" /> Salin VA
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {onlinePaymentResult.transaction.midtrans.instructions?.length ? (
                    <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Langkah Pembayaran</p>
                      {onlinePaymentResult.transaction.midtrans.instructions.map((instruction, index) => (
                        <div key={`${instruction.title}-${index}`} className="space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950/60">
                          <p className="font-semibold text-slate-800 dark:text-slate-200">{instruction.title}</p>
                          <ol className="list-decimal space-y-1 pl-4 text-sm text-slate-600 dark:text-slate-400">
                            {instruction.steps.map((step, stepIndex) => (
                              <li key={`step-${index}-${stepIndex}`}>{step}</li>
                            ))}
                          </ol>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </section>
              ) : (
                <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300">
                  Detail pembayaran online belum tersedia. Silakan cek dashboard transaksi atau hubungi admin.
                </div>
              )}

              <div className="rounded-lg border border-orange-300 bg-orange-50 p-4 text-sm text-orange-800 dark:border-orange-500/40 dark:bg-orange-500/10 dark:text-orange-200">
                <div className="flex items-start gap-2">
                  <Clock className="mt-0.5 h-4 w-4" />
                  <p>
                    Transaksi akan kadaluarsa {formatDateTime(onlinePaymentResult.transaction.midtrans?.expiredAt)}. Pastikan pelanggan menyelesaikan pembayaran sebelum waktu tersebut.
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button onClick={resetPaymentState} className="bg-red-600 hover:bg-red-500">
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}