/**
 * Local API Routes
 * Network-first (json-server), localStorage-fallback architecture
 * - Development: Tries json-server first, falls back to localStorage
 * - Production: Uses localStorage directly (no json-server on Vercel)
 */

import { fetchApi, LOCAL_API_BASE } from "./utils";
import { initializeStorage, readDB, writeDB, delay } from "./storageUtils";
import type {
  SupervisorProgram,
  ProgramAssignment,
  CourseEnrollment,
} from "@/types/models";

/**
 * Get all programs for a supervisor
 */
export async function getAllPrograms(): Promise<SupervisorProgram[]> {
  // 1. Try network (dev only)
  if (!import.meta.env.PROD) {
    try {
      const response = await fetchApi<SupervisorProgram[]>(`${LOCAL_API_BASE}/programs`);
      return response || [];
    } catch {
      console.warn("json-server offline, using localStorage");
    }
  }

  // 2. Fallback to localStorage
  initializeStorage();
  await delay(300);
  const db = readDB();
  return db.programs;
}

/**
 * Get a specific program by ID
 * @param id - The program UUID
 */
export async function getProgramById(id: string): Promise<SupervisorProgram> {
  // 1. Try network (dev only)
  if (!import.meta.env.PROD) {
    try {
      const response = await fetchApi<SupervisorProgram>(
        `${LOCAL_API_BASE}/programs/${id}`,
      );
      return response;
    } catch {
      console.warn("json-server offline, using localStorage");
    }
  }

  // 2. Fallback to localStorage
  initializeStorage();
  await delay(300);
  const db = readDB();
  const program = db.programs.find((p) => p.id === id);

  if (!program) {
    throw new Error(`Program ${id} not found`);
  }

  return program;
}

/**
 * Save a new program
 * @param program - The program to save (with courseSequence as array of IDs)
 */
export async function saveProgram(
  program: SupervisorProgram,
): Promise<SupervisorProgram> {
  // 1. Try network (dev only)
  if (!import.meta.env.PROD) {
    try {
      const response = await fetchApi<SupervisorProgram>(`${LOCAL_API_BASE}/programs`, {
        method: "POST",
        body: JSON.stringify(program),
      });
      return response;
    } catch {
      console.warn("json-server offline, using localStorage");
    }
  }

  // 2. Fallback to localStorage
  initializeStorage();
  await delay(300);
  const db = readDB();
  db.programs.push(program);
  writeDB(db);
  return program;
}

/**
 * Update an existing program
 * @param id - The program UUID
 * @param updates - Partial program updates
 */
export async function updateProgram(
  id: string,
  updates: Partial<SupervisorProgram>,
): Promise<SupervisorProgram> {
  // 1. Try network (dev only)
  if (!import.meta.env.PROD) {
    try {
      const response = await fetchApi<SupervisorProgram>(
        `${LOCAL_API_BASE}/programs/${id}`,
        {
          method: "PATCH",
          body: JSON.stringify(updates),
        },
      );
      return response;
    } catch {
      console.warn("json-server offline, using localStorage");
    }
  }

  // 2. Fallback to localStorage
  initializeStorage();
  await delay(300);
  const db = readDB();
  const programIndex = db.programs.findIndex((p) => p.id === id);

  if (programIndex === -1) {
    throw new Error(`Program ${id} not found`);
  }

  // Merge updates into existing program
  db.programs[programIndex] = {
    ...db.programs[programIndex],
    ...updates,
  };

  writeDB(db);
  return db.programs[programIndex];
}

/**
 * Get all program assignments
 */
export async function getAssignments(): Promise<ProgramAssignment[]> {
  // 1. Try network (dev only)
  if (!import.meta.env.PROD) {
    try {
      const response = await fetchApi<ProgramAssignment[]>(
        `${LOCAL_API_BASE}/program_registrations`,
      );
      return response || [];
    } catch {
      console.warn("json-server offline, using localStorage");
    }
  }

  // 2. Fallback to localStorage
  initializeStorage();
  await delay(300);
  const db = readDB();
  return db.program_registrations;
}

/**
 * Assign a program to a student
 * @param payload - Assignment data (without id)
 */
export async function assignProgram(
  payload: Omit<ProgramAssignment, "id">,
): Promise<ProgramAssignment> {
  const assignment: ProgramAssignment = {
    id: crypto.randomUUID(),
    ...payload,
  };

  // 1. Try network (dev only)
  if (!import.meta.env.PROD) {
    try {
      const response = await fetchApi<ProgramAssignment>(
        `${LOCAL_API_BASE}/program_registrations`,
        {
          method: "POST",
          body: JSON.stringify(assignment),
        },
      );
      return response;
    } catch {
      console.warn("json-server offline, using localStorage");
    }
  }

  // 2. Fallback to localStorage
  initializeStorage();
  await delay(300);
  const db = readDB();
  db.program_registrations.push(assignment);
  writeDB(db);
  return assignment;
}

/**
 * Get all course enrollments
 */
export async function getEnrollments(): Promise<CourseEnrollment[]> {
  // 1. Try network (dev only)
  if (!import.meta.env.PROD) {
    try {
      const response = await fetchApi<CourseEnrollment[]>(
        `${LOCAL_API_BASE}/enrollments`,
      );
      return response || [];
    } catch {
      console.warn("json-server offline, using localStorage");
    }
  }

  // 2. Fallback to localStorage
  initializeStorage();
  await delay(300);
  const db = readDB();
  return db.enrollments;
}

/**
 * Enroll a student in a specific class for a course
 * @param payload - Enrollment data (without id)
 */
export async function enrollStudent(
  payload: Omit<CourseEnrollment, "id">,
): Promise<CourseEnrollment> {
  const enrollment: CourseEnrollment = {
    id: crypto.randomUUID(),
    ...payload,
  };

  // 1. Try network (dev only)
  if (!import.meta.env.PROD) {
    try {
      const response = await fetchApi<CourseEnrollment>(`${LOCAL_API_BASE}/enrollments`, {
        method: "POST",
        body: JSON.stringify(enrollment),
      });
      return response;
    } catch {
      console.warn("json-server offline, using localStorage");
    }
  }

  // 2. Fallback to localStorage
  initializeStorage();
  await delay(300);
  const db = readDB();
  db.enrollments.push(enrollment);
  writeDB(db);
  return enrollment;
}

/**
 * Local API object for convenient access
 */
export const localApi = {
  saveProgram,
  getProgramById,
  updateProgram,
  assignProgram,
  enrollStudent,
  getAssignments,
  getEnrollments,
  getAllPrograms,
};
