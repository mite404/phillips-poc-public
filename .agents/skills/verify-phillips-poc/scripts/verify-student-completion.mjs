#!/usr/bin/env bun
/**
 * Proves ETH-38 completion against live json-server fixture data.
 * Run while `control-phillips-poc.sh launch` is active.
 */
import { isProgramComplete } from "../../../../src/lib/completion.ts";

const LEARNER_ID = "6c541134-c0f6-41af-904a-1dcb46d16b71";
const BASE = process.env.VERIFY_JSON_BASE ?? "http://127.0.0.1:3001";

const [registrations, enrollments, programs] = await Promise.all([
  fetch(`${BASE}/program_registrations`).then((r) => r.json()),
  fetch(`${BASE}/enrollments`).then((r) => r.json()),
  fetch(`${BASE}/programs`).then((r) => r.json()),
]);

const myRegs = registrations.filter((r) => r.learnerId === LEARNER_ID);
const uniqueProgramIds = [...new Set(myRegs.map((r) => r.programId))];
const myEnrollments = enrollments.filter((e) => e.learnerId === LEARNER_ID);

const hydrated = uniqueProgramIds.map((programId) => {
  const program = programs.find((p) => p.id === programId);
  if (!program) throw new Error(`missing program ${programId}`);
  const programEnrollments = myEnrollments.filter(
    (e) => e.programId === programId
  );
  return {
    name: program.programName,
    isCompleted: isProgramComplete(program.courseSequence, programEnrollments),
  };
});

const completed = hydrated.filter((p) => p.isCompleted).map((p) => p.name);
const assigned = hydrated.filter((p) => !p.isCompleted).map((p) => p.name);

const failures = [];
if (!completed.includes("Advanced 5-Axis Certification")) {
  failures.push(
    `expected Advanced 5-Axis Certification in completed, got: ${completed.join(", ")}`
  );
}
if (completed.includes("Q1 Safety Fundamentals")) {
  failures.push("Q1 Safety Fundamentals must not appear in completed");
}
if (assigned.includes("Advanced 5-Axis Certification")) {
  failures.push("Advanced 5-Axis Certification must not appear in assigned");
}

if (failures.length > 0) {
  console.error("FAIL");
  for (const f of failures) console.error(`- ${f}`);
  console.error(JSON.stringify({ assigned, completed }, null, 2));
  process.exit(1);
}

console.log("PASS");
console.log(JSON.stringify({ assigned, completed }, null, 2));
