import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { legacyApi } from "../legacyRoutes";
import type { CourseInventory, LearnerProfile } from "@/types/models";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch as unknown as typeof fetch;

describe("Data Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Scenario A: Book Class Data - Empty API Response Fallback", () => {
    it("should fall back to Schedules.json when API returns HTTP 200 with empty array", async () => {
      // Mock: API returns HTTP 200 but with empty result array
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ result: [] }),
      });

      const inventory = await legacyApi.getInventory(11);

      // Assert: Should return fallback data from Schedules.json
      expect(inventory).not.toBeNull();
      expect(inventory?.courseId).toBe(11);
      expect(inventory?.classes).toBeDefined();
      expect(inventory?.classes.length).toBeGreaterThan(0);

      // Verify fallback data structure
      expect(inventory?.classes[0]).toHaveProperty("classId");
      expect(inventory?.classes[0]).toHaveProperty("location");
      expect(inventory?.classes[0]).toHaveProperty("startDate");
      expect(inventory?.classes[0]).toHaveProperty("endDate");
      expect(inventory?.classes[0]).toHaveProperty("seats");
      expect(inventory?.classes[0]).toHaveProperty("type");
    });

    it("should fall back to Schedules.json when API returns data without matching courseId", async () => {
      // Mock: API returns data but no match for courseId 11
      const mockApiResponse: CourseInventory[] = [
        {
          courseId: 999,
          classes: [
            {
              classId: 1,
              location: "Test Location",
              startDate: "2025-01-01T00:00:00",
              endDate: "2025-01-05T00:00:00",
              seats: 10,
              type: "ILT",
            },
          ],
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ result: mockApiResponse }),
      });

      const inventory = await legacyApi.getInventory(11);

      // Assert: Should return fallback data for course 11
      expect(inventory).not.toBeNull();
      expect(inventory?.courseId).toBe(11);
      expect(inventory?.classes.length).toBeGreaterThan(0);
    });

    it("should fall back to Schedules.json when API returns inventory with empty classes array", async () => {
      // Mock: API returns matching courseId but with empty classes array
      const mockApiResponse: CourseInventory[] = [
        {
          courseId: 11,
          classes: [], // Empty classes
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ result: mockApiResponse }),
      });

      const inventory = await legacyApi.getInventory(11);

      // Assert: Should return fallback data with actual classes
      expect(inventory).not.toBeNull();
      expect(inventory?.courseId).toBe(11);
      expect(inventory?.classes.length).toBeGreaterThan(0);
    });

    it("should fall back to Schedules.json on network error", async () => {
      // Mock: Network error (fetch fails)
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const inventory = await legacyApi.getInventory(11);

      // Assert: Should return fallback data
      expect(inventory).not.toBeNull();
      expect(inventory?.courseId).toBe(11);
      expect(inventory?.classes.length).toBeGreaterThan(0);
    });

    it("should return valid class data from Schedules.json for course 116", async () => {
      // Mock: Empty API response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ result: [] }),
      });

      const inventory = await legacyApi.getInventory(116);

      // Assert: Should return fallback data for course 116
      expect(inventory).not.toBeNull();
      expect(inventory?.courseId).toBe(116);
      expect(inventory?.classes.length).toBeGreaterThan(0);

      // Verify at least one class has expected structure
      const firstClass = inventory?.classes[0];
      expect(firstClass).toHaveProperty("classId");
      expect(firstClass).toHaveProperty("location");
      expect(typeof firstClass?.location).toBe("string");
      expect(firstClass?.seats).toBeGreaterThan(0);
    });

    it("should return null for courses not in Schedules.json", async () => {
      // Mock: Empty API response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ result: [] }),
      });

      const inventory = await legacyApi.getInventory(99999); // Non-existent course

      // Assert: Should return null (no fallback data available)
      expect(inventory).toBeNull();
    });
  });

  describe("Scenario B: Student Progress Data - Roster Fetching", () => {
    it("should fetch and return learner roster with expected structure", async () => {
      // Mock: Successful API response with learner data
      const mockLearners: LearnerProfile[] = [
        {
          learner_Data_Id: 1511,
          learnerId: "fc067d90-a136-4f7f-97c5-eafc8f01a81f",
          learnerName: "Ethan Rodriguez",
          emailId: "ethan.rodriguez@phillips.com",
          location: "Bensalem, PA",
          status: "Active",
          currentEnrollment: {
            productName: "CNC Fundamentals",
            learnerStatusTag: "Enrolled",
          },
        },
        {
          learner_Data_Id: 1512,
          learnerId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
          learnerName: "Sarah Chen",
          emailId: "sarah.chen@phillips.com",
          location: "Mumbai, India",
          status: "Active",
          currentEnrollment: null,
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ result: mockLearners }),
      });

      const roster = await legacyApi.getRoster();

      // Assert: Should return learner array
      expect(Array.isArray(roster)).toBe(true);
      expect(roster.length).toBeGreaterThan(0);

      // Verify structure of first learner
      const firstLearner = roster[0];
      expect(firstLearner).toHaveProperty("learner_Data_Id");
      expect(firstLearner).toHaveProperty("learnerId");
      expect(firstLearner).toHaveProperty("learnerName");
      expect(firstLearner).toHaveProperty("emailId");
      expect(firstLearner).toHaveProperty("location");
      expect(firstLearner).toHaveProperty("status");
      expect(firstLearner).toHaveProperty("currentEnrollment");

      // Verify data types
      expect(typeof firstLearner.learner_Data_Id).toBe("number");
      expect(typeof firstLearner.learnerId).toBe("string");
      expect(typeof firstLearner.learnerName).toBe("string");
      expect(typeof firstLearner.emailId).toBe("string");
      expect(["Active", "Inactive"]).toContain(firstLearner.status);
    });

    it("should fall back to Students.json when API fails", async () => {
      // Mock: Network error
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const roster = await legacyApi.getRoster();

      // Assert: Should return fallback data from Students.json
      expect(Array.isArray(roster)).toBe(true);
      expect(roster.length).toBeGreaterThan(0);

      // Verify fallback data has correct structure
      const firstStudent = roster[0];
      expect(firstStudent).toHaveProperty("learner_Data_Id");
      expect(firstStudent).toHaveProperty("learnerId");
      expect(firstStudent).toHaveProperty("learnerName");
    });

    it("should return empty array when API returns empty result and no fallback", async () => {
      // Mock: API returns empty result array
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ result: [] }),
      });

      const roster = await legacyApi.getRoster();

      // Assert: Should return empty array (no fallback triggered for empty but successful response)
      expect(Array.isArray(roster)).toBe(true);
      // Note: getRoster doesn't have the same "Data Guarantee" pattern as getInventory
      // It returns whatever the API returns (empty array is valid)
    });

    it("should handle learners with null currentEnrollment", async () => {
      const mockLearners: LearnerProfile[] = [
        {
          learner_Data_Id: 1513,
          learnerId: "test-guid",
          learnerName: "Test User",
          emailId: "test@example.com",
          location: "Test Location",
          status: "Active",
          currentEnrollment: null,
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ result: mockLearners }),
      });

      const roster = await legacyApi.getRoster();

      expect(roster[0].currentEnrollment).toBeNull();
    });
  });

  describe("Scenario C: Course Catalog Data Fetching", () => {
    it("should fetch course catalog from API successfully", async () => {
      const mockCourses = [
        {
          courseId: 11,
          courseTitle: "Haas CNC Maintenance",
          levelName: "Basic",
          trainingTypeName: "ILT",
          totalDays: 5,
          hours: null,
          previewImageUrl: null,
          prices: [{ isFree: false, price: 2500, currency: "USD" }],
          skills: [{ skillName: "CNC" }],
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ result: mockCourses }),
      });

      const catalog = await legacyApi.getCatalog();

      expect(Array.isArray(catalog)).toBe(true);
      expect(catalog.length).toBeGreaterThan(0);
      expect(catalog[0]).toHaveProperty("courseId");
      expect(catalog[0]).toHaveProperty("courseTitle");
      expect(catalog[0]).toHaveProperty("trainingTypeName");
    });

    it("should fall back to Courses.json when API fails", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const catalog = await legacyApi.getCatalog();

      expect(Array.isArray(catalog)).toBe(true);
      expect(catalog.length).toBeGreaterThan(0);
    });
  });

  describe("Data Guarantee Pattern Verification", () => {
    it("should log warning when using fallback for empty inventory", async () => {
      const consoleWarnSpy = vi.spyOn(console, "warn");

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ result: [] }),
      });

      await legacyApi.getInventory(11);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining("Real API returned no classes for course 11"),
      );

      consoleWarnSpy.mockRestore();
    });

    it("should log warning when API network fails", async () => {
      const consoleWarnSpy = vi.spyOn(console, "warn");

      mockFetch.mockRejectedValueOnce(new Error("Connection refused"));

      await legacyApi.getInventory(11);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining("Legacy API failed (network error)"),
        expect.any(Error),
      );

      consoleWarnSpy.mockRestore();
    });
  });
});
