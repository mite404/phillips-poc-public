import { useState, useEffect } from "react";
import { legacyApi } from "@/api/legacyRoutes";
import { localApi } from "@/api/localRoutes";
import type { LearnerProfile, ClassSchedule, CourseInventory } from "@/types/models";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Skeleton } from "../ui/skeleton";
import { toast } from "sonner";

interface EnrollmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  learner: LearnerProfile;
  programId: string;
  courseId: number;
  onEnrollmentComplete: () => void;
}

export function EnrollmentModal({
  isOpen,
  onClose,
  learner,
  programId,
  courseId,
  onEnrollmentComplete,
}: EnrollmentModalProps) {
  const [inventory, setInventory] = useState<CourseInventory | null>(null);
  const [selectedClass, setSelectedClass] = useState<ClassSchedule | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadInventory();
    }
  }, [isOpen, courseId]);

  async function loadInventory() {
    setIsLoading(true);
    try {
      const data = await legacyApi.getInventory(courseId);
      setInventory(data);
    } catch (error) {
      console.error("Failed to load class inventory:", error);
      toast.error("Failed to load class schedules");
    } finally {
      setIsLoading(false);
    }
  }

  const handleEnroll = async () => {
    if (!selectedClass) {
      toast.error("Please select a class");
      return;
    }

    try {
      toast.loading("Enrolling student...");

      await localApi.enrollStudent({
        learnerId: learner.learnerId,
        programId,
        courseId,
        classId: selectedClass.classId,
        enrolledDate: new Date().toISOString(),
      });

      toast.dismiss();
      toast.success(`${learner.learnerName} enrolled successfully!`);

      onEnrollmentComplete();
      onClose();
    } catch (error) {
      toast.dismiss();
      toast.error("Failed to enroll student");
      console.error(error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Enroll {learner.learnerName}</DialogTitle>
          <p className="text-sm text-slate-600">
            Select a class session for the first course in the program
          </p>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : !inventory || inventory.classes.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              No class sessions available for this course
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {inventory.classes.map((classSession) => (
                <button
                  key={classSession.classId}
                  onClick={() => setSelectedClass(classSession)}
                  className={`w-full p-4 border rounded-lg text-left transition-colors ${
                    selectedClass?.classId === classSession.classId
                      ? "border-phillips-blue bg-blue-50"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-slate-900">
                          {classSession.location}
                        </span>
                        <span
                          className={`px-2 py-0.5 text-xs rounded ${
                            classSession.type === "ILT"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {classSession.type}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600">
                        {formatDate(classSession.startDate)} –{" "}
                        {formatDate(classSession.endDate)}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {classSession.seats} seat{classSession.seats !== 1 ? "s" : ""} available
                      </p>
                    </div>
                    {selectedClass?.classId === classSession.classId && (
                      <div className="flex-shrink-0 ml-3">
                        <div className="w-6 h-6 bg-phillips-blue rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded hover:bg-slate-200"
          >
            Cancel
          </button>
          <button
            onClick={handleEnroll}
            disabled={!selectedClass}
            className="px-4 py-2 bg-phillips-blue text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirm Enrollment
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
