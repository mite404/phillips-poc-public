// CALCULATIONS: pure filter/sort/column rules behind the student progress table.
// Kept out of StudentProgressView so both the metrics pass and the render pass
// share one predicate instead of two copies that can drift.

import type { CourseRow, CourseStatus } from "@/types/models";

export type SortCol = "courseId" | "courseName" | "program" | "level" | "status";
export type ColKey = SortCol | "type" | "duration";

export interface CourseFilters {
  levels: string[];
  statuses: CourseStatus[];
  search: string;
}

export interface CourseSort {
  col: SortCol | null;
  dir: "asc" | "desc";
}

/** Table columns in render order. Also the source of truth for the View menu. */
export const COLUMNS: { key: ColKey; label: string }[] = [
  { key: "courseId", label: "Course ID" },
  { key: "courseName", label: "Course Name" },
  { key: "program", label: "Program" },
  { key: "level", label: "Level" },
  { key: "type", label: "Training Type" },
  { key: "duration", label: "Duration" },
  { key: "status", label: "Status" },
];

const LEVEL_ORDER: Record<string, number> = { Basic: 0, Intermediate: 1, Advanced: 2 };
const STATUS_ORDER: Record<CourseStatus, number> = {
  "Not Enrolled": 0,
  Incomplete: 1,
  Completed: 2,
};

/**
 * Free-text match across course id, course title and program name.
 * An empty or whitespace-only search matches every row.
 */
export function matchesSearch(row: CourseRow, search: string): boolean {
  if (search.trim() === "") return true;

  const searchLower = search.toLowerCase();

  return (
    row.course.courseId.toString().includes(searchLower) ||
    row.course.courseTitle.toLowerCase().includes(searchLower) ||
    row.program.programName.toLowerCase().includes(searchLower)
  );
}

/**
 * The one filter predicate for the table: an empty facet means "all", selections
 * inside a facet are OR'd, and the two facets plus the search are AND'd together.
 */
export function matchesFilters(row: CourseRow, filters: CourseFilters): boolean {
  const matchesLevel = filters.levels.length === 0 || filters.levels.includes(row.course.levelName);
  const matchesStatus =
    filters.statuses.length === 0 || filters.statuses.includes(row.status);

  return matchesLevel && matchesStatus && matchesSearch(row, filters.search);
}

/** Rows surviving the facet + search filters, in their original order. */
export function filterCourses(rows: CourseRow[], filters: CourseFilters): CourseRow[] {
  return rows.filter((row) => matchesFilters(row, filters));
}

function compare(a: CourseRow, b: CourseRow, col: SortCol): number {
  switch (col) {
    case "level":
      return (LEVEL_ORDER[a.course.levelName] ?? 99) - (LEVEL_ORDER[b.course.levelName] ?? 99);
    case "status":
      return STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    case "courseId":
      return a.course.courseId - b.course.courseId;
    case "courseName":
      return a.course.courseTitle.localeCompare(b.course.courseTitle);
    case "program":
      return a.program.programName.localeCompare(b.program.programName);
  }
}

/**
 * Sorted copy of `rows`. No sort column means the input order is kept.
 * Ties keep their incoming order, since Array#sort is stable.
 */
export function sortCourses(rows: CourseRow[], sort: CourseSort): CourseRow[] {
  const col = sort.col;
  if (!col) return rows;

  return [...rows].sort((a, b) => (sort.dir === "asc" ? compare(a, b, col) : -compare(a, b, col)));
}

/** Hidden-column set with `col` flipped. Returns a new Set; never mutates. */
export function toggleColumn(hidden: Set<ColKey>, col: ColKey): Set<ColKey> {
  const next = new Set(hidden);
  if (next.has(col)) {
    next.delete(col);
  } else {
    next.add(col);
  }
  return next;
}
