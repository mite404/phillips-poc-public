import { useState } from "react";

interface Course {
  id: string;
  title: string;
  code: string;
  type: "ILT" | "Self-Paced";
  level: "Basic" | "Advanced";
}

const MOCK_COURSES: Course[] = [
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

export function ProgramBuilder() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Record<FilterKey, boolean>>({
    "Self-Paced": false,
    ILT: false,
    Advanced: false,
  });

  const toggleFilter = (key: FilterKey) => {
    setFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const filteredCourses = MOCK_COURSES.filter((course) => {
    // Search filter
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase());

    // Type filters (Self-Paced or ILT)
    const typeFiltersActive = filters["Self-Paced"] || filters["ILT"];
    const matchesType =
      !typeFiltersActive ||
      (filters["Self-Paced"] && course.type === "Self-Paced") ||
      (filters["ILT"] && course.type === "ILT");

    // Level filter (Advanced)
    const matchesLevel = !filters["Advanced"] || course.level === "Advanced";

    return matchesSearch && matchesType && matchesLevel;
  });

  return (
    <div className="flex h-full gap-4">
      {/* Left Column - My Program (60%) */}
      <div className="flex-[0.6] flex flex-col border border-slate-300 rounded-lg">
        {/* Header */}
        <div className="p-4 border-b border-slate-300">
          <input
            type="text"
            placeholder="My Program (Click to rename...)"
            className="w-full text-xl font-semibold bg-transparent border-none outline-none focus:ring-0"
          />
        </div>

        {/* Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex items-center justify-center h-full text-slate-400 text-lg">
            Insert Courses Here...
          </div>
        </div>

        {/* Footer - Sticky */}
        <div className="p-4 border-t border-slate-300 bg-white">
          <button className="bg-phillips-blue text-white px-6 py-2 rounded hover:bg-blue-700">
            Save Draft
          </button>
        </div>
      </div>

      {/* Right Column - Course Catalog (40%) */}
      <div className="flex-[0.4] flex flex-col border border-slate-300 rounded-lg">
        {/* Header */}
        <div className="p-4 border-b border-slate-300 space-y-3">
          <h2 className="text-xl font-semibold">Course Catalog</h2>
          <input
            type="text"
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-phillips-blue"
          />
          <div className="flex gap-2">
            {(["Self-Paced", "ILT", "Advanced"] as FilterKey[]).map((filterKey) => (
              <button
                key={filterKey}
                onClick={() => toggleFilter(filterKey)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  filters[filterKey]
                    ? "bg-phillips-blue text-white"
                    : "border border-slate-300 text-slate-700 hover:bg-slate-50"
                }`}
              >
                {filterKey}
              </button>
            ))}
          </div>
        </div>

        {/* Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {filteredCourses.map((course) => (
              <div
                key={course.id}
                className="flex items-center justify-between p-3 border border-slate-200 rounded hover:bg-slate-50"
              >
                <div className="flex-1">
                  <h3 className="font-medium text-slate-900">{course.title}</h3>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-500 font-mono">{course.code}</span>
                  <button
                    onClick={() => console.log("Add course:", course)}
                    className="px-3 py-1 bg-phillips-blue text-white text-sm rounded hover:bg-blue-700"
                  >
                    Add
                  </button>
                </div>
              </div>
            ))}
            {filteredCourses.length === 0 && (
              <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                No courses found
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
