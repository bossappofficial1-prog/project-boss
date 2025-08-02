<script setup lang="ts">
interface Props {
    modelValue?: {
        address?: string
        latitude?: number
        longitude?: number
    }
    placeholder?: string
    error?: string
}

interface Emits {
    (e: 'update:modelValue', value: { address?: string; latitude?: number; longitude?: number }): void
}

const props = withDefaults(defineProps<Props>(), {
    placeholder: 'Masukkan alamat atau pilih di peta'
})

const emit = defineEmits<Emits>()

const mapContainer = ref<HTMLDivElement>()
const searchInput = ref('')
const isLoading = ref(false)
const searchResults = ref<any[]>([])
const showResults = ref(false)
const map = ref<any>(null)
const marker = ref<any>(null)

// Initialize values
const address = ref(props.modelValue?.address || '')
const latitude = ref(props.modelValue?.latitude || -6.2)
const longitude = ref(props.modelValue?.longitude || 106.816666)

// Update form when values change
const updateValue = () => {
    emit('update:modelValue', {
        address: address.value,
        latitude: latitude.value,
        longitude: longitude.value
    })
}

// Search for places using Nominatim (OpenStreetMap)
const searchPlaces = async (query: string) => {
    if (!query || query.length < 3) {
        searchResults.value = []
        showResults.value = false
        return
    }

    isLoading.value = true
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ', Indonesia')}&limit=5&addressdetails=1`
        )
        const data = await response.json()
        searchResults.value = data
        showResults.value = true
    } catch (error) {
        console.error('Error searching places:', error)
        searchResults.value = []
    }
    isLoading.value = false
}

// Select a place from search results
const selectPlace = (place: any) => {
    address.value = place.display_name
    latitude.value = parseFloat(place.lat)
    longitude.value = parseFloat(place.lon)
    searchInput.value = place.display_name
    showResults.value = false
    updateValue()
    updateMap()
}

// Initialize Leaflet map
const initMap = async () => {
    // Dynamically import Leaflet to avoid SSR issues
    const L = await import('leaflet')

    if (!mapContainer.value) return

    // Initialize map
    map.value = L.map(mapContainer.value).setView([latitude.value, longitude.value], 15)

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map.value)

    // Add marker
    marker.value = L.marker([latitude.value, longitude.value], {
        draggable: true
    }).addTo(map.value)

    // Handle marker drag
    marker.value.on('dragend', async (e: any) => {
        const position = e.target.getLatLng()
        latitude.value = position.lat
        longitude.value = position.lng

        // Reverse geocoding to get address
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.lat}&lon=${position.lng}&addressdetails=1`
            )
            const data = await response.json()
            if (data.display_name) {
                address.value = data.display_name
                searchInput.value = data.display_name
            }
        } catch (error) {
            console.error('Error reverse geocoding:', error)
        }

        updateValue()
    })

    // Handle map click
    map.value.on('click', async (e: any) => {
        const { lat, lng } = e.latlng
        latitude.value = lat
        longitude.value = lng
        marker.value.setLatLng([lat, lng])

        // Reverse geocoding
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
            )
            const data = await response.json()
            if (data.display_name) {
                address.value = data.display_name
                searchInput.value = data.display_name
            }
        } catch (error) {
            console.error('Error reverse geocoding:', error)
        }

        updateValue()
    })
}

// Update map position
const updateMap = () => {
    if (map.value && marker.value) {
        map.value.setView([latitude.value, longitude.value], 15)
        marker.value.setLatLng([latitude.value, longitude.value])
    }
}

// Get current location
const getCurrentLocation = () => {
    if (navigator.geolocation) {
        isLoading.value = true
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                latitude.value = position.coords.latitude
                longitude.value = position.coords.longitude

                // Reverse geocoding
                try {
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude.value}&lon=${longitude.value}&addressdetails=1`
                    )
                    const data = await response.json()
                    if (data.display_name) {
                        address.value = data.display_name
                        searchInput.value = data.display_name
                    }
                } catch (error) {
                    console.error('Error reverse geocoding:', error)
                }

                updateValue()
                updateMap()
                isLoading.value = false
            },
            (error) => {
                console.error('Error getting location:', error)
                isLoading.value = false
            }
        )
    }
}

// Watch for search input changes
watch(searchInput, (newValue) => {
    if (debounceTimer) {
        clearTimeout(debounceTimer)
    }
    debounceTimer = setTimeout(() => {
        searchPlaces(newValue)
    }, 500)
}, { immediate: false })

let debounceTimer: ReturnType<typeof setTimeout> | null = null

// Initialize map on mount
onMounted(() => {
    nextTick(() => {
        initMap()
    })
})

// Handle click outside to close search results
const closeResults = () => {
    setTimeout(() => {
        showResults.value = false
    }, 200)
}
</script>

<template>
    <div class="space-y-4">
        <!-- Search Input -->
        <div class="relative">
            <div class="relative">
                <input v-model="searchInput" type="text" :placeholder="placeholder"
                    class="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:text-white transition-colors"
                    :class="{
                        'border-red-300 dark:border-red-600': error
                    }" @blur="closeResults" />
                <Icon name="lucide:search" size="20"
                    class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <button v-if="!isLoading" type="button" @click="getCurrentLocation"
                    class="absolute right-3 top-1/2 transform -translate-y-1/2 text-primary-600 hover:text-primary-700 transition-colors"
                    title="Gunakan lokasi saat ini">
                    <Icon name="lucide:crosshair" size="20" />
                </button>
                <div v-else class="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div class="animate-spin w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full">
                    </div>
                </div>
            </div>

            <!-- Search Results -->
            <div v-if="showResults && searchResults.length > 0"
                class="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                <button v-for="(result, index) in searchResults" :key="index" type="button" @click="selectPlace(result)"
                    class="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-colors">
                    <div class="flex items-start space-x-3">
                        <Icon name="lucide:map-pin" size="16" class="text-primary-600 mt-1 flex-shrink-0" />
                        <div class="flex-1 min-w-0">
                            <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {{ result.display_name.split(',').slice(0, 2).join(',') }}
                            </p>
                            <p class="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {{ result.display_name }}
                            </p>
                        </div>
                    </div>
                </button>
            </div>

            <!-- Error Message -->
            <p v-if="error" class="mt-1 text-sm text-red-600 dark:text-red-400">
                {{ error }}
            </p>
        </div>

        <!-- Map Container -->
        <div class="relative">
            <div ref="mapContainer"
                class="w-full h-64 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800">
            </div>

            <!-- Map Instructions -->
            <div
                class="absolute top-3 left-3 bg-white dark:bg-gray-800 px-3 py-2 rounded-md shadow-md border border-gray-200 dark:border-gray-700">
                <p class="text-xs text-gray-600 dark:text-gray-400">
                    <Icon name="lucide:info" size="12" class="inline mr-1" />
                    Klik atau seret marker untuk memilih lokasi
                </p>
            </div>
        </div>

        <!-- Coordinates Display -->
        <div v-if="latitude && longitude" class="grid grid-cols-2 gap-4 text-sm">
            <div class="bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-md">
                <span class="text-gray-500 dark:text-gray-400">Latitude:</span>
                <span class="ml-2 font-mono text-gray-900 dark:text-white">{{ latitude.toFixed(6) }}</span>
            </div>
            <div class="bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-md">
                <span class="text-gray-500 dark:text-gray-400">Longitude:</span>
                <span class="ml-2 font-mono text-gray-900 dark:text-white">{{ longitude.toFixed(6) }}</span>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Import Leaflet CSS dynamically */
@import 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
</style>
