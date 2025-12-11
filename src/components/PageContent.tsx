import { ProgramBuilder } from "./ProgramBuilder";

export function PageContent(props: {
  userType: "supervisor" | "student";
  setUserType: (userType: "supervisor" | "student" | null) => void;
  currentView: string;
}) {
  const { setUserType, currentView } = props;

  // Check if viewing a saved program draft
  const isSavedProgram = ["prog_101", "prog_102", "prog_103"].includes(currentView);

  return (
    <main className="flex-1 overflow-y-auto p-8 flex flex-col">
      <header className="w-full flex justify-center py-4 border-b border-slate-600">
        <h1 className="text-2xl font-bold">Phillips Education</h1>
      </header>

      {isSavedProgram ? (
        <>
          <h2>Viewing Saved Program: {currentView}</h2>
          <div className="flex-1 mt-4 p-4 border border-slate-300 rounded">
            <p className="text-slate-500">Saved program content will appear here...</p>
          </div>
        </>
      ) : (
        <div className="flex-1 mt-4">
          <ProgramBuilder />
        </div>
      )}

      <div className="flex-1"></div>
      <button
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700 active:bg-blue-600 mx-auto"
        onClick={() => setUserType(null)}
      >
        Back to Auth Portal
      </button>
    </main>
  );
}
