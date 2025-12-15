import { useState, useEffect } from "react";
import { ProgramProgressCard } from "./ProgramProgressCard";
import { legacyApi } from "@/api/legacyRoutes";
import { localApi } from "@/api/localRoutes";
import type {
  LearnerProfile,
  CourseEnrollment,
  SupervisorProgram,
  CourseCatalogItem,
} from "@/types/models";

interface StudentProgressViewProps {
  studentId: string | number;
}

interface HydratedProgram {
  program: SupervisorProgram;
  courses: CourseCatalogItem[];
  enrollments: CourseEnrollment[];
}

export function StudentProgressView({ studentId }: StudentProgressViewProps) {
  const [student, setStudent] = useState<LearnerProfile | null>(null);
  const [hydratedPrograms, setHydratedPrograms] = useState<HydratedProgram[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        setError(null);

        // Step 1: Fetch all data in parallel
        const [roster, assignments, enrollments, allPrograms, catalog] =
          await Promise.all([
            legacyApi.getRoster(),
            localApi.getAssignments(),
            localApi.getEnrollments(),
            fetchAllPrograms(),
            legacyApi.getCatalog(),
          ]);

        // Step 2: Find the student
        const foundStudent = roster.find(
          (s) =>
            s.learnerId === String(studentId) || s.learner_Data_Id === Number(studentId),
        );

        if (!foundStudent) {
          setError("Student not found");
          setIsLoading(false);
          return;
        }

        setStudent(foundStudent);

        // Step 3: Filter assignments for this student
        const studentAssignments = assignments.filter(
          (a) => a.learnerId === foundStudent.learnerId,
        );

        // Step 4: Filter enrollments for this student
        const studentEnrollments = enrollments.filter(
          (e) => e.learnerId === foundStudent.learnerId,
        );

        // Step 5: Hydrate programs with course data
        const hydrated: HydratedProgram[] = studentAssignments
          .map((assignment) => {
            // Find the program
            const program = allPrograms.find((p) => p.id === assignment.programId);
            if (!program) return null;

            // Hydrate courses (match IDs to full objects)
            const courses = program.courseSequence
              .map((courseId) => catalog.find((c) => c.courseId === courseId))
              .filter((c): c is CourseCatalogItem => c !== undefined);

            // Filter enrollments for this program
            const programEnrollments = studentEnrollments.filter(
              (e) => e.programId === assignment.programId,
            );

            return {
              program,
              courses,
              enrollments: programEnrollments,
            };
          })
          .filter((p): p is HydratedProgram => p !== null);

        setHydratedPrograms(hydrated);
      } catch (err) {
        console.error("Failed to fetch student progress data:", err);
        setError("Failed to load student progress");
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [studentId]);

  // Helper function to fetch all programs (uses network-first, localStorage-fallback)
  async function fetchAllPrograms(): Promise<SupervisorProgram[]> {
    return localApi.getAllPrograms();
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="h-full p-8">
        <div className="space-y-6">
          <div className="h-8 w-64 bg-slate-200 rounded animate-pulse"></div>
          <div className="space-y-4">
            <div className="h-64 bg-slate-100 rounded animate-pulse"></div>
            <div className="h-64 bg-slate-100 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="h-full p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-red-900 mb-2">Error</h2>
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  // Empty state (no programs assigned)
  if (hydratedPrograms.length === 0) {
    return (
      <div className="h-full p-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">
          {student?.learnerName}'s Progress
        </h2>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-8 text-center">
          <p className="text-slate-600">No programs assigned to this student.</p>
        </div>
      </div>
    );
  }

  // Main render
  return (
    <div className="h-full p-8 overflow-y-auto">
      <h2 className="text-2xl font-bold text-slate-900 mb-6">
        {student?.learnerName}'s Progress
      </h2>

      <div className="space-y-8 max-w-5xl">
        {hydratedPrograms.map(({ program, courses, enrollments }) => (
          <ProgramProgressCard
            key={program.id}
            programName={program.programName}
            programDescription={program.description}
            courses={courses}
            enrollments={enrollments}
          />
        ))}
      </div>
    </div>
  );
}
