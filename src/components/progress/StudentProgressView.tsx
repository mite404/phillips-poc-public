// VIEW: Supervisor Persona. Read-only progress tracker for direct reports.

import { legacyApi } from "@/api/legacyRoutes";
import { localApi } from "@/api/localRoutes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import {
  CheckCircle,
  FileText,
  UserCheck,
  Users,
  X,
  Search,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  SlidersHorizontal,
  EyeOff,
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

function FacetFilter<T extends string>({
  label,
  options,
  selected,
  onToggle,
  onClear,
}: {
  label: string;
  options: T[];
  selected: T[];
  onToggle: (value: T) => void;
  onClear: () => void;
}) {
  const activeCount = selected.length;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 h-9 text-sm">
          + {label}
          {activeCount > 0 && (
            <span className="ml-0.5 flex h-4 min-w-4 items-center justify-center rounded bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
              {activeCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2 space-y-0.5" align="start">
        {activeCount > 0 && (
          <button
            onClick={onClear}
            className="flex w-full items-center gap-2 rounded px-2 py-1 text-xs text-muted-foreground hover:bg-muted focus-visible:outline-none"
          >
            <X className="h-3 w-3" />
            Clear filter
          </button>
        )}
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onToggle(opt)}
            className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted focus-visible:outline-none"
          >
            <Checkbox checked={selected.includes(opt)} className="pointer-events-none" />
            <span>{opt}</span>
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

type SortCol = "courseId" | "courseName" | "program" | "level" | "status";

function SortHeader({
  col,
  label,
  sort,
  onSort,
  onHide,
}: {
  col: SortCol;
  label: string;
  sort: { col: string | null; dir: "asc" | "desc" };
  onSort: (col: SortCol, dir: "asc" | "desc") => void;
  onHide: () => void;
}) {
  const isActive = sort.col === col;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-1 focus-visible:outline-none group">
          {label}
          <span className={isActive ? "opacity-100" : "opacity-40 group-hover:opacity-100"}>
            {isActive && sort.dir === "asc" ? (
              <ArrowUp className="h-3 w-3" />
            ) : isActive && sort.dir === "desc" ? (
              <ArrowDown className="h-3 w-3" />
            ) : (
              <ArrowUpDown className="h-3 w-3" />
            )}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-32">
        <DropdownMenuItem onClick={() => onSort(col, "asc")}>
          <ArrowUp className="h-3.5 w-3.5 text-muted-foreground/70" />
          Asc
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSort(col, "desc")}>
          <ArrowDown className="h-3.5 w-3.5 text-muted-foreground/70" />
          Desc
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onHide}>
          <EyeOff className="h-3.5 w-3.5 text-muted-foreground/70" />
          Hide
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ColumnToggle({
  hiddenCols,
  onToggle,
}: {
  hiddenCols: Set<string>;
  onToggle: (col: string) => void;
}) {
  const cols: { key: string; label: string }[] = [
    { key: "courseId", label: "Course ID" },
    { key: "courseName", label: "Course Name" },
    { key: "program", label: "Program" },
    { key: "level", label: "Level" },
    { key: "type", label: "Training Type" },
    { key: "duration", label: "Duration" },
    { key: "status", label: "Status" },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 h-9 ml-auto">
          <SlidersHorizontal className="h-4 w-4" />
          View
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
          Toggle columns
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {cols.map(({ key, label }) => (
          <DropdownMenuCheckboxItem
            key={key}
            checked={!hiddenCols.has(key)}
            onCheckedChange={() => onToggle(key)}
          >
            {label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const LEVEL_ORDER: Record<string, number> = { Basic: 0, Intermediate: 1, Advanced: 2 };
const STATUS_ORDER: Record<CourseStatus, number> = {
  "Not Enrolled": 0,
  Incomplete: 1,
  Completed: 2,
};

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

  const [sort, setSort] = useState<{ col: SortCol | null; dir: "asc" | "desc" }>({
    col: null,
    dir: "asc",
  });

  type ColKey = "courseId" | "courseName" | "program" | "level" | "type" | "duration" | "status";
  const [hiddenCols, setHiddenCols] = useState<Set<ColKey>>(new Set());

  const toggleCol = (col: ColKey) =>
    setHiddenCols((prev) => {
      const next = new Set(prev);
      if (next.has(col)) {
        next.delete(col);
      } else {
        next.add(col);
      }
      return next;
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
        const studentAssignments = assignments.filter(
          (a) => a.learnerId === foundStudent.learnerId,
        );

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
        const studentEnrollments = enrollments.filter(
          (e) => e.learnerId === foundStudent.learnerId,
        );

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
        const flatCourses: Array<CourseRow> = hydrated.flatMap(
          ({ program, courses, enrollments }) =>
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
        (flatCourses.filter((course) => course.status === "Completed").length /
          flatCourses.length) *
        100, // (statusCompleted / totalCourses) * 100
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
    const matchesLevel =
      selectedLevels.length === 0 || selectedLevels.includes(row.course.levelName);
    const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(row.status);
    const matchesSearchText = matchesSearch(row, searchText);

    console.log("Filters active:", { searchText, selectedLevels, selectedStatuses });
    console.log("Row Checks:", { matchesSearchText, matchesLevel, matchesStatus });

    return matchesLevel && matchesStatus && matchesSearchText;
  });

  const sortedCourses = useMemo(() => {
    if (!sort.col) return filteredCourses;
    return [...filteredCourses].sort((a, b) => {
      let cmp = 0;
      if (sort.col === "level") {
        const aO = LEVEL_ORDER[a.course.levelName] ?? 99;
        const bO = LEVEL_ORDER[b.course.levelName] ?? 99;
        cmp = aO - bO;
      } else if (sort.col === "status") {
        cmp = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
      } else if (sort.col === "courseId") {
        cmp = a.course.courseId - b.course.courseId;
      } else if (sort.col === "courseName") {
        cmp = a.course.courseTitle.localeCompare(b.course.courseTitle);
      } else if (sort.col === "program") {
        cmp = a.program.programName.localeCompare(b.program.programName);
      }
      return sort.dir === "asc" ? cmp : -cmp;
    });
  }, [filteredCourses, sort]);

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

  const clearFilters = () => {
    setSearchText("");
    setSelectedLevels([]);
    setSelectedStatuses([]);
  };

  const ALL_STATUSES: CourseStatus[] = ["Completed", "Incomplete", "Not Enrolled"];
  const allLevels = useMemo(
    () => [...new Set(flatCourses.map((r) => r.course.levelName).filter(Boolean))].sort(),
    [flatCourses],
  );

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
        <h2 className="text-2xl font-bold text-slate-900 mb-4">
          {student?.learnerName}'s Progress
        </h2>
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
        <h2 className="text-2xl font-bold text-slate-900 mb-6">
          {student?.learnerName}'s Progress
        </h2>

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

        {/* Filter Toolbar */}
        <div className="flex items-center gap-2 mb-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Filter courses..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="pl-8 h-9"
            />
          </div>

          <FacetFilter
            label="Status"
            options={ALL_STATUSES}
            selected={selectedStatuses}
            onToggle={(v) =>
              setSelectedStatuses((prev) =>
                prev.includes(v) ? prev.filter((s) => s !== v) : [...prev, v],
              )
            }
            onClear={() => setSelectedStatuses([])}
          />

          <FacetFilter
            label="Level"
            options={allLevels}
            selected={selectedLevels}
            onToggle={(v) =>
              setSelectedLevels((prev) =>
                prev.includes(v) ? prev.filter((l) => l !== v) : [...prev, v],
              )
            }
            onClear={() => setSelectedLevels([])}
          />

          {(selectedStatuses.length > 0 || selectedLevels.length > 0 || searchText !== "") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="gap-1.5 text-muted-foreground"
            >
              <X className="h-4 w-4" />
              Clear all
            </Button>
          )}

          <ColumnToggle hiddenCols={hiddenCols} onToggle={(col) => toggleCol(col as ColKey)} />
        </div>

        <div className="border border-border rounded-[--radius] overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted">
                  {!hiddenCols.has("courseId") && (
                    <TableHead className="w-[8%]">
                      <SortHeader
                        col="courseId"
                        label="Course ID"
                        sort={sort}
                        onSort={(col, dir) => setSort({ col, dir })}
                        onHide={() => toggleCol("courseId")}
                      />
                    </TableHead>
                  )}
                  {!hiddenCols.has("courseName") && (
                    <TableHead className="w-[25%]">
                      <SortHeader
                        col="courseName"
                        label="Course Name"
                        sort={sort}
                        onSort={(col, dir) => setSort({ col, dir })}
                        onHide={() => toggleCol("courseName")}
                      />
                    </TableHead>
                  )}
                  {!hiddenCols.has("program") && (
                    <TableHead className="w-[18%]">
                      <SortHeader
                        col="program"
                        label="Program"
                        sort={sort}
                        onSort={(col, dir) => setSort({ col, dir })}
                        onHide={() => toggleCol("program")}
                      />
                    </TableHead>
                  )}
                  {!hiddenCols.has("level") && (
                    <TableHead className="w-[12%]">
                      <SortHeader
                        col="level"
                        label="Level"
                        sort={sort}
                        onSort={(col, dir) => setSort({ col, dir })}
                        onHide={() => toggleCol("level")}
                      />
                    </TableHead>
                  )}
                  {!hiddenCols.has("type") && <TableHead className="w-[12%]">Type</TableHead>}
                  {!hiddenCols.has("duration") && (
                    <TableHead className="w-[10%]">Duration</TableHead>
                  )}
                  {!hiddenCols.has("status") && (
                    <TableHead className="w-[15%]">
                      <SortHeader
                        col="status"
                        label="Status"
                        sort={sort}
                        onSort={(col, dir) => setSort({ col, dir })}
                        onHide={() => toggleCol("status")}
                      />
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedCourses.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7 - hiddenCols.size}
                      className="h-24 text-center text-muted-foreground"
                    >
                      {selectedLevels.length > 0 || selectedStatuses.length > 0 || searchText !== ""
                        ? "No courses found"
                        : "No courses assigned"}
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedCourses.map((row) => (
                    <TableRow key={`${row.program.id}-${row.course.courseId}`}>
                      {/* Course ID */}
                      {!hiddenCols.has("courseId") && (
                        <TableCell className="text-xs text-muted-foreground font-mono text-right">
                          #{row.course.courseId}
                        </TableCell>
                      )}

                      {/* Course Name */}
                      {!hiddenCols.has("courseName") && (
                        <TableCell className="font-medium text-left">
                          {row.course.courseTitle}
                        </TableCell>
                      )}

                      {/* Program Badge (clickable sort) */}
                      {!hiddenCols.has("program") && (
                        <TableCell className="text-left">
                          <Badge
                            variant="outline"
                            className="cursor-pointer hover:bg-primary/10 transition-colors text-left"
                          >
                            {row.program.programName}
                          </Badge>
                        </TableCell>
                      )}

                      {/* Level */}
                      {!hiddenCols.has("level") && (
                        <TableCell className="text-sm text-muted-foreground text-left">
                          {row.course.levelName}
                        </TableCell>
                      )}

                      {/* Type */}
                      {!hiddenCols.has("type") && (
                        <TableCell className="text-sm text-muted-foreground text-left">
                          {row.course.trainingTypeName}
                        </TableCell>
                      )}

                      {/* Duration */}
                      {!hiddenCols.has("duration") && (
                        <TableCell className="text-sm text-muted-foreground text-left">
                          {row.course.totalDays} days
                        </TableCell>
                      )}

                      {/* Status Badge */}
                      {!hiddenCols.has("status") && (
                        <TableCell className="text-left">
                          <Badge className={getStatusClassName(row.status)}>{row.status}</Badge>
                        </TableCell>
                      )}
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
