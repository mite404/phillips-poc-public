/**
 * Local API Routes
 * POST/PUT/GET calls to json-server running on localhost:3001
 * Falls back to mock data when json-server is unavailable (production)
 */

import { fetchApi, LOCAL_API_BASE } from "./utils";
import { mockPrograms, mockAssignments, mockEnrollments } from "@/data/mockData";
import type {
  SupervisorProgram,
  ProgramAssignment,
  CourseEnrollment,
} from "@/types/models";

/**
 * Save a new program to the local json-server
 * @param program - The program to save (with courseSequence as array of IDs)
 */
export async function saveProgram(
  program: SupervisorProgram,
): Promise<SupervisorProgram> {
  try {
    const response = await fetchApi<SupervisorProgram>(`${LOCAL_API_BASE}/programs`, {
      method: "POST",
      body: JSON.stringify(program),
    });

    return response;
  } catch (error) {
    console.error("Failed to save program:", error);
    throw error;
  }
}

/**
 * Get a specific program by ID
 * @param id - The program UUID
 */
export async function getProgramById(id: string): Promise<SupervisorProgram> {
  try {
    const response = await fetchApi<SupervisorProgram>(
      `${LOCAL_API_BASE}/programs/${id}`,
    );
    return response;
  } catch (error) {
    console.error("Failed to fetch program from server, using mock data:", error);
    const program = mockPrograms.find((p) => p.id === id);
    if (!program) {
      throw new Error(`Program ${id} not found`);
    }
    return program;
  }
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
  try {
    const response = await fetchApi<SupervisorProgram>(
      `${LOCAL_API_BASE}/programs/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify(updates),
      },
    );
    return response;
  } catch (error) {
    console.error("Failed to update program:", error);
    throw error;
  }
}

/**
 * Assign a program to a student
 * @param payload - Assignment data
 */
export async function assignProgram(
  payload: Omit<ProgramAssignment, "id">,
): Promise<ProgramAssignment> {
  try {
    const assignment: ProgramAssignment = {
      id: crypto.randomUUID(),
      ...payload,
    };

    const response = await fetchApi<ProgramAssignment>(
      `${LOCAL_API_BASE}/program_registrations`,
      {
        method: "POST",
        body: JSON.stringify(assignment),
      },
    );

    return response;
  } catch (error) {
    console.error("Failed to assign program:", error);
    throw error;
  }
}

/**
 * Enroll a student in a specific class for a course
 * @param payload - Enrollment data
 */
export async function enrollStudent(
  payload: Omit<CourseEnrollment, "id">,
): Promise<CourseEnrollment> {
  try {
    const enrollment: CourseEnrollment = {
      id: crypto.randomUUID(),
      ...payload,
    };

    const response = await fetchApi<CourseEnrollment>(`${LOCAL_API_BASE}/enrollments`, {
      method: "POST",
      body: JSON.stringify(enrollment),
    });

    return response;
  } catch (error) {
    console.error("Failed to enroll student:", error);
    throw error;
  }
}

/**
 * Get all program assignments
 */
export async function getAssignments(): Promise<ProgramAssignment[]> {
  try {
    const response = await fetchApi<ProgramAssignment[]>(
      `${LOCAL_API_BASE}/program_registrations`,
    );
    return response;
  } catch (error) {
    console.error("Failed to fetch assignments from server, using mock data:", error);
    return mockAssignments;
  }
}

/**
 * Get all course enrollments
 */
export async function getEnrollments(): Promise<CourseEnrollment[]> {
  try {
    const response = await fetchApi<CourseEnrollment[]>(`${LOCAL_API_BASE}/enrollments`);
    return response || [];
  } catch (error) {
    console.error("Failed to fetch enrollments from server, using mock data:", error);
    return mockEnrollments;
  }
}

/**
 * Get all programs for a supervisor
 */
export async function getAllPrograms(): Promise<SupervisorProgram[]> {
  try {
    const response = await fetchApi<SupervisorProgram[]>(`${LOCAL_API_BASE}/programs`);
    return response || [];
  } catch (error) {
    console.error("Failed to fetch programs from server, using mock data:", error);
    return mockPrograms;
  }
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
