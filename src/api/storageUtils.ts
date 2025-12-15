/**
 * localStorage Utility Functions
 * Manages the client-side persistence layer for Vercel deployment
 */

import { INITIAL_DB, type LocalDB } from "@/data/seedData";

const STORAGE_KEY = "phillips_db";

/**
 * Initialize localStorage with seed data if it doesn't exist
 * Called automatically by read/write operations
 */
export function initializeStorage(): void {
  if (typeof window === "undefined") return; // SSR safety

  if (!localStorage.getItem(STORAGE_KEY)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DB));
    console.log("📦 localStorage initialized with seed data");
  }
}

/**
 * Read the entire database from localStorage
 * Returns INITIAL_DB if storage is empty or invalid
 */
export function readDB(): LocalDB {
  if (typeof window === "undefined") return INITIAL_DB; // SSR safety

  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return INITIAL_DB;

    const parsed = JSON.parse(data) as LocalDB;

    // Validate structure
    if (!parsed.programs || !parsed.program_registrations || !parsed.enrollments) {
      console.warn("⚠️ Invalid localStorage structure, resetting to seed data");
      return INITIAL_DB;
    }

    return parsed;
  } catch (error) {
    console.error("Failed to read from localStorage:", error);
    return INITIAL_DB;
  }
}

/**
 * Write the entire database to localStorage
 * @param db - The complete database object to persist
 */
export function writeDB(db: LocalDB): void {
  if (typeof window === "undefined") return; // SSR safety

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch (error) {
    if (error instanceof DOMException && error.name === "QuotaExceededError") {
      console.error("❌ localStorage quota exceeded - data not saved");
    } else {
      console.error("Failed to write to localStorage:", error);
    }
  }
}

/**
 * Simulate network latency for UX consistency
 * Makes localStorage operations feel like network requests
 * @param ms - Milliseconds to delay (default 300)
 */
export function delay(ms: number = 300): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Clear all localStorage data (useful for debugging)
 * ⚠️ This will reset the app to seed data state
 */
export function clearStorage(): void {
  if (typeof window === "undefined") return;

  localStorage.removeItem(STORAGE_KEY);
  console.log("🗑️ localStorage cleared");
}
