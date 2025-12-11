import { ProgramBuilder } from "./ProgramBuilder";
import { ProgramManager } from "./ProgramManager";
import { StudentDashboard } from "./student/StudentDashboard";
import { StudentProgressView } from "./progress/StudentProgressView";

export function PageContent(props: {
  userType: "supervisor" | "student";
  setUserType: (userType: "supervisor" | "student" | null) => void;
  currentView: string;
}) {
  const { userType, setUserType, currentView } = props;

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
      <header className="w-full flex justify-center py-4 border-b border-slate-600">
        <h1 className="text-2xl font-bold">Phillips Education</h1>
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
            <ProgramBuilder />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-300">
        <button
          className="bg-gray-100! text-slate-700!  border-slate-300 outline border-2 outline-gray-400 px-4 py-2 rounded hover:bg-slate-200! hover:border-slate-400 mx-auto block font-medium"
          onClick={() => setUserType(null)}
        >
          Back to Auth Portal
        </button>
      </div>
    </main>
  );
}
