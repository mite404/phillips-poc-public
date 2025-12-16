import { useState, useEffect, useCallback } from "react";
import { ChevronDown } from "lucide-react";
import { legacyApi } from "@/api/legacyRoutes";
import { localApi } from "@/api/localRoutes";
import { clearStorage } from "@/api/storageUtils";
import type { SupervisorProgram, LearnerProfile } from "@/types/models";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface AppSidebarProps {
  currentView: string;
  onNavigate: (viewId: string) => void;
  userType: "supervisor" | "student";
  refreshTrigger: number;
}

export function AppSidebar({
  onNavigate,
  userType,
  refreshTrigger,
}: AppSidebarProps) {
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
      loadSavedPrograms();
      loadStudents();
    }
  }, [userType, loadSavedPrograms, loadStudents, refreshTrigger]);

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <img
            src="/assets/philips-corp-brand-mark.png"
            alt="Phillips Logo"
            className="h-6"
          />
          <span className="text-lg font-bold italic">Phillips Education</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu>
          {/* Account */}
          <SidebarMenuItem>
            <SidebarMenuButton>
              <span>Account</span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* Supervisor Menu */}
          {userType === "supervisor" && (
            <>
              {/* Program Builder */}
              <Collapsible
                open={isBuilderOpen}
                onOpenChange={setIsBuilderOpen}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      onClick={() => {
                        setIsBuilderOpen(!isBuilderOpen);
                        onNavigate("builder");
                      }}
                    >
                      <span>Create Program</span>
                      <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="ml-4 mt-1 flex flex-col gap-1 border-l-2 border-slate-300 pl-2">
                      {savedPrograms.length === 0 ? (
                        <div className="text-xs text-slate-400 px-2 py-1">
                          No saved programs
                        </div>
                      ) : (
                        savedPrograms.map((program) => (
                          <button
                            key={program.id}
                            onClick={() => onNavigate(program.id)}
                            className="text-left px-2 py-1 bg-gray-100 text-black border-slate-300 hover:bg-slate-200 hover:border-slate-400 rounded text-xs truncate flex items-center justify-between gap-2"
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
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              {/* Student Progress */}
              <Collapsible
                open={isProgressOpen}
                onOpenChange={setIsProgressOpen}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      onClick={() => {
                        setIsProgressOpen(!isProgressOpen);
                      }}
                    >
                      <span>Invite / Manage Students</span>
                      <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="ml-4 mt-1 flex flex-col gap-1 border-l-2 border-slate-300 pl-2">
                      {students.length === 0 ? (
                        <div className="text-xs text-slate-400 px-2 py-1">
                          Loading students...
                        </div>
                      ) : (
                        students.map((student) => (
                          <button
                            key={student.learner_Data_Id}
                            onClick={() =>
                              onNavigate(`student_${student.learner_Data_Id}`)
                            }
                            className="text-left px-2 py-1 bg-gray-100 text-black border-slate-300 hover:bg-slate-200 hover:border-slate-400 rounded text-xs truncate"
                          >
                            {student.learnerName}
                          </button>
                        ))
                      )}
                    </div>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            </>
          )}

          {/* Student Menu */}
          {userType === "student" && (
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => onNavigate("programs")}>
                <span>My Programs</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarContent>

      {/* Footer: Reset Demo Data */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={async () => {
                clearStorage();
                window.location.reload();
              }}
              className="text-xs text-slate-400 hover:text-red-500"
            >
              <span>Reset Demo Data</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
