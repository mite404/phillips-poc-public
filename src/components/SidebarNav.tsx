import { useState } from "react";

interface SidebarNavProps {
  currentView: string;
  onNavigate: (viewId: string) => void;
  userType: "supervisor" | "student";
}

export function SidebarNav({ currentView, onNavigate, userType }: SidebarNavProps) {
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);

  // Sample data for sub-menu
  const savedPrograms = [
    { id: "prog_101", title: "Q3 Safety Ramp-up" },
    { id: "prog_102", title: "Advanced Milling" },
    { id: "prog_103", title: "New Hire Onboarding" },
  ];

  return (
    <nav className="w-[220px] bg-slate-50 border-r border-slate-200 flex flex-col h-full p-4 text-left">
      <div className="space-y-1">
        <div className="px-3 py-2 text-sm font-medium text-slate-700">Account</div>

        {/* Supervisor Menu */}
        {userType === "supervisor" && (
          <>
            {/* Program Builder */}
            <button
              onClick={() => {
                setIsBuilderOpen(!isBuilderOpen);
                onNavigate("builder");
              }}
              className="w-full text-left px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors whitespace-nowrap"
            >
              Program Builder
            </button>

            {/* CONDITIONAL RENDER: list appears if isBuilderOpen is true */}
            {isBuilderOpen && (
              <div className="ml-6 mt-1 flex flex-col gap-1 border-l-2 border-slate-300 pl-2">
                {/* List: Saved Programs*/}
                {savedPrograms.map((program) => (
                  <button
                    key={program.id}
                    onClick={() => onNavigate(program.id)}
                    className="text-left px-2 py-1 ! bg-gray-100 !text-black border-slate-300 hover:!bg-slate-200 hover:border-slate-400 rounded text-xs truncate"
                  >
                    {program.title}
                  </button>
                ))}
              </div>
            )}

            <div className="px-3 py-2 text-sm font-medium text-slate-700">
              Student Progress
            </div>
          </>
        )}

        {/* Student Menu */}
        {userType === "student" && (
          <button
            onClick={() => onNavigate("programs")}
            className="w-full text-left px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors whitespace-nowrap"
          >
            My Programs
          </button>
        )}
      </div>
    </nav>
  );
}
