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
import { Skeleton } from "./ui/skeleton";

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
    isLoading,
    addCourse,
    removeCourse,
    reorderCourses,
    updateTitle,
    updateDescription,
    toggleFilter,
    setSearch,
    saveDraft,
    saveProgram,
  } = useProgramBuilder();

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      reorderCourses(active.id as string, over.id as string);
    }
  };

  // Calculate total duration from selected courses
  const calculateTotalDuration = () => {
    let totalDays = 0;
    let totalHours = 0;

    selectedCourses.forEach((course) => {
      if (course.trainingTypeName === "ILT") {
        totalDays += course.totalDays || 0;
      } else if (course.trainingTypeName === "eLearning") {
        totalHours += course.hours || 0;
      }
    });

    const parts: string[] = [];
    if (totalDays > 0) {
      parts.push(`${totalDays} day${totalDays !== 1 ? "s" : ""}`);
    }
    if (totalHours > 0) {
      parts.push(`${totalHours} hour${totalHours !== 1 ? "s" : ""}`);
    }

    return parts.length > 0 ? parts.join(" + ") : "0 hours";
  };

  return (
    <div className="flex flex-col h-full">
      {/* Page Header */}
      <div className="text-4xl font-bold text-black mb-6">Create Custom Program</div>

      {/* Two Column Layout */}
      <div className="flex flex-1 gap-4 min-h-0">
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

                          // "bg-orange-500! text-gray-950! px-6 py-3 rounded hover:bg-orange-400! hover:ring-1 hover:ring-slate-600 mx-auto font-medium"
                        >
                          <div className="flex-1">
                            <h3 className="font-medium text-slate-900">
                              {course.courseTitle}
                            </h3>
                            <p className="text-sm text-slate-600">
                              {course.trainingTypeName} • {course.levelName}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-slate-500 font-mono">
                              #{course.courseId}
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

          {/* Footer - Sticky with Duration Stats */}
          <div className="p-4 border-t border-slate-300 bg-white space-y-2">
            {selectedCourses.length > 0 && (
              <div className="text-sm text-slate-600">
                <span className="font-semibold">Total Duration:</span>{" "}
                {calculateTotalDuration()}
              </div>
            )}
            <button
              onClick={saveDraft}
              className="bg-gray-100! text-black border-2 border-slate-300 outline outline-gray px-4 py-2 rounded hover:bg-slate-50! hover:border-slate-400 font-medium"
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
              disabled={isLoading}
              className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-phillips-blue disabled:bg-slate-100 disabled:cursor-not-allowed"
            />
            <div className="flex gap-2">
              {(["Self-Paced", "ILT", "Advanced"] as FilterKey[]).map((filterKey) => (
                <button
                  key={filterKey}
                  onClick={() => toggleFilter(filterKey)}
                  disabled={isLoading}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    activeFilters[filterKey]
                      ? "bg-gray-100! text-slate-900! outline border-2 border-slate-300 font-bold shadow-sm"
                      : "bg-white text-black outline border-2 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {filterKey}
                </button>
              ))}
            </div>
          </div>

          {/* Body - Scrollable */}
          <div className="flex-1 overflow-y-auto p-4">
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : (
              <div className="space-y-2">
                {filteredCourses.map((course) => (
                  <div
                    key={course.id}
                    onClick={() => setActiveCourse(course)}
                    className="flex items-center justify-between p-3 border border-slate-200 rounded hover:bg-slate-50 cursor-pointer"
                  >
                    <div className="flex-1">
                      <h3 className="font-medium text-slate-900">{course.courseTitle}</h3>
                      <p className="text-xs text-slate-500">
                        {course.trainingTypeName} • {course.levelName}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-slate-500 font-mono">
                        #{course.courseId}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          addCourse(course);
                        }}
                        className="px-3 py-1 bg-orange-50! text-black outline hover:bg-orange-300! hover:ring-1 outline-gray-400! text-sm rounded"
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
            )}
          </div>
        </div>

        <CourseDetailModal
          course={activeCourse}
          isOpen={!!activeCourse}
          onClose={() => setActiveCourse(null)}
        />
      </div>
    </div>
  );
}
