// composables/usePromo.ts
import { ref, computed } from 'vue'
import { useApi } from './useApi'

interface PromoInfo {
  code: string
  type: 'PERCENTAGE' | 'FIXED_AMOUNT'
  value: number
  discountAmount: number
  description?: string
  minPurchaseAmount?: number
  maxUses?: number
  timesUsed?: number
  validUntil?: Date
  businessSpecific?: boolean
}

export function usePromo() {
  const isValidating = ref(false)
  const appliedPromo = ref<PromoInfo | null>(null)
  const validationError = ref<string | null>(null)

  // Mock promo data based on backend seed
  const mockPromos: Record<string, Omit<PromoInfo, 'code' | 'discountAmount'>> = {
    'WELCOME20': {
      type: 'PERCENTAGE',
      value: 20,
      minPurchaseAmount: 50000,
      maxUses: 100,
      timesUsed: 15,
      description: 'Diskon 20% untuk pelanggan baru'
    },
    'HEMAT25K': {
      type: 'FIXED_AMOUNT',
      value: 25000,
      minPurchaseAmount: 100000,
      maxUses: 50,
      timesUsed: 8,
      description: 'Potongan Rp 25.000 minimal pembelian Rp 100.000'
    },
    'BEAUTY15': {
      type: 'PERCENTAGE',
      value: 15,
      minPurchaseAmount: 80000,
      maxUses: 30,
      timesUsed: 5,
      description: 'Diskon 15% untuk semua treatment'
    },
    'CANTIK50K': {
      type: 'FIXED_AMOUNT',
      value: 50000,
      minPurchaseAmount: 200000,
      maxUses: 25,
      timesUsed: 3,
      description: 'Cashback Rp 50.000 minimal treatment Rp 200.000'
    },
    'TECHFIX30': {
      type: 'PERCENTAGE',
      value: 30,
      minPurchaseAmount: 75000,
      maxUses: 15,
      timesUsed: 2,
      description: 'Diskon 30% untuk perbaikan pertama'
    }
  }

  const calculateDiscount = (subtotal: number, promoInfo: Omit<PromoInfo, 'code' | 'discountAmount'>): number => {
    let discountAmount = 0
    
    if (promoInfo.type === 'PERCENTAGE') {
      discountAmount = Math.round(subtotal * promoInfo.value / 100)
    } else if (promoInfo.type === 'FIXED_AMOUNT') {
      discountAmount = promoInfo.value
    }
    
    // Ensure discount doesn't exceed subtotal
    return Math.min(discountAmount, subtotal)
  }

  // Simulate business-specific promo validation
  const validatePromoForBusiness = async (promoCode: string, businessId: string | null, outletId: string | undefined): Promise<boolean> => {
    // For production, this would be an API call to check if promo is valid for the specific business/outlet
    // For now, we'll simulate business-specific rules based on the promo code pattern
    
    if (!outletId) {
      // If no outletId provided, allow all promos (for testing purposes)
      return true
    }

    // Simulate different business scenarios based on promo codes:
    switch (promoCode) {
      case 'DISCOUNT10':
        // Universal promo - valid for all businesses
        return true
      
      case 'NEWCUSTOMER15':
        // Only valid for businesses that have enabled new customer promos
        // In real scenario, this would be checked via API
        return true
      
      case 'FLASH50':
        // Time-sensitive flash sale - check if business participates
        const currentHour = new Date().getHours()
        // Simulate: only available during specific hours for participating outlets
        return currentHour >= 10 && currentHour <= 22
      
      case 'LOYALTY20':
        // Only for businesses with loyalty program enabled
        // This would normally be checked against business settings
        return businessId !== null // Simulate: if we can get businessId, loyalty is enabled
      
      default:
        // For unknown promo codes, assume they might be business-specific
        // In real implementation, this would be validated via API
        return true
    }
  }

  const validatePromo = async (promoCode: string, subtotal: number, outletId?: string): Promise<PromoInfo | null> => {
    isValidating.value = true
    validationError.value = null

    try {
      const code = promoCode.trim().toUpperCase()
      
      if (!code) {
        throw new Error('Kode promo tidak boleh kosong')
      }

      if (!outletId) {
        throw new Error('Outlet ID diperlukan untuk validasi promo')
      }

      // Use the proper API for business-specific validation
      const { validatePromoForOutlet } = usePromoApi()
      const validationResult = await validatePromoForOutlet(code, outletId, subtotal)

      if (!validationResult.valid) {
        throw new Error(validationResult.message || 'Kode promo tidak valid')
      }

      // Create PromoInfo object from validation result
      const validPromo: PromoInfo = {
        code,
        type: validationResult.type || 'PERCENTAGE',
        value: validationResult.type === 'PERCENTAGE' 
          ? Math.round((validationResult.discount || 0) / subtotal * 100)
          : validationResult.discount || 0,
        discountAmount: validationResult.discount || 0,
        description: validationResult.message || `Berhasil menerapkan kode ${code}`,
        businessSpecific: validationResult.businessSpecific || false
      }

      return validPromo

    } catch (error: any) {
      validationError.value = error.message
      throw error
    } finally {
      isValidating.value = false
    }
  }

  const applyPromo = async (promoCode: string, subtotal: number, outletId?: string): Promise<boolean> => {
    try {
      const promo = await validatePromo(promoCode, subtotal, outletId)
      if (promo) {
        appliedPromo.value = promo
        return true
      }
      return false
    } catch (error) {
      appliedPromo.value = null
      return false
    }
  }

  const removePromo = (): void => {
    appliedPromo.value = null
    validationError.value = null
  }

  const formatPrice = (amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  // Computed properties
  const hasAppliedPromo = computed(() => !!appliedPromo.value)
  const discountAmount = computed(() => appliedPromo.value?.discountAmount || 0)
  const promoCode = computed(() => appliedPromo.value?.code || '')

  return {
    // State
    isValidating,
    appliedPromo,
    validationError,
    
    // Computed
    hasAppliedPromo,
    discountAmount,
    promoCode,
    
    // Methods
    validatePromo,
    applyPromo,
    removePromo,
    calculateDiscount,
    
    // Utils
    formatPrice
  }
}
