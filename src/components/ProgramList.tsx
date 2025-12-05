import { useState, useEffect } from "react";
import { ProgramCard } from "./ProgramCard";
import { LegacyProgram } from "@/types/models";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export function ProgramList() {
  const [programs, setPrograms] = useState<LegacyProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Define the async fetch function inside useEffect
    const fetchPrograms = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          "https://phillipsx-pims-stage.azurewebsites.net/api/Program/GetAll",
        );

        if (!response.ok) {
          throw new Error(`Error: ${response.statusText}`);
        }

        const data = await response.json();

        // Safety check: ensure result exists and is an array
        if (data.result && Array.isArray(data.result)) {
          // Filter for active programs as requested
          const activePrograms = data.result.filter((p: LegacyProgram) => p.active);
          setPrograms(activePrograms);
        } else {
          setPrograms([]); // Handle empty or malformed data gracefully
        }
      } catch (err) {
        console.error("Failed to fetch programs:", err);
        setError("Could not load programs.");
        toast.error("Failed to load program list from legacy API.");
      } finally {
        setLoading(false);
      }
    };

    fetchPrograms();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-48 w-full rounded-lg" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-10 text-center text-red-500 bg-red-50 rounded-lg mx-6 border border-red-200">
        <p>{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 text-sm underline hover:text-red-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Existing Programs</h2>
        <p className="text-slate-500">Select a base program or create a new one.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {programs.map((program) => (
          <ProgramCard
            key={program.programId}
            title={program.programName}
            level={program.levelName}
            duration={`${program.totalDays} days`}
            skills={program.skills ? program.skills.map((s) => s.skillName) : []}
            courseCount={program.courses ? program.courses.length : 0}
            image={program.previewImageUrl}
            isFree={program.prices?.some((p) => p.isFree) ?? false}
            onView={() => console.log(`Clicked program ${program.programId}`)}
          />
        ))}
      </div>
    </div>
  );
}
