/**
 * Content API Routes
 * GET calls to Phillips X Content staging API with fallback handling
 */

import { fetchApi, CONTENT_API_BASE } from "./utils";

/**
 * Fetch testimonials from Content API
 * Returns all testimonials with partial values
 */
export async function getTestimonials(): Promise<unknown[]> {
  try {
    const response = await fetchApi<{ result: unknown[] }>(
      `${CONTENT_API_BASE}/Testimonial/GetAllPartialValue`,
    );

    // The API returns { result: [...] }
    return response.result || [];
  } catch (error) {
    console.error("Content API failed for testimonials:", error);
    throw error;
  }
}

/**
 * Test function to check API availability
 */
export async function testContentAPI(): Promise<unknown> {
  try {
    // Try different possible endpoints
    const endpoints = [
      "/Testimonial/GetAllPartialValue",
      "/Testimonials/GetAllPartialValue",
      "/Content/GetAllPartialValue",
    ];

    const results = [];
    for (const endpoint of endpoints) {
      try {
        console.log(`Testing endpoint: ${CONTENT_API_BASE}${endpoint}`);
        const response = await fetchApi(`${CONTENT_API_BASE}${endpoint}`);
        results.push({ endpoint, status: "success", data: response });
      } catch (err) {
        results.push({ endpoint, status: "failed", error: String(err) });
      }
    }

    return results;
  } catch (error) {
    console.error("Content API test failed:", error);
    throw error;
  }
}

/**
 * Content API object for convenient access
 */
export const contentApi = {
  getTestimonials,
  testContentAPI,
};
