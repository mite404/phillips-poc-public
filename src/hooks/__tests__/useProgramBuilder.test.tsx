import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useProgramBuilder } from "../useProgramBuilder";
import type { CourseCatalogItem } from "@/types/models";

// Mock the API modules
vi.mock("@/api/legacyRoutes", () => ({
  getCatalog: vi.fn(),
}));

vi.mock("@/api/localRoutes", () => ({
  localApi: {
    saveProgram: vi.fn(),
  },
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
  },
}));

// Import mocked modules
import { getCatalog } from "@/api/legacyRoutes";
import { localApi } from "@/api/localRoutes";
import { toast } from "sonner";

// Mock course data
const mockCourses: CourseCatalogItem[] = [
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
  {
    courseId: 116,
    courseTitle: "Advanced Mill Programming",
    levelName: "Advanced",
    trainingTypeName: "ILT",
    totalDays: 2,
    hours: null,
    previewImageUrl: null,
    prices: [{ isFree: false, price: 1500, currency: "USD" }],
    skills: [{ skillName: "Programming" }],
  },
  {
    courseId: 9,
    courseTitle: "Safety Fundamentals",
    levelName: "Basic",
    trainingTypeName: "eLearning",
    totalDays: 0,
    hours: 8,
    previewImageUrl: null,
    prices: [{ isFree: true }],
    skills: [{ skillName: "Safety" }],
  },
];

describe("useProgramBuilder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock: successful catalog fetch
    (getCatalog as any).mockResolvedValue(mockCourses);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Initialization", () => {
    it("should load courses on mount", async () => {
      const { result } = renderHook(() => useProgramBuilder());

      // Initially loading
      expect(result.current.isLoading).toBe(true);
      expect(result.current.availableCourses).toHaveLength(0);

      // Wait for courses to load
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Verify courses are loaded and transformed
      expect(result.current.availableCourses).toHaveLength(3);
      expect(result.current.availableCourses[0].id).toBe("11"); // Numeric ID converted to string
      expect(getCatalog).toHaveBeenCalledTimes(1);
    });

    it("should handle API errors gracefully", async () => {
      (getCatalog as any).mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(() => useProgramBuilder());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.availableCourses).toHaveLength(0);
      expect(toast.error).toHaveBeenCalledWith("Failed to load course catalog");
    });
  });

  describe("Course Selection", () => {
    it("should add a course to selectedCourses", async () => {
      const { result } = renderHook(() => useProgramBuilder());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const courseToAdd = result.current.availableCourses[0];

      act(() => {
        result.current.addCourse(courseToAdd);
      });

      expect(result.current.selectedCourses).toHaveLength(1);
      expect(result.current.selectedCourses[0].courseId).toBe(11);
    });

    it("should prevent duplicate courses from being added", async () => {
      const { result } = renderHook(() => useProgramBuilder());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const courseToAdd = result.current.availableCourses[0];

      act(() => {
        result.current.addCourse(courseToAdd);
      });

      // Wait for state to update
      await waitFor(() => {
        expect(result.current.selectedCourses).toHaveLength(1);
      });

      act(() => {
        result.current.addCourse(courseToAdd); // Try to add same course again
      });

      expect(result.current.selectedCourses).toHaveLength(1);
    });

    it("should remove a course from selectedCourses", async () => {
      const { result } = renderHook(() => useProgramBuilder());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const courseToAdd = result.current.availableCourses[0];

      act(() => {
        result.current.addCourse(courseToAdd);
      });

      expect(result.current.selectedCourses).toHaveLength(1);

      act(() => {
        result.current.removeCourse(courseToAdd.id);
      });

      expect(result.current.selectedCourses).toHaveLength(0);
    });
  });

  describe("Duration Calculations", () => {
    it("should calculate total days for ILT courses correctly", async () => {
      const { result } = renderHook(() => useProgramBuilder());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Add two ILT courses (5 days + 2 days = 7 days)
      const course1 = result.current.availableCourses.find((c) => c.courseId === 11)!;
      const course2 = result.current.availableCourses.find((c) => c.courseId === 116)!;

      act(() => {
        result.current.addCourse(course1);
        result.current.addCourse(course2);
      });

      const totalDays = result.current.selectedCourses.reduce(
        (sum, course) => sum + (course.trainingTypeName === "ILT" ? course.totalDays : 0),
        0,
      );

      expect(totalDays).toBe(7);
    });

    it("should calculate total hours for eLearning courses correctly", async () => {
      const { result } = renderHook(() => useProgramBuilder());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Add eLearning course (8 hours)
      const eLearningCourse = result.current.availableCourses.find(
        (c) => c.courseId === 9,
      )!;

      act(() => {
        result.current.addCourse(eLearningCourse);
      });

      const totalHours = result.current.selectedCourses.reduce(
        (sum, course) =>
          sum + (course.trainingTypeName === "eLearning" ? course.hours || 0 : 0),
        0,
      );

      expect(totalHours).toBe(8);
    });
  });

  describe("Search and Filtering", () => {
    it("should filter courses by search query (case-insensitive)", async () => {
      const { result } = renderHook(() => useProgramBuilder());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.setSearch("haas");
      });

      expect(result.current.filteredCourses).toHaveLength(1);
      expect(result.current.filteredCourses[0].courseTitle).toBe("Haas CNC Maintenance");
    });

    it("should filter courses by training type (ILT)", async () => {
      const { result } = renderHook(() => useProgramBuilder());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.toggleFilter("ILT");
      });

      expect(result.current.filteredCourses).toHaveLength(2);
      expect(
        result.current.filteredCourses.every((c) => c.trainingTypeName === "ILT"),
      ).toBe(true);
    });

    it("should filter courses by training type (Self-Paced/eLearning)", async () => {
      const { result } = renderHook(() => useProgramBuilder());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.toggleFilter("Self-Paced");
      });

      expect(result.current.filteredCourses).toHaveLength(1);
      expect(result.current.filteredCourses[0].trainingTypeName).toBe("eLearning");
    });

    it("should filter courses by level (Advanced)", async () => {
      const { result } = renderHook(() => useProgramBuilder());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.toggleFilter("Advanced");
      });

      expect(result.current.filteredCourses).toHaveLength(1);
      expect(result.current.filteredCourses[0].levelName).toBe("Advanced");
    });

    it("should combine search and filters", async () => {
      const { result } = renderHook(() => useProgramBuilder());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.setSearch("programming");
        result.current.toggleFilter("Advanced");
      });

      expect(result.current.filteredCourses).toHaveLength(1);
      expect(result.current.filteredCourses[0].courseTitle).toBe(
        "Advanced Mill Programming",
      );
    });
  });

  describe("Program Save Validation", () => {
    it("should validate program title is required", async () => {
      const { result } = renderHook(() => useProgramBuilder());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.updateTitle("");
      });

      await act(async () => {
        await result.current.saveDraft();
      });

      expect(toast.error).toHaveBeenCalledWith("Program title is required");
      expect(localApi.saveProgram).not.toHaveBeenCalled();
    });

    it("should validate at least one course is required", async () => {
      const { result } = renderHook(() => useProgramBuilder());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.saveDraft();
      });

      expect(toast.error).toHaveBeenCalledWith("Please add at least one course");
      expect(localApi.saveProgram).not.toHaveBeenCalled();
    });

    it("should successfully save program with valid data", async () => {
      (localApi.saveProgram as any).mockResolvedValue(undefined);

      const { result } = renderHook(() => useProgramBuilder());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const course = result.current.availableCourses[0];

      act(() => {
        result.current.addCourse(course);
        result.current.updateTitle("My Test Program");
        result.current.updateDescription("Test description");
      });

      await act(async () => {
        await result.current.saveDraft();
      });

      expect(localApi.saveProgram).toHaveBeenCalledTimes(1);
      expect(localApi.saveProgram).toHaveBeenCalledWith(
        expect.objectContaining({
          programName: "My Test Program",
          description: "Test description",
          courseSequence: [11], // Only numeric IDs
          published: false,
        }),
      );
      expect(toast.success).toHaveBeenCalledWith(
        'Program "My Test Program" saved successfully!',
      );
    });
  });

  describe("Program State Management", () => {
    it("should update program title", async () => {
      const { result } = renderHook(() => useProgramBuilder());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.updateTitle("New Title");
      });

      expect(result.current.programTitle).toBe("New Title");
    });

    it("should update program description", async () => {
      const { result } = renderHook(() => useProgramBuilder());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.updateDescription("New Description");
      });

      expect(result.current.programDescription).toBe("New Description");
    });
  });
});
