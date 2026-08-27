import { useState, useEffect } from "react";
import { legacyApi } from "@/api/legacyRoutes";
import { localApi } from "@/api/localRoutes";
import type {
  LearnerProfile,
  ClassSchedule,
  CourseInventory,
} from "@/types/models";
import { Button } from "@/components/ui/button";
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
  learner: LearnerProfile | null;
  programId: string;
  courseId: number | null;
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
  const [selectedClass, setSelectedClass] = useState<ClassSchedule | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);

  // Callers select a learner/course together and clear both in the same handler that
  // closes the dialog (see RosterList: `onClose={() => setSelectedLearner(null)}`). Without
  // retaining the last non-null pair, the exit animation would play on an empty dialog.
  // Updating state synchronously during render (React's documented pattern for this) means a
  // reopen with a different learner never paints the previous one.
  const [displayLearner, setDisplayLearner] = useState(learner);
  const [displayCourseId, setDisplayCourseId] = useState(courseId);
  if (learner && learner !== displayLearner) {
    setDisplayLearner(learner);
    // Same reasoning as the testimonials clear: every learner in a roster shares one
    // courseId, so a class checked for Alice stayed checked when reopening for Charlie
    // once the dialog stopped unmounting. Reproduced live before this line existed.
    setSelectedClass(null);
  }
  if (courseId !== null && courseId !== displayCourseId) {
    setDisplayCourseId(courseId);
  }

  // Plan 011 made this dialog stay permanently mounted (rendered unconditionally by
  // the parent so its exit transition can play), so the SAME instance now lives
  // through many different `courseId` values instead of unmounting between them (see
  // StudentDashboard, which opens this modal for a different course per program). If
  // one course's inventory fetch is still in flight when a different course opens,
  // the stale response can land after the new one and show the wrong class list.
  // `ignore` discards it - see docs/plans/2026-08-26-anim-audit/012-fetch-abort-guard.md.
  useEffect(() => {
    if (!isOpen || courseId === null) return;
    const activeCourseId = courseId;

    let ignore = false;

    async function loadInventory() {
      setIsLoading(true);
      try {
        const data = await legacyApi.getInventory(activeCourseId);
        if (ignore) return;
        setInventory(data);
      } catch (error) {
        if (ignore) return;
        console.error("Failed to load class inventory:", error);
        toast.error("Failed to load class schedules");
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    loadInventory();

    return () => {
      ignore = true;
    };
  }, [isOpen, courseId]);

  const handleEnroll = async () => {
    if (!selectedClass || !displayLearner || displayCourseId === null) {
      toast.error("Please select a class");
      return;
    }

    try {
      toast.loading("Enrolling student...");

      await localApi.enrollStudent({
        learnerId: displayLearner.learnerId,
        programId,
        courseId: displayCourseId,
        classId: selectedClass.classId,
        enrolledDate: new Date().toISOString(),
      });

      toast.dismiss();
      toast.success(`${displayLearner.learnerName} enrolled successfully!`);

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
        {displayLearner && (
          <>
            <DialogHeader>
              <DialogTitle>Enroll {displayLearner.learnerName}</DialogTitle>
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
                          ? " bg-card-background"
                          : "border-border hover:bg-card-background"
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
                            {classSession.seats} seat
                            {classSession.seats !== 1 ? "s" : ""} available
                          </p>
                        </div>
                        {selectedClass?.classId === classSession.classId && (
                          <div className="shrink-0 ml-3">
                            <div className="w-6 h-6 rounded-full flex items-center justify-center">
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
              <Button onClick={onClose}>Cancel</Button>
              <Button onClick={handleEnroll} disabled={!selectedClass}>
                Confirm Enrollment
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
