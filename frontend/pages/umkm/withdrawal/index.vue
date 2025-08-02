<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import type { ApiResponse } from '~/types'

definePageMeta({
  layout: 'umkm',
  middleware: ['auth', 'owner', 'business-required']
})

const auth = useAuthStore()
const toast = useToast()
const pageTitle = 'Penarikan Dana'

interface WithdrawalCalculation {
  totalOrders: number
  grossRevenue: number
  midtransFeeDeducted: number
  appFeeDeducted: number
  netRevenue: number
  canWithdraw: boolean
  minimumWithdrawalAmount: number
}

const { data: calculation, pending, error, refresh } = useApi<WithdrawalCalculation>(
  `/withdrawals/business/${auth.business?.id}/calculation`,
  {
    lazy: true,
    immediate: true
  }
)

const amount = ref<number | null>(null)
const isLoading = ref(false)
const submissionError = ref<string | null>(null)

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(value)
}

const submitWithdrawal = async () => {
  if (!amount.value) {
    submissionError.value = 'Jumlah penarikan harus diisi.'
    return
  }
  if (calculation.value?.data && amount.value < calculation.value.data.minimumWithdrawalAmount) {
    submissionError.value = `Jumlah penarikan minimum adalah ${formatCurrency(calculation.value.data.minimumWithdrawalAmount)}.`
    return
  }
  if (calculation.value?.data && amount.value > calculation.value.data.netRevenue) {
    submissionError.value = 'Jumlah penarikan tidak boleh melebihi pendapatan bersih.'
    return
  }

  isLoading.value = true
  submissionError.value = null

  try {
    const { error: postError } = await useApi(
      `/withdrawals/business/${auth.business?.id}/request`,
      {
        method: 'POST',
        body: { amount: amount.value }
      }
    )

    if (postError.value) {
      throw new Error(postError.value.data?.message || 'Gagal mengajukan penarikan.')
    }

    toast.add({
      title: 'Berhasil!',
      description: 'Permintaan penarikan dana Anda telah berhasil diajukan.',
      color: 'success'
    })
    amount.value = null
    refresh() // Refresh calculation data
  } catch (e: any) {
    submissionError.value = e.message
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold mb-6">{{ pageTitle }}</h1>
    <div class="space-y-6">
      <BaseCard>
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold">Kalkulasi Penarikan</h2>
          <BaseButton size="sm" @click="refresh" :disabled="pending">
            <Icon name="mdi:refresh" :class="{'animate-spin': pending}" />
            Refresh
          </BaseButton>
        </div>
        <div v-if="pending">
          <p>Memuat data kalkulasi...</p>
        </div>
        <div v-else-if="error">
          <p class="text-red-500">Gagal memuat data kalkulasi.</p>
        </div>
        <div v-else-if="calculation?.data" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="text-sm font-medium text-gray-500">Total Pesanan</label>
            <p class="text-lg font-semibold">{{ calculation.data.totalOrders }}</p>
          </div>
          <div>
            <label class="text-sm font-medium text-gray-500">Pendapatan Kotor</label>
            <p class="text-lg font-semibold">{{ formatCurrency(calculation.data.grossRevenue) }}</p>
          </div>
          <div>
            <label class="text-sm font-medium text-gray-500">Potongan Biaya Midtrans</label>
            <p class="text-lg font-semibold">{{ formatCurrency(calculation.data.midtransFeeDeducted) }}</p>
          </div>
          <div>
            <label class="text-sm font-medium text-gray-500">Potongan Biaya Aplikasi</label>
            <p class="text-lg font-semibold">{{ formatCurrency(calculation.data.appFeeDeducted) }}</p>
          </div>
          <div>
            <label class="text-sm font-medium text-gray-500">Pendapatan Bersih</label>
            <p class="text-lg font-semibold">{{ formatCurrency(calculation.data.netRevenue) }}</p>
          </div>
          <div>
            <label class="text-sm font-medium text-gray-500">Status Penarikan</label>
            <p class="text-lg font-semibold" :class="calculation.data.canWithdraw ? 'text-green-500' : 'text-red-500'">
              {{ calculation.data.canWithdraw ? 'Bisa Melakukan Penarikan' : 'Tidak Bisa Melakukan Penarikan' }}
            </p>
          </div>
          <div>
            <label class="text-sm font-medium text-gray-500">Minimum Penarikan</label>
            <p class="text-lg font-semibold">{{ formatCurrency(calculation.data.minimumWithdrawalAmount) }}</p>
          </div>
        </div>
      </BaseCard>
      
      <BaseCard>
        <h2 class="text-xl font-semibold mb-4">Ajukan Penarikan</h2>
        <form v-if="calculation?.data?.canWithdraw" @submit.prevent="submitWithdrawal" class="space-y-4">
          <div>
            <label for="amount" class="block text-sm font-medium text-gray-700">Jumlah Penarikan</label>
            <div class="mt-1">
              <input
                id="amount"
                v-model.number="amount"
                type="number"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                :min="calculation.data.minimumWithdrawalAmount"
                :max="calculation.data.netRevenue"
                placeholder="Masukkan jumlah"
                required
              />
            </div>
            <p class="text-sm text-gray-500 mt-1">
              Saldo yang dapat ditarik: {{ formatCurrency(calculation.data.netRevenue) }}
            </p>
          </div>
          
          <div v-if="submissionError" class="text-red-500 text-sm">
            {{ submissionError }}
          </div>

          <BaseButton type="submit" :disabled="isLoading">
            <span v-if="isLoading">
              <Icon name="lucide:loader-2" class="animate-spin mr-2" />
              Mengajukan...
            </span>
            <span v-else>Ajukan Penarikan</span>
          </BaseButton>
        </form>
        <div v-else>
          <p class="text-gray-600">Anda belum dapat melakukan penarikan saat ini. Silakan periksa kembali nanti.</p>
        </div>
      </BaseCard>
    </div>
  </div>
</template>