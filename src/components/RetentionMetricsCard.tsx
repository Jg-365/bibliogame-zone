import React from "react";
import { Activity, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useRetentionMetrics } from "@/hooks/useRetentionMetrics";

const MetricItem = ({
  label,
  value,
  subtitle,
}: {
  label: string;
  value: number;
  subtitle: string;
}) => (
  <div className="rounded-[var(--radius-md)] border border-border/70 bg-card p-3">
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="text-2xl font-bold">{value}%</p>
    <p className="text-xs text-muted-foreground">{subtitle}</p>
  </div>
);

export const RetentionMetricsCard = () => {
  const { data, isLoading } = useRetentionMetrics();

  return (
    <Card className="border-border/70">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <BarChart3 className="h-4 w-4 text-primary" />
          Retenção D1 / D7 / D30
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {isLoading || !data ? (
          <div className="grid gap-3 sm:grid-cols-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            <MetricItem label="D1" value={data.d1} subtitle={`${data.activeToday} ativos em 24h`} />
            <MetricItem label="D7" value={data.d7} subtitle={`${data.active7d} ativos em 7 dias`} />
            <MetricItem
              label="D30"
              value={data.d30}
              subtitle={`${data.active30d} ativos em 30 dias`}
            />
          </div>
        )}
        <div className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
          <Activity className="h-3.5 w-3.5" />
          Métrica baseada em eventos instrumentados de produto
        </div>
      </CardContent>
    </Card>
  );
};
