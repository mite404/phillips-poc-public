import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import { useCountUp } from "@/hooks/useCountUp";
interface MetricCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  isLoading: boolean;
  highlight?: boolean;
}

export function MetricCard({ title, value, icon, isLoading, highlight = false }: MetricCardProps) {
  // `!isLoading` gates the count so it starts when real data lands, not while
  // the skeleton is up - otherwise it would count once against the skeleton and
  // again after the crossfade.
  const shown = useCountUp(value, !isLoading);
  return (
    <Card className={highlight ? "border-primary" : ""}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <div className="text-3xl font-bold transition-opacity duration-(--duration-swap) ease-out starting:opacity-0">
            {shown}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
