// VIEW: Supervisor Persona. Read-only progress tracker for direct reports.

import { legacyApi } from "@/api/legacyRoutes";
import { localApi } from "@/api/localRoutes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MetricCard } from "../MetricCard";
import type {
  CourseCatalogItem,
  CourseRow,
  CourseStatus,
  LearnerProfile,
  SupervisorProgram,
  HydratedProgram,
  StudentMetrics,
  StudentProgressViewProps,
} from "@/types/models";
import { CheckCircle, FileText, UserCheck, Users, X } from "lucide-react";
import { useEffect, useState } from "react";

export function StudentProgressView({ studentId }: StudentProgressViewProps) {
  const [student, setStudent] = useState<LearnerProfile | null>(null);
  const [hydratedPrograms, setHydratedPrograms] = useState<HydratedProgram[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLevels, setSelectedLevels] = useState<Array<string>>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<Array<CourseStatus>>([]);
  const [searchText, setSearchText] = useState<string>("");
  const [flatCourses, setFlatCourses] = useState<Array<CourseRow>>([]);
  const [metrics, setMetrics] = useState<StudentMetrics>({
    statusCompleted: 0,
    statusIncomplete: 0,
    statusNotEnrolled: 0,
    totalCourses: 0,
    completionPercentage: 0,
    programsAssigned: 0,
  });

  // Fetch & hydrate data
  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        setError(null);

        // Step 1: Fetch all data in parallel
        const [roster, assignments, enrollments, allPrograms, catalog] = await Promise.all([
          legacyApi.getRoster(),
          localApi.getAssignments(),
          localApi.getEnrollments(),
          fetchAllPrograms(),
          legacyApi.getCatalog(),
        ]);

        // Step 2: Find the student
        const foundStudent = roster.find(
          (s) => s.learnerId === String(studentId) || s.learner_Data_Id === Number(studentId),
        );

        if (!foundStudent) {
          setError("Student not found");
          setIsLoading(false);
          return;
        }

        // console.log("foundStudent:", foundStudent);
        setStudent(foundStudent);

        // Step 3: Filter assignments for this student
        const studentAssignments = assignments.filter((a) => a.learnerId === foundStudent.learnerId);

        // Step 3.5: Deduplicate assignments by programId (keep only first occurrence)
        const uniqueAssignments = studentAssignments.reduce(
          (acc, current) => {
            const exists = acc.find((item) => item.programId === current.programId);
            if (!exists) {
              return acc.concat([current]);
            }
            return acc;
          },
          [] as typeof studentAssignments,
        );

        // Step 4: Filter enrollments for this student
        const studentEnrollments = enrollments.filter((e) => e.learnerId === foundStudent.learnerId);

        // Step 5: Hydrate programs with course data
        const hydrated: HydratedProgram[] = uniqueAssignments
          .map((assignment) => {
            // Find the program
            const program = allPrograms.find((p) => p.id === assignment.programId);
            if (!program) return null;

            // Hydrate courses (match IDs to full objects)
            const courses = program.courseSequence
              .map((courseId) => catalog.find((c) => c.courseId === courseId))
              .filter((c): c is CourseCatalogItem => c !== undefined);

            // Filter enrollments for this program
            const programEnrollments = studentEnrollments.filter((e) => e.programId === assignment.programId);

            return {
              program,
              courses,
              enrollments: programEnrollments,
            };
          })
          .filter((p): p is HydratedProgram => p !== null);

        // Populate flatCourses.status from getCourseStatus()
        const getCourseStatus = (courseId: number): CourseStatus => {
          const isEnrolled = enrollments.find((e) => e.courseId === courseId);

          if (!isEnrolled) {
            return "Not Enrolled";
          } else {
            return "Incomplete";
          }
        };

        // Step 6: Create flatCourses from hydrated
        const flatCourses: Array<CourseRow> = hydrated.flatMap(({ program, courses, enrollments }) =>
          courses.map((course) => ({
            course,
            program,
            enrollment: enrollments.find((e) => e.courseId === course.courseId),
            status: getCourseStatus(course.courseId),
          })),
        );

        setHydratedPrograms(hydrated);
        setFlatCourses(flatCourses);
      } catch (err) {
        console.error("Failed to fetch student progress data:", err);
        setError("Failed to load student progress");
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [studentId]);

  // Calculate metrics from flat data
  useEffect(() => {
    if (flatCourses.length === 0) return;

    const metrics: StudentMetrics = {
      statusCompleted: flatCourses.filter((course) => course.status === "Completed").length,
      statusIncomplete: flatCourses.filter((course) => course.status === "Incomplete").length,
      statusNotEnrolled: flatCourses.filter((course) => course.status === "Not Enrolled").length,
      totalCourses: flatCourses.length, // statusCompleted + statusIncomplete + statusNotEnrolled
      completionPercentage:
        (flatCourses.filter((course) => course.status === "Completed").length / flatCourses.length) * 100, // (statusCompleted / totalCourses) * 100
      programsAssigned: new Set(flatCourses.map((course) => course.program.id)).size,
    };

    setMetrics(metrics);
  }, [flatCourses]);

  useEffect(() => {
    console.log("searchText changed to:", searchText);
  }, [searchText]);

  // Compare our search against any CourseRow's string
  function matchesSearch(row: CourseRow, search: string): boolean {
    if (search.trim() === "") {
      console.log("Empty search, returning true");
      return true;
    }

    const searchLower = search.toLowerCase();

    const matchesId = row.course.courseId.toString().includes(searchLower);
    const matchesTitle = row.course.courseTitle.toLowerCase().includes(searchLower);
    const matchesProgram = row.program.programName.toLowerCase().includes(searchLower);

    return matchesId || matchesTitle || matchesProgram;
  }

  // filteredCourese is 'derived state' computed from other state on every render
  const filteredCourses = flatCourses.filter((row) => {
    const matchesLevel = selectedLevels.length === 0 || selectedLevels.includes(row.course.levelName);
    const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(row.status);
    const matchesSearchText = matchesSearch(row, searchText);

    console.log("Filters active:", { searchText, selectedLevels, selectedStatuses });
    console.log("Row Checks:", { matchesSearchText, matchesLevel, matchesStatus });

    return matchesLevel && matchesStatus && matchesSearchText;
  });

  // filter courses to only show those where the status is 'Completed'
  // const completedCourses = filteredCourses.filter((course) => course.status === "Completed");

  console.log("flattened courses:", flatCourses);
  console.log("filteredCourses:", filteredCourses);

  // Helper function to fetch all programs (uses network-first, localStorage-fallback)
  async function fetchAllPrograms(): Promise<SupervisorProgram[]> {
    console.log(localApi.getAllPrograms());
    return localApi.getAllPrograms();
  }

  const getStatusClassName = (status: CourseStatus): string => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800 hover:bg-green-100";
      case "Incomplete":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
      case "Not Enrolled":
        return "bg-slate-100 text-slate-600 hover:bg-slate-100";
    }
  };

  // function toggleProgramFilter(programId: string) {
  //   setSelectedPrograms((prev) =>
  //     prev.includes(programId)
  //       ? prev.filter((id) => id !== programId) // remove if already selected
  //       : [...prev, programId],
  //   );
  // }

  const clearFilters = () => {
    setSearchText("");
    setSelectedLevels([]);
    setSelectedStatuses([]);
  };

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
        <div className="bg-red-50 border border-red-200 rounded-[--radius] p-6">
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
        <h2 className="text-2xl font-bold text-slate-900 mb-4">{student?.learnerName}'s Progress</h2>
        <div className="bg-muted border border-border rounded-[--radius] p-8 text-center">
          <p className="text-slate-600">No programs assigned to this student.</p>
        </div>
      </div>
    );
  }

  // Main render
  return (
    <>
      <div className="h-full p-8 overflow-y-auto">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">{student?.learnerName}'s Progress</h2>

        {/* summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-4 gap-4 mb-8">
          {/* summary cards */}
          <MetricCard
            title="Courses Not Enrolled"
            value={metrics.statusNotEnrolled}
            icon={<CheckCircle className="h-5 w-5 text-muted-foreground" />}
            isLoading={isLoading}
            highlight={metrics.statusNotEnrolled > 0}
          />
          <MetricCard
            title="Courses Completed"
            value={metrics.statusCompleted}
            icon={<Users className="h-5 w-5 text-muted-foreground" />}
            isLoading={isLoading}
          />
          <MetricCard
            title="Courses Incomplete"
            value={metrics.statusIncomplete}
            icon={<UserCheck className="h-5 w-5 text-muted-foreground" />}
            isLoading={isLoading}
          />
          <MetricCard
            title="Total Courses Created"
            value={metrics.totalCourses}
            icon={<FileText className="h-5 w-5 text-muted-foreground" />}
            isLoading={isLoading}
          />
          <MetricCard
            title="Courses Completed"
            value={metrics.completionPercentage}
            icon={<FileText className="h-5 w-5 text-muted-foreground" />}
            isLoading={isLoading}
          />
          <MetricCard
            title="Programs Assigned"
            value={metrics.programsAssigned}
            icon={<FileText className="h-5 w-5 text-muted-foreground" />}
            isLoading={isLoading}
          />
        </div>

        {selectedLevels.length > 0 ||
          selectedStatuses.length > 0 ||
          (searchText !== "" && (
            <Button size="sm" onClick={() => clearFilters()} className="gap-2">
              Clear Filters
              <X className="h-5 w-5" />
            </Button>
          ))}

        <div className="border border-border rounded-[--radius] overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted">
                  <TableHead className="w-[8%]">Course ID</TableHead>
                  <TableHead className="w-[25%]">Course Name</TableHead>
                  <TableHead className="w-[18%]">Program</TableHead>
                  <TableHead className="w-[12%]">Level</TableHead>
                  <TableHead className="w-[12%]">Type</TableHead>
                  <TableHead className="w-[10%]">Duration</TableHead>
                  <TableHead className="w-[15%]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCourses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      {selectedLevels.length > 0 || selectedStatuses.length > 0 || searchText !== ""
                        ? "No courses found"
                        : "No courses assigned"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCourses.map((row) => (
                    <TableRow key={`${row.program.id}-${row.course.courseId}`}>
                      {/* Course ID */}
                      <TableCell className="text-xs text-muted-foreground font-mono text-right">
                        #{row.course.courseId}
                      </TableCell>

                      {/* Course Name */}
                      <TableCell className="font-medium text-left">{row.course.courseTitle}</TableCell>

                      {/* Program Badge (clickable sort) */}
                      <TableCell className="text-left">
                        <Badge
                          variant="outline"
                          className="cursor-pointer hover:bg-primary/10 transition-colors text-left"
                        >
                          {row.program.programName}
                        </Badge>
                      </TableCell>

                      {/* Level */}
                      <TableCell className="text-sm text-muted-foreground text-left">
                        {row.course.levelName}
                      </TableCell>

                      {/* Type */}
                      <TableCell className="text-sm text-muted-foreground text-left">
                        {row.course.trainingTypeName}
                      </TableCell>

                      {/* Duration */}
                      <TableCell className="text-sm text-muted-foreground text-left">
                        {row.course.totalDays} days
                      </TableCell>

                      {/* Status Badge */}
                      <TableCell className="text-left">
                        <Badge className={getStatusClassName(row.status)}>{row.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </>
  );
}
