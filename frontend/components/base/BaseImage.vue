<script setup lang="ts">
interface Props {
    src?: string
    alt: string
    class?: string
    fallbackIcon?: string
}

const props = withDefaults(defineProps<Props>(), {
    fallbackIcon: 'mdi:image-broken'
})

const imageLoaded = ref(false)
const imageError = ref(false)
const isLoading = ref(true)

const handleLoad = () => {
    imageLoaded.value = true
    imageError.value = false
    isLoading.value = false
}

const handleError = () => {
    imageLoaded.value = false
    imageError.value = true
    isLoading.value = false
}

// Reset states when src changes
watch(() => props.src, () => {
    imageLoaded.value = false
    imageError.value = false
    isLoading.value = true
})
</script>

<template>
    <div class="relative w-full h-full bg-gray-200 dark:bg-gray-700">
        <!-- Actual Image -->
        <img v-if="src && !imageError" :src="src" :alt="alt" :class="[
            'w-full h-full object-cover transition-all duration-300',
            props.class,
            { 'opacity-0': !imageLoaded }
        ]" @load="handleLoad" @error="handleError" loading="lazy" />

        <!-- Loading State -->
        <div v-if="src && isLoading && !imageError"
            class="absolute inset-0 flex items-center justify-center text-gray-500">
            <div class="text-center">
                <div
                    class="animate-spin w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full mx-auto mb-2">
                </div>
                <span class="text-xs">Loading...</span>
            </div>
        </div>

        <!-- Error State or No Image -->
        <div v-if="!src || imageError" class="absolute inset-0 flex items-center justify-center text-gray-500">
            <div class="text-center">
                <Icon :name="imageError ? 'mdi:image-broken' : 'mdi:store-outline'" :size="imageError ? 32 : 48"
                    class="mx-auto mb-2" />
                <span class="text-sm">
                    {{ imageError ? 'Gambar tidak dapat dimuat' : alt }}
                </span>
            </div>
        </div>
    </div>
</template>
