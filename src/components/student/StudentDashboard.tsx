// VIEW: Student Persona. Interactive Dashboard for the Learner.

import { useState, useEffect } from "react";
import { localApi } from "@/api/localRoutes";
import { legacyApi } from "@/api/legacyRoutes";
import type {
  CourseEnrollment,
  SupervisorProgram,
  CourseInventory,
} from "@/types/models";
import { Course } from "@/hooks/useProgramBuilder";
import * as Accordion from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
  const [courseInventory, setCourseInventory] = useState<
    Map<number, CourseInventory | null>
  >(new Map());

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

      // Filter assignments for this student and deduplicate by program ID
      const myAssignments = assignments.filter(
        (a) => a.learnerId === MOCK_STUDENT.learnerId,
      );

      // Deduplicate by program ID (keep only first assignment per program)
      const uniqueAssignments = myAssignments.reduce(
        (acc, assignment) => {
          if (!acc.find((a) => a.programId === assignment.programId)) {
            acc.push(assignment);
          }
          return acc;
        },
        [] as typeof myAssignments,
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

      for (const assignment of uniqueAssignments) {
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

      // Step 6: Pre-fetch inventory for all ILT courses (BEFORE rendering)
      try {
        const inventoryMap = await legacyApi.getAllInventory();
        setCourseInventory(inventoryMap);
      } catch (error) {
        console.error("Failed to pre-fetch inventory:", error);
        // Continue without inventory cache (buttons will still show)
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

  const handleCourseClick = (course: Course, programId: string) => {
    setActiveCourse(course);
    setPendingEnrollment({ programId, courseId: course.courseId });
    setCourseDetailOpen(true);
  };

  const handleBookClick = (programId: string, courseId: number) => {
    setCourseDetailOpen(false);
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

  // Helper to check if a course has available sessions
  const hasAvailableSessions = (courseId: number): boolean => {
    const inventory = courseInventory.get(courseId);

    // If inventory map is empty (still loading), optimistically show button
    if (courseInventory.size === 0) return true;

    // If course is not in inventory map, no sessions available
    if (inventory === undefined) return false;

    // If explicitly marked as null, no sessions available
    if (inventory === null) return false;

    // Check if classes array has items
    return inventory.classes && inventory.classes.length > 0;
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
            <Accordion.Root type="single" collapsible className="space-y-3">
              {assignedPrograms.map((hydrated) => {
                const firstCourseId = hydrated.program.courseSequence[0];
                const enrolled = isEnrolled(hydrated.program.id, firstCourseId);

                return (
                  <Accordion.Item
                    key={hydrated.program.id}
                    value={hydrated.program.id}
                    className="border border-slate-200 rounded-xl overflow-hidden bg-card-background"
                  >
                    <Accordion.Trigger className="flex w-full items-center px-4 py-3 hover:bg-card-background [&[data-state=open]]:bg-card-background text-left group">
                      <span className="font-semibold text-slate-900 flex-1">
                        {hydrated.program.programName}
                      </span>
                      <Badge
                        className={
                          enrolled
                            ? "bg-green-100 text-green-800 hover:bg-green-100 mr-2"
                            : "bg-yellow-100 text-yellow-800 hover:bg-yellow-100 mr-2"
                        }
                      >
                        {enrolled ? "Registered" : "Pending"}
                      </Badge>
                      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                    </Accordion.Trigger>
                    <Accordion.Content className="px-4 pb-4 pt-2">
                      {hydrated.program.description && (
                        <p className="text-sm text-slate-600 mb-4">
                          {hydrated.program.description}
                        </p>
                      )}
                      <div className="space-y-3 pt-2">
                        {hydrated.courses.map((course, idx) => {
                          const isEnrolledInCourse = isEnrolled(
                            hydrated.program.id,
                            course.courseId,
                          );

                          return (
                            <Card
                              key={course.id}
                              className="cursor-pointer border border-slate-200 rounded-lg p-4 bg-card-background transition-colors"
                              onClick={() =>
                                handleCourseClick(course, hydrated.program.id)
                              }
                            >
                              <div className="flex items-center gap-3">
                                {/* Sequence Number */}
                                <div className="flex-shrink-0 w-8 h-8  text-white rounded-full flex items-center justify-center text-sm font-semibold">
                                  {idx + 1}
                                </div>

                                {/* Course Info */}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-slate-900 truncate">
                                    {course.courseTitle}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    {course.trainingTypeName} • {course.levelName}
                                  </p>
                                </div>

                                {/* Status/Action */}
                                <div className="flex-shrink-0">
                                  {isEnrolledInCourse ? (
                                    <Badge className="bg-green-100 text-green-800">
                                      ✓ Enrolled
                                    </Badge>
                                  ) : course.trainingTypeName.includes("ILT") ? (
                                    hasAvailableSessions(course.courseId) ? (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-sm font-semibold text-slate-900"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleBookClick(
                                            hydrated.program.id,
                                            course.courseId,
                                          );
                                        }}
                                      >
                                        Book Class
                                      </Button>
                                    ) : (
                                      <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
                                        No sessions avail
                                      </Badge>
                                    )
                                  ) : (
                                    <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                                      Pending
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </Card>
                          );
                        })}
                      </div>
                    </Accordion.Content>
                  </Accordion.Item>
                );
              })}
            </Accordion.Root>
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
            <Accordion.Root type="single" collapsible className="space-y-3">
              {completedPrograms.map((hydrated) => (
                <Accordion.Item
                  key={hydrated.program.id}
                  value={hydrated.program.id}
                  className="border-2 rounded-xl overflow-hidden bg-card-background"
                >
                  <Accordion.Trigger className="flex w-full items-center px-4 py-3 [&[data-state=open]] text-left group">
                    <span className="font-semibold text-slate-900 flex-1">
                      {hydrated.program.programName}
                    </span>
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100 mr-2">
                      ✓ Complete
                    </Badge>
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                  </Accordion.Trigger>
                  <Accordion.Content className="px-4 pb-4 pt-2">
                    {hydrated.program.description && (
                      <p className="text-sm text-slate-600 mb-4">
                        {hydrated.program.description}
                      </p>
                    )}
                    <div className="space-y-3 pt-2">
                      {hydrated.courses.map((course, idx) => (
                        <Card
                          key={course.id}
                          className="cursor-pointer border rounded-lg p-4 bg-card-background hover:border-green-400/50 transition-colors"
                          onClick={() => handleCourseClick(course, hydrated.program.id)}
                        >
                          <div className="flex items-center gap-3">
                            {/* Sequence Number */}
                            <div className="flex-shrink-0 w-8 h-8  text-white rounded-full flex items-center justify-center text-sm font-semibold">
                              {idx + 1}
                            </div>

                            {/* Course Info */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-slate-900 truncate">
                                {course.courseTitle}
                              </p>
                              <p className="text-xs text-slate-500">
                                {course.trainingTypeName} • {course.levelName}
                              </p>
                            </div>

                            {/* Completion Badge */}
                            <div className="flex-shrink-0">
                              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                ✓ Done
                              </Badge>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </Accordion.Content>
                </Accordion.Item>
              ))}
            </Accordion.Root>
          )}
        </div>
      </div>

      {/* Course Detail Modal */}
      <CourseDetailModal
        course={activeCourse}
        isOpen={courseDetailOpen}
        onClose={() => setCourseDetailOpen(false)}
        onBookClick={
          pendingEnrollment
            ? () =>
                handleBookClick(pendingEnrollment.programId, pendingEnrollment.courseId)
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
