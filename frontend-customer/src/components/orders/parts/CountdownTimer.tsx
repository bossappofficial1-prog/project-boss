"use client"

import { useEffect, useState } from "react"
import { Clock, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslations } from "@/hooks/useI18n"

interface CountdownTimerProps {
    expiryTime: string // ISO date string
    onExpire?: () => void
    className?: string
    compact?: boolean // For card view vs detail view
}

interface TimeRemaining {
    hours: number
    minutes: number
    seconds: number
    totalSeconds: number
}

export default function CountdownTimer({ expiryTime, onExpire, className, compact = false }: CountdownTimerProps) {
    const t = useTranslations('orders')
    const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(null)
    const [isExpired, setIsExpired] = useState(false)

    useEffect(() => {
        const calculateTimeRemaining = (): TimeRemaining => {
            const now = new Date().getTime()
            const expiry = new Date(expiryTime).getTime()
            const diff = Math.max(0, expiry - now)
            const totalSeconds = Math.floor(diff / 1000)

            return {
                hours: Math.floor(totalSeconds / 3600),
                minutes: Math.floor((totalSeconds % 3600) / 60),
                seconds: totalSeconds % 60,
                totalSeconds
            }
        }

        const updateTimer = () => {
            const remaining = calculateTimeRemaining()
            setTimeRemaining(remaining)

            if (remaining.totalSeconds === 0 && !isExpired) {
                setIsExpired(true)
                onExpire?.()
            }
        }

        // Initial update
        updateTimer()

        // Update every second
        const interval = setInterval(updateTimer, 1000)

        return () => clearInterval(interval)
    }, [expiryTime, isExpired, onExpire])

    if (!timeRemaining) {
        return null
    }

    if (isExpired) {
        return (
            <div className={cn(
                "flex items-center gap-2 text-sm font-medium",
                "text-destructive",
                className
            )}>
                <AlertTriangle className="w-4 h-4" />
                <span>{t('timer.expired')}</span>
            </div>
        )
    }

    const isUrgent = timeRemaining.totalSeconds < 3600 // Less than 1 hour
    const isCritical = timeRemaining.totalSeconds < 600 // Less than 10 minutes

    if (compact) {
        // Compact view for order cards
        return (
            <div className={cn(
                "inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium",
                isCritical 
                    ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"
                    : isUrgent 
                        ? "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400"
                        : "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400",
                className
            )}>
                <Clock className="w-3 h-3" />
                <span>
                    {timeRemaining.hours > 0 && `${timeRemaining.hours}h `}
                    {String(timeRemaining.minutes).padStart(2, '0')}:
                    {String(timeRemaining.seconds).padStart(2, '0')}
                </span>
            </div>
        )
    }

    // Full view for detail pages
    return (
        <div className={cn(
            "flex flex-col gap-2 p-4 rounded-lg border",
            isCritical
                ? "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900"
                : isUrgent
                    ? "bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-900"
                    : "bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-900",
            className
        )}>
            <div className="flex items-center gap-2">
                <Clock className={cn(
                    "w-5 h-5",
                    isCritical
                        ? "text-red-600 dark:text-red-400"
                        : isUrgent
                            ? "text-orange-600 dark:text-orange-400"
                            : "text-yellow-600 dark:text-yellow-400"
                )} />
                <span className={cn(
                    "font-semibold text-sm",
                    isCritical
                        ? "text-red-700 dark:text-red-400"
                        : isUrgent
                            ? "text-orange-700 dark:text-orange-400"
                            : "text-yellow-700 dark:text-yellow-400"
                )}>
                    {t('timer.timeRemaining')}
                </span>
            </div>

            <div className="flex items-center gap-3">
                {/* Hours */}
                {timeRemaining.hours > 0 && (
                    <div className="flex flex-col items-center">
                        <div className={cn(
                            "text-2xl font-bold tabular-nums",
                            isCritical
                                ? "text-red-700 dark:text-red-400"
                                : isUrgent
                                    ? "text-orange-700 dark:text-orange-400"
                                    : "text-yellow-700 dark:text-yellow-400"
                        )}>
                            {String(timeRemaining.hours).padStart(2, '0')}
                        </div>
                        <div className="text-xs text-muted-foreground uppercase">
                            {t('timer.hours')}
                        </div>
                    </div>
                )}

                {/* Separator */}
                {timeRemaining.hours > 0 && (
                    <div className={cn(
                        "text-2xl font-bold",
                        isCritical
                            ? "text-red-700 dark:text-red-400"
                            : isUrgent
                                ? "text-orange-700 dark:text-orange-400"
                                : "text-yellow-700 dark:text-yellow-400"
                    )}>:</div>
                )}

                {/* Minutes */}
                <div className="flex flex-col items-center">
                    <div className={cn(
                        "text-2xl font-bold tabular-nums",
                        isCritical
                            ? "text-red-700 dark:text-red-400"
                            : isUrgent
                                ? "text-orange-700 dark:text-orange-400"
                                : "text-yellow-700 dark:text-yellow-400"
                    )}>
                        {String(timeRemaining.minutes).padStart(2, '0')}
                    </div>
                    <div className="text-xs text-muted-foreground uppercase">
                        {t('timer.minutes')}
                    </div>
                </div>

                {/* Separator */}
                <div className={cn(
                    "text-2xl font-bold",
                    isCritical
                        ? "text-red-700 dark:text-red-400"
                        : isUrgent
                            ? "text-orange-700 dark:text-orange-400"
                            : "text-yellow-700 dark:text-yellow-400"
                )}>:</div>

                {/* Seconds */}
                <div className="flex flex-col items-center">
                    <div className={cn(
                        "text-2xl font-bold tabular-nums",
                        isCritical
                            ? "text-red-700 dark:text-red-400"
                            : isUrgent
                                ? "text-orange-700 dark:text-orange-400"
                                : "text-yellow-700 dark:text-yellow-400"
                    )}>
                        {String(timeRemaining.seconds).padStart(2, '0')}
                    </div>
                    <div className="text-xs text-muted-foreground uppercase">
                        {t('timer.seconds')}
                    </div>
                </div>
            </div>

            {/* Warning message */}
            {isUrgent && (
                <p className={cn(
                    "text-xs font-medium flex items-center gap-1.5",
                    isCritical
                        ? "text-red-700 dark:text-red-400"
                        : "text-orange-700 dark:text-orange-400"
                )}>
                    <AlertTriangle className="w-3 h-3" />
                    {isCritical 
                        ? t('timer.urgentWarning')
                        : t('timer.expiringWarning')
                    }
                </p>
            )}
        </div>
    )
}
