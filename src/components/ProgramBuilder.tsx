import { useState } from "react";
import { useProgramBuilder, Course } from "../hooks/useProgramBuilder";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { SortableCourseItem } from "./SortableCourseItem";
import { CourseDetailModal } from "./common/CourseDetailModal";

type FilterKey = "Self-Paced" | "ILT" | "Advanced";

export function ProgramBuilder() {
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const {
    programTitle,
    programDescription,
    selectedCourses,
    searchQuery,
    activeFilters,
    filteredCourses,
    addCourse,
    removeCourse,
    reorderCourses,
    updateTitle,
    updateDescription,
    toggleFilter,
    setSearch,
    saveDraft,
  } = useProgramBuilder();

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      reorderCourses(active.id as string, over.id as string);
    }
  };

  return (
    <div className="flex h-full gap-4">
      {/* Left Column - My Program (60%) */}
      <div className="flex-[0.6] flex flex-col border border-slate-300 rounded-lg">
        {/* Header */}
        <div className="p-4 border-b border-slate-300 space-y-2">
          <input
            type="text"
            value={programTitle}
            onChange={(e) => updateTitle(e.target.value)}
            placeholder="My Program (Click to rename...)"
            className="w-full text-xl font-semibold bg-transparent border-none outline-none focus:ring-0"
          />
          <textarea
            value={programDescription}
            onChange={(e) => updateDescription(e.target.value)}
            placeholder="Add a description for this program..."
            rows={2}
            className="w-full p-2 text-sm text-slate-600 bg-transparent resize-none outline-none placeholder:text-slate-400"
          />
        </div>

        {/* Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4">
          {selectedCourses.length === 0 ? (
            <div className="flex items-center justify-center h-full text-slate-400 text-lg">
              Insert Courses Here...
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={selectedCourses.map((c) => c.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {selectedCourses.map((course) => (
                    <SortableCourseItem key={course.id} id={course.id}>
                      <div
                        onClick={() => setActiveCourse(course)}
                        className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 cursor-pointer"
                      >
                        <div className="flex-1">
                          <h3 className="font-medium text-slate-900">{course.title}</h3>
                          <p className="text-sm text-slate-600">
                            {course.type} • {course.level}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-slate-500 font-mono">
                            {course.code}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeCourse(course.id);
                            }}
                            className="px-2 py-1 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded"
                            title="Remove course"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    </SortableCourseItem>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>

        {/* Footer - Sticky */}
        <div className="p-4 border-t border-slate-300 bg-white">
          <button
            onClick={saveDraft}
            className="bg-phillips-blue text-white px-6 py-2 rounded hover:bg-blue-700"
          >
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
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-phillips-blue"
          />
          <div className="flex gap-2">
            {(["Self-Paced", "ILT", "Advanced"] as FilterKey[]).map((filterKey) => (
              <button
                key={filterKey}
                onClick={() => toggleFilter(filterKey)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  activeFilters[filterKey]
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
                onClick={() => setActiveCourse(course)}
                className="flex items-center justify-between p-3 border border-slate-200 rounded hover:bg-slate-50 cursor-pointer"
              >
                <div className="flex-1">
                  <h3 className="font-medium text-slate-900">{course.title}</h3>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-500 font-mono">{course.code}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      addCourse(course);
                    }}
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

      <CourseDetailModal
        course={activeCourse}
        isOpen={!!activeCourse}
        onClose={() => setActiveCourse(null)}
      />
    </div>
  );
}
