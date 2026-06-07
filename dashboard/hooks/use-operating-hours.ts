import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { operatingHoursApi } from '@/lib/apis/operating-hours'

interface OperatingHoursData {
    id?: string
    outletId: string
    dayOfWeek: number
    openTime: Date
    closeTime: Date
    breakStart?: Date | string | null
    breakEnd?: Date | string | null
    isOpen: boolean
}

interface CreateOperatingHoursInput {
    outletId: string
    dayOfWeek: number
    openTime: Date
    closeTime: Date
    breakStart?: Date | string | null
    breakEnd?: Date | string | null
    isOpen: boolean
}

export interface OperatingHoursInput {
    dayOfWeek: number
    openTime: Date
    closeTime: Date
    breakStart?: Date | string | null
    breakEnd?: Date | string | null
    isOpen: boolean
}

interface UpdateOperatingHoursInput {
    openTime?: Date
    closeTime?: Date
    breakStart?: Date | string | null
    breakEnd?: Date | string | null
    isOpen?: boolean
}

// Hook untuk fetch operating hours by outlet ID
export function useOperatingHours(outletId: string) {
    return useQuery({
        queryKey: ['operating-hours', outletId],
        queryFn: async (): Promise<OperatingHoursData[]> => {
            return operatingHoursApi.getByOutletId(outletId)
        },
        enabled: !!outletId
    })
}

// Hook untuk create operating hours
export function useCreateOperatingHours() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (data: CreateOperatingHoursInput): Promise<OperatingHoursData> => {
            return operatingHoursApi.create(data)
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['operating-hours', data.outletId] })
        },
    })
}

// Hook untuk upsert operating hours
export function useUpsertOperatingHours() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (payload: { outletId: string, hours: OperatingHoursInput[] }): Promise<OperatingHoursData[]> => {
            return await operatingHoursApi.upsert(payload.outletId, payload.hours)
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['operating-hours', data[0].outletId] })
        },
    })
}

// Hook untuk update operating hours
export function useUpdateOperatingHours() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: UpdateOperatingHoursInput }): Promise<OperatingHoursData> => {
            return operatingHoursApi.update(id, data)
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['operating-hours', data.outletId] })
        },
    })
}