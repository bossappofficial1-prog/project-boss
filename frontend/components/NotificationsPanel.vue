<template>
    <BaseCard>
        <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-bold text-gray-900 dark:text-gray-100">Notifikasi Terbaru</h2>
            <BaseButton size="sm" variant="outline" @click="refresh">Refresh</BaseButton>
        </div>

        <div v-if="pending" class="py-6 text-center">
            <BaseLoading />
            <p class="text-gray-500 mt-2">Memuat notifikasi...</p>
        </div>

        <div v-else-if="error" class="py-6 text-center">
            <Icon name="mdi:alert-circle-outline" size="32" class="text-red-400 mx-auto mb-2" />
            <p class="text-gray-500">Gagal memuat notifikasi</p>
        </div>

        <div v-else class="space-y-3">
            <div v-for="(n, idx) in (data?.data?.items || [])" :key="idx" :class="badgeClass(n.type)"
                class="rounded-lg border p-4">
                <div class="flex items-center justify-between">
                    <div class="font-semibold">{{ n.title }}</div>
                    <div class="text-xs text-gray-500">{{ formatTime(n.time) }}</div>
                </div>
                <div class="text-gray-700 dark:text-gray-300 mt-1">
                    {{ n.message }}
                </div>
            </div>
        </div>
    </BaseCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useNotifications } from '~/composables/useNotifications'

const props = defineProps<{ threshold?: number }>()
const { data, pending, error, refresh } = useNotifications({ threshold: props.threshold ?? 5 })

const badgeClass = (type: string) => {
    switch (type) {
        case 'NEW_ORDERS':
            return 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
        case 'LOW_STOCK':
            return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
        case 'WEEKLY_REPORT':
            return 'bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-800'
        default:
            return 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
    }
}

const formatTime = (iso: string) => {
    try {
        const d = new Date(iso)
        return d.toLocaleString()
    } catch {
        return ''
    }
}
</script>
