import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function OrderCardSkeleton() {
    return (
        <Card className="overflow-hidden">
            <CardHeader className="p-4 bg-muted/50">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-20" />
                </div>
            </CardHeader>
            <CardContent className="p-4">
                <div className="flex items-start gap-4">
                    <Skeleton className="h-12 w-12 rounded-md" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                    </div>
                </div>
            </CardContent>
            <CardFooter className="p-4 bg-muted/50">
                <div className="flex items-center justify-between w-full">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-9 w-24 rounded-md" />
                </div>
            </CardFooter>
        </Card>
    )
}
