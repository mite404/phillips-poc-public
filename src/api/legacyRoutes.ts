/**
 * Legacy API Routes
 * GET calls to Phillips X PIMS staging API with fallback to local JSON
 */

import { fetchApi, LEGACY_API_BASE, CONTENT_API_BASE } from "./utils";
import type {
  CourseCatalogItem,
  LearnerProfile,
  CourseInventory,
  Testimonial,
} from "@/types/models";

// Fallback imports
import coursesData from "@/data/Courses.json";
import studentsData from "@/data/Students.json";
import schedulesData from "@/data/Schedules.json";
import testimonialsData from "@/data/Testimonials.json";

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
 * Falls back to local Students.json if API fails
 */
export async function getRoster(): Promise<LearnerProfile[]> {
  try {
    const response = await fetchApi<{ result: LearnerProfile[] }>(
      `${LEGACY_API_BASE}/Learner/GetAllPartialValue`,
    );

    return response.result || [];
  } catch (error) {
    console.warn("Legacy API failed, using fallback student data:", error);
    return studentsData as LearnerProfile[];
  }
}

/**
 * Fetch class schedule inventory for a specific course
 * Falls back to local Schedules.json if API fails OR returns no data
 * @param courseId - The numeric course ID
 */
export async function getInventory(courseId: number): Promise<CourseInventory | null> {
  try {
    const response = await fetchApi<{ result: CourseInventory[] }>(
      `${LEGACY_API_BASE}/Class/Machinist/Schedules`,
    );

    // Find the inventory for this specific course
    const inventory = response.result?.find((inv) => inv.courseId === courseId);

    // CRITICAL: Data Guarantee - If API returns empty/no matches, use fallback
    if (!inventory || !inventory.classes || inventory.classes.length === 0) {
      console.warn(
        `Real API returned no classes for course ${courseId}, using fallback data`,
      );

      // Return from local schedules data
      const schedules = schedulesData as CourseInventory[];
      const fallbackInventory = schedules.find((inv) => inv.courseId === courseId);
      return fallbackInventory || null;
    }

    return inventory;
  } catch (error) {
    console.warn(
      "Legacy API failed (network error), using fallback schedule data:",
      error,
    );

    // Return from local schedules data
    const schedules = schedulesData as CourseInventory[];
    const inventory = schedules.find((inv) => inv.courseId === courseId);
    return inventory || null;
  }
}

/**
 * Fetch testimonials from Content API
 * Falls back to local Testimonials.json if API fails
 */
export async function getTestimonials(): Promise<Testimonial[]> {
  try {
    const response = await fetchApi<{ result: Testimonial[] }>(
      `${CONTENT_API_BASE}/Testimonial/GetAllPartialValue`,
    );

    return response.result || [];
  } catch (error) {
    console.warn("Content API failed, using fallback testimonials data:", error);
    return testimonialsData as Testimonial[];
  }
}

/**
 * Fetch ALL class schedule inventory at once (optimized for batch checking)
 * Returns a Map of courseId -> CourseInventory for quick lookups
 * Falls back to local Schedules.json if API fails
 */
export async function getAllInventory(): Promise<Map<number, CourseInventory | null>> {
  try {
    const response = await fetchApi<{ result: CourseInventory[] }>(
      `${LEGACY_API_BASE}/Class/Machinist/Schedules`,
    );

    const inventoryMap = new Map<number, CourseInventory | null>();

    if (response.result && Array.isArray(response.result)) {
      response.result.forEach((inv) => {
        // Only add if it has classes (Data Guarantee pattern)
        if (inv.classes && inv.classes.length > 0) {
          inventoryMap.set(inv.courseId, inv);
        } else {
          // Mark as explicitly no sessions
          inventoryMap.set(inv.courseId, null);
        }
      });
    }

    // Merge with fallback data
    const schedules = schedulesData as CourseInventory[];
    schedules.forEach((inv) => {
      // Only add fallback if not already in map from API
      if (!inventoryMap.has(inv.courseId)) {
        if (inv.classes && inv.classes.length > 0) {
          inventoryMap.set(inv.courseId, inv);
        } else {
          inventoryMap.set(inv.courseId, null);
        }
      }
    });

    return inventoryMap;
  } catch (error) {
    console.warn(
      "Legacy API failed, using fallback schedule data for all inventory:",
      error,
    );

    // Full fallback to local data
    const schedules = schedulesData as CourseInventory[];
    const fallbackMap = new Map<number, CourseInventory | null>();

    schedules.forEach((inv) => {
      if (inv.classes && inv.classes.length > 0) {
        fallbackMap.set(inv.courseId, inv);
      } else {
        fallbackMap.set(inv.courseId, null);
      }
    });

    return fallbackMap;
  }
}

/**
 * Legacy API object for convenient access
 */
export const legacyApi = {
  getCatalog,
  getRoster,
  getInventory,
  getAllInventory,
  getTestimonials,
};
