import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HealthStatus } from "@/hooks/use-tools";
import { StatusBadge } from "./status-badge";
import { ScoreBar } from "./score-bar";

export function MetricCard({
  icon,
  title,
  score,
  status,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  score: number;
  status: HealthStatus;
  children: React.ReactNode;
}) {
  return (
    <Card className="gap-0 py-0 shadow-none border-border/50">
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
              {icon}
            </div>
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
          </div>
          <StatusBadge status={status} />
        </div>
        <ScoreBar score={score} status={status} />
      </CardHeader>
      <CardContent className="p-4 pt-2 space-y-2">{children}</CardContent>
    </Card>
  );
}
