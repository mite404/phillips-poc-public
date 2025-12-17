import { useState, useEffect, useCallback } from "react";
import { ChevronRight } from "lucide-react"; // Shadcn typically uses ChevronRight for collapsibles
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
  SidebarMenuSub, // NEW: For nested lists
  SidebarMenuSubItem, // NEW: For nested items
  SidebarMenuSubButton, // NEW: For nested buttons
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
  currentView, // Use this to highlight active items
  onNavigate,
  userType,
  refreshTrigger,
}: AppSidebarProps) {
  const [isBuilderOpen, setIsBuilderOpen] = useState(true); // Default open looks better
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

  useEffect(() => {
    if (userType === "supervisor") {
      loadSavedPrograms();
      loadStudents();
    }
  }, [userType, loadSavedPrograms, loadStudents, refreshTrigger]);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-phillips-orange text-sidebar-primary-foreground">
                <img
                  src="/assets/philips-corp-brand-mark.png"
                  alt="P"
                  className="h-4 w-4 brightness-0 invert" // Make logo white
                />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">Phillips Education</span>
                <span className="truncate text-xs">Supervisor Console</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu>
          {/* Account */}
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Account"
              isActive={currentView === "account"}
              // APPLYING THE ACME STYLE FONT HERE
              className="text-sm font-medium"
            >
              <span>Account</span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* Supervisor Menu */}
          {userType === "supervisor" && (
            <>
              {/* Program Builder */}
              <Collapsible
                asChild
                open={isBuilderOpen}
                onOpenChange={setIsBuilderOpen}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      tooltip="Program Builder"
                      isActive={currentView === "builder"}
                      className="text-sm font-medium" // Font fix
                      onClick={() => onNavigate("builder")}
                    >
                      <span>Create Program</span>
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    {/* REFACTOR: Use SidebarMenuSub for proper indentation and styling */}
                    <SidebarMenuSub>
                      {savedPrograms.length === 0 ? (
                        <SidebarMenuSubItem>
                          <span className="px-2 text-xs text-muted-foreground">
                            No saved programs
                          </span>
                        </SidebarMenuSubItem>
                      ) : (
                        savedPrograms.map((program) => (
                          <SidebarMenuSubItem key={program.id}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={currentView === program.id}
                              className="cursor-pointer"
                            >
                              <button onClick={() => onNavigate(program.id)}>
                                <span className="truncate">{program.programName}</span>
                                {!program.published && (
                                  <span className="ml-auto text-[10px] text-yellow-600 bg-yellow-50 px-1 rounded">
                                    DRAFT
                                  </span>
                                )}
                              </button>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))
                      )}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              {/* Student Progress */}
              <Collapsible
                asChild
                open={isProgressOpen}
                onOpenChange={setIsProgressOpen}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      tooltip="Student Progress"
                      className="text-sm font-medium" // Font fix
                    >
                      <span>Invite / Manage Students</span>
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {students.length === 0 ? (
                        <SidebarMenuSubItem>
                          <span className="px-2 text-xs text-muted-foreground">
                            Loading...
                          </span>
                        </SidebarMenuSubItem>
                      ) : (
                        students.map((student) => (
                          <SidebarMenuSubItem key={student.learner_Data_Id}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={
                                currentView === `student_${student.learner_Data_Id}`
                              }
                              className="cursor-pointer"
                            >
                              <button
                                onClick={() =>
                                  onNavigate(`student_${student.learner_Data_Id}`)
                                }
                              >
                                <span>{student.learnerName}</span>
                              </button>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))
                      )}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            </>
          )}

          {/* Student Menu */}
          {userType === "student" && (
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => onNavigate("programs")}
                isActive={currentView === "programs"}
                className="text-sm font-medium"
              >
                <span>My Programs</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={async () => {
                clearStorage();
                window.location.reload();
              }}
              className="text-xs text-muted-foreground hover:text-destructive"
            >
              <span>Reset Demo Data</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
