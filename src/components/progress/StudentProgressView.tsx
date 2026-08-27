// VIEW: Supervisor Persona. Read-only progress tracker for direct reports.

import { legacyApi } from "@/api/legacyRoutes";
import { localApi } from "@/api/localRoutes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
  X,
  Search,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  SlidersHorizontal,
  EyeOff,
  Timer,
  HelpCircle,
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
import { cn } from "@/lib/utils";
import {
  COLUMNS,
  filterCourses,
  sortCourses,
  toggleColumn,
  type ColKey,
  type SortCol,
} from "./courseTable";

interface FacetOption<T> {
  value: T;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

function FacetFilter<T extends string>({
  label,
  options,
  selected,
  onToggle,
  onClear,
}: {
  label: string;
  options: FacetOption<T>[];
  selected: T[];
  onToggle: (value: T) => void;
  onClear: () => void;
}) {
  const activeCount = selected.length;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 h-9 text-sm border-dashed">
          <span className="mr-1">+ {label}</span>
          {activeCount > 0 && (
            <>
              <div className="h-4 w-[1px] bg-border" />
              <Badge variant="secondary" className="rounded-sm px-1 font-normal lg:hidden">
                {activeCount}
              </Badge>
              <div className="hidden space-x-1 lg:flex">
                {activeCount > 2 ? (
                  <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                    {activeCount} selected
                  </Badge>
                ) : (
                  options
                    .filter((option) => selected.includes(option.value))
                    .map((option) => (
                      <Badge
                        variant="secondary"
                        key={option.value}
                        className="rounded-sm px-1 font-normal"
                      >
                        {option.label}
                      </Badge>
                    ))
                )}
              </div>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <div className="p-1">
          {options.map((option) => {
            const isSelected = selected.includes(option.value);
            return (
              <div
                key={option.value}
                className={cn(
                  "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                )}
                onClick={() => onToggle(option.value)}
              >
                <div
                  className={cn(
                    "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "opacity-50 [&_svg]:invisible",
                  )}
                >
                  <CheckCircle className={cn("h-4 w-4")} />
                </div>
                {option.icon && <option.icon className="mr-2 h-4 w-4 text-muted-foreground" />}
                <span>{option.label}</span>
              </div>
            );
          })}
        </div>
        {activeCount > 0 && (
          <>
            <div className="h-[1px] bg-border my-1" />
            <div className="p-1">
              <Button
                variant="ghost"
                className="w-full justify-center text-center text-sm font-normal"
                onClick={onClear}
              >
                Clear filters
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}

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
        <button className="flex items-center gap-1 group">
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
  hiddenCols: Set<ColKey>;
  onToggle: (col: ColKey) => void;
}) {
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
        {COLUMNS.map(({ key, label }) => (
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

  const [hiddenCols, setHiddenCols] = useState<Set<ColKey>>(new Set());

  const toggleCol = (col: ColKey) => setHiddenCols((prev) => toggleColumn(prev, col));

  // Fetch & hydrate data.
  // StrictMode double-invokes this effect in dev; abort the stale request and ignore
  // its response so it can't overwrite a later, live one.
  useEffect(() => {
    const controller = new AbortController();

    async function fetchData() {
      try {
        setIsLoading(true);
        setError(null);

        // Step 1: Fetch all data in parallel
        const [roster, assignments, enrollments, allPrograms, catalog] = await Promise.all([
          legacyApi.getRoster(controller.signal),
          localApi.getAssignments(controller.signal),
          localApi.getEnrollments(controller.signal),
          fetchAllPrograms(controller.signal),
          legacyApi.getCatalog(controller.signal),
        ]);
        if (controller.signal.aborted) return;

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
        if (controller.signal.aborted) return;
        console.error("Failed to fetch student progress data:", err);
        setError("Failed to load student progress");
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    fetchData();
    return () => controller.abort();
  }, [studentId]);

  // Calculate metrics from flat data
  useEffect(() => {
    if (flatCourses.length === 0) return;

    // Count unique programs from currently filtered courses
    const filteredCourses = filterCourses(flatCourses, {
      levels: selectedLevels,
      statuses: selectedStatuses,
      search: searchText,
    });

    const metrics: StudentMetrics = {
      statusCompleted: flatCourses.filter((course) => course.status === "Completed").length,
      statusIncomplete: flatCourses.filter((course) => course.status === "Incomplete").length,
      statusNotEnrolled: flatCourses.filter((course) => course.status === "Not Enrolled").length,
      totalCourses: flatCourses.length,
      completionPercentage:
        (flatCourses.filter((course) => course.status === "Completed").length /
          flatCourses.length) *
        100,
      programsAssigned: new Set(filteredCourses.map((course) => course.program.id)).size,
    };

    setMetrics(metrics);
  }, [flatCourses, selectedLevels, selectedStatuses, searchText]);

  // filteredCourses is 'derived state' computed from other state on every render
  const filteredCourses = filterCourses(flatCourses, {
    levels: selectedLevels,
    statuses: selectedStatuses,
    search: searchText,
  });

  const hasActiveFilters =
    selectedStatuses.length > 0 || selectedLevels.length > 0 || searchText !== "";

  const sortedCourses = sortCourses(filteredCourses, sort);

  // filter courses to only show those where the status is 'Completed'
  // const completedCourses = filteredCourses.filter((course) => course.status === "Completed");

  // Helper function to fetch all programs (uses network-first, localStorage-fallback)
  async function fetchAllPrograms(signal?: AbortSignal): Promise<SupervisorProgram[]> {
    return localApi.getAllPrograms(signal);
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

  const statusOptions: FacetOption<CourseStatus>[] = [
    { label: "Completed", value: "Completed", icon: CheckCircle },
    { label: "Incomplete", value: "Incomplete", icon: Timer },
    { label: "Not Enrolled", value: "Not Enrolled", icon: HelpCircle },
  ];

  const levelOptions: FacetOption<string>[] = useMemo(
    () =>
      [...new Set(flatCourses.map((r) => r.course.levelName).filter(Boolean))]
        .sort()
        .map((level) => ({ label: level, value: level })),
    [flatCourses],
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="h-full p-4 @sm:p-6 @lg:p-8">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="space-y-4">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="h-full p-4 @sm:p-6 @lg:p-8">
        <div className="bg-red-50 border border-red-200 rounded-(--radius) p-6">
          <h2 className="text-xl font-semibold text-red-900 mb-2">Error</h2>
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  // Empty state (no programs assigned)
  if (hydratedPrograms.length === 0) {
    return (
      <div className="h-full p-4 @sm:p-6 @lg:p-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">
          {student?.learnerName}'s Progress
        </h2>
        <div className="bg-muted border border-border rounded-(--radius) p-8 text-center">
          <p className="text-slate-600">No programs assigned to this student.</p>
        </div>
      </div>
    );
  }

  // Main render
  return (
    <>
      <div className="h-full p-4 @sm:p-6 @lg:p-8 overflow-y-auto transition-opacity duration-(--duration-swap) ease-out starting:opacity-0">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">
          {student?.learnerName}'s Progress
        </h2>

        {/* summary cards */}
        <div className="grid grid-cols-2 @sm:grid-cols-3 @lg:grid-cols-5 gap-4 mb-8">
          <MetricCard
            title="Programs Assigned"
            value={metrics.programsAssigned}
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
            title="Courses Not Enrolled"
            value={metrics.statusNotEnrolled}
            icon={<CheckCircle className="h-5 w-5 text-muted-foreground" />}
            isLoading={isLoading}
            highlight={metrics.statusNotEnrolled > 0}
          />
          <MetricCard
            title="Courses Incomplete"
            value={metrics.statusIncomplete}
            icon={<Timer className="h-5 w-5 text-muted-foreground" />}
            isLoading={isLoading}
          />
          <MetricCard
            title="Total Courses"
            value={metrics.totalCourses}
            icon={<FileText className="h-5 w-5 text-muted-foreground" />}
            isLoading={isLoading}
          />
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <div className="relative w-full @sm:flex-1 @sm:max-w-sm">
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
            options={statusOptions}
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
            options={levelOptions}
            selected={selectedLevels}
            onToggle={(v) =>
              setSelectedLevels((prev) =>
                prev.includes(v) ? prev.filter((l) => l !== v) : [...prev, v],
              )
            }
            onClear={() => setSelectedLevels([])}
          />

          {hasActiveFilters && (
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

          <ColumnToggle hiddenCols={hiddenCols} onToggle={toggleCol} />
        </div>

        <div className="border border-border rounded-(--radius) overflow-hidden">
          <div className="overflow-x-auto">
            <Table className="min-w-[640px]">
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
                  {!hiddenCols.has("type") && <TableHead className="w-[12%] hidden @sm:table-cell">Type</TableHead>}
                  {!hiddenCols.has("duration") && (
                    <TableHead className="w-[10%] hidden @sm:table-cell">Duration</TableHead>
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
                      colSpan={COLUMNS.length - hiddenCols.size}
                      className="h-24 text-center text-muted-foreground"
                    >
                      {hasActiveFilters ? "No courses match your filters" : "No courses assigned"}
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
                        <TableCell className="text-sm text-muted-foreground text-left hidden @sm:table-cell">
                          {row.course.trainingTypeName}
                        </TableCell>
                      )}

                      {/* Duration */}
                      {!hiddenCols.has("duration") && (
                        <TableCell className="text-sm text-muted-foreground text-left hidden @sm:table-cell">
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
