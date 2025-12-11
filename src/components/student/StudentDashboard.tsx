import { useState, useEffect } from "react";
import { localApi } from "@/api/localRoutes";
import { legacyApi } from "@/api/legacyRoutes";
import type { CourseEnrollment, SupervisorProgram } from "@/types/models";
import { Course } from "@/hooks/useProgramBuilder";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { CourseDetailModal } from "@/components/common/CourseDetailModal";
import { EnrollmentModal } from "@/components/common/EnrollmentModal";
import { toast } from "sonner";

interface HydratedProgram {
  program: SupervisorProgram;
  courses: Course[];
  isCompleted: boolean;
}

// Hardcoded logged-in student (Liam - ID 1511)
const MOCK_STUDENT = {
  learner_Data_Id: 1511,
  learnerId: "6c541134-c0f6-41af-904a-1dcb46d16b71",
  learnerName: "Bob Martinez",
  emailId: "bob.martinez@example.com",
  location: "Charlotte, NC",
  status: "Active" as const,
  currentEnrollment: {
    productName: "Haas Advanced Mill",
    learnerStatusTag: "Enrolled",
  },
};

export function StudentDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [assignedPrograms, setAssignedPrograms] = useState<HydratedProgram[]>([]);
  const [completedPrograms, setCompletedPrograms] = useState<HydratedProgram[]>([]);
  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>([]);

  // Modal state
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [courseDetailOpen, setCourseDetailOpen] = useState(false);
  const [enrollmentModalOpen, setEnrollmentModalOpen] = useState(false);
  const [pendingEnrollment, setPendingEnrollment] = useState<{
    programId: string;
    courseId: number;
  } | null>(null);

  useEffect(() => {
    loadStudentData();
  }, []);

  async function loadStudentData() {
    setIsLoading(true);
    try {
      // Fetch all data in parallel
      const [assignments, allEnrollments, catalog] = await Promise.all([
        localApi.getAssignments(),
        localApi.getEnrollments(),
        legacyApi.getCatalog(),
      ]);

      // Filter assignments for this student
      const myAssignments = assignments.filter(
        (a) => a.learnerId === MOCK_STUDENT.learnerId,
      );

      // Filter enrollments for this student
      const myEnrollments = allEnrollments.filter(
        (e) => e.learnerId === MOCK_STUDENT.learnerId,
      );
      setEnrollments(myEnrollments);

      // Transform catalog to Course objects
      const coursesMap = new Map<number, Course>(
        catalog.map((item) => [
          item.courseId,
          {
            ...item,
            id: String(item.courseId),
          },
        ]),
      );

      // Hydrate programs
      const hydratedPrograms: HydratedProgram[] = [];

      for (const assignment of myAssignments) {
        try {
          const program = await localApi.getProgramById(assignment.programId);

          // Hydrate course sequence
          const courses: Course[] = program.courseSequence
            .map((courseId) => coursesMap.get(courseId))
            .filter((course): course is Course => course !== undefined);

          hydratedPrograms.push({
            program,
            courses,
            isCompleted: false, // TODO: Check completion logic
          });
        } catch (error) {
          console.error(`Failed to load program ${assignment.programId}:`, error);
        }
      }

      setAssignedPrograms(hydratedPrograms);

      // Mock: Add one completed program for demo
      // In real implementation, this would check completion status
      const mockCompletedProgram: HydratedProgram = {
        program: {
          id: "completed_mock",
          supervisorId: "pat_mann_guid",
          programName: "Q1 Safety Fundamentals",
          description: "Basic safety training completed",
          tags: ["Safety", "Completed"],
          courseSequence: [116, 11],
          published: true,
          createdAt: "2025-09-01T10:00:00Z",
        },
        courses: [116, 11]
          .map((courseId) => coursesMap.get(courseId))
          .filter((course): course is Course => course !== undefined),
        isCompleted: true,
      };
      setCompletedPrograms([mockCompletedProgram]);
    } catch (error) {
      console.error("Failed to load student data:", error);
      toast.error("Failed to load programs");
    } finally {
      setIsLoading(false);
    }
  }

  const handleCourseClick = (course: Course) => {
    setActiveCourse(course);
    setCourseDetailOpen(true);
  };

  const handleBookClick = (programId: string, courseId: number) => {
    setPendingEnrollment({ programId, courseId });
    setEnrollmentModalOpen(true);
  };

  const handleEnrollmentComplete = () => {
    // Refresh enrollments
    localApi.getEnrollments().then((allEnrollments) => {
      const myEnrollments = allEnrollments.filter(
        (e) => e.learnerId === MOCK_STUDENT.learnerId,
      );
      setEnrollments(myEnrollments);
    });
  };

  const isEnrolled = (programId: string, courseId: number) => {
    return enrollments.some((e) => e.programId === programId && e.courseId === courseId);
  };

  if (isLoading) {
    return (
      <div className="h-full p-8">
        <div className="grid grid-cols-2 gap-6 h-full">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Assigned Programs</h2>
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Completed Programs</h2>
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full p-8">
      {/* Two-Column Grid */}
      <div className="grid grid-cols-2 gap-6 h-full">
        {/* Left Column: Assigned Programs */}
        <div className="space-y-4 overflow-y-auto">
          <h2 className="text-xl font-semibold text-slate-800">Assigned Programs</h2>

          {assignedPrograms.length === 0 ? (
            <div className="p-8 text-center text-slate-400">No programs assigned yet</div>
          ) : (
            <Accordion type="single" collapsible className="space-y-2">
              {assignedPrograms.map((hydrated) => {
                const firstCourseId = hydrated.program.courseSequence[0];
                const enrolled = isEnrolled(hydrated.program.id, firstCourseId);

                return (
                  <AccordionItem
                    key={hydrated.program.id}
                    value={hydrated.program.id}
                    className="border rounded-lg"
                  >
                    <AccordionTrigger className="px-4 hover:no-underline">
                      <div className="flex items-center justify-between w-full pr-2">
                        <span className="font-medium text-slate-900">
                          {hydrated.program.programName}
                        </span>
                        <span
                          className={`px-2 py-1 text-xs rounded ${
                            enrolled
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {enrolled ? "Registered" : "Pending"}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      {hydrated.program.description && (
                        <p className="text-sm text-slate-600 mb-3">
                          {hydrated.program.description}
                        </p>
                      )}
                      <div className="space-y-2">
                        {hydrated.courses.map((course, idx) => {
                          const isEnrolledInCourse = isEnrolled(
                            hydrated.program.id,
                            course.courseId,
                          );
                          const isFirstCourse = idx === 0;

                          return (
                            <div
                              key={course.id}
                              className="flex items-center gap-3 p-3 border rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                              onClick={() => handleCourseClick(course)}
                            >
                              <div className="flex-shrink-0 w-8 h-8 bg-phillips-blue text-white rounded-full flex items-center justify-center text-sm font-medium">
                                {idx + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-900 truncate">
                                  {course.courseTitle}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {course.trainingTypeName} • {course.levelName}
                                </p>
                              </div>
                              {isEnrolledInCourse && (
                                <div className="flex-shrink-0">
                                  <span className="text-green-600 text-sm">✓</span>
                                </div>
                              )}
                              {!isEnrolledInCourse &&
                                isFirstCourse &&
                                course.trainingTypeName.includes("ILT") && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleBookClick(
                                        hydrated.program.id,
                                        course.courseId,
                                      );
                                    }}
                                    className="flex-shrink-0 px-3 py-1 bg-slate-700 text-white text-xs rounded hover:bg-slate-600"
                                  >
                                    Book
                                  </button>
                                )}
                            </div>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </div>

        {/* Right Column: Completed Programs */}
        <div className="space-y-4 overflow-y-auto">
          <h2 className="text-xl font-semibold text-slate-800">Completed Programs</h2>

          {completedPrograms.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              No completed programs yet
            </div>
          ) : (
            <Accordion type="single" collapsible className="space-y-2">
              {completedPrograms.map((hydrated) => (
                <AccordionItem
                  key={hydrated.program.id}
                  value={hydrated.program.id}
                  className="border rounded-lg"
                >
                  <AccordionTrigger className="px-4 hover:no-underline bg-green-100">
                    <div className="flex items-center justify-between w-full pr-2">
                      <span className="font-medium text-slate-900">
                        {hydrated.program.programName}
                      </span>
                      <span className="text-green-600 text-sm">✓ Complete</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    {hydrated.program.description && (
                      <p className="text-sm text-slate-600 mb-3">
                        {hydrated.program.description}
                      </p>
                    )}
                    <div className="space-y-2">
                      {hydrated.courses.map((course, idx) => (
                        <div
                          key={course.id}
                          className="flex items-center gap-3 p-3 border border-green-200 rounded-lg bg-white cursor-pointer hover:bg-green-50 transition-colors"
                          onClick={() => handleCourseClick(course)}
                        >
                          <div className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                            {idx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-700 truncate">
                              {course.courseTitle}
                            </p>
                            <p className="text-xs text-slate-500">
                              {course.trainingTypeName} • {course.levelName}
                            </p>
                          </div>
                          <div className="flex-shrink-0">
                            <span className="text-green-600 text-sm">✓</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>
      </div>

      {/* Course Detail Modal */}
      <CourseDetailModal
        course={activeCourse}
        isOpen={courseDetailOpen}
        onClose={() => setCourseDetailOpen(false)}
        onBookClick={
          activeCourse && pendingEnrollment
            ? () => handleBookClick(pendingEnrollment.programId, activeCourse.courseId)
            : undefined
        }
      />

      {/* Enrollment Modal */}
      {pendingEnrollment && (
        <EnrollmentModal
          isOpen={enrollmentModalOpen}
          onClose={() => setEnrollmentModalOpen(false)}
          learner={MOCK_STUDENT}
          programId={pendingEnrollment.programId}
          courseId={pendingEnrollment.courseId}
          onEnrollmentComplete={handleEnrollmentComplete}
        />
      )}
    </div>
  );
}
