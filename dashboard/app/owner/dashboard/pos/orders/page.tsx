'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useOutletContext } from '@/components/providers/OutletProvider'
import { productApi } from '@/lib/api'
import { resolveUploadImageUrl } from '@/lib/url'

type Props = {}

export default function POSOrdersPage({}: Props) {
  const router = useRouter()
  const { selectedOutlet } = useOutletContext()
  const [products, setProducts] = React.useState<any[]>([])
  const [selectedProducts, setSelectedProducts] = React.useState<{[key: string]: number}>({})
  const [customerName, setCustomerName] = React.useState('')
  const [customerPhone, setCustomerPhone] = React.useState('')
  const [paymentMethod, setPaymentMethod] = React.useState<'cash' | 'qris' | 'online'>('cash')
  const [loading, setLoading] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState('')

  // Fetch products
  React.useEffect(() => {
    if (selectedOutlet?.id) {
      fetchProducts()
    }
  }, [selectedOutlet])

  const fetchProducts = async () => {
    try {
      const data = await productApi.getByOutlet(selectedOutlet!.id, { search: searchQuery })
      setProducts(data.filter((p: any) => p.type === 'GOODS'))
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  const addToCart = (productId: string) => {
    setSelectedProducts(prev => ({
      ...prev,
      [productId]: (prev[productId] || 0) + 1
    }))
  }

  const removeFromCart = (productId: string) => {
    setSelectedProducts(prev => {
      const newQuantity = (prev[productId] || 0) - 1
      if (newQuantity <= 0) {
        const { [productId]: removed, ...rest } = prev
        return rest
      }
      return { ...prev, [productId]: newQuantity }
    })
  }

  const getCartItems = () => {
    return products.filter(p => selectedProducts[p.id] > 0)
      .map(p => ({ ...p, quantity: selectedProducts[p.id] }))
  }

  const getTotal = () => {
    return getCartItems().reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  const handleSubmitOrder = async () => {
    if (!selectedOutlet?.id) {
      alert('Pilih outlet terlebih dahulu')
      return
    }
    
    const cartItems = getCartItems()
    if (cartItems.length === 0) {
      alert('Pilih minimal satu produk')
      return
    }

    if (!customerName.trim()) {
      alert('Nama pelanggan wajib diisi')
      return
    }

    // Phone is required for guest customer identification
    if (!customerPhone.trim()) {
      alert('Nomor telepon wajib diisi')
      return
    }

    try {
      setLoading(true)
      
      const orderData = {
        guestCustomer: {
          name: customerName.trim(),
          phone: customerPhone.trim()
        },
        outletId: selectedOutlet.id,
        items: cartItems.map(item => ({
          productId: item.id,
          quantity: item.quantity
        })),
        paymentMethod: paymentMethod
      }

      console.log('Creating order:', orderData)
      
      const { default: orderApi } = await import('@/lib/apis/order')
      const result = await orderApi.create(orderData)
      
      console.log('Order created successfully:', result)
      
      // Reset form
      setSelectedProducts({})
      setCustomerName('')
      setCustomerPhone('')
      setPaymentMethod('cash')
      
      // Show success message and redirect
      alert(`Pesanan berhasil dibuat! Order ID: ${result.orderId}`)
      router.push('/owner/dashboard/orders')
      
    } catch (error: any) {
      console.error('Error creating order:', error)
      const errorMessage = error?.message || error?.response?.data?.message || 'Gagal membuat pesanan'
      alert(errorMessage)
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
            <p className="text-gray-500 dark:text-gray-400">Pilih outlet terlebih dahulu untuk menggunakan sistem POS</p>
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
            POS - Tambah Pesanan Baru
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Outlet: <span className="font-semibold">{selectedOutlet.name}</span>
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Products Grid */}
          <div className="xl:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex flex-col sm:flex-row gap-4">
                  <input
                    type="text"
                    placeholder="Cari produk..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                  <button
                    onClick={fetchProducts}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors whitespace-nowrap"
                  >
                    Cari
                  </button>
                </div>
              </div>

              <div className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                  {products.map((product) => (
                    <div key={product.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg mb-3 overflow-hidden">
                        {product.image ? (
                          <img 
                            src={resolveUploadImageUrl(product.image) || 'https://png.pngtree.com/png-vector/20230808/ourmid/pngtree-goods-and-services-vector-png-image_6891390.png'} 
                            alt={product.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = 'https://png.pngtree.com/png-vector/20230808/ourmid/pngtree-goods-and-services-vector-png-image_6891390.png';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1 line-clamp-2">{product.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Stok: {product.quantity || 0}</p>
                      <p className="text-lg font-semibold text-red-600 dark:text-red-400 mb-3">
                        Rp {product.price.toLocaleString('id-ID')}
                      </p>
                      <button
                        onClick={() => addToCart(product.id)}
                        disabled={product.quantity <= 0}
                        className="w-full px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed touch-manipulation"
                      >
                        {product.quantity <= 0 ? 'Stok Habis' : 'Tambah'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Cart & Customer Info - Fixed on mobile */}
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Metode Pembayaran *</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as 'cash' | 'qris' | 'online')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-base"
                  >
                    <option value="cash">Cash / Bayar di Tempat</option>
                    <option value="qris">QRIS</option>
                    <option value="online">Transfer Online</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Cart */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Keranjang</h3>
              <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                {getCartItems().map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">{item.name}</p>
                      <p className="text-red-600 dark:text-red-400 text-sm">Rp {item.price.toLocaleString('id-ID')}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="w-8 h-8 bg-red-100 dark:bg-red-900/20 text-red-600 rounded flex items-center justify-center hover:bg-red-200 dark:hover:bg-red-900/40 touch-manipulation"
                      >
                        -
                      </button>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100 min-w-[24px] text-center">{item.quantity}</span>
                      <button
                        onClick={() => addToCart(item.id)}
                        className="w-8 h-8 bg-red-100 dark:bg-red-900/20 text-red-600 rounded flex items-center justify-center hover:bg-red-200 dark:hover:bg-red-900/40 touch-manipulation"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
                {getCartItems().length === 0 && (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">Keranjang kosong</p>
                )}
              </div>

              {getCartItems().length > 0 && (
                <>
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-4">
                    <div className="flex justify-between text-lg font-semibold text-gray-900 dark:text-gray-100">
                      <span>Total:</span>
                      <span>Rp {getTotal().toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                  <button
                    onClick={handleSubmitOrder}
                    disabled={loading || !customerName.trim() || !customerPhone.trim()}
                    className="w-full px-4 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed touch-manipulation text-base"
                  >
                    {loading ? 'Memproses...' : 'Buat Pesanan'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}