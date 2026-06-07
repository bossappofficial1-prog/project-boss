export function MetricRow({
  label,
  value,
  sub,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <div className="text-right">
        <div className="font-medium tabular-nums">{value}</div>
        {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
      </div>
    </div>
  );
}
