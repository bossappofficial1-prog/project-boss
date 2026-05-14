import { Badge } from "@/components/ui/badge";
import { HealthStatus } from "@/hooks/use-tools";
import { STATUS_CONFIG } from "./utils";

export function StatusBadge({ status }: { status: HealthStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <Badge className={`${cfg.bg} ${cfg.color} border hover:${cfg.bg} text-xs`}>
      {cfg.label}
    </Badge>
  );
}
