import { useState, useEffect } from "react";
import { legacyApi } from "@/api/legacyRoutes";
import { localApi } from "@/api/localRoutes";
import type { LearnerProfile, ProgramAssignment, CourseEnrollment } from "@/types/models";
import { Skeleton } from "./ui/skeleton";
import { EnrollmentModal } from "./common/EnrollmentModal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
        <div className="p-4 border-b border-border bg-muted">
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
        <div className="h-[88px] p-4 border-b border-border bg-muted flex flex-col justify-center">
          <h2 className="text-lg font-semibold">Student Roster</h2>
          <p className="text-sm text-slate-600">{learners.length} students</p>
        </div>

        {/* Batch Invite Button */}
        <div className="px-4 py-3 border-b border-border bg-background">
          <Button
            onClick={handleBatchInvite}
            className="w-full"
            disabled={selectedStudentIds.length === 0}
          >
            Invite Selected ({selectedStudentIds.length})
          </Button>
        </div>

        {/* Student Table */}
        <div className="flex-1 overflow-auto p-4">
          {learners.length === 0 ? (
            <div className="flex items-center justify-center h-full text-slate-400">
              No students found
            </div>
          ) : (
            <div className="min-w-max">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12 flex-shrink-0 pl-6">
                      <input
                        type="checkbox"
                        checked={
                          selectedStudentIds.length === learners.length &&
                          learners.length > 0
                        }
                        onChange={toggleSelectAll}
                        className="w-4 h-4 cursor-pointer"
                      />
                    </TableHead>
                    <TableHead className="min-w-48">Name</TableHead>
                    <TableHead className="w-32 text-center">Status</TableHead>
                    <TableHead className="w-[130px] pr-6 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {learners.map((learner) => {
                    const status = getStudentStatus(learner);
                    const isSelected = selectedStudentIds.includes(learner.learnerId);

                    return (
                      <TableRow key={learner.learnerId}>
                        <TableCell className="flex-shrink-0 pl-6">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleStudentSelection(learner.learnerId)}
                            className="w-4 h-4 cursor-pointer"
                          />
                        </TableCell>
                        <TableCell className="min-w-48">
                          <div className="flex flex-col min-w-0">
                            <span className="font-medium text-slate-900 truncate">
                              {learner.learnerName}
                            </span>
                            <span className="text-sm text-slate-600 truncate">
                              {learner.emailId}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="w-32 text-center">
                          {status === "registered" && (
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                              Registered
                            </Badge>
                          )}
                          {status === "pending" && (
                            <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                              Pending
                            </Badge>
                          )}
                          {status === "unassigned" && (
                            <Badge variant="outline">Unassigned</Badge>
                          )}
                        </TableCell>
                        <TableCell className="w-[130px] pr-6">
                          <div className="flex justify-end">
                            {status === "unassigned" && (
                              <Button
                                size="sm"
                                onClick={() => handleAssignProgram(learner)}
                              >
                                Assign
                              </Button>
                            )}
                            {status === "pending" && firstCourseId && (
                              <Button
                                size="sm"
                                onClick={() => handleForceEnroll(learner)}
                              >
                                Force Enroll
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
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
