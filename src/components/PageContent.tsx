import { ProgramBuilder } from "./ProgramBuilder";
import { ProgramManager } from "./ProgramManager";

export function PageContent(props: {
  userType: "supervisor" | "student";
  setUserType: (userType: "supervisor" | "student" | null) => void;
  currentView: string;
}) {
  const { setUserType, currentView } = props;

  // Check if viewing a saved program (UUID format or specific IDs)
  const isProgramView =
    currentView !== "builder" &&
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
        {isProgramView ? (
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
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700 active:bg-blue-600 mx-auto block"
          onClick={() => setUserType(null)}
        >
          Back to Auth Portal
        </button>
      </div>
    </main>
  );
}
