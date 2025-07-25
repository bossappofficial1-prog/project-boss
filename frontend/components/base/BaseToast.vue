<script setup>
import { computed } from 'vue'

const props = defineProps({
  variant: {
    type: String,
    default: 'info'
  },
  title: {
    type: String,
    default: ''
  },
  message: {
    type: String,
    required: true
  },
  autoClose: {
    type: Boolean,
    default: true
  },
  duration: {
    type: Number,
    default: 5000
  },
  closable: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['close'])

const variantConfig = computed(() => {
  const configs = {
    success: {
      icon: 'lucide:check-circle',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800',
      iconColor: 'text-green-500 dark:text-green-400',
      titleColor: 'text-green-800 dark:text-green-200',
      messageColor: 'text-green-700 dark:text-green-300'
    },
    error: {
      icon: 'lucide:x-circle',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-800',
      iconColor: 'text-red-500 dark:text-red-400',
      titleColor: 'text-red-800 dark:text-red-200',
      messageColor: 'text-red-700 dark:text-red-300'
    },
    warning: {
      icon: 'lucide:alert-triangle',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
      iconColor: 'text-yellow-500 dark:text-yellow-400',
      titleColor: 'text-yellow-800 dark:text-yellow-200',
      messageColor: 'text-yellow-700 dark:text-yellow-300'
    },
    info: {
      icon: 'lucide:info',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
      iconColor: 'text-blue-500 dark:text-blue-400',
      titleColor: 'text-blue-800 dark:text-blue-200',
      messageColor: 'text-blue-700 dark:text-blue-300'
    }
  }
  return configs[props.variant] || configs.info
})

const handleClose = () => {
  emit('close')
}

// Auto close functionality
if (props.autoClose) {
  setTimeout(() => {
    handleClose()
  }, props.duration)
}
</script>

<template>
  <Transition enter-active-class="transition duration-300 ease-out"
    enter-from-class="transform translate-x-full opacity-0" enter-to-class="transform translate-x-0 opacity-100"
    leave-active-class="transition duration-200 ease-in" leave-from-class="transform translate-x-0 opacity-100"
    leave-to-class="transform translate-x-full opacity-0">

    <div :class="[
      'max-w-sm w-full shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden',
      variantConfig.bgColor,
      variantConfig.borderColor
    ]">
      <div class="p-4">
        <div class="flex items-start">
          <!-- Icon -->
          <div class="flex-shrink-0">
            <Icon :name="variantConfig.icon" size="20" :class="variantConfig.iconColor" />
          </div>

          <!-- Content -->
          <div class="ml-3 w-0 flex-1 pt-0.5">
            <p v-if="title" :class="['text-sm font-medium', variantConfig.titleColor]">
              {{ title }}
            </p>
            <p :class="[
              'text-sm',
              title ? 'mt-1' : '',
              variantConfig.messageColor
            ]">
              {{ message }}
            </p>
          </div>

          <!-- Close Button -->
          <div v-if="closable" class="ml-4 flex-shrink-0 flex">
            <button @click="handleClose" :class="[
              'rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2',
              variant === 'success' && 'focus:ring-green-500',
              variant === 'error' && 'focus:ring-red-500',
              variant === 'warning' && 'focus:ring-yellow-500',
              variant === 'info' && 'focus:ring-blue-500'
            ]">
              <span class="sr-only">Close</span>
              <Icon name="lucide:x" size="16" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>
