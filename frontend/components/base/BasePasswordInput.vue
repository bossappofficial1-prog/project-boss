<script setup>
defineProps({
  modelValue: String,
  placeholder: String,
  required: Boolean
})

defineEmits(['update:modelValue'])

const show = ref(false)
</script>

<template>
  <div class="relative">
    <input
      :type="show ? 'text' : 'password'"
      :placeholder="placeholder"
      :required="required"
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
      class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:outline-none"
    />
    <button type="button" class="absolute inset-y-0 right-0 flex items-center px-3" @click="show = !show">
      <Icon :name="show ? 'mdi:eye-off' : 'mdi:eye'" class="text-gray-500 dark:text-gray-300" size="20" />
    </button>
  </div>
</template>
