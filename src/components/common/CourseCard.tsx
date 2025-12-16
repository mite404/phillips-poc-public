import { Course } from "@/hooks/useProgramBuilder";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface CourseCardProps {
  course: Course;
  action: "add" | "remove";
  onAction: () => void;
  onClick?: () => void;
}

export function CourseCard({ course, action, onAction, onClick }: CourseCardProps) {
  const handleCardClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAction();
  };

  // Determine level badge variant
  const getLevelVariant = (level: string) => {
    if (level === "Advanced") return "default";
    return "secondary";
  };

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
            <Badge variant={getLevelVariant(course.levelName)} className="text-xs">
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
        <Button
          size="sm"
          variant={action === "remove" ? "destructive" : "outline"}
          onClick={handleActionClick}
          className="w-full"
        >
          {action === "remove" ? "Remove" : "Add"}
        </Button>
      </CardFooter>
    </Card>
  );
}
