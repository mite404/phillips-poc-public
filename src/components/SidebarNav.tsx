import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { legacyApi } from "@/api/legacyRoutes";
import { localApi } from "@/api/localRoutes";
import type { SupervisorProgram, LearnerProfile } from "@/types/models";
import { clearStorage } from "@/api/storageUtils";

interface SidebarNavProps {
  currentView: string;
  onNavigate: (viewId: string) => void;
  userType: "supervisor" | "student";
  refreshTrigger: number;
}

export function SidebarNav({
  onNavigate,
  userType,
  refreshTrigger,
}: Omit<SidebarNavProps, "currentView">) {
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [isProgressOpen, setIsProgressOpen] = useState(false);
  const [savedPrograms, setSavedPrograms] = useState<SupervisorProgram[]>([]);
  const [students, setStudents] = useState<LearnerProfile[]>([]);

  const loadSavedPrograms = useCallback(async () => {
    try {
      const programs = await localApi.getAllPrograms();
      setSavedPrograms(programs);
    } catch (error) {
      console.error("Failed to load saved programs:", error);
    }
  }, []);

  const loadStudents = useCallback(async () => {
    try {
      const roster = await legacyApi.getRoster();
      setStudents(roster);
    } catch (error) {
      console.error("Failed to load students:", error);
    }
  }, []);

  // Load saved programs and students when component mounts or when refreshTrigger changes
  useEffect(() => {
    if (userType === "supervisor") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadSavedPrograms();
      loadStudents();
    }
  }, [userType, loadSavedPrograms, loadStudents, refreshTrigger]);

  return (
    <nav className="w-[250px] bg-muted border-r border-border flex flex-col h-full p-4 text-left">
      <div className="space-y-1">
        <Button
          variant="ghost"
          className="w-full justify-start px-3 py-2 text-sm text-slate-700"
        >
          Account
        </Button>

        {/* Supervisor Menu */}
        {userType === "supervisor" && (
          <>
            {/* Program Builder */}
            <Button
              variant="ghost"
              onClick={() => {
                setIsBuilderOpen(!isBuilderOpen);
                onNavigate("builder");
              }}
              className="w-full justify-start px-3 py-2 text-sm text-slate-700"
            >
              Create Program
            </Button>

            {/* CONDITIONAL RENDER: list appears if isBuilderOpen is true */}
            {isBuilderOpen && (
              <div className="ml-6 mt-1 flex flex-col gap-1 border-l-2 border-border pl-2">
                {/* List: Saved Programs*/}
                {savedPrograms.length === 0 ? (
                  <div className="text-xs text-slate-400 px-2 py-1">
                    No saved programs
                  </div>
                ) : (
                  savedPrograms.map((program) => (
                    <Button
                      key={program.id}
                      variant="ghost"
                      onClick={() => onNavigate(program.id)}
                      className="w-full justify-start px-2 py-1 text-xs text-slate-700"
                    >
                      <span className="truncate">{program.programName}</span>
                      {!program.published && (
                        <span className="text-[10px] px-1 py-0.5 bg-yellow-100 text-yellow-800 rounded flex-shrink-0 ml-auto">
                          DRAFT
                        </span>
                      )}
                    </Button>
                  ))
                )}
              </div>
            )}

            {/* Student Progress */}
            <Button
              variant="ghost"
              onClick={() => {
                setIsProgressOpen(!isProgressOpen);
              }}
              className="w-full justify-start px-3 py-2 text-sm text-slate-700"
            >
              Invite / Manage Students
            </Button>

            {/* CONDITIONAL RENDER: student list appears if isProgressOpen is true */}
            {isProgressOpen && (
              <div className="ml-6 mt-1 flex flex-col gap-1 border-l-2 border-border pl-2">
                {/* List: Students */}
                {students.length === 0 ? (
                  <div className="text-xs text-slate-400 px-2 py-1">
                    Loading students...
                  </div>
                ) : (
                  students.map((student) => (
                    <Button
                      key={student.learner_Data_Id}
                      variant="ghost"
                      onClick={() => onNavigate(`student_${student.learner_Data_Id}`)}
                      className="w-full justify-start px-2 py-1 text-xs text-slate-700"
                    >
                      {student.learnerName}
                    </Button>
                  ))
                )}
              </div>
            )}
          </>
        )}

        {/* Student Menu */}
        {userType === "student" && (
          <Button
            variant="ghost"
            onClick={() => onNavigate("programs")}
            className="w-full justify-start px-3 py-2 text-sm text-slate-700"
          >
            My Programs
          </Button>
        )}

        {/* RESET DEMO DATA BTN */}
        <Button
          variant="ghost"
          onClick={async () => {
            clearStorage();
            // Reset db.json by calling a reset endpoint (you'd need to create this)
            // For now, just reload to see seed data
            window.location.reload();
          }}
          className="text-xs text-slate-400 hover:text-red-500 mt-auto p-4 w-full justify-start"
        >
          Reset Demo Data
        </Button>
      </div>
    </nav>
  );
}
