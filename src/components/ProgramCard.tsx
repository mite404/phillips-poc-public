import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, BookOpen } from "lucide-react";

interface ProgramCardProps {
  title: string;
  level: string;
  duration: string;
  skills: string[];
  courseCount: number;
  image: string | null;
  isFree: boolean;
  onView?: () => void; // Optional click handler
}

export function ProgramCard({
  title,
  level,
  duration,
  skills,
  courseCount,
  image,
  isFree,
  onView,
}: ProgramCardProps) {
  return (
    <Card className="flex flex-col h-full overflow-hidden hover:shadow-lg transition-shadow duration-200">
      {/* Hero Image */}
      <div className="h-48 w-full bg-slate-200 relative overflow-hidden">
        {image ? (
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400">
            No Image
          </div>
        )}
        {/* Level Badge Overlay */}
        <Badge className="absolute top-3 right-3 bg-white/90 text-slate-900 hover:bg-white shadow-sm">
          {level}
        </Badge>
      </div>

      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start">
          <h3 className="font-bold text-lg text-phillips-blue line-clamp-2 min-h-14">
            {title}
          </h3>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-2 grow">
        {/* Metadata Row */}
        <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{duration}</span>
          </div>
          <div className="flex items-center gap-1">
            <BookOpen className="w-4 h-4" />
            <span>{courseCount} Courses</span>
          </div>
        </div>

        {/* Skills Tags */}
        <div className="flex flex-wrap gap-1">
          {skills.slice(0, 3).map((skill) => (
            <span
              key={skill}
              className="text-xs bg-phillips-gray text-slate-600 px-2 py-1 rounded-md"
            >
              {skill}
            </span>
          ))}
          {skills.length > 3 && (
            <span className="text-xs text-slate-400 px-2 py-1">
              +{skills.length - 3} more
            </span>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex justify-between items-center border-t border-slate-100 mt-auto bg-slate-50/50">
        <span className="font-semibold text-phillips-red">
          {isFree ? "Free" : "Paid"}
        </span>
        <Button variant="outline" size="sm" onClick={onView}>
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
}
