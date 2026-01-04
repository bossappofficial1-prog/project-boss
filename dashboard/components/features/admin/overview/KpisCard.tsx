import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowDownRight, ArrowUpRight, LucideIcon } from "lucide-react"

type KpiCardProps = {
    title: string
    nominal: string
    description?: string
    Icon: LucideIcon
    growth?: number
}

export function KpiCard({ title, nominal, Icon, description, growth }: KpiCardProps) {
    return (
        <Card className="shadow-md rounded-md border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{nominal}</div>
                <p className="text-xs text-muted-foreground flex items-center mt-1">
                    {
                        typeof growth === 'number' && (
                            <>
                                {growth < 0
                                    ? <span className="text-red-500 flex items-center font-medium">
                                        {growth}% <ArrowDownRight className="h-3 w-3 ml-0.5" />
                                    </span>
                                    : <span className="text-emerald-500 flex items-center font-medium">
                                        {growth}% <ArrowUpRight className="h-3 w-3 ml-0.5" />
                                    </span>
                                }
                                <span className="ml-1">{description}</span>
                            </>
                        )
                    }
                </p>
            </CardContent>
        </Card>
    )
}