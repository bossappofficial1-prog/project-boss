<template>
    <div :class="['bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden', className]">
        <!-- Header -->
        <div v-if="showHeader"
            :class="['bg-gradient-to-r from-gray-50 to-gray-100 p-6 border-b border-gray-200', headerClassName]">
            <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <h2 class="text-2xl font-bold text-gray-900">{{ title }}</h2>
                    <p v-if="subtitle" class="text-gray-600 mt-1">{{ subtitle }}</p>
                </div>

                <div class="flex items-center gap-3 flex-wrap">
                    <button v-if="filterable && filters.length > 0" @click="showFilters = !showFilters"
                        class="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                        <FilterIcon class="w-4 h-4" />
                        Filters
                    </button>

                    <button v-if="showExport" @click="$emit('export')"
                        class="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                        <DownloadIcon class="w-4 h-4" />
                        Export
                    </button>

                    <button v-if="showRefresh" @click="$emit('refresh')"
                        class="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                        <RefreshIcon class="w-4 h-4" />
                        Refresh
                    </button>

                    <button v-for="(action, index) in actions" :key="index" @click="action.handler" :class="[
                        'inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
                        action.variant === 'primary'
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    ]">
                        <component v-if="action.icon" :is="action.icon" class="w-4 h-4" />
                        {{ action.label }}
                    </button>
                </div>
            </div>

            <!-- Search Bar -->
            <div v-if="searchable" class="relative mt-4">
                <SearchIcon class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input v-model="searchTerm" type="text" :placeholder="searchPlaceholder"
                    class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white" />
            </div>

            <!-- Filters -->
            <div v-if="filterable && showFilters && filters.length > 0"
                class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 p-4 bg-white rounded-lg border border-gray-200">
                <div v-for="filter in filters" :key="filter.key">
                    <label class="block text-sm font-medium text-gray-700 mb-2">{{ filter.label }}</label>
                    <select v-model="activeFilters[filter.key]"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <option value="">{{ filter.placeholder || `All ${filter.label}` }}</option>
                        <option v-for="option in filter.options" :key="option.value" :value="option.value">
                            {{ option.label }}
                        </option>
                    </select>
                </div>
                <div class="flex items-end">
                    <button @click="clearFilters"
                        class="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors">
                        Clear Filters
                    </button>
                </div>
            </div>
        </div>

        <!-- Table -->
        <div class="overflow-x-auto">
            <table :class="['w-full', tableClassName]">
                <thead class="bg-gray-50 border-b border-gray-200">
                    <tr>
                        <th v-if="showRowNumbers"
                            class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            #
                        </th>

                        <th v-if="selectable" class="px-6 py-4 text-left">
                            <input type="checkbox"
                                :checked="paginatedData.length > 0 && selectedRows.size === paginatedData.length"
                                @change="handleSelectAll"
                                class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                        </th>

                        <th v-for="column in columns" :key="column.key"
                            @click="column.sortable !== false && handleSort(column.key)" :class="[
                                'px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
                                sortable && column.sortable !== false ? 'cursor-pointer hover:bg-gray-100 transition-colors' : ''
                            ]">
                            <div class="flex items-center gap-2">
                                {{ column.label }}
                                <div v-if="sortable && column.sortable !== false" class="flex flex-col">
                                    <ChevronUpIcon
                                        :class="['w-3 h-3', sortConfig.key === column.key && sortConfig.direction === 'asc' ? 'text-blue-600' : 'text-gray-400']" />
                                    <ChevronDownIcon
                                        :class="['w-3 h-3', sortConfig.key === column.key && sortConfig.direction === 'desc' ? 'text-blue-600' : 'text-gray-400']" />
                                </div>
                            </div>
                        </th>

                        <th v-if="rowActions.length > 0"
                            class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                    <tr v-for="(row, rowIndex) in paginatedData" :key="row.id || rowIndex" :class="[
                        'transition-colors cursor-pointer',
                        hoverable ? 'hover:bg-gray-50' : '',
                        selectedRows.has(row.id || rowIndex) ? 'bg-blue-50' : '',
                        striped && rowIndex % 2 === 0 ? 'bg-white' : striped ? 'bg-gray-50/30' : ''
                    ]" @click="$emit('row-click', row, rowIndex)">
                        <td v-if="showRowNumbers" class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {{ (currentPage - 1) * itemsPerPage + rowIndex + 1 }}
                        </td>

                        <td v-if="selectable" class="px-6 py-4 whitespace-nowrap">
                            <input type="checkbox" :checked="selectedRows.has(row.id || rowIndex)"
                                @change="(e) => handleSelectRow(row.id || rowIndex, e.target.checked)" @click.stop
                                class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                        </td>

                        <td v-for="column in columns" :key="column.key" class="px-6 py-4 whitespace-nowrap">
                            <div v-if="column.type === 'slot'">
                                <slot :name="column.key" :value="row[column.key]" :row="row" :index="rowIndex">
                                    {{ row[column.key] }}
                                </slot>
                            </div>
                            <div v-else-if="column.type === 'badge'">
                                <span
                                    :class="['inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', getBadgeClass(row[column.key], column.badgeConfig)]">
                                    {{ row[column.key] }}
                                </span>
                            </div>
                            <div v-else-if="column.type === 'avatar'" class="flex items-center">
                                <div
                                    class="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                    {{ getInitials(row[column.key] || row.name || '') }}
                                </div>
                                <span class="ml-2">{{ row[column.key] || row.name }}</span>
                            </div>
                            <div v-else-if="column.type === 'date'">
                                {{ formatDate(row[column.key]) }}
                            </div>
                            <div v-else-if="column.type === 'currency'">
                                {{ formatCurrency(row[column.key]) }}
                            </div>
                            <div v-else>
                                {{ row[column.key] }}
                            </div>
                        </td>

                        <td v-if="rowActions.length > 0"
                            class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div class="flex items-center gap-2">
                                <button v-for="action in rowActions" :key="action.key"
                                    @click.stop="action.handler(row, rowIndex)" :class="[
                                        'p-1 rounded transition-colors',
                                        getActionClass(action.variant)
                                    ]" :title="action.label">
                                    <component :is="action.icon" class="w-4 h-4" />
                                </button>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>

            <!-- Empty State -->
            <div v-if="paginatedData.length === 0" class="text-center py-12">
                <div class="text-gray-500 text-lg">{{ emptyMessage }}</div>
            </div>
        </div>

        <!-- Footer -->
        <div v-if="showFooter && (paginated || selectable)" class="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div class="flex items-center gap-4">
                    <div class="text-sm text-gray-700">
                        Showing {{ startIndex }} to {{ endIndex }} of {{ sortedData.length }} results
                    </div>
                    <div v-if="selectedRows.size > 0" class="text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                        {{ selectedRows.size }} selected
                    </div>
                </div>

                <div v-if="paginated" class="flex items-center gap-4">
                    <div class="flex items-center gap-2">
                        <label class="text-sm text-gray-700">Show:</label>
                        <select v-model="itemsPerPage" @change="currentPage = 1"
                            class="border border-gray-300 rounded px-2 py-1 text-sm">
                            <option v-for="size in pageSizeOptions" :key="size" :value="size">
                                {{ size }}
                            </option>
                        </select>
                    </div>

                    <div class="flex items-center gap-2">
                        <button @click="currentPage = Math.max(1, currentPage - 1)" :disabled="currentPage === 1"
                            class="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                            Previous
                        </button>

                        <div class="flex gap-1">
                            <button v-for="pageNum in visiblePages" :key="pageNum" @click="currentPage = pageNum"
                                :class="[
                                    'px-3 py-1 text-sm border rounded',
                                    currentPage === pageNum
                                        ? 'bg-blue-600 text-white border-blue-600'
                                        : 'border-gray-300 hover:bg-gray-50'
                                ]">
                                {{ pageNum }}
                            </button>
                        </div>

                        <button @click="currentPage = Math.min(totalPages, currentPage + 1)"
                            :disabled="currentPage === totalPages"
                            class="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

// Icons (you can replace with your preferred icon library)
import {
    MagnifyingGlassIcon as SearchIcon,
    FunnelIcon as FilterIcon,
    ArrowDownTrayIcon as DownloadIcon,
    ArrowPathIcon as RefreshIcon,
    ChevronUpIcon,
    ChevronDownIcon
} from '@heroicons/vue/24/outline'

const props = defineProps({
    // Data props
    data: {
        type: Array,
        default: () => []
    },
    columns: {
        type: Array,
        default: () => []
    },

    // Configuration props
    title: {
        type: String,
        default: 'Data Table'
    },
    subtitle: {
        type: String,
        default: ''
    },
    searchable: {
        type: Boolean,
        default: true
    },
    sortable: {
        type: Boolean,
        default: true
    },
    filterable: {
        type: Boolean,
        default: false
    },
    selectable: {
        type: Boolean,
        default: false
    },
    paginated: {
        type: Boolean,
        default: true
    },

    // Customization props
    filters: {
        type: Array,
        default: () => []
    },
    actions: {
        type: Array,
        default: () => []
    },
    rowActions: {
        type: Array,
        default: () => []
    },
    searchPlaceholder: {
        type: String,
        default: 'Search...'
    },
    emptyMessage: {
        type: String,
        default: 'No data available'
    },

    // Pagination props
    defaultPageSize: {
        type: Number,
        default: 10
    },
    pageSizeOptions: {
        type: Array,
        default: () => [5, 10, 25, 50]
    },

    // Style props
    className: {
        type: String,
        default: ''
    },
    headerClassName: {
        type: String,
        default: ''
    },
    tableClassName: {
        type: String,
        default: ''
    },

    // Feature flags
    showHeader: {
        type: Boolean,
        default: true
    },
    showFooter: {
        type: Boolean,
        default: true
    },
    showRowNumbers: {
        type: Boolean,
        default: false
    },
    showExport: {
        type: Boolean,
        default: true
    },
    showRefresh: {
        type: Boolean,
        default: true
    },
    striped: {
        type: Boolean,
        default: true
    },
    hoverable: {
        type: Boolean,
        default: true
    }
})

const emit = defineEmits([
    'search',
    'sort',
    'filter',
    'select',
    'row-click',
    'export',
    'refresh'
])

// Reactive state
const searchTerm = ref('')
const sortConfig = ref({ key: null, direction: 'asc' })
const activeFilters = ref({})
const currentPage = ref(1)
const itemsPerPage = ref(props.defaultPageSize)
const selectedRows = ref(new Set())
const showFilters = ref(false)

// Computed properties
const searchableFields = computed(() =>
    props.columns.filter(col => col.searchable !== false).map(col => col.key)
)

const filteredData = computed(() => {
    return props.data.filter(item => {
        // Search filter
        const matchesSearch = !props.searchable || !searchTerm.value ||
            searchableFields.value.some(field => {
                const value = item[field]
                return value && value.toString().toLowerCase().includes(searchTerm.value.toLowerCase())
            })

        // Custom filters
        const matchesFilters = Object.entries(activeFilters.value).every(([key, value]) => {
            if (!value) return true
            return item[key] === value
        })

        return matchesSearch && matchesFilters
    })
})

const sortedData = computed(() => {
    if (!props.sortable || !sortConfig.value.key) return filteredData.value

    return [...filteredData.value].sort((a, b) => {
        const column = props.columns.find(col => col.key === sortConfig.value.key)
        let aValue = a[sortConfig.value.key]
        let bValue = b[sortConfig.value.key]

        // Handle different data types
        if (column?.type === 'number') {
            aValue = Number(aValue) || 0
            bValue = Number(bValue) || 0
        } else if (column?.type === 'date') {
            aValue = new Date(aValue)
            bValue = new Date(bValue)
        }

        if (aValue < bValue) return sortConfig.value.direction === 'asc' ? -1 : 1
        if (aValue > bValue) return sortConfig.value.direction === 'asc' ? 1 : -1
        return 0
    })
})

const paginatedData = computed(() => {
    if (!props.paginated) return sortedData.value
    const startIndex = (currentPage.value - 1) * itemsPerPage.value
    return sortedData.value.slice(startIndex, startIndex + itemsPerPage.value)
})

const totalPages = computed(() => Math.ceil(sortedData.value.length / itemsPerPage.value))

const startIndex = computed(() => (currentPage.value - 1) * itemsPerPage.value + 1)
const endIndex = computed(() => Math.min(currentPage.value * itemsPerPage.value, sortedData.value.length))

const visiblePages = computed(() => {
    const pages = []
    const maxVisible = 5

    if (totalPages.value <= maxVisible) {
        for (let i = 1; i <= totalPages.value; i++) {
            pages.push(i)
        }
    } else if (currentPage.value <= 3) {
        for (let i = 1; i <= maxVisible; i++) {
            pages.push(i)
        }
    } else if (currentPage.value >= totalPages.value - 2) {
        for (let i = totalPages.value - maxVisible + 1; i <= totalPages.value; i++) {
            pages.push(i)
        }
    } else {
        for (let i = currentPage.value - 2; i <= currentPage.value + 2; i++) {
            pages.push(i)
        }
    }

    return pages
})

// Methods
const handleSort = (key) => {
    if (!props.sortable) return

    const newConfig = {
        key,
        direction: sortConfig.value.key === key && sortConfig.value.direction === 'asc' ? 'desc' : 'asc'
    }
    sortConfig.value = newConfig
    emit('sort', newConfig)
}

const handleSelectAll = (event) => {
    const checked = event.target.checked
    if (checked) {
        selectedRows.value = new Set(paginatedData.value.map((item, index) => item.id || index))
    } else {
        selectedRows.value = new Set()
    }
    emit('select', Array.from(selectedRows.value))
}

const handleSelectRow = (id, checked) => {
    if (checked) {
        selectedRows.value.add(id)
    } else {
        selectedRows.value.delete(id)
    }
    emit('select', Array.from(selectedRows.value))
}

const clearFilters = () => {
    activeFilters.value = {}
    searchTerm.value = ''
    currentPage.value = 1
}

const getBadgeClass = (value, config = {}) => {
    return config[value] || 'bg-gray-100 text-gray-800 border-gray-200'
}

const getActionClass = (variant) => {
    const classes = {
        view: 'text-blue-600 hover:text-blue-900 hover:bg-blue-50',
        edit: 'text-green-600 hover:text-green-900 hover:bg-green-50',
        delete: 'text-red-600 hover:text-red-900 hover:bg-red-50',
        default: 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
    }
    return classes[variant] || classes.default
}

const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
}

const formatDate = (date) => {
    if (!date) return ''
    return new Date(date).toLocaleDateString()
}

const formatCurrency = (amount) => {
    if (!amount) return ''
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR'
    }).format(amount)
}

// Watchers
watch(searchTerm, (newValue) => {
    currentPage.value = 1
    emit('search', newValue)
})

watch(activeFilters, (newValue) => {
    currentPage.value = 1
    emit('filter', newValue)
}, { deep: true })
</script>