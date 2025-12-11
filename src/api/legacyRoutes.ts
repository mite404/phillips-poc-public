/**
 * Legacy API Routes
 * GET calls to Phillips X PIMS staging API with fallback to local JSON
 */

import { fetchApi, LEGACY_API_BASE } from "./utils";
import type { CourseCatalogItem } from "@/types/models";

// Fallback imports
import coursesData from "@/data/Courses.json";

/**
 * Fetch course catalog from Legacy API
 * Falls back to local JSON if API fails (CORS, network, etc.)
 */
export async function getCatalog(): Promise<CourseCatalogItem[]> {
  try {
    const response = await fetchApi<{ result: CourseCatalogItem[] }>(
      `${LEGACY_API_BASE}/Course/GetAllPartialValue`,
    );

    // The API returns { result: [...] }
    return response.result || [];
  } catch (error) {
    console.warn("Legacy API failed, using fallback data:", error);
    // Return the statically imported course data
    return coursesData as CourseCatalogItem[];
  }
}

/**
 * Fetch learner roster from Legacy API
 * TODO: Implement in PR-04
 */
export async function getRoster() {
  throw new Error("Not yet implemented");
}

/**
 * Fetch class schedule inventory for a specific course
 * TODO: Implement in PR-04
 */
export async function getInventory(_courseId: number) {
  throw new Error("Not yet implemented");
}
