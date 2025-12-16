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
import { CourseCard } from "./common/CourseCard";
import { Skeleton } from "./ui/skeleton";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";

type FilterKey = "Self-Paced" | "ILT" | "Advanced";

interface ProgramBuilderProps {
  onProgramSaved?: () => void;
}

export function ProgramBuilder({ onProgramSaved }: ProgramBuilderProps) {
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
            <Input
              type="text"
              value={programTitle}
              onChange={(e) => updateTitle(e.target.value)}
              placeholder="My Program (Click to rename...)"
              className="text-xl font-semibold border-none shadow-none focus-visible:ring-0 px-0"
            />
            <Textarea
              value={programDescription}
              onChange={(e) => updateDescription(e.target.value)}
              placeholder="Add a description for this program..."
              rows={2}
              className="text-sm resize-none border-none shadow-none focus-visible:ring-0 px-0"
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
                  <div className="space-y-3">
                    {selectedCourses.map((course) => (
                      <SortableCourseItem key={course.id} id={course.id}>
                        <CourseCard
                          course={course}
                          action="remove"
                          onAction={() => removeCourse(course.id)}
                          onClick={() => setActiveCourse(course)}
                        />
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
            <Button
              onClick={async () => {
                await saveDraft();
                // Notify parent that a program was saved
                onProgramSaved?.();
              }}
              variant="outline"
              size="sm"
              className="w-full"
            >
              Save Draft
            </Button>
          </div>
        </div>

        {/* Right Column - Course Catalog (40%) */}
        <div className="flex-[0.4] flex flex-col border border-slate-300 rounded-lg">
          {/* Header */}
          <div className="p-4 border-b border-slate-300 space-y-3">
            <h2 className="text-xl font-semibold">Course Catalog</h2>
            <Input
              type="text"
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearch(e.target.value)}
              disabled={isLoading}
            />
            <div className="flex gap-2">
              {(["Self-Paced", "ILT", "Advanced"] as FilterKey[]).map((filterKey) => (
                <Button
                  key={filterKey}
                  onClick={() => toggleFilter(filterKey)}
                  disabled={isLoading}
                  variant={activeFilters[filterKey] ? "secondary" : "ghost"}
                  size="sm"
                  className="flex-1"
                >
                  {filterKey}
                </Button>
              ))}
            </div>
          </div>

          {/* Body - Scrollable */}
          <ScrollArea className="flex-1">
            <div className="p-4">
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-48 w-full" />
                  <Skeleton className="h-48 w-full" />
                  <Skeleton className="h-48 w-full" />
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredCourses.map((course) => (
                    <CourseCard
                      key={course.id}
                      course={course}
                      action="add"
                      onAction={() => addCourse(course)}
                      onClick={() => setActiveCourse(course)}
                    />
                  ))}
                  {filteredCourses.length === 0 && (
                    <div className="flex items-center justify-center h-full text-slate-400 text-sm py-8">
                      No courses found
                    </div>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>
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
