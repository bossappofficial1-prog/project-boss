<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import type { Expense } from '~/types'

definePageMeta({
  layout: 'umkm',
  middleware: ["auth", 'owner', 'business-required']
})

const auth = useAuthStore()
const isLoading = ref(false)
const expenses = ref<Expense[]>([])

const fetchExpenses = async () => {
  isLoading.value = true
  try {
    const { data, error } = await useApi<{ expenses: Expense[] }>(`/api/expenses/outlet/${auth.selectedOutlet?.id}`)
    if (error.value) {
      console.error('Failed to fetch expenses:', error.value)
      const toast = useToast()
      toast.add({
        title: 'Error!',
        description: 'Gagal memuat daftar pengeluaran.',
        color: 'error'
      })
      return
    }
    expenses.value = data.value?.data?.expenses || []
  } catch (error) {
    console.error('Expenses fetch error:', error)
    const toast = useToast()
    toast.add({
      title: 'Error!',
      description: 'Terjadi kesalahan saat memuat daftar pengeluaran.',
      color: 'error'
    })
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  if (auth.selectedOutlet?.id) {
    fetchExpenses()
  }
})

watch(() => auth.selectedOutlet?.id, (newId, oldId) => {
  if (newId && newId !== oldId) {
    fetchExpenses()
  }
})

const deleteExpense = async (expenseId: string) => {
  if (!confirm('Apakah Anda yakin ingin menghapus pengeluaran ini?')) return

  isLoading.value = true
  try {
    const { error } = await useApi(`/api/expenses/delete/${expenseId}`, {
      method: 'DELETE'
    })

    if (error.value) {
      const toast = useToast()
      toast.add({
        title: 'Error!',
        description: error.value.data?.message || 'Gagal menghapus pengeluaran.',
        color: 'error'
      })
      return
    }

    const toast = useToast()
    toast.add({
      title: 'Berhasil!',
      description: 'Pengeluaran berhasil dihapus.',
      color: 'success'
    })
    fetchExpenses() // Refresh the list
  } catch (error) {
    console.error('Delete expense error:', error)
    const toast = useToast()
    toast.add({
      title: 'Error!',
      description: 'Terjadi kesalahan saat menghapus pengeluaran.',
      color: 'error'
    })
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Daftar Pengeluaran</h1>
      <NuxtLink to="/umkm/expense/create">
        <BaseButton>
          <Icon name="mdi:plus" size="16" class="mr-2" />
          Tambah Pengeluaran
        </BaseButton>
      </NuxtLink>
    </div>

    <BaseCard>
      <div v-if="isLoading" class="p-4 text-center">
        <Icon name="lucide:loader-2" size="32" class="animate-spin text-primary-500" />
        <p class="text-gray-500 mt-2">Memuat pengeluaran...</p>
      </div>
      <div v-else-if="expenses.length === 0" class="text-center py-12">
        <Icon name="lucide:wallet" size="64" class="text-gray-400 mx-auto mb-4" />
        <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          Belum ada pengeluaran
        </h3>
        <p class="text-gray-500 dark:text-gray-400 mb-4">
          Catat pengeluaran pertama Anda
        </p>
        <NuxtLink to="/umkm/expense/create">
          <BaseButton>
            <Icon name="mdi:plus" size="16" class="mr-2" />
            Tambah Pengeluaran
          </BaseButton>
        </NuxtLink>
      </div>
      <BaseTable v-else>
        <template #thead>
          <thead>
            <BaseTableHeader>Deskripsi</BaseTableHeader>
            <BaseTableHeader>Jumlah</BaseTableHeader>
            <BaseTableHeader>Tanggal</BaseTableHeader>
            <BaseTableHeader>Aksi</BaseTableHeader>
          </thead>
        </template>
        <tbody>
          <BaseTableRow v-for="expense in expenses" :key="expense.id">
            <td class="px-4 py-3">{{ expense.description }}</td>
            <td class="px-4 py-3">Rp{{ expense.amount.toLocaleString('id-ID') }}</td>
            <td class="px-4 py-3">{{ new Date(expense.date).toLocaleDateString('id-ID') }}</td>
            <td class="px-4 py-3">
              <div class="flex space-x-2">
                <NuxtLink :to="`/umkm/expense/${expense.id}/edit`">
                  <BaseButton size="sm" variant="outline">Edit</BaseButton>
                </NuxtLink>
                <BaseButton size="sm" variant="error" @click="deleteExpense(expense.id)">Hapus</BaseButton>
              </div>
            </td>
          </BaseTableRow>
        </tbody>
      </BaseTable>
    </BaseCard>
  </div>
</template>
