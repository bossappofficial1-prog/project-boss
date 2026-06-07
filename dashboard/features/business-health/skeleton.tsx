import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function BusinessHealthSkeleton() {
  return (
    <div className="space-y-3 animate-in fade-in duration-500">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-60" />
      </div>

      {/* Overall Score Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-none border-border/50 md:col-span-1">
          <CardContent className="p-6 flex flex-col items-center justify-center gap-4 h-full">
            <Skeleton className="h-24 w-24 rounded-full" />
            <div className="space-y-2 flex flex-col items-center">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-4 w-32" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-none border-border/50 md:col-span-2">
          <CardHeader className="p-4 pb-2">
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent className="p-4 pt-2 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-2 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Metric Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i} className="shadow-none border-border/50 py-0">
            <CardHeader className="p-4 pb-2">
              <div className="flex justify-between items-center">
                <div className="flex gap-2 items-center">
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-2 w-full mt-2" />
            </CardHeader>
            <CardContent className="p-4 pt-2 space-y-4">
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
