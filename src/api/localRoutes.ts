/**
 * Local API Routes
 * GET/POST calls to local JSON Server for managing programs, assignments, and enrollments
 */

import { fetchApi, LOCAL_API_BASE } from "./utils";
import type { SupervisorProgram } from "@/types/models";

/**
 * Create a new supervisor program
 * POSTs to json-server running on localhost:3001
 */
export async function createProgram(
  program: Omit<SupervisorProgram, "id">
): Promise<SupervisorProgram> {
  // Generate UUID for the program
  const id = crypto.randomUUID();

  const programData: SupervisorProgram = {
    ...program,
    id,
  };

  const response = await fetchApi<SupervisorProgram>(
    `${LOCAL_API_BASE}/custom_programs`,
    {
      method: "POST",
      body: JSON.stringify(programData),
    }
  );

  return response;
}

/**
 * Get all supervisor programs
 */
export async function getPrograms(): Promise<SupervisorProgram[]> {
  const response = await fetchApi<SupervisorProgram[]>(
    `${LOCAL_API_BASE}/custom_programs`
  );
  return response;
}

/**
 * Get a specific program by ID
 */
export async function getProgram(id: string): Promise<SupervisorProgram> {
  const response = await fetchApi<SupervisorProgram>(
    `${LOCAL_API_BASE}/custom_programs/${id}`
  );
  return response;
}

/**
 * Update an existing program
 */
export async function updateProgram(
  id: string,
  updates: Partial<SupervisorProgram>
): Promise<SupervisorProgram> {
  const response = await fetchApi<SupervisorProgram>(
    `${LOCAL_API_BASE}/custom_programs/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(updates),
    }
  );
  return response;
}

/**
 * Delete a program
 */
export async function deleteProgram(id: string): Promise<void> {
  await fetchApi(`${LOCAL_API_BASE}/custom_programs/${id}`, {
    method: "DELETE",
  });
}
