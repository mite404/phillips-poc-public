import { useState, useEffect } from "react";
import { legacyApi } from "@/api/legacyRoutes";
import { localApi } from "@/api/localRoutes";
import type { LearnerProfile, ProgramAssignment, CourseEnrollment } from "@/types/models";
import { Skeleton } from "./ui/skeleton";
import { EnrollmentModal } from "./common/EnrollmentModal";
import { toast } from "sonner";

interface RosterListProps {
  programId: string;
  firstCourseId?: number;
}

export function RosterList({ programId, firstCourseId }: RosterListProps) {
  const [learners, setLearners] = useState<LearnerProfile[]>([]);
  const [assignments, setAssignments] = useState<ProgramAssignment[]>([]);
  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLearner, setSelectedLearner] = useState<LearnerProfile | null>(null);

  useEffect(() => {
    loadRosterData();
  }, []);

  async function loadRosterData() {
    setIsLoading(true);
    try {
      const [fetchedLearners, fetchedAssignments, fetchedEnrollments] = await Promise.all(
        [legacyApi.getRoster(), localApi.getAssignments(), localApi.getEnrollments()],
      );

      setLearners(fetchedLearners);
      setAssignments(fetchedAssignments);
      setEnrollments(fetchedEnrollments);
    } catch (error) {
      console.error("Failed to load roster data:", error);
      toast.error("Failed to load student roster");
    } finally {
      setIsLoading(false);
    }
  }

  const handleAssignProgram = async (learner: LearnerProfile) => {
    try {
      toast.loading("Assigning program...");

      await localApi.assignProgram({
        learnerId: learner.learnerId,
        programId,
        assignedDate: new Date().toISOString(),
        status: "Pending",
      });

      // Reload assignments
      const updatedAssignments = await localApi.getAssignments();
      setAssignments(updatedAssignments);

      toast.dismiss();
      toast.success(`Program assigned to ${learner.learnerName}`);
    } catch (error) {
      toast.dismiss();
      toast.error("Failed to assign program");
      console.error(error);
    }
  };

  const handleForceEnroll = (learner: LearnerProfile) => {
    setSelectedLearner(learner);
  };

  const handleEnrollmentComplete = async () => {
    // Reload data after enrollment
    const [updatedAssignments, updatedEnrollments] = await Promise.all([
      localApi.getAssignments(),
      localApi.getEnrollments(),
    ]);
    setAssignments(updatedAssignments);
    setEnrollments(updatedEnrollments);
    setSelectedLearner(null);
  };

  const getStudentStatus = (
    learner: LearnerProfile,
  ): "unassigned" | "pending" | "registered" => {
    // Check if enrolled
    const hasEnrollment = enrollments.some(
      (e) => e.learnerId === learner.learnerId && e.programId === programId,
    );
    if (hasEnrollment) return "registered";

    // Check if assigned
    const hasAssignment = assignments.some(
      (a) => a.learnerId === learner.learnerId && a.programId === programId,
    );
    if (hasAssignment) return "pending";

    return "unassigned";
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-slate-300 bg-slate-50">
          <h2 className="text-lg font-semibold">Student Roster</h2>
        </div>
        <div className="flex-1 p-4 space-y-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-slate-300 bg-slate-50">
          <h2 className="text-lg font-semibold">Student Roster</h2>
          <p className="text-sm text-slate-600">{learners.length} students</p>
        </div>

        {/* Student List */}
        <div className="flex-1 overflow-y-auto p-4">
          {learners.length === 0 ? (
            <div className="flex items-center justify-center h-full text-slate-400">
              No students found
            </div>
          ) : (
            <div className="space-y-2">
              {learners.map((learner) => {
                const status = getStudentStatus(learner);

                return (
                  <div
                    key={learner.learnerId}
                    className="p-3 border border-slate-200 rounded hover:bg-slate-50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      {/* Student Info */}
                      <div className="flex-1">
                        <h3 className="font-medium text-slate-900">
                          {learner.learnerName}
                        </h3>
                        <p className="text-sm text-slate-600">{learner.emailId}</p>
                        <p className="text-xs text-slate-500">{learner.location}</p>
                      </div>

                      {/* Status & Actions */}
                      <div className="flex flex-col items-end gap-2">
                        {/* Status Badge */}
                        {status === "registered" && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded font-medium">
                            ✓ Registered
                          </span>
                        )}
                        {status === "pending" && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded font-medium">
                            ⏳ Pending
                          </span>
                        )}

                        {/* Action Buttons */}
                        {status === "unassigned" && (
                          <button
                            onClick={() => handleAssignProgram(learner)}
                            className="px-3 py-1 bg-phillips-blue text-white text-sm rounded hover:bg-blue-700"
                          >
                            Assign
                          </button>
                        )}
                        {status === "pending" && firstCourseId && (
                          <button
                            onClick={() => handleForceEnroll(learner)}
                            className="px-3 py-1 bg-phillips-red text-white text-sm rounded hover:bg-red-700"
                          >
                            Force Enroll
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Enrollment Modal */}
      {selectedLearner && firstCourseId && (
        <EnrollmentModal
          isOpen={!!selectedLearner}
          onClose={() => setSelectedLearner(null)}
          learner={selectedLearner}
          programId={programId}
          courseId={firstCourseId}
          onEnrollmentComplete={handleEnrollmentComplete}
        />
      )}
    </>
  );
}
