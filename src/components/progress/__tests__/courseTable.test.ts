import { describe, it, expect } from "vitest";
import type { CourseCatalogItem, CourseRow, CourseStatus, SupervisorProgram } from "@/types/models";
import {
  COLUMNS,
  filterCourses,
  matchesFilters,
  matchesSearch,
  sortCourses,
  toggleColumn,
  type ColKey,
} from "../courseTable";

const program = (id: string, programName: string): SupervisorProgram => ({
  id,
  supervisorId: "sup_1",
  programName,
  description: "",
  tags: [],
  courseSequence: [],
  published: true,
  createdAt: "2026-01-01T00:00:00.000Z",
});

const course = (courseId: number, courseTitle: string, levelName: string): CourseCatalogItem => ({
  courseId,
  courseTitle,
  levelName,
  trainingTypeName: "ILT",
  totalDays: 1,
  hours: null,
  previewImageUrl: null,
  prices: [{ isFree: true }],
});

const row = (
  courseId: number,
  courseTitle: string,
  levelName: string,
  status: CourseStatus,
  programName = "CNC Fundamentals",
): CourseRow => ({
  course: course(courseId, courseTitle, levelName),
  program: program(`prog_${programName}`, programName),
  status,
});

const rows: CourseRow[] = [
  row(11, "Haas CNC Maintenance", "Basic", "Completed"),
  row(116, "Advanced Mill Programming", "Advanced", "Incomplete"),
  row(9, "Safety Fundamentals", "Intermediate", "Not Enrolled", "Safety Track"),
  row(42, "Lathe Basics", "Basic", "Not Enrolled", "Safety Track"),
];

const noFilters = { levels: [], statuses: [], search: "" };
const titles = (result: CourseRow[]) => result.map((r) => r.course.courseTitle);

describe("matchesSearch", () => {
  it("matches every row when the search is empty or whitespace", () => {
    expect(matchesSearch(rows[0], "")).toBe(true);
    expect(matchesSearch(rows[0], "   ")).toBe(true);
  });

  it("matches on course title, case-insensitively", () => {
    expect(matchesSearch(rows[0], "haas")).toBe(true);
    expect(matchesSearch(rows[0], "lathe")).toBe(false);
  });

  it("matches on course id and program name", () => {
    expect(matchesSearch(rows[1], "116")).toBe(true);
    expect(matchesSearch(rows[2], "safety track")).toBe(true);
    expect(matchesSearch(rows[0], "safety track")).toBe(false);
  });
});

describe("matchesFilters", () => {
  it("treats an empty facet as 'all'", () => {
    expect(rows.every((r) => matchesFilters(r, noFilters))).toBe(true);
  });

  it("ORs selections within the level facet", () => {
    const filters = { ...noFilters, levels: ["Basic", "Advanced"] };
    expect(titles(filterCourses(rows, filters))).toEqual([
      "Haas CNC Maintenance",
      "Advanced Mill Programming",
      "Lathe Basics",
    ]);
  });

  it("ORs selections within the status facet", () => {
    const filters = { ...noFilters, statuses: ["Completed", "Incomplete"] as CourseStatus[] };
    expect(titles(filterCourses(rows, filters))).toEqual([
      "Haas CNC Maintenance",
      "Advanced Mill Programming",
    ]);
  });

  it("ANDs the level and status facets together", () => {
    const filters = {
      ...noFilters,
      levels: ["Basic"],
      statuses: ["Not Enrolled"] as CourseStatus[],
    };
    expect(titles(filterCourses(rows, filters))).toEqual(["Lathe Basics"]);
  });

  it("ANDs the search with the facets", () => {
    const filters = { levels: ["Basic"], statuses: [] as CourseStatus[], search: "haas" };
    expect(titles(filterCourses(rows, filters))).toEqual(["Haas CNC Maintenance"]);

    expect(filterCourses(rows, { ...filters, levels: ["Advanced"] })).toEqual([]);
  });

  it("returns nothing when the facets exclude everything", () => {
    const filters = {
      ...noFilters,
      levels: ["Advanced"],
      statuses: ["Completed"] as CourseStatus[],
    };
    expect(filterCourses(rows, filters)).toEqual([]);
  });
});

describe("sortCourses", () => {
  it("keeps the incoming order when no column is selected", () => {
    expect(sortCourses(rows, { col: null, dir: "asc" })).toBe(rows);
  });

  it("sorts levels Basic -> Intermediate -> Advanced, and reverses on desc", () => {
    const asc = sortCourses(rows, { col: "level", dir: "asc" });
    expect(asc.map((r) => r.course.levelName)).toEqual([
      "Basic",
      "Basic",
      "Intermediate",
      "Advanced",
    ]);

    const desc = sortCourses(rows, { col: "level", dir: "desc" });
    expect(desc.map((r) => r.course.levelName)).toEqual([
      "Advanced",
      "Intermediate",
      "Basic",
      "Basic",
    ]);
  });

  it("sorts statuses Not Enrolled -> Incomplete -> Completed, and reverses on desc", () => {
    expect(sortCourses(rows, { col: "status", dir: "asc" }).map((r) => r.status)).toEqual([
      "Not Enrolled",
      "Not Enrolled",
      "Incomplete",
      "Completed",
    ]);
    expect(sortCourses(rows, { col: "status", dir: "desc" }).map((r) => r.status)).toEqual([
      "Completed",
      "Incomplete",
      "Not Enrolled",
      "Not Enrolled",
    ]);
  });

  it("is stable across equal values", () => {
    // Equal levels and equal statuses must keep the order they arrived in.
    expect(titles(sortCourses(rows, { col: "level", dir: "asc" })).slice(0, 2)).toEqual([
      "Haas CNC Maintenance",
      "Lathe Basics",
    ]);
    expect(titles(sortCourses(rows, { col: "status", dir: "asc" })).slice(0, 2)).toEqual([
      "Safety Fundamentals",
      "Lathe Basics",
    ]);
  });

  it("sorts course id numerically and titles alphabetically", () => {
    expect(sortCourses(rows, { col: "courseId", dir: "asc" }).map((r) => r.course.courseId)).toEqual(
      [9, 11, 42, 116],
    );
    expect(titles(sortCourses(rows, { col: "courseName", dir: "asc" }))).toEqual([
      "Advanced Mill Programming",
      "Haas CNC Maintenance",
      "Lathe Basics",
      "Safety Fundamentals",
    ]);
  });

  it("does not mutate the input array", () => {
    const input = [...rows];
    sortCourses(input, { col: "courseId", dir: "desc" });
    expect(input).toEqual(rows);
  });

  it("sorts unknown levels last", () => {
    const withUnknown = [row(7, "Mystery Course", "Expert", "Completed"), ...rows];
    const sorted = sortCourses(withUnknown, { col: "level", dir: "asc" });
    expect(sorted[sorted.length - 1].course.courseTitle).toBe("Mystery Course");
  });
});

describe("toggleColumn", () => {
  it("hides, then re-shows, a column without touching the others", () => {
    const hidden = toggleColumn(new Set<ColKey>(["level"]), "status");
    expect([...hidden].sort()).toEqual(["level", "status"]);
    expect([...toggleColumn(hidden, "status")]).toEqual(["level"]);
  });

  it("returns a new Set rather than mutating the previous one", () => {
    const prev = new Set<ColKey>();
    expect(toggleColumn(prev, "level")).not.toBe(prev);
    expect(prev.size).toBe(0);
  });

  it("covers every column the table renders", () => {
    expect(COLUMNS.map((c) => c.key)).toEqual([
      "courseId",
      "courseName",
      "program",
      "level",
      "type",
      "duration",
      "status",
    ]);
  });
});
