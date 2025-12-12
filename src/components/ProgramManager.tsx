import { useState, useEffect } from "react";
import { localApi } from "@/api/localRoutes";
import { legacyApi } from "@/api/legacyRoutes";
import type { SupervisorProgram, CourseCatalogItem } from "@/types/models";
import { Skeleton } from "./ui/skeleton";
import { RosterList } from "./RosterList";
import { CourseDetailModal } from "./common/CourseDetailModal";
import { toast } from "sonner";

interface ProgramManagerProps {
  programId: string;
}

interface HydratedCourse extends CourseCatalogItem {
  id: string; // String ID for React keys
}

interface Course extends CourseCatalogItem {
  id: string;
}

export function ProgramManager({ programId }: ProgramManagerProps) {
  const [program, setProgram] = useState<SupervisorProgram | null>(null);
  const [hydratedCourses, setHydratedCourses] = useState<HydratedCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);

  useEffect(() => {
    async function loadProgramData() {
      setIsLoading(true);
      try {
        // Fetch program and catalog in parallel
        const [fetchedProgram, catalog] = await Promise.all([
          localApi.getProgramById(programId),
          legacyApi.getCatalog(),
        ]);

        setProgram(fetchedProgram);

        // Hydrate: Match course IDs to full course objects
        const hydrated: HydratedCourse[] = fetchedProgram.courseSequence
          .map((courseId) => {
            const fullCourse = catalog.find((c) => c.courseId === courseId);
            if (!fullCourse) {
              console.warn(`Course ID ${courseId} not found in catalog`);
              return null;
            }
            return {
              ...fullCourse,
              id: String(courseId), // Add string ID for React keys
            };
          })
          .filter((course): course is HydratedCourse => course !== null);

        setHydratedCourses(hydrated);
      } catch (error) {
        console.error("Failed to load program data:", error);
        toast.error("Failed to load program");
      } finally {
        setIsLoading(false);
      }
    }

    loadProgramData();
  }, [programId]);

  // Calculate total duration
  const calculateTotalDuration = () => {
    let totalDays = 0;
    let totalHours = 0;

    hydratedCourses.forEach((course) => {
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

  // Publish program function
  const handlePublishProgram = async () => {
    if (!program) return;

    try {
      toast.loading("Publishing program...");

      await localApi.updateProgram(programId, { published: true });

      // Update local state
      setProgram({ ...program, published: true });

      toast.dismiss();
      toast.success(`Program "${program.programName}" published successfully!`);
    } catch (error) {
      toast.dismiss();
      toast.error("Failed to publish program");
      console.error("Publish error:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full p-8 space-y-4">
        <Skeleton className="h-12 w-1/3" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!program) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-slate-500">Program not found</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-6 p-8">
      {/* Program Header */}
      <div className="space-y-2">
        <div className="text-3xl font-bold text-black">{program.programName}</div>
        {program.description && <p className="text-slate-600">{program.description}</p>}
        {program.tags.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-500">
              Tags included in Program:
            </span>
            {program.tags.map((tag, idx) => (
              <span
                key={idx}
                className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Split View: Course List + Roster */}
      <div className="flex-1 flex gap-6 min-h-0">
        {/* Left Column: Course Sequence */}
        <div className="flex-[0.5] flex flex-col border border-slate-300 rounded-lg overflow-hidden">
          <div className="p-4 border-b border-slate-300 bg-slate-50">
            <h2 className="text-lg font-semibold">Course Sequence</h2>
            <p className="text-sm text-slate-600">
              {hydratedCourses.length} course{hydratedCourses.length !== 1 ? "s" : ""} •{" "}
              {calculateTotalDuration()}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {hydratedCourses.length === 0 ? (
              <div className="flex items-center justify-center h-full text-slate-400">
                No courses in this program
              </div>
            ) : (
              <div className="space-y-2">
                {hydratedCourses.map((course, index) => (
                  <div
                    key={course.id}
                    onClick={() => setActiveCourse(course)}
                    className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded cursor-pointer hover:bg-slate-50 transition-colors"
                  >
                    {/* Sequence Number */}
                    <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-phillips-blue text-white rounded-full text-sm font-bold">
                      {index + 1}
                    </div>

                    {/* Course Info */}
                    <div className="flex-1">
                      <h3 className="font-medium text-slate-900">{course.courseTitle}</h3>
                      <p className="text-sm text-slate-600">
                        {course.trainingTypeName} • {course.levelName}
                        {course.trainingTypeName === "ILT"
                          ? ` • ${course.totalDays} day${course.totalDays !== 1 ? "s" : ""}`
                          : course.hours
                            ? ` • ${course.hours} hour${course.hours !== 1 ? "s" : ""}`
                            : " • Self-paced"}
                      </p>
                    </div>

                    {/* Course ID */}
                    <span className="text-sm text-slate-500 font-mono">
                      #{course.courseId}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Student Roster */}
        <div className="flex-[0.5] flex flex-col border border-slate-300 rounded-lg overflow-hidden">
          <RosterList
            programId={programId}
            firstCourseId={hydratedCourses[0]?.courseId}
          />
        </div>
      </div>

      {/* Publish Program Button - Bottom Center (always visible for demo) */}
      <div className="flex justify-center items-center gap-4 pt-4">
        <button
          onClick={handlePublishProgram}
          className="px-8 py-3 bg-gray-100! text-black border-2 border-slate-300 outline rounded hover:bg-slate-50! transition-all"
        >
          Publish Program
        </button>
        {program.published && (
          <span className="px-4 py-2 bg-green-100 text-green-800 font-semibold rounded-lg">
            ✓ Published
          </span>
        )}
      </div>

      {/* Course Detail Modal */}
      <CourseDetailModal
        course={activeCourse}
        isOpen={!!activeCourse}
        onClose={() => setActiveCourse(null)}
      />
    </div>
  );
}
