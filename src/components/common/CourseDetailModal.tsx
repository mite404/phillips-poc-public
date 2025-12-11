import { Course } from "../../hooks/useProgramBuilder";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";

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
        </div>
        <DialogFooter>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded hover:bg-slate-200"
          >
            Close
          </button>
          {showBookButton && (
            <button
              onClick={() => {
                onBookClick();
                onClose();
              }}
              className="px-4 py-2 bg-phillips-blue text-white rounded hover:bg-blue-700"
            >
              Book Class
            </button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
