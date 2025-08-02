<script setup lang="ts">
interface Alert {
    id: string;
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message: string;
    timestamp: Date;
    dismissible?: boolean;
}

const props = defineProps<{
    alerts: Alert[];
}>();

const emit = defineEmits<{
    dismiss: [id: string];
}>();

const alertStyles = {
    info: {
        container: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
        icon: 'lucide:info',
        iconColor: 'text-blue-500',
        titleColor: 'text-blue-800 dark:text-blue-200',
        messageColor: 'text-blue-700 dark:text-blue-300'
    },
    success: {
        container: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
        icon: 'lucide:check-circle',
        iconColor: 'text-green-500',
        titleColor: 'text-green-800 dark:text-green-200',
        messageColor: 'text-green-700 dark:text-green-300'
    },
    warning: {
        container: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
        icon: 'lucide:alert-triangle',
        iconColor: 'text-yellow-500',
        titleColor: 'text-yellow-800 dark:text-yellow-200',
        messageColor: 'text-yellow-700 dark:text-yellow-300'
    },
    error: {
        container: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
        icon: 'lucide:alert-circle',
        iconColor: 'text-red-500',
        titleColor: 'text-red-800 dark:text-red-200',
        messageColor: 'text-red-700 dark:text-red-300'
    }
};

const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: 'short'
    }).format(date);
};

const dismissAlert = (id: string) => {
    emit('dismiss', id);
};
</script>

<template>
    <div v-if="alerts.length > 0" class="space-y-4">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Notifikasi Terbaru</h3>

        <TransitionGroup name="alert" tag="div" class="space-y-3">
            <div v-for="alert in alerts" :key="alert.id" :class="[
                'p-4 rounded-lg border transition-all duration-300 hover:shadow-md',
                alertStyles[alert.type].container
            ]">
                <div class="flex items-start space-x-3">
                    <div class="flex-shrink-0">
                        <Icon :name="alertStyles[alert.type].icon" size="20"
                            :class="alertStyles[alert.type].iconColor" />
                    </div>

                    <div class="flex-1 min-w-0">
                        <div class="flex items-center justify-between">
                            <h4 :class="['font-medium', alertStyles[alert.type].titleColor]">
                                {{ alert.title }}
                            </h4>
                            <span class="text-xs text-gray-500 dark:text-gray-400">
                                {{ formatTime(alert.timestamp) }}
                            </span>
                        </div>

                        <p :class="['mt-1 text-sm', alertStyles[alert.type].messageColor]">
                            {{ alert.message }}
                        </p>
                    </div>

                    <div v-if="alert.dismissible !== false" class="flex-shrink-0">
                        <button @click="dismissAlert(alert.id)"
                            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200">
                            <Icon name="lucide:x" size="16" />
                        </button>
                    </div>
                </div>
            </div>
        </TransitionGroup>
    </div>
</template>

<style scoped>
.alert-enter-active {
    transition: all 0.3s ease-out;
}

.alert-leave-active {
    transition: all 0.3s ease-in;
}

.alert-enter-from {
    opacity: 0;
    transform: translateY(-10px);
}

.alert-leave-to {
    opacity: 0;
    transform: translateX(20px);
}

.alert-move {
    transition: transform 0.3s ease;
}
</style>
