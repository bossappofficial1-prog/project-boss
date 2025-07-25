<!-- BaseDrawer.vue -->
<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
    open: boolean
    position?: 'left' | 'right'
    maxWidth?: string
}>()

const emit = defineEmits<{
    (e: 'close'): void
}>()

// Internal state for animation
const isVisible = ref(props.open)
const isClosing = ref(false)

watch(() => props.open, (newVal) => {
    if (newVal) {
        isVisible.value = true
        isClosing.value = false
    } else {
        isClosing.value = true
        setTimeout(() => {
            isVisible.value = false
            isClosing.value = false
        }, 300)
    }
})

function closeDrawer() {
    emit('close')
}
</script>

<template>
    <Teleport to="body">
        <!-- Backdrop -->
        <Transition enter-active-class="transition-opacity duration-300 ease-out" enter-from-class="opacity-0"
            enter-to-class="opacity-100" leave-active-class="transition-opacity duration-300 ease-in"
            leave-from-class="opacity-100" leave-to-class="opacity-0">
            <div v-if="isVisible" @click="closeDrawer" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"></div>
        </Transition>

        <!-- Drawer -->
        <Transition enter-active-class="transform transition-transform duration-300 ease-out"
            enter-from-class="translate-x-full" enter-to-class="translate-x-0"
            leave-active-class="transform transition-transform duration-300 ease-in" leave-from-class="translate-x-0"
            leave-to-class="translate-x-full">
            <div v-if="isVisible"
                class="fixed top-0 bottom-0 right-0 z-50 w-full bg-white dark:bg-gray-900 shadow-xl flex flex-col"
                :class="[
                    position === 'left' ? 'left-0' : 'right-0',
                    { 'translate-x-full': isClosing }
                ]" :style="{ maxWidth }">
                <slot></slot>
            </div>
        </Transition>
    </Teleport>
</template>
