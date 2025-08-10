<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useApi } from '~/composables/useApi'
import type { Product, Booking } from '~/types'

definePageMeta({
  layout: 'umkm',
  middleware: ["auth", 'owner', 'business-required']
})

const route = useRoute()
const productId = route.params.id as string

const { data: productData, pending: productPending, error: productError } = useApi<Product>(`/products/${productId}`)
const { data: bookingsData, pending: bookingsPending, error: bookingsError, refresh: refreshBookings } = useApi<{ bookings: Booking[] }>(`/bookings/product/${productId}`)

const product = computed(() => productData.value?.data)
const bookings = computed(() => bookingsData.value?.data?.bookings || [])

const newBooking = ref({
  date: '',
  startTime: '',
  endTime: ''
})

const toast = useToast()

const addBooking = async () => {
  if (!newBooking.value.date || !newBooking.value.startTime || !newBooking.value.endTime) {
    return toast.add({ title: 'Error', description: 'Semua field harus diisi.', color: 'error' })
  }

  const startDateTime = `${newBooking.value.date}T${newBooking.value.startTime}:00.000Z`
  const endDateTime = `${newBooking.value.date}T${newBooking.value.endTime}:00.000Z`

  const { error } = await useApi('/bookings', {
    method: 'POST',
    body: {
      productId: productId,
      date: new Date(newBooking.value.date).toISOString(),
      startTime: new Date(startDateTime).toISOString(),
      endTime: new Date(endDateTime).toISOString()
    }
  })

  if (error.value) {
    return toast.add({ title: 'Gagal Menambah Jadwal', description: error.value.data?.message || 'Terjadi kesalahan', color: 'error' })
  }

  toast.add({ title: 'Berhasil', description: 'Jadwal baru berhasil ditambahkan.', color: 'success' })
  newBooking.value = { date: '', startTime: '', endTime: '' }
  refreshBookings()
}

const deleteBooking = async (bookingId: string) => {
  if (!confirm('Apakah Anda yakin ingin menghapus jadwal ini?')) return

  const { error } = await useApi(`/bookings/${bookingId}`, {
    method: 'DELETE'
  })

  if (error.value) {
    return toast.add({ title: 'Gagal Menghapus Jadwal', description: error.value.data?.message || 'Terjadi kesalahan', color: 'error' })
  }

  toast.add({ title: 'Berhasil', description: 'Jadwal berhasil dihapus.', color: 'success' })
  refreshBookings()
}
</script>

<template>
  <div>
    <BaseBack />
    <div v-if="productPending">
      <BaseLoading />
    </div>
    <div v-else-if="productError">
      <BaseErrorState :error="productError" />
    </div>
    <div v-else-if="product">
      <h1 class="text-2xl font-bold mb-4">Kelola Jadwal untuk {{ product.name }}</h1>

      <div class="my-8">
        <h2 class="text-xl font-semibold mb-4">Tambah Jadwal Baru</h2>
        <form @submit.prevent="addBooking" class="space-y-4">
          <div>
            <label for="date">Tanggal</label>
            <UInput id="date" type="date" v-model="newBooking.date" />
          </div>
          <div>
            <label for="startTime">Waktu Mulai</label>
            <UInput id="startTime" type="time" v-model="newBooking.startTime" />
          </div>
          <div>
            <label for="endTime">Waktu Selesai</label>
            <UInput id="endTime" type="time" v-model="newBooking.endTime" />
          </div>
          <UButton type="submit">Tambah Jadwal</UButton>
        </form>
      </div>

      <div>
        <h2 class="text-xl font-semibold mb-4">Jadwal Tersedia</h2>
        <div v-if="bookingsPending">
          <BaseLoading />
        </div>
        <div v-else-if="bookingsError">
          <BaseErrorState :error="bookingsError" @retry="refreshBookings" />
        </div>
        <div v-else-if="bookings.length === 0">
          <p>Belum ada jadwal yang ditambahkan untuk produk ini.</p>
        </div>
        <ul v-else class="space-y-2">
          <li v-for="booking in bookings" :key="booking.id" class="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p><strong>Tanggal:</strong> {{ new Date(booking.date).toLocaleDateString() }}</p>
              <p><strong>Waktu:</strong> {{ new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }} - {{ new Date(booking.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}</p>
            </div>
            <UButton @click="deleteBooking(booking.id)" color="error" variant="soft" icon="i-heroicons-trash" />
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>