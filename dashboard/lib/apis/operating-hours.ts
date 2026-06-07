import { OperatingHoursInput } from '@/hooks/use-operating-hours'
import { apiClient } from './base'

export interface OperatingHoursData {
    id: string
    outletId: string
    dayOfWeek: number
    openTime: Date
    closeTime: Date
    isOpen: boolean
    createdAt: Date
    updatedAt: Date
}

export interface CreateOperatingHoursInput {
    outletId: string
    dayOfWeek: number
    openTime: Date
    closeTime: Date
    isOpen: boolean
}

export interface UpdateOperatingHoursInput {
    openTime?: Date
    closeTime?: Date
    isOpen?: boolean
}

export const operatingHoursApi = {
    // Get operating hours by outlet ID
    getByOutletId: (outletId: string): Promise<OperatingHoursData[]> => {
        return apiClient.get(`/operating-hours/outlet/${outletId}`).then(res => res.data.data || [])
    },

    // Create new operating hours
    create: (data: CreateOperatingHoursInput): Promise<OperatingHoursData> => {
        return apiClient.post('/operating-hours', data).then(res => res.data.data)
    },

    // Upsert operating hours (create or update)
    upsert: (outletId: string, hours: OperatingHoursInput[]) => {
        return apiClient.put(`/operating-hours/${outletId}/upsert`, { hours }).then(res => res.data.data)
    },

    // Update existing operating hours
    update: (id: string, data: UpdateOperatingHoursInput): Promise<OperatingHoursData> => {
        return apiClient.patch(`/operating-hours/${id}`, data).then(res => res.data.data)
    },

    // Delete operating hours
    delete: (id: string): Promise<void> => {
        return apiClient.delete(`/operating-hours/${id}`).then(() => undefined)
    }
}