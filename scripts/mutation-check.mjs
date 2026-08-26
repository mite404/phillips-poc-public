#!/usr/bin/env node
// Breaks one rule in the table logic (or its callers) at a time and requires the suite to go red.
// A green suite proves nothing on its own; this proves the tests are load-bearing.
// Run with: bun run test:mutants

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const LOGIC = "src/components/progress/courseTable.ts";
const VIEW = "src/components/progress/StudentProgressView.tsx";
const SUITE = "src/components/progress";

const MUTANTS = [
  {
    name: "level facet no longer accepts an empty selection as 'all'",
    from: "filters.levels.length === 0 || filters.levels.includes(row.course.levelName)",
    to: "filters.levels.includes(row.course.levelName)",
  },
  {
    name: "status facet predicate inverted",
    from: "filters.statuses.includes(row.status)",
    to: "!filters.statuses.includes(row.status)",
  },
  {
    name: "facets combined with OR instead of AND",
    from: "return matchesLevel && matchesStatus && matchesSearch(row, filters.search);",
    to: "return matchesLevel || matchesStatus || matchesSearch(row, filters.search);",
  },
  {
    name: "search stops looking at the program name",
    from: "row.program.programName.toLowerCase().includes(searchLower)",
    to: "false",
  },
  {
    name: "blank search no longer matches every row",
    from: 'if (search.trim() === "") return true;',
    to: 'if (search.trim() === "") return false;',
  },
  {
    name: "sort direction flipped",
    from: 'sort.dir === "asc" ? compare(a, b, col) : -compare(a, b, col)',
    to: 'sort.dir === "asc" ? -compare(a, b, col) : compare(a, b, col)',
  },
  {
    name: "level ordering collapsed so Basic and Advanced tie",
    from: "(LEVEL_ORDER[a.course.levelName] ?? 99) - (LEVEL_ORDER[b.course.levelName] ?? 99)",
    to: "0",
  },
  {
    name: "status ordering collapsed",
    from: "STATUS_ORDER[a.status] - STATUS_ORDER[b.status]",
    to: "0",
  },
  {
    name: "toggleColumn can hide a column but never show it again",
    from: "next.delete(col);",
    to: "next.add(col);",
  },
  {
    name: "metrics path stops passing the search text to the shared filter",
    file: VIEW,
    from: `    const filteredCourses = filterCourses(flatCourses, {
      levels: selectedLevels,
      statuses: selectedStatuses,
      search: searchText,
    });`,
    to: `    const filteredCourses = filterCourses(flatCourses, {
      levels: selectedLevels,
      statuses: selectedStatuses,
      search: "",
    });`,
  },
];

function runSuite() {
  try {
    execFileSync("npx", ["vitest", "run", SUITE], { stdio: "pipe" });
    return { failed: 0 };
  } catch (err) {
    const output = `${err.stdout ?? ""}${err.stderr ?? ""}`.replace(/\[\d+m/g, "");
    const match = output.match(/Tests\s+(\d+) failed/);
    return { failed: match ? Number(match[1]) : 1 };
  }
}

function applyMutant(source, mutant, file) {
  const hits = source.split(mutant.from).length - 1;
  if (hits !== 1) {
    throw new Error(
      `mutant "${mutant.name}" matched ${hits} times in ${file}; update scripts/mutation-check.mjs`,
    );
  }
  return source.replace(mutant.from, mutant.to);
}

const originals = new Map([LOGIC, VIEW].map((file) => [file, readFileSync(file, "utf8")]));
const restore = () => originals.forEach((source, file) => writeFileSync(file, source));
const survivors = [];

try {
  const baseline = runSuite();
  if (baseline.failed > 0) {
    console.error(`baseline suite is red (${baseline.failed} failing). Fix that first.`);
    process.exit(1);
  }
  console.log(`baseline green, running ${MUTANTS.length} mutants against ${SUITE}\n`);

  for (const mutant of MUTANTS) {
    const file = mutant.file ?? LOGIC;
    writeFileSync(file, applyMutant(originals.get(file), mutant, file));
    const { failed } = runSuite();
    restore();
    if (failed === 0) survivors.push(mutant.name);
    console.log(`${failed > 0 ? "killed " : "SURVIVED"}  ${String(failed).padStart(2)} failing  ${mutant.name}`);
  }
} finally {
  restore();
}

if (survivors.length > 0) {
  console.error(`\n${survivors.length} mutant(s) survived. The tests do not cover:`);
  survivors.forEach((name) => console.error(`  - ${name}`));
  process.exit(1);
}

console.log(`\nall ${MUTANTS.length} mutants killed`);
