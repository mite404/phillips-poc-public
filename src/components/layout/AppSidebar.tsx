import { useState, useEffect } from "react";
import {
  ChevronRight,
  FileText,
  Users,
  FolderOpen,
  Plus,
  User,
  LayoutDashboard,
  Settings,
  HelpCircle,
  Search,
  MoreVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarFooter,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface AppSidebarProps {
  currentView: string;
  onNavigate: (viewId: string) => void;
  onSetUserType: (userType: "supervisor" | "student" | null) => void;
  userType: "supervisor" | "student";
  refreshTrigger: number;
}

export function AppSidebar({
  currentView, // Use this to highlight active items
  onNavigate,
  onSetUserType,
  userType,
  refreshTrigger,
}: AppSidebarProps) {
  const [isBuilderOpen, setIsBuilderOpen] = useState(true); // Default open looks better
  const [isProgressOpen, setIsProgressOpen] = useState(false);
  const [savedPrograms, setSavedPrograms] = useState<SupervisorProgram[]>([]);
  const [students, setStudents] = useState<LearnerProfile[]>([]);

  useEffect(() => {
    if (userType !== "supervisor") {
      return;
    }

    let mounted = true;

    const loadData = async () => {
      try {
        const programs = await localApi.getAllPrograms();
        if (mounted) {
          setSavedPrograms(programs);
        }
      } catch (error) {
        console.error("Failed to load saved programs:", error);
      }

      try {
        const roster = await legacyApi.getRoster();
        if (mounted) {
          setStudents(roster);
        }
      } catch (error) {
        console.error("Failed to load students:", error);
      }
    };

    void loadData();

    return () => {
      mounted = false;
    };
  }, [userType, refreshTrigger]);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center justify-between gap-2">
          <SidebarMenu className="flex-1">
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                onClick={() => onSetUserType(null)}
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground cursor-pointer"
              >
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-phillips-orange text-sidebar-primary-foreground">
                  <img
                    src="/assets/philips-corp-brand-mark.png"
                    alt="P"
                    className="h-4 w-4 brightness-0 invert"
                  />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Phillips Education</span>
                  <span className="truncate text-xs">Supervisor Console</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          <SidebarTrigger className="ml-2 h-8 w-8" />
        </div>
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
              {/* Dashboard */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Dashboard"
                  isActive={currentView === "dashboard"}
                  className="text-sm font-medium"
                  onClick={() => onNavigate("dashboard")}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Dashboard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Create Program Button */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Create Program"
                  isActive={currentView === "builder"}
                  className="text-sm font-medium"
                  onClick={() => onNavigate("builder")}
                >
                  <Plus className="h-4 w-4" />
                  <span>Create Program</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Program Drafts Collapsible */}
              <Collapsible
                asChild
                open={isBuilderOpen}
                onOpenChange={setIsBuilderOpen}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      tooltip="Program Drafts"
                      className="text-sm font-medium"
                    >
                      <FolderOpen className="h-4 w-4" />
                      <span>Program Drafts</span>
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
                              <Button
                                variant="ghost"
                                className="w-full justify-start"
                                onClick={() => onNavigate(program.id)}
                              >
                                <FileText className="h-4 w-4 mr-2 flex-shrink-0" />
                                <span className="truncate">{program.programName}</span>
                                {!program.published && (
                                  <span className="ml-auto text-[10px] text-yellow-600 bg-yellow-50 px-1 rounded">
                                    DRAFT
                                  </span>
                                )}
                              </Button>
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
                      <Users className="h-4 w-4" />
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
                              <Button
                                variant="ghost"
                                className="w-full justify-start"
                                onClick={() =>
                                  onNavigate(`student_${student.learner_Data_Id}`)
                                }
                              >
                                <User className="h-4 w-4 mr-2 flex-shrink-0" />
                                <span>{student.learnerName}</span>
                              </Button>
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
          {/* Settings - placeholder */}
          <SidebarMenuItem>
            <SidebarMenuButton className="text-sm font-medium">
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* Get Help - placeholder */}
          <SidebarMenuItem>
            <SidebarMenuButton className="text-sm font-medium">
              <HelpCircle className="h-4 w-4" />
              <span>Get Help</span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* Search - placeholder */}
          <SidebarMenuItem>
            <SidebarMenuButton className="text-sm font-medium">
              <Search className="h-4 w-4" />
              <span>Search</span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* User Profile with dropdown */}
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="h-auto py-2">
                  <div className="flex items-center gap-2 flex-1">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>SC</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start text-left group-data-[collapsible=icon]:hidden">
                      <span className="text-sm font-semibold">shadcn</span>
                      <span className="text-xs text-muted-foreground">m@example.com</span>
                    </div>
                  </div>
                  <MoreVertical className="h-4 w-4 ml-auto group-data-[collapsible=icon]:hidden" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Account Settings</DropdownMenuItem>
                <DropdownMenuItem
                  onClick={async () => {
                    clearStorage();
                    window.location.reload();
                  }}
                >
                  Reset Demo Data
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
