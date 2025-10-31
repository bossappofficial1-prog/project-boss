import { OrderDetail } from "@/types"
import {
    isToday,
    isYesterday,
    isThisWeek,
    isThisMonth,
    startOfWeek,
    startOfMonth,
    parseISO
} from "date-fns"
import { id as localeId } from "date-fns/locale"

export type DateGroupKey = "today" | "yesterday" | "thisWeek" | "thisMonth" | "older"

export interface DateGroup {
    key: DateGroupKey
    label: string
    orders: OrderDetail[]
}

const dateGroupLabels: Record<DateGroupKey, string> = {
    today: "Hari Ini",
    yesterday: "Kemarin",
    thisWeek: "Minggu Ini",
    thisMonth: "Bulan Ini",
    older: "Lebih Lama"
}

export function getDateGroup(dateString: string): DateGroupKey {
    const date = parseISO(dateString)
    const now = new Date()

    // Check in order of specificity
    if (isToday(date)) {
        return "today"
    }

    if (isYesterday(date)) {
        return "yesterday"
    }

    // Check if within this week (starting from Monday)
    const weekStart = startOfWeek(now, { weekStartsOn: 1, locale: localeId })
    if (isThisWeek(date, { weekStartsOn: 1, locale: localeId }) && date >= weekStart) {
        return "thisWeek"
    }

    // Check if within this month
    const monthStart = startOfMonth(now)
    if (isThisMonth(date) && date >= monthStart) {
        return "thisMonth"
    }

    return "older"
}

export function groupOrdersByDate(orders: OrderDetail[]): DateGroup[] {
    // Create map to group orders
    const groupMap = new Map<DateGroupKey, OrderDetail[]>()

    // Initialize all groups
    const allGroups: DateGroupKey[] = ["today", "yesterday", "thisWeek", "thisMonth", "older"]
    allGroups.forEach(key => groupMap.set(key, []))

    // Group orders by date
    orders.forEach(order => {
        const group = getDateGroup(order.createdAt)
        groupMap.get(group)?.push(order)
    })

    // Convert map to array, filtering out empty groups
    const result: DateGroup[] = []
    allGroups.forEach(key => {
        const ordersInGroup = groupMap.get(key) || []
        if (ordersInGroup.length > 0) {
            result.push({
                key,
                label: dateGroupLabels[key],
                orders: ordersInGroup
            })
        }
    })

    return result
}

export function sortOrdersByDate(orders: OrderDetail[], descending = true): OrderDetail[] {
    return [...orders].sort((a, b) => {
        const dateA = parseISO(a.createdAt).getTime()
        const dateB = parseISO(b.createdAt).getTime()
        return descending ? dateB - dateA : dateA - dateB
    })
}
