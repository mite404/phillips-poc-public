/**
 * API Utilities
 * Centralized fetch wrapper with error handling
 */

export const LEGACY_API_BASE = 'https://phillipsx-pims-stage.azurewebsites.net/api';
export const LOCAL_API_BASE = 'http://localhost:3001';

/**
 * Generic fetch wrapper with error parsing
 */
export async function fetchApi<T>(url: string, options?: RequestInit): Promise<T> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}
