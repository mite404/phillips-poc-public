/**
 * API Utilities
 * Centralized fetch wrapper with error handling
 */

// Use relative paths to leverage Vite proxy in development
// In production, these would be overridden by environment variables
export const LEGACY_API_BASE = import.meta.env.VITE_LEGACY_API_BASE || "/api";
export const CONTENT_API_BASE = import.meta.env.VITE_CONTENT_API_BASE || "/content-api";
export const LOCAL_API_BASE =
  import.meta.env.VITE_LOCAL_API_BASE || "http://localhost:3001";

/**
 * Generic fetch wrapper with error parsing
 */
export async function fetchApi<T>(url: string, options?: RequestInit): Promise<T> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Fetch error:", error);
    throw error;
  }
}
