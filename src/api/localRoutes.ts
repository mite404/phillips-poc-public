/**
 * Local API Routes
 * POST/PUT calls to json-server running on localhost:3001
 */

import { fetchApi, LOCAL_API_BASE } from "./utils";
import type { SupervisorProgram } from "@/types/models";

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
 * Local API object for convenient access
 */
export const localApi = {
  saveProgram,
};
