import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { DashboardCardProps } from "@/lib/types/api.types";

export function DashboardCard({ title, value, change, icon: Icon, isLoading }: DashboardCardProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">
                    {isLoading ? (
                        <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
                    ) : (
                        value
                    )}
                </div>
                {change && (
                    <p className="text-xs text-muted-foreground">
                        {change}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}