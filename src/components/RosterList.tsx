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
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

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

  // Get unassigned learners (eligible for batch invite)
  const unassignedLearners = learners.filter((l) => getStudentStatus(l) === "unassigned");

  // Toggle individual student selection
  const toggleStudentSelection = (learnerId: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(learnerId)
        ? prev.filter((id) => id !== learnerId)
        : [...prev, learnerId],
    );
  };

  // Toggle select all
  const toggleSelectAll = () => {
    if (selectedStudentIds.length === learners.length) {
      // Deselect all
      setSelectedStudentIds([]);
    } else {
      // Select all learners
      setSelectedStudentIds(learners.map((l) => l.learnerId));
    }
  };

  // Batch invite selected students
  const handleBatchInvite = async () => {
    if (selectedStudentIds.length === 0) return;

    try {
      toast.loading(`Sending invites to ${selectedStudentIds.length} students...`);

      // Assign program to each selected student
      await Promise.all(
        selectedStudentIds.map((learnerId) =>
          localApi.assignProgram({
            learnerId,
            programId,
            assignedDate: new Date().toISOString(),
            status: "Pending",
          }),
        ),
      );

      // Reload assignments
      const updatedAssignments = await localApi.getAssignments();
      setAssignments(updatedAssignments);

      toast.dismiss();
      toast.success(`Sent invites to ${selectedStudentIds.length} students`);

      // Clear selection
      setSelectedStudentIds([]);
    } catch (error) {
      toast.dismiss();
      toast.error("Failed to send batch invites");
      console.error(error);
    }
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
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold">Student Roster</h2>
            {learners.length > 0 && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={
                    selectedStudentIds.length === learners.length && learners.length > 0
                  }
                  onChange={toggleSelectAll}
                  className="w-4 h-4 cursor-pointer"
                />
                <label
                  className="text-sm text-slate-600 cursor-pointer"
                  onClick={toggleSelectAll}
                >
                  Select All
                </label>
              </div>
            )}
          </div>
          <p className="text-sm text-slate-600">{learners.length} students</p>
          {selectedStudentIds.length > 0 && (
            <button
              onClick={handleBatchInvite}
              className="mt-3 w-full px-4 py-2 bg-gray-100! text-black font-semibold rounded-lg outline outline-gray border-2 hover:bg-slate-50! hover:border-slate-400 transition-colors"
            >
              Invite Selected ({selectedStudentIds.length})
            </button>
          )}
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
                const isUnassigned = status === "unassigned";
                const isSelected = selectedStudentIds.includes(learner.learnerId);

                return (
                  <div
                    key={learner.learnerId}
                    className="p-3 border border-slate-200 rounded hover:bg-slate-50"
                  >
                    <div className="flex items-start gap-3">
                      {/* Checkbox (for all students) */}
                      <div className="flex items-center pt-1">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleStudentSelection(learner.learnerId)}
                          className="w-4 h-4 cursor-pointer"
                        />
                      </div>

                      {/* Student Info */}
                      <div className="flex-1">
                        <h3 className="font-medium text-slate-900">
                          {learner.learnerName}
                        </h3>
                        <p className="text-sm text-slate-600">{learner.emailId}</p>
                        <p className="text-xs text-slate-500">
                          {typeof learner.location === "string"
                            ? learner.location
                            : learner.location?.locationName || "N/A"}
                        </p>
                      </div>

                      {/* Status Badge */}
                      <div className="flex items-center">
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
                        {status === "unassigned" && (
                          <button
                            onClick={() => handleAssignProgram(learner)}
                            className="px-3 py-1 bg-gray-100! text-slate-700!  border-slate-300 outline border-2 outline-gray-400 rounded hover:bg-slate-200! hover:border-slate-400"
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
