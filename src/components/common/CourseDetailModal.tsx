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
}

export function CourseDetailModal({ course, isOpen, onClose }: CourseDetailModalProps) {
  if (!course) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{course.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">Course Code</p>
              <p className="text-base font-mono">{course.code}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Level</p>
              <p className="text-base">{course.level}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Type</p>
              <p className="text-base">{course.type}</p>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 mb-2">Description</p>
            <p className="text-sm text-slate-600">
              This course covers the fundamentals of {course.title.toLowerCase()}. Students
              will learn essential skills and techniques through hands-on practice and
              expert instruction.
            </p>
          </div>
        </div>
        <DialogFooter>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded hover:bg-slate-200"
          >
            Close
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
