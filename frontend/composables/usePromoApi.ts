/**
 * API composable for promo validation with business/outlet specific logic
 * This composable handles the business logic for promo validation
 */

export const usePromoApi = () => {
  const { $api } = useNuxtApp()

  /**
   * Validate promo code for specific outlet/business
   * In production, this would call the actual backend API
   */
  const validatePromoForOutlet = async (
    promoCode: string, 
    outletId: string, 
    subtotal: number
  ): Promise<{
    valid: boolean
    discount?: number
    type?: 'PERCENTAGE' | 'FIXED_AMOUNT'
    message?: string
    businessSpecific?: boolean
  }> => {
    try {
      // In production, this would be:
      // const response = await $api(`/promos/validate`, {
      //   method: 'POST',
      //   body: {
      //     code: promoCode,
      //     outletId,
      //     subtotal
      //   }
      // })

      // For now, simulate the API response based on business logic
      const response = await simulatePromoValidation(promoCode, outletId, subtotal)
      
      return response
    } catch (error) {
      console.error('Promo validation API error:', error)
      throw new Error('Gagal memvalidasi kode promo. Silakan coba lagi.')
    }
  }

  /**
   * Get outlet business information
   * This is used to determine business-specific promo rules
   */
  const getOutletBusinessInfo = async (outletId: string): Promise<{
    businessId: string
    businessType: string
    promoSettings: {
      allowsNewCustomerPromos: boolean
      allowsLoyaltyPromos: boolean
      allowsFlashSales: boolean
      participatesInGlobalPromos: boolean
    }
  } | null> => {
    try {
      const { data } = await useApi(`/outlets/${outletId}`)
      
      if (data.value?.success) {
        const outletData = (data.value as any).data
        
        // Extract business information
        return {
          businessId: outletData.business?.id || '',
          businessType: outletData.business?.category || 'general',
          promoSettings: {
            // In production, these would come from business settings
            allowsNewCustomerPromos: true,
            allowsLoyaltyPromos: true,
            allowsFlashSales: true,
            participatesInGlobalPromos: true
          }
        }
      }
      
      return null
    } catch (error) {
      console.warn('Failed to get outlet business info:', error)
      return null
    }
  }

  return {
    validatePromoForOutlet,
    getOutletBusinessInfo
  }
}

/**
 * Simulate promo validation with business-specific rules
 * In production, this logic would be handled by the backend
 */
async function simulatePromoValidation(
  promoCode: string, 
  outletId: string, 
  subtotal: number
): Promise<{
  valid: boolean
  discount?: number
  type?: 'PERCENTAGE' | 'FIXED_AMOUNT'
  message?: string
  businessSpecific?: boolean
}> {
  const code = promoCode.toUpperCase()
  
  // Get business info for this outlet
  const { getOutletBusinessInfo } = usePromoApi()
  const businessInfo = await getOutletBusinessInfo(outletId)
  
  // Define business-specific promo rules
  const promoRules: Record<string, {
    type: 'PERCENTAGE' | 'FIXED_AMOUNT'
    value: number
    minPurchase?: number
    requiresBusinessType?: string[]
    requiresBusinessSettings?: (keyof NonNullable<typeof businessInfo>['promoSettings'])[]
    maxDiscount?: number
    businessSpecific: boolean
    description: string
  }> = {
    'DISCOUNT10': {
      type: 'PERCENTAGE',
      value: 10,
      businessSpecific: false, // Universal promo
      description: 'Diskon 10% untuk semua pembelian'
    },
    'NEWCUSTOMER15': {
      type: 'PERCENTAGE',
      value: 15,
      minPurchase: 50000,
      requiresBusinessSettings: ['allowsNewCustomerPromos'],
      businessSpecific: true,
      description: 'Diskon 15% untuk pelanggan baru'
    },
    'FLASH50': {
      type: 'FIXED_AMOUNT',
      value: 50000,
      minPurchase: 150000,
      requiresBusinessSettings: ['allowsFlashSales'],
      businessSpecific: true,
      description: 'Flash Sale - Diskon Rp 50.000'
    },
    'LOYALTY20': {
      type: 'PERCENTAGE',
      value: 20,
      maxDiscount: 100000,
      requiresBusinessSettings: ['allowsLoyaltyPromos'],
      businessSpecific: true,
      description: 'Diskon loyalty 20% maksimal Rp 100.000'
    },
    'BEAUTY25': {
      type: 'PERCENTAGE',
      value: 25,
      requiresBusinessType: ['beauty', 'salon'],
      businessSpecific: true,
      description: 'Diskon khusus salon & beauty 25%'
    },
    'TECHFIX30': {
      type: 'PERCENTAGE',
      value: 30,
      minPurchase: 75000,
      requiresBusinessType: ['technology', 'service'],
      businessSpecific: true,
      description: 'Diskon teknologi 30%'
    }
  }

  const promoRule = promoRules[code]
  
  if (!promoRule) {
    return {
      valid: false,
      message: 'Kode promo tidak ditemukan'
    }
  }

  // Check business-specific requirements
  if (promoRule.businessSpecific && businessInfo) {
    // Check business type requirement
    if (promoRule.requiresBusinessType && 
        !promoRule.requiresBusinessType.includes(businessInfo.businessType)) {
      return {
        valid: false,
        message: 'Kode promo ini tidak berlaku untuk jenis bisnis ini',
        businessSpecific: true
      }
    }

    // Check business settings requirement
    if (promoRule.requiresBusinessSettings) {
      for (const setting of promoRule.requiresBusinessSettings) {
        if (!businessInfo.promoSettings[setting]) {
          return {
            valid: false,
            message: 'Outlet ini tidak berpartisipasi dalam promo ini',
            businessSpecific: true
          }
        }
      }
    }
  }

  // Check minimum purchase
  if (promoRule.minPurchase && subtotal < promoRule.minPurchase) {
    return {
      valid: false,
      message: `Minimal pembelian ${formatPrice(promoRule.minPurchase)} untuk menggunakan kode ini`
    }
  }

  // Calculate discount
  let discount = 0
  if (promoRule.type === 'PERCENTAGE') {
    discount = Math.round(subtotal * promoRule.value / 100)
    if (promoRule.maxDiscount) {
      discount = Math.min(discount, promoRule.maxDiscount)
    }
  } else {
    discount = promoRule.value
  }

  // Ensure discount doesn't exceed subtotal
  discount = Math.min(discount, subtotal)

  return {
    valid: true,
    discount,
    type: promoRule.type,
    businessSpecific: promoRule.businessSpecific,
    message: promoRule.description
  }
}

// Helper function for price formatting
function formatPrice(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount)
}
