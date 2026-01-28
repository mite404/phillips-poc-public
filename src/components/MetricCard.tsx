import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
interface MetricCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  isLoading: boolean;
  highlight?: boolean;
}

export function MetricCard({ title, value, icon, isLoading, highlight = false }: MetricCardProps) {
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
          <div className="text-3xl font-bold">{value}</div>
        )}
      </CardContent>
    </Card>
  );
}
