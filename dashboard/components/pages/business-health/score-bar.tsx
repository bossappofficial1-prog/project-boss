import { HealthStatus } from "@/hooks/use-tools";

export function ScoreBar({
  score,
  status,
}: {
  score: number;
  status: HealthStatus;
}) {
  const barColor =
    status === "healthy"
      ? "bg-emerald-500"
      : status === "warning"
        ? "bg-amber-500"
        : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${barColor}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-xs tabular-nums text-muted-foreground w-8 text-right">
        {score.toFixed(1)}%
      </span>
    </div>
  );
}
