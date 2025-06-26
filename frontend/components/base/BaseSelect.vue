<script setup>
defineProps({
  modelValue: [String, Number, Object],
  options: {
    type: Array,
    default: () => []
  },
  valueKey: {
    type: String,
    default: 'value'
  },
  labelKey: {
    type: String,
    default: 'label'
  },
  placeholder: {
    type: String,
    default: 'Pilih opsi'
  },
  required: Boolean
})

defineEmits(['update:modelValue'])
</script>

<template>
  <select
    :value="modelValue"
    @change="$emit('update:modelValue', $event.target.value)"
    :required="required"
    class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:outline-none"
  >
    <option value="" disabled selected hidden>{{ placeholder }}</option>
    <option
      v-for="(option, index) in options"
      :key="index"
      :value="option[valueKey]"
    >
      {{ option[labelKey] }}
    </option>
  </select>
</template>
