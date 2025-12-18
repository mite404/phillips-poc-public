import { Course } from "@/hooks/useProgramBuilder";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface CourseCardProps {
  course: Course;
  action: "add" | "remove";
  onAction: () => void;
  onClick?: () => void;
  variant?: "default" | "workbench";
  dragHandle?: React.ReactNode;
}

export function CourseCard({
  course,
  action,
  onAction,
  onClick,
  variant = "default",
  dragHandle,
}: CourseCardProps) {
  const handleCardClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAction();
  };

  // Workbench variant: Vertical layout with title centered at top
  if (variant === "workbench") {
    return (
      <Card className="p-4 hover:shadow-md transition-all cursor-pointer border-slate-200">
        {/* Row 1: Centered Title */}
        <div className="text-lg font-semibold text-center text-slate-900 mb-4">
          {course.courseTitle}
        </div>

        {/* Row 2: Metadata (Drag Handle + Badges + Duration) */}
        <div className="flex items-center justify-between mb-4 gap-2">
          {/* Left: Drag Handle */}
          {dragHandle || (
            <div className="w-5 flex items-center justify-center flex-shrink-0">
              <div className="text-slate-400 text-sm">⋮⋮</div>
            </div>
          )}

          {/* Center: Badges */}
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="border-secondary text-foreground bg-transparent text-xs font-normal"
            >
              {course.trainingTypeName}
            </Badge>
            <Badge
              variant="outline"
              className="border-secondary text-foreground bg-transparent text-xs font-normal"
            >
              {course.levelName}
            </Badge>
          </div>

          {/* Right: Duration */}
          <div className="text-sm text-slate-500 ml-auto whitespace-nowrap">
            Duration:{" "}
            {course.trainingTypeName === "ILT"
              ? `${course.totalDays} day${course.totalDays !== 1 ? "s" : ""}`
              : course.hours
                ? `${course.hours} hour${course.hours !== 1 ? "s" : ""}`
                : "Self-paced"}
          </div>
        </div>

        {/* Row 3: Full Width Remove Button */}
        <Button size="sm" onClick={handleActionClick} className="w-full">
          Remove
        </Button>
      </Card>
    );
  }

  // Default variant: Original layout
  return (
    <Card
      className="cursor-pointer hover:bg-accent/50 transition-colors"
      onClick={handleCardClick}
    >
      <CardHeader className="p-4 pb-3">
        <div className="flex items-start gap-3">
          {/* Course Image Thumbnail */}
          {course.previewImageUrl && (
            <div className="relative flex-shrink-0 w-16 h-16 rounded overflow-hidden bg-slate-100">
              <img
                src={course.previewImageUrl}
                alt={course.courseTitle}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          )}

          {/* Title and Level Badge */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm leading-tight mb-2 line-clamp-2">
              {course.courseTitle}
            </h3>
            <Badge
              variant="outline"
              className="border-secondary text-foreground bg-transparent text-xs font-normal"
            >
              {course.levelName}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-3 pt-0">
        <div className="flex flex-col gap-1 text-xs text-muted-foreground">
          {/* Training Type */}
          <div className="flex items-center gap-2">
            <span className="font-medium">Type:</span>
            <span>{course.trainingTypeName}</span>
          </div>

          {/* Duration */}
          <div className="flex items-center gap-2">
            <span className="font-medium">Duration:</span>
            <span>
              {course.trainingTypeName === "ILT"
                ? `${course.totalDays || 0} day${course.totalDays !== 1 ? "s" : ""}`
                : `${course.hours || 0} hour${course.hours !== 1 ? "s" : ""}`}
            </span>
          </div>

          {/* Course ID */}
          <div className="flex items-center gap-2 font-mono">
            <span className="font-medium">ID:</span>
            <span>#{course.courseId}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="px-4 pb-4 pt-0">
        <Button size="sm" onClick={handleActionClick} className="w-full">
          {action === "remove" ? "Remove" : "Add"}
        </Button>
      </CardFooter>
    </Card>
  );
}
