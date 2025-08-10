<template>
  <div class="border-t border-gray-200 dark:border-gray-700 pt-4">
    <div class="flex items-center justify-between mb-3">
      <h4 class="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
        <Icon name="lucide:tag" class="h-4 w-4 text-red-600 dark:text-red-400" />
        Kode Promo
      </h4>
      <button 
        v-if="showAvailablePromos && !hasAppliedPromo"
        type="button"
        @click="togglePromoList"
        class="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
        :aria-expanded="showPromoList"
        aria-label="Lihat promo yang tersedia">
        {{ showPromoList ? 'Sembunyikan' : 'Lihat promo tersedia' }}
      </button>
    </div>
    
    <!-- Available Promos List -->
    <div 
      v-if="showPromoList && showAvailablePromos && !hasAppliedPromo"
      class="mb-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
      role="region"
      aria-label="Daftar promo yang tersedia">
      <p class="text-xs text-gray-600 dark:text-gray-400 mb-2">Promo yang tersedia:</p>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <button 
          v-for="(promo, code) in availablePromos" 
          :key="code"
          type="button"
          @click="selectPromo(code)"
          :disabled="subtotal < (promo.minPurchaseAmount || 0)"
          class="text-left p-2 rounded-md border border-gray-200 dark:border-gray-600 hover:border-red-300 dark:hover:border-red-600 hover:bg-white dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs">
          <div class="font-medium text-gray-900 dark:text-white">{{ code }}</div>
          <div class="text-gray-600 dark:text-gray-400 text-xs">{{ promo.description }}</div>
          <div v-if="promo.minPurchaseAmount" class="text-gray-500 dark:text-gray-500 text-xs">
            Min: {{ formatPrice(promo.minPurchaseAmount) }}
          </div>
        </button>
      </div>
    </div>
    
    <!-- Promo Input -->
    <div class="flex gap-2">
      <div class="flex-1">
        <input 
          :id="inputId"
          v-model="localPromoCode"
          type="text" 
          :placeholder="placeholder"
          :disabled="hasAppliedPromo"
          :class="[
            'w-full px-4 py-2 border rounded-lg transition-colors duration-200',
            hasAppliedPromo 
              ? 'border-green-300 dark:border-green-600 bg-green-50 dark:bg-green-900/20 text-green-900 dark:text-green-200'
              : validationError
                ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20'
                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-red-500'
          ]"
          :aria-describedby="`${inputId}-error ${inputId}-success`"
          @keyup.enter="!hasAppliedPromo && handleApplyPromo()" />
      </div>
      <button 
        v-if="!hasAppliedPromo"
        type="button"
        @click="handleApplyPromo"
        :disabled="!localPromoCode.trim() || isValidating"
        class="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition-colors duration-200 flex items-center gap-1 disabled:cursor-not-allowed focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none"
        :aria-label="isValidating ? 'Sedang memvalidasi kode promo' : 'Terapkan kode promo'">
        <Icon v-if="isValidating" name="lucide:loader-2" class="h-4 w-4 animate-spin" />
        <span v-else>Terapkan</span>
      </button>
      <button 
        v-else
        type="button"
        @click="handleRemovePromo"
        class="px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors duration-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:outline-none"
        aria-label="Hapus kode promo">
        <Icon name="lucide:x" class="h-4 w-4" />
      </button>
    </div>
    
    <!-- Applied Promo Display -->
    <div 
      v-if="hasAppliedPromo"
      :id="`${inputId}-success`"
      class="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg slide-in"
      role="status"
      aria-live="polite">
      <div class="flex items-center gap-2 text-green-600 dark:text-green-400">
        <Icon name="lucide:check-circle" class="h-4 w-4" />
        <span class="text-sm font-medium">Promo diterapkan: {{ appliedPromoCode }}</span>
      </div>
      <p class="text-xs text-green-600 dark:text-green-400 mt-1">
        Hemat {{ formatPrice(discountAmount) }}
      </p>
      <p v-if="appliedPromo?.description" class="text-xs text-green-700 dark:text-green-300 mt-1">
        {{ appliedPromo.description }}
      </p>
      <!-- Business Specific Indicator -->
      <div v-if="appliedPromo?.businessSpecific" 
           class="inline-flex items-center mt-2 px-2 py-1 bg-green-100 dark:bg-green-800/30 rounded-full">
        <Icon name="lucide:building-2" class="w-3 h-3 text-green-600 dark:text-green-400 mr-1" />
        <span class="text-xs text-green-600 dark:text-green-400 font-medium">Promo khusus outlet</span>
      </div>
    </div>
    
    <!-- Error Display -->
    <p 
      v-if="validationError" 
      :id="`${inputId}-error`"
      class="text-red-600 dark:text-red-400 text-xs mt-1"
      role="alert"
      aria-live="assertive">
      {{ validationError }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { usePromo } from '@/composables/usePromo'

interface Props {
  subtotal: number
  outletId?: string
  placeholder?: string
  showAvailablePromos?: boolean
  inputId?: string
}

interface Emits {
  (e: 'promo-applied', promo: any): void
  (e: 'promo-removed'): void
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Masukkan kode promo',
  showAvailablePromos: true,
  inputId: 'promo-code'
})

const emit = defineEmits<Emits>()

const {
  isValidating,
  appliedPromo,
  validationError,
  hasAppliedPromo,
  discountAmount,
  promoCode: appliedPromoCode,
  applyPromo,
  removePromo,
  formatPrice
} = usePromo()

// Local state
const localPromoCode = ref('')
const showPromoList = ref(false)

// Available promos (could be fetched from API in real implementation)
const availablePromos = {
  'WELCOME20': {
    description: 'Diskon 20% untuk pelanggan baru',
    minPurchaseAmount: 50000
  },
  'HEMAT25K': {
    description: 'Potongan Rp 25.000 minimal pembelian Rp 100.000',
    minPurchaseAmount: 100000
  },
  'BEAUTY15': {
    description: 'Diskon 15% untuk semua treatment',
    minPurchaseAmount: 80000
  },
  'CANTIK50K': {
    description: 'Cashback Rp 50.000 minimal treatment Rp 200.000',
    minPurchaseAmount: 200000
  },
  'TECHFIX30': {
    description: 'Diskon 30% untuk perbaikan pertama',
    minPurchaseAmount: 75000
  }
}

const togglePromoList = () => {
  showPromoList.value = !showPromoList.value
}

const selectPromo = (code: string) => {
  localPromoCode.value = code
  showPromoList.value = false
  handleApplyPromo()
}

const handleApplyPromo = async () => {
  const success = await applyPromo(localPromoCode.value, props.subtotal, props.outletId)
  if (success && appliedPromo.value) {
    emit('promo-applied', appliedPromo.value)
  }
}

const handleRemovePromo = () => {
  removePromo()
  localPromoCode.value = ''
  showPromoList.value = false
  emit('promo-removed')
}

// Update local code when applied promo changes
watch(appliedPromoCode, (newCode) => {
  if (newCode) {
    localPromoCode.value = newCode
  }
})
</script>

<style scoped>
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.slide-in {
  animation: slideIn 0.3s ease-out;
}
</style>
