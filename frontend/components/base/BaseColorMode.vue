<script setup>
const isDark = ref(false)

const setTheme = (val) => {
  isDark.value = val
  if (val) {
    document.documentElement.classList.add('dark')
    localStorage.theme = 'dark'
  } else {
    document.documentElement.classList.remove('dark')
    localStorage.theme = 'light'
  }
}

// Saat page load → cek localStorage atau OS preference
onMounted(() => {
  const userTheme = localStorage.getItem('theme')
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches

  if (userTheme === 'dark' || (!userTheme && systemPrefersDark)) {
    setTheme(true)
  } else {
    setTheme(false)
  }
})

const toggleTheme = () => {
  setTheme(!isDark.value)
}
</script>

<template>
  <button
    class="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
    @click="toggleTheme"
  >
    <Icon :name="isDark ? 'mdi:weather-night' : 'mdi:white-balance-sunny'" size="24" />
  </button>
</template>
