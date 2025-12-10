import { useState } from "react";
import { arrayMove } from "@dnd-kit/sortable";

export interface Course {
  id: string;
  title: string;
  code: string;
  type: "ILT" | "Self-Paced";
  level: "Basic" | "Advanced";
}

export const MOCK_COURSES: Course[] = [
  {
    id: "1",
    title: "Haas CNC Mill Certification",
    code: "C101",
    type: "ILT",
    level: "Basic",
  },
  {
    id: "2",
    title: "Advanced Haas Mill Programming",
    code: "C102",
    type: "ILT",
    level: "Advanced",
  },
  {
    id: "3",
    title: "CNC Safety Fundamentals",
    code: "C201",
    type: "Self-Paced",
    level: "Basic",
  },
  {
    id: "4",
    title: "Precision Measurement Techniques",
    code: "C301",
    type: "ILT",
    level: "Advanced",
  },
  {
    id: "5",
    title: "Shop Floor Leadership",
    code: "C401",
    type: "Self-Paced",
    level: "Advanced",
  },
  {
    id: "6",
    title: "Machine Maintenance Basics",
    code: "C501",
    type: "Self-Paced",
    level: "Basic",
  },
];

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

  // Filtering logic
  const filteredCourses = MOCK_COURSES.filter((course) => {
    // Search filter
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase());

    // Type filters (Self-Paced or ILT)
    const typeFiltersActive = activeFilters["Self-Paced"] || activeFilters["ILT"];
    const matchesType =
      !typeFiltersActive ||
      (activeFilters["Self-Paced"] && course.type === "Self-Paced") ||
      (activeFilters["ILT"] && course.type === "ILT");

    // Level filter (Advanced)
    const matchesLevel = !activeFilters["Advanced"] || course.level === "Advanced";

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

  const saveDraft = () => {
    console.log("Saving draft:", {
      title: programTitle,
      courses: selectedCourses,
    });
    alert(`Draft saved: "${programTitle}" with ${selectedCourses.length} courses`);
  };

  return {
    // State
    programTitle,
    programDescription,
    selectedCourses,
    searchQuery,
    activeFilters,
    filteredCourses,

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
