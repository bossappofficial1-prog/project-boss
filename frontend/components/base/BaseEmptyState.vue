<script setup>
defineProps({
  icon: {
    type: String,
    default: 'lucide:inbox'
  },
  title: {
    type: String,
    default: 'Tidak ada data'
  },
  description: {
    type: String,
    default: 'Belum ada data yang tersedia untuk ditampilkan.'
  },
  actionText: {
    type: String,
    default: ''
  },
  actionIcon: {
    type: String,
    default: 'lucide:plus'
  },
  compact: {
    type: Boolean,
    default: false
  }
})

defineEmits(['action'])
</script>

<template>
  <div :class="[
    'flex flex-col items-center justify-center text-center',
    compact ? 'py-8' : 'py-16'
  ]">
    <!-- Icon -->
    <div :class="[
      'rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-6',
      compact ? 'w-16 h-16' : 'w-24 h-24'
    ]">
      <Icon :name="icon" :size="compact ? '32' : '48'" class="text-gray-400 dark:text-gray-500" />
    </div>

    <!-- Title -->
    <h3 :class="[
      'font-semibold text-gray-900 dark:text-white mb-2',
      compact ? 'text-lg' : 'text-xl'
    ]">
      {{ title }}
    </h3>

    <!-- Description -->
    <p :class="[
      'text-gray-600 dark:text-gray-400 mb-6 max-w-md',
      compact ? 'text-sm' : 'text-base'
    ]">
      {{ description }}
    </p>

    <!-- Action Button -->
    <BaseButton v-if="actionText" @click="$emit('action')" class="shadow-md hover:shadow-lg">
      <Icon :name="actionIcon" class="mr-2" size="16" />
      {{ actionText }}
    </BaseButton>

    <!-- Custom Action Slot -->
    <slot name="action" />
  </div>
</template>
