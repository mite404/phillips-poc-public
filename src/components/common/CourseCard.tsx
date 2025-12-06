/**
 * CourseCard Component
 * Displays a course catalog item with image, title, duration, level, and add button
 */

import { Plus } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CourseCatalogItem } from "@/types/models";

interface CourseCardProps {
  course: CourseCatalogItem;
  onAdd?: (course: CourseCatalogItem) => void;
}

export function CourseCard({ course, onAdd }: CourseCardProps) {
  const {
    courseTitle,
    levelName,
    trainingTypeName,
    totalDays,
    hours,
    previewImageUrl,
    prices,
  } = course;

  // Determine if the course is free
  const isFree = prices[0]?.isFree ?? false;
  const price = !isFree && prices[0]?.price ? `$${prices[0].price}` : null;

  // Format duration display
  const duration =
    trainingTypeName === "ILT"
      ? `${totalDays} ${totalDays === 1 ? "day" : "days"}`
      : hours
        ? `${hours} ${hours === 1 ? "hour" : "hours"}`
        : "Self-paced";

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {/* Image */}
      <div className="aspect-video bg-slate-200 relative overflow-hidden">
        {previewImageUrl ? (
          <img
            src={previewImageUrl}
            alt={courseTitle}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400">
            No Image
          </div>
        )}

        {/* Level Badge - positioned on image */}
        <div className="absolute top-2 left-2">
          <Badge
            variant={levelName === "Advanced" ? "default" : "secondary"}
            className={levelName === "Advanced" ? "bg-phillips-blue" : ""}
          >
            {levelName}
          </Badge>
        </div>

        {/* Training Type Badge */}
        <div className="absolute top-2 right-2">
          <Badge variant="outline" className="bg-white/90">
            {trainingTypeName}
          </Badge>
        </div>
      </div>

      <CardContent className="p-4">
        {/* Title */}
        <h3 className="font-semibold text-sm line-clamp-2 mb-2 min-h-10">
          {courseTitle}
        </h3>

        {/* Duration & Price */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{duration}</span>
          {isFree ? (
            <Badge variant="secondary" className="text-xs">
              Free
            </Badge>
          ) : price ? (
            <span className="font-semibold text-phillips-blue">{price}</span>
          ) : null}
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <Button
          size="sm"
          variant="outline"
          className="w-full"
          onClick={() => onAdd?.(course)}
        >
          <Plus className="w-4 h-4 mr-1" />
          Add to Program
        </Button>
      </CardFooter>
    </Card>
  );
}
