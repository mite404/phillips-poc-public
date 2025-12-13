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

  useEffect(() => {
    if (isOpen && course) {
      loadTestimonials();
    }
  }, [isOpen, course]);

  async function loadTestimonials() {
    try {
      const allTestimonials = await legacyApi.getTestimonials();
      // Filter testimonials for this specific course
      const filtered = allTestimonials.filter((t) =>
        t.courses.some((c) => c.courseId === course?.courseId),
      );
      setTestimonials(filtered);
    } catch (error) {
      console.error("Failed to load testimonials:", error);
      setTestimonials([]);
    }
  }

  if (!course) return null;

  const showBookButton = onBookClick && course.trainingTypeName.includes("ILT");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{course.courseTitle}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">Course ID</p>
              <p className="text-base font-mono">#{course.courseId}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Level</p>
              <p className="text-base">{course.levelName}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Type</p>
              <p className="text-base">{course.trainingTypeName}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Duration</p>
              <p className="text-base">
                {course.trainingTypeName === "ILT"
                  ? `${course.totalDays} day${course.totalDays !== 1 ? "s" : ""}`
                  : course.hours
                    ? `${course.hours} hour${course.hours !== 1 ? "s" : ""}`
                    : "Self-paced"}
              </p>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 mb-2">Description</p>
            <p className="text-sm text-slate-600">
              This course covers the fundamentals of {course.courseTitle.toLowerCase()}.
              Students will learn essential skills and techniques through hands-on
              practice and expert instruction.
            </p>
          </div>
          {course.skills && course.skills.length > 0 && (
            <div>
              <p className="text-sm font-medium text-slate-500 mb-2">Skills</p>
              <div className="flex flex-wrap gap-2">
                {course.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                  >
                    {skill.skillName}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Testimonials Section */}
          {testimonials.length > 0 && (
            <div>
              <p className="text-sm font-medium text-slate-500 mb-2">What People Say</p>
              <div className="space-y-3">
                {testimonials.map((testimonial) => (
                  <div
                    key={testimonial.testimonialId}
                    className="p-3 bg-slate-50 rounded-lg border border-slate-200"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
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
                          <div className="flex items-center gap-1 text-sm text-phillips-blue">
                            <ExternalLink className="w-4 h-4" />
                            <span>Video Testimonial Available</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <button
            onClick={onClose}
            className="bg-orange-50! text-black outline hover:bg-orange-300! hover:ring-1 outline-gray-400! text-sm rounded px-4 py-2"
          >
            Close
          </button>
          {showBookButton && (
            <button
              onClick={() => {
                onBookClick();
              }}
              className="bg-gray-100! text-black! border-slate-300 outline border-2 outline-gray-400 px-4 py-2 rounded hover:bg-slate-200! hover:border-slate-400"
            >
              Book Class
            </button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
