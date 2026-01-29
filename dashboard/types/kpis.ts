export type KPIStatus = "healthy" | "warning" | "critical"
export interface KPIGrowth {
    percentage: number | null
    direction: "up" | "down" | "flat" | "new"
    label: string
}
export interface KPIPeriod {
    type: "daily" | "weekly" | "monthly" | "yearly"
    current: string
    compareWith?: string
}


export interface KPIItem {
    value: number
    formatted?: string
    unit?: "count" | "currency" | "percent"
    status?: KPIStatus
    growth?: KPIGrowth | null
    meta?: Record<string, number | string | boolean>
}