import { useState, useEffect } from "react";
import { arrayMove } from "@dnd-kit/sortable";
import { getCatalog } from "@/api/legacyRoutes";
import { localApi } from "@/api/localRoutes";
import type { CourseCatalogItem, SupervisorProgram } from "@/types/models";
import { toast } from "sonner";

// Rich UI Course Model (extends CourseCatalogItem with local ID)
export interface Course extends CourseCatalogItem {
  id: string; // String ID for dnd-kit compatibility
}

type FilterKey = "Self-Paced" | "ILT" | "Advanced";

export function useProgramBuilder() {
  const [programTitle, setProgramTitle] = useState("My Program");
  const [programDescription, setProgramDescription] = useState("");
  const [selectedCourses, setSelectedCourses] = useState<Course[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<FilterKey, boolean>>({
    "Self-Paced": false,
    ILT: false,
    Advanced: false,
  });

  // NEW: Loading state and available courses from API
  const [isLoading, setIsLoading] = useState(true);
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);

  // Fetch courses from Legacy API on mount
  useEffect(() => {
    async function loadCatalog() {
      setIsLoading(true);
      try {
        const catalogItems = await getCatalog();

        // Transform CourseCatalogItem[] to Course[] (add string ID for dnd-kit)
        const courses: Course[] = catalogItems.map((item) => ({
          ...item,
          id: String(item.courseId), // Convert numeric ID to string for dnd-kit
        }));

        setAvailableCourses(courses);
      } catch (error) {
        console.error("Failed to load course catalog:", error);
        toast.error("Failed to load course catalog");
      } finally {
        setIsLoading(false);
      }
    }

    loadCatalog();
  }, []);

  // Filtering logic
  const filteredCourses = availableCourses.filter((course) => {
    // Search filter
    const matchesSearch = course.courseTitle
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    // Type filters (Self-Paced or ILT)
    const typeFiltersActive = activeFilters["Self-Paced"] || activeFilters["ILT"];
    const matchesType =
      !typeFiltersActive ||
      (activeFilters["Self-Paced"] && course.trainingTypeName === "eLearning") ||
      (activeFilters["ILT"] && course.trainingTypeName === "ILT");

    // Level filter (Advanced)
    const matchesLevel = !activeFilters["Advanced"] || course.levelName === "Advanced";

    return matchesSearch && matchesType && matchesLevel;
  });

  // Actions
  const addCourse = (course: Course) => {
    // Prevent duplicates
    if (!selectedCourses.find((c) => c.id === course.id)) {
      setSelectedCourses((prev) => [...prev, course]);
    }
  };

  const removeCourse = (courseId: string) => {
    setSelectedCourses((prev) => prev.filter((c) => c.id !== courseId));
  };

  const reorderCourses = (activeId: string, overId: string) => {
    setSelectedCourses((courses) => {
      const oldIndex = courses.findIndex((c) => c.id === activeId);
      const newIndex = courses.findIndex((c) => c.id === overId);
      return arrayMove(courses, oldIndex, newIndex);
    });
  };

  const updateTitle = (newTitle: string) => {
    setProgramTitle(newTitle);
  };

  const updateDescription = (text: string) => {
    setProgramDescription(text);
  };

  const toggleFilter = (filterType: FilterKey) => {
    setActiveFilters((prev) => ({ ...prev, [filterType]: !prev[filterType] }));
  };

  const setSearch = (term: string) => {
    setSearchQuery(term);
  };

  const saveDraft = async () => {
    // Validation
    if (!programTitle.trim()) {
      toast.error("Program title is required");
      return;
    }

    if (selectedCourses.length === 0) {
      toast.error("Please add at least one course");
      return;
    }

    try {
      toast.loading("Saving program...");

      // Transform UI state (Rich Objects) to Lightweight Payload (IDs only)
      const payload: SupervisorProgram = {
        id: crypto.randomUUID(), // Generate UUID
        supervisorId: "pat_mann_guid", // Hardcoded for POC
        programName: programTitle,
        description: programDescription,
        tags: [], // TODO: Add tag functionality later
        courseSequence: selectedCourses.map((course) => course.courseId), // Extract numeric IDs
        published: false,
        createdAt: new Date().toISOString(),
      };

      // Save to json-server
      await localApi.saveProgram(payload);

      toast.dismiss();
      toast.success(`Program "${programTitle}" saved successfully!`);
    } catch (error) {
      toast.dismiss();
      toast.error("Failed to save program");
      console.error("Save error:", error);
    }
  };

  return {
    // State
    programTitle,
    programDescription,
    selectedCourses,
    searchQuery,
    activeFilters,
    filteredCourses,
    isLoading,
    availableCourses,

    // Actions
    addCourse,
    removeCourse,
    reorderCourses,
    updateTitle,
    updateDescription,
    toggleFilter,
    setSearch,
    saveDraft,
  };
}
