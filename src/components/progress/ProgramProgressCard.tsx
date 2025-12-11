import { useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import type { CourseCatalogItem, CourseEnrollment } from "@/types/models";

interface ProgramProgressCardProps {
  programName: string;
  programDescription?: string;
  courses: CourseCatalogItem[];
  enrollments: CourseEnrollment[];
}

type CourseStatus = "Completed" | "Incomplete" | "Not Enrolled";

export function ProgramProgressCard({
  programName,
  programDescription,
  courses,
  enrollments,
}: ProgramProgressCardProps) {
  // Initialize with 1 random course ID to simulate "25% complete" for demo
  const [completedCourseIds, setCompletedCourseIds] = useState<number[]>(() => {
    if (courses.length > 0) {
      const randomIndex = Math.floor(Math.random() * courses.length);
      return [courses[randomIndex].courseId];
    }
    return [];
  });

  // Calculate progress percentage
  const totalCourses = courses.length;
  const completedCount = completedCourseIds.length;
  const progressPercentage = totalCourses > 0 ? (completedCount / totalCourses) * 100 : 0;

  // Get enrolled course IDs
  const enrolledCourseIds = enrollments.map((e) => e.courseId);

  // Determine course status
  const getCourseStatus = (courseId: number): CourseStatus => {
    if (completedCourseIds.includes(courseId)) {
      return "Completed";
    }
    if (enrolledCourseIds.includes(courseId)) {
      return "Incomplete";
    }
    return "Not Enrolled";
  };

  // Toggle completion status (for demo purposes)
  const toggleCompletion = (courseId: number) => {
    setCompletedCourseIds((prev) => {
      if (prev.includes(courseId)) {
        return prev.filter((id) => id !== courseId);
      } else {
        return [...prev, courseId];
      }
    });
  };

  // Badge styling based on status
  const getStatusBadgeProps = (status: CourseStatus) => {
    switch (status) {
      case "Completed":
        return {
          className: "bg-green-100 text-green-800 hover:bg-green-200 cursor-pointer",
          text: "Completed",
        };
      case "Incomplete":
        return {
          className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 cursor-pointer",
          text: "Incomplete",
        };
      case "Not Enrolled":
        return {
          className: "bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer",
          text: "Not Enrolled",
        };
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
      {/* Header with Program Title and Progress Bar */}
      <div className="space-y-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{programName}</h3>
          {programDescription && (
            <p className="text-sm text-slate-600 mt-1">{programDescription}</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Progress</span>
            <span className="font-medium text-slate-900">
              {completedCount} of {totalCourses} courses completed (
              {Math.round(progressPercentage)}%)
            </span>
          </div>
          <Progress value={progressPercentage} className="h-3" />
        </div>
      </div>

      {/* Course List */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-slate-700">Courses</h4>
        <div className="space-y-2">
          {courses.map((course) => {
            const status = getCourseStatus(course.courseId);
            const badgeProps = getStatusBadgeProps(status);

            return (
              <div
                key={course.courseId}
                className="flex items-center py-2 px-3 rounded border border-slate-100 hover:bg-slate-50 gap-4"
              >
                {/* Left: Course Title */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {course.courseTitle}
                  </p>
                </div>

                {/* Center: Course Code (right-aligned, fixed width) */}
                <span className="text-xs text-slate-400 font-mono whitespace-nowrap text-right w-12">
                  #{course.courseId}
                </span>

                {/* Right: Status Badge */}
                <Badge
                  onClick={() => toggleCompletion(course.courseId)}
                  className={badgeProps.className}
                >
                  {badgeProps.text}
                </Badge>
              </div>
            );
          })}
        </div>
      </div>

      {/* Demo Hint */}
      <p className="text-xs text-slate-400 italic border-t border-slate-100 pt-3">
        Click status badges to toggle completion (demo feature)
      </p>
    </div>
  );
}
