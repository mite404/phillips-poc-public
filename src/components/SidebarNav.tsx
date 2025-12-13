import { useState, useEffect } from "react";
import { legacyApi } from "@/api/legacyRoutes";
import { localApi } from "@/api/localRoutes";
import type { SupervisorProgram, LearnerProfile } from "@/types/models";

interface SidebarNavProps {
  currentView: string;
  onNavigate: (viewId: string) => void;
  userType: "supervisor" | "student";
}

export function SidebarNav({
  currentView: _currentView,
  onNavigate,
  userType,
}: SidebarNavProps) {
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [isProgressOpen, setIsProgressOpen] = useState(false);
  const [savedPrograms, setSavedPrograms] = useState<SupervisorProgram[]>([]);
  const [students, setStudents] = useState<LearnerProfile[]>([]);

  // Load saved programs and students when component mounts
  useEffect(() => {
    if (userType === "supervisor") {
      loadSavedPrograms();
      loadStudents();
    }
  }, [userType]);

  async function loadSavedPrograms() {
    try {
      const programs = await localApi.getAllPrograms();
      setSavedPrograms(programs);
    } catch (error) {
      console.error("Failed to load saved programs:", error);
    }
  }

  async function loadStudents() {
    try {
      const roster = await legacyApi.getRoster();
      setStudents(roster);
    } catch (error) {
      console.error("Failed to load students:", error);
    }
  }

  return (
    <nav className="w-[250px] bg-slate-50 border-r border-slate-200 flex flex-col h-full p-4 text-left">
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
              Create Program
            </button>

            {/* CONDITIONAL RENDER: list appears if isBuilderOpen is true */}
            {isBuilderOpen && (
              <div className="ml-6 mt-1 flex flex-col gap-1 border-l-2 border-slate-300 pl-2">
                {/* List: Saved Programs*/}
                {savedPrograms.length === 0 ? (
                  <div className="text-xs text-slate-400 px-2 py-1">
                    No saved programs
                  </div>
                ) : (
                  savedPrograms.map((program) => (
                    <button
                      key={program.id}
                      onClick={() => onNavigate(program.id)}
                      className="text-left px-2 py-1 bg-gray-100! text-black! border-slate-300 hover:bg-slate-200! hover:border-slate-400 rounded text-xs truncate flex items-center justify-between gap-2"
                    >
                      <span className="truncate">{program.programName}</span>
                      {!program.published && (
                        <span className="text-[10px] px-1 py-0.5 bg-yellow-100 text-yellow-800 rounded flex-shrink-0">
                          DRAFT
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>
            )}

            {/* Student Progress */}
            <button
              onClick={() => {
                setIsProgressOpen(!isProgressOpen);
              }}
              className="w-full text-left px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors whitespace-nowrap"
            >
              Invite / Manage Students
            </button>

            {/* CONDITIONAL RENDER: student list appears if isProgressOpen is true */}
            {isProgressOpen && (
              <div className="ml-6 mt-1 flex flex-col gap-1 border-l-2 border-slate-300 pl-2">
                {/* List: Students */}
                {students.length === 0 ? (
                  <div className="text-xs text-slate-400 px-2 py-1">
                    Loading students...
                  </div>
                ) : (
                  students.map((student) => (
                    <button
                      key={student.learner_Data_Id}
                      onClick={() => onNavigate(`student_${student.learner_Data_Id}`)}
                      className="text-left px-2 py-1 bg-gray-100! text-black! border-slate-300 hover:bg-slate-200! hover:border-slate-400 rounded text-xs truncate"
                    >
                      {student.learnerName}
                    </button>
                  ))
                )}
              </div>
            )}
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
