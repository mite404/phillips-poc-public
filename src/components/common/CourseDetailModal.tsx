import { useState, useEffect } from "react";
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

  // The parent nulls `course` in the same callback that closes the dialog (see
  // ProgramBuilder/ProgramManager: `onClose={() => setActiveCourse(null)}`). If the dialog's
  // exit animation read `course` directly, its content would blank out the instant the close
  // starts, before the transition finishes. Retaining the last non-null value keeps the
  // content visible through the exit. This is React's documented "adjust state during
  // rendering" pattern, not a derived-state useEffect: it runs synchronously in render, so a
  // reopen with a new course never paints the previous one.
  const [displayCourse, setDisplayCourse] = useState(course);
  if (course && course !== displayCourse) {
    setDisplayCourse(course);
    // Clear in the same swap. `testimonials` is keyed to nothing, so without this a
    // reopen shows the PREVIOUS course's testimonials until the new fetch resolves.
    // Unmounting used to reset it for free; keeping the dialog mounted is what makes
    // this leak possible, so the fix belongs with the change that caused it.
    setTestimonials([]);
  }

  // Plan 011 made this dialog stay permanently mounted (rendered unconditionally by
  // the parent so its exit transition can play), so the SAME instance now lives
  // through many different `course` values instead of unmounting between them. If a
  // course closes before its testimonials fetch resolves and a different course opens,
  // the stale response can land after the new one and show the wrong testimonials.
  // `ignore` discards it - see docs/plans/2026-08-26-anim-audit/012-fetch-abort-guard.md.
  useEffect(() => {
    if (!isOpen || !course) return;
    const activeCourse = course;

    let ignore = false;

    async function loadTestimonials() {
      try {
        const allTestimonials = await legacyApi.getTestimonials();
        if (ignore) return;
        // Filter testimonials for this specific course
        const filtered = allTestimonials.filter((t) =>
          t.courses.some((c) => c.courseId === activeCourse.courseId),
        );
        setTestimonials(filtered);
      } catch (error) {
        if (ignore) return;
        console.error("Failed to load testimonials:", error);
        setTestimonials([]);
      }
    }

    loadTestimonials();

    return () => {
      ignore = true;
    };
  }, [isOpen, course]);

  const showBookButton =
    onBookClick && displayCourse?.trainingTypeName.includes("ILT");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl">
        {displayCourse && (
          <>
            <DialogHeader>
              <DialogTitle>{displayCourse.courseTitle}</DialogTitle>
            </DialogHeader>

            {/* 2-Column Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 py-6">
              {/* Left Column (Metadata & Description) */}
              <div className="md:col-span-7 space-y-8">
                {/* Metadata Grid (2x2) */}
                <div className="grid grid-cols-2 gap-6">
                  {/* Course ID */}
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Course ID
                    </p>
                    <p className="text-lg font-semibold font-mono">
                      #{displayCourse.courseId}
                    </p>
                  </div>

                  {/* Level */}
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Level</p>
                    <p className="text-lg font-semibold">
                      {displayCourse.levelName}
                    </p>
                  </div>

                  {/* Type */}
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Type</p>
                    <p className="text-lg font-semibold">
                      {displayCourse.trainingTypeName}
                    </p>
                  </div>

                  {/* Duration */}
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Duration
                    </p>
                    <p className="text-lg font-semibold">
                      {displayCourse.trainingTypeName === "ILT"
                        ? `${displayCourse.totalDays} day${displayCourse.totalDays !== 1 ? "s" : ""}`
                        : displayCourse.hours
                          ? `${displayCourse.hours} hour${displayCourse.hours !== 1 ? "s" : ""}`
                          : "Self-paced"}
                    </p>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Description
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    This course covers the fundamentals of{" "}
                    {displayCourse.courseTitle.toLowerCase()}. Students will
                    learn essential skills and techniques through hands-on
                    practice and expert instruction.
                  </p>
                </div>
              </div>

              {/* Right Column (Skills & Testimonials) */}
              <div className="md:col-span-5 space-y-8">
                {/* Skills Section */}
                {displayCourse.skills && displayCourse.skills.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-3">Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {displayCourse.skills.map((skill, idx) => (
                        <Badge
                          key={idx}
                          className="bg-blue-100 text-blue-700 hover:bg-blue-100 shadow-none"
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
                    <p className="text-sm text-muted-foreground mb-3">
                      What People Say
                    </p>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {testimonials.map((testimonial) => (
                        <div
                          key={testimonial.testimonialId}
                          className="bg-card-background border border-border rounded-lg p-3"
                        >
                          <p className="font-medium text-sm text-foreground">
                            {testimonial.personName}
                          </p>
                          <p className="text-xs text-muted-foreground mb-2">
                            {testimonial.personTitle}
                          </p>
                          {testimonial.testimonialText ? (
                            <p className="text-sm text-muted-foreground italic">
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
              <Button onClick={onClose}>Close</Button>
              {showBookButton && (
                <Button
                  onClick={() => {
                    onBookClick();
                  }}
                >
                  Book Class
                </Button>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
