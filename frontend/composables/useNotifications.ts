import type { NotificationsResponse } from '~/types'

export function useNotifications(options?: { threshold?: number; immediate?: boolean }) {
    const auth = useAuthStore()
    const outletId = auth.selectedOutlet?.id
    const threshold = options?.threshold ?? 5

    const { data, pending, error, refresh, execute } = useApi<NotificationsResponse>('/notifications', {
        method: 'GET',
        query: { outletId, threshold },
        immediate: options?.immediate ?? true,
    })

    return { data, pending, error, refresh, execute }
}
