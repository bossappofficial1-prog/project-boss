import { subscriptionPlanvalues } from "@/features/admin/subcriptions/plans/schema"
import { apiClient } from "@/lib/apis/base"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

export interface SubcriptionPlan {
    id: string
    name: string
    code: string
    price: number
    promo: number;
    durationDays: number
    yearlyPrice: number
    yearlyDiscount: number
    features: Features
    isActive: boolean
    isPopular: boolean
    createdAt: string
    updatedAt: string
}

export interface Features {
    maxStaff: number
    maxOutlets: number
    maxProducts: number
    supportLevel: "EMAIL" | "WHATSAPP" | "PRIORITY"
    canExportReport: boolean
}

export const useSubscriptionPlans = () => {
    return useQuery({
        queryKey: ['subscription-plans'],
        queryFn: async () => (await apiClient.get(`/subscription-plans`)).data.data as SubcriptionPlan[]
    })
}

export const useCreateSubscriptionPlans = () => {
    const query = useQueryClient()
    return useMutation({
        mutationFn: async (data: subscriptionPlanvalues) => (await apiClient.post(`/subscription-plans`, data)).data.data as SubcriptionPlan,
        onSuccess: (data) => {
            query.invalidateQueries({ queryKey: ['subscription-plans'] })
            toast.success(`Berhasil menambahkan plan "${data.name}"`)
        }
    })
}

export const useDeleteSubscriptionPlans = () => {
    const query = useQueryClient()

    return useMutation({
        mutationFn: async (id: string) => (await apiClient.delete(`/subscription-plans/${id}`)).data.data as SubcriptionPlan,
        onSuccess: (data) => {
            query.invalidateQueries({ queryKey: ['subscription-plans'] })
            toast.success(`Berhasil menghapus ${data.name}`)
        },
        onError: () => toast.error('Gagal menghapus subcriptions plans')
    })
}

export const useUpdateSubscriptionPlans = () => {
    const query = useQueryClient()
    return useMutation({
        mutationFn: async (payload: { id: string, data: subscriptionPlanvalues }) => (await apiClient.put(`/subscription-plans/${payload.id}`, payload.data)).data.data as SubcriptionPlan,
        onSuccess: (data) => {
            query.invalidateQueries({ queryKey: ['subscription-plans'] })
            toast.success(`Berhasil mengupdate plan ${data.name}`)
        }
    })
}