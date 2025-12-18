import { useState, useEffect, useCallback } from "react";
import { Course } from "../../hooks/useProgramBuilder";
import { legacyApi } from "@/api/legacyRoutes";
import type { Testimonial } from "@/types/models";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { ExternalLink } from "lucide-react";

interface CourseDetailModalProps {
  course: Course | null;
  isOpen: boolean;
  onClose: () => void;
  onBookClick?: () => void;
}

export function CourseDetailModal({
  course,
  isOpen,
  onClose,
  onBookClick,
}: CourseDetailModalProps) {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);

  const loadTestimonials = useCallback(async () => {
    if (!course) return;

    try {
      const allTestimonials = await legacyApi.getTestimonials();
      // Filter testimonials for this specific course
      const filtered = allTestimonials.filter((t) =>
        t.courses.some((c) => c.courseId === course.courseId),
      );
      setTestimonials(filtered);
    } catch (error) {
      console.error("Failed to load testimonials:", error);
      setTestimonials([]);
    }
  }, [course]);

  useEffect(() => {
    if (isOpen && course) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadTestimonials();
    }
  }, [isOpen, course, loadTestimonials]);

  if (!course) return null;

  const showBookButton = onBookClick && course.trainingTypeName.includes("ILT");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{course.courseTitle}</DialogTitle>
        </DialogHeader>

        {/* 2-Column Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 py-6">
          {/* Left Column (Metadata & Description) */}
          <div className="md:col-span-7 space-y-8">
            {/* Metadata Grid (2x2) */}
            <div className="grid grid-cols-2 gap-6">
              {/* Course ID */}
              <div>
                <p className="text-sm text-muted-foreground mb-1">Course ID</p>
                <p className="text-lg font-semibold font-mono">#{course.courseId}</p>
              </div>

              {/* Level */}
              <div>
                <p className="text-sm text-muted-foreground mb-1">Level</p>
                <p className="text-lg font-semibold">{course.levelName}</p>
              </div>

              {/* Type */}
              <div>
                <p className="text-sm text-muted-foreground mb-1">Type</p>
                <p className="text-lg font-semibold">{course.trainingTypeName}</p>
              </div>

              {/* Duration */}
              <div>
                <p className="text-sm text-muted-foreground mb-1">Duration</p>
                <p className="text-lg font-semibold">
                  {course.trainingTypeName === "ILT"
                    ? `${course.totalDays} day${course.totalDays !== 1 ? "s" : ""}`
                    : course.hours
                      ? `${course.hours} hour${course.hours !== 1 ? "s" : ""}`
                      : "Self-paced"}
                </p>
              </div>
            </div>

            {/* Description */}
            <div>
              <p className="text-sm text-muted-foreground mb-3">Description</p>
              <p className="text-sm text-slate-600 leading-relaxed">
                This course covers the fundamentals of {course.courseTitle.toLowerCase()}.
                Students will learn essential skills and techniques through hands-on
                practice and expert instruction.
              </p>
            </div>
          </div>

          {/* Right Column (Skills & Testimonials) */}
          <div className="md:col-span-5 space-y-8">
            {/* Skills Section */}
            {course.skills && course.skills.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-3">Skills</p>
                <div className="flex flex-wrap gap-2">
                  {course.skills.map((skill, idx) => (
                    <Badge
                      key={idx}
                      className="bg-blue-100 text-blue-700 hover:bg-blue-100"
                    >
                      {skill.skillName}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Testimonials Section */}
            {testimonials.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-3">What People Say</p>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {testimonials.map((testimonial) => (
                    <div
                      key={testimonial.testimonialId}
                      className="bg-card-background border border-slate-100 rounded-lg p-3"
                    >
                      <p className="font-medium text-sm text-slate-900">
                        {testimonial.personName}
                      </p>
                      <p className="text-xs text-slate-500 mb-2">
                        {testimonial.personTitle}
                      </p>
                      {testimonial.testimonialText ? (
                        <p className="text-sm text-slate-700 italic">
                          "{testimonial.testimonialText}"
                        </p>
                      ) : (
                        <div className="flex items-center gap-1 text-sm">
                          <ExternalLink className="w-4 h-4" />
                          <span>Video Testimonial Available</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer with Actions */}
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {showBookButton && (
            <Button
              variant="outline"
              onClick={() => {
                onBookClick();
              }}
            >
              Book Class
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
