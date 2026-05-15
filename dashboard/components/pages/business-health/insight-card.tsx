import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BusinessHealthData } from "@/hooks/use-tools";
import { Activity, AlertTriangle, CheckCircle, XCircle } from "lucide-react";

function InsightIcon({ type }: { type: "positive" | "warning" | "danger" }) {
  if (type === "positive")
    return <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />;
  if (type === "warning")
    return <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />;
  return <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />;
}

type InsightProps = {
  insights: BusinessHealthData["insights"];
};

export function InsightCard({ insights }: InsightProps) {
  return (
    <Card className="py-0 gap-0 shadow-none border-border/50">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Activity className="h-4 w-4 text-muted-foreground" />
          Insight & Rekomendasi
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-2 space-y-3">
        {insights.map((insight, i) => (
          <div key={i} className="flex items-start gap-3 text-sm">
            <InsightIcon type={insight.type} />
            <p
              className={
                insight.type === "positive"
                  ? "text-foreground"
                  : insight.type === "warning"
                    ? "text-amber-800"
                    : "text-red-800"
              }
            >
              {insight.message}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
