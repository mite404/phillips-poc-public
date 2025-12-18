import { Button } from "./ui/button";
import { ProgramBuilder } from "./ProgramBuilder";
import { ProgramManager } from "./ProgramManager";
import { StudentDashboard } from "./student/StudentDashboard";
import { StudentProgressView } from "./progress/StudentProgressView";

export function PageContent(props: {
  userType: "supervisor" | "student";
  setUserType: (userType: "supervisor" | "student" | null) => void;
  currentView: string;
  onProgramSaved?: () => void;
}) {
  const { userType, setUserType, currentView, onProgramSaved } = props;

  // Check if viewing a student progress view (student_1511, student_1512, etc.)
  const isStudentProgressView = currentView.startsWith("student_");
  const studentId = isStudentProgressView ? currentView.replace("student_", "") : null;

  // Check if viewing a saved program (UUID format or specific IDs)
  const isProgramView =
    currentView !== "builder" &&
    currentView !== "programs" &&
    !isStudentProgressView &&
    (currentView.match(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    ) ||
      ["prog_101", "prog_102", "prog_103"].includes(currentView));

  return (
    <main className="flex-1 overflow-hidden flex flex-col">
      <header className="w-full flex justify-center items-center gap-2 py-4">
        <img
          src="/assets/philips-corp-brand-mark.png"
          alt="Phillips Logo"
          className="h-8"
        />
        <h1 className="text-2xl font-bold italic">Phillips Education</h1>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        {userType === "student" && currentView === "programs" ? (
          <StudentDashboard />
        ) : isStudentProgressView && studentId ? (
          <StudentProgressView studentId={studentId} />
        ) : isProgramView ? (
          <ProgramManager programId={currentView} />
        ) : (
          <div className="h-full p-8">
            <ProgramBuilder onProgramSaved={onProgramSaved} />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-300 flex justify-center">
        <Button size="sm" onClick={() => setUserType(null)}>
          Back to Auth Portal
        </Button>
      </div>
    </main>
  );
}
