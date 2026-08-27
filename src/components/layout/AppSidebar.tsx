import { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  CircleUser,
  FileText,
  Users,
  FolderOpen,
  Plus,
  User,
  LayoutDashboard,
  Settings,
  HelpCircle,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { legacyApi } from "@/api/legacyRoutes";
import { localApi } from "@/api/localRoutes";
import { clearStorage } from "@/api/storageUtils";
import type { SupervisorProgram, LearnerProfile } from "@/types/models";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { useSidebar } from "@/components/ui/use-sidebar";
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

/**
 * Collapse/expand control that rides the sidebar's outer edge.
 *
 * It renders as a child of `<Sidebar>` but positions `absolute -right-3`, which
 * resolves against the `fixed` rail container in `ui/sidebar.tsx` rather than
 * the flex column it sits in. That container is the element whose width already
 * animates from `--sidebar-width` to `--sidebar-width-icon`, so pinning the
 * button to its right edge makes it slide with the collapse for free - there is
 * no second transition here to keep in sync with the rail's.
 *
 * Living outside the rail is the point: the old `<SidebarTrigger>` sat inside
 * `<SidebarHeader>`, so collapsing to 3rem clipped it and left no way back out.
 *
 * Desktop only (`hidden md:flex`). On mobile the rail is a Sheet, and
 * `SiteHeader` already carries a `<SidebarTrigger className="md:hidden">`.
 */
function SidebarEdgeToggle() {
  const { toggleSidebar, state } = useSidebar();
  const label = state === "collapsed" ? "Expand sidebar" : "Collapse sidebar";

  return (
    <button
      type="button"
      onClick={toggleSidebar}
      aria-label={label}
      title={label}
      className="absolute -right-3 top-5 z-20 hidden size-6 items-center justify-center rounded-full border border-sidebar-border bg-sidebar text-sidebar-foreground shadow-sm transition-[background-color,scale] duration-(--duration-micro) ease-out hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring active:scale-(--scale-press) active:duration-0 md:flex"
    >
      <ChevronLeft
        className={`size-4 transition-transform duration-(--duration-swap) ease-out ${
          state === "collapsed" ? "rotate-180" : ""
        }`}
      />
    </button>
  );
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
  const { isMobile } = useSidebar();

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
      <SidebarEdgeToggle />

      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            {/* Home. Clearing userType drops back to the mock auth portal in
                App.tsx, which is this POC's landing route. */}
            <SidebarMenuButton
              size="lg"
              tooltip="Home"
              onClick={() => onSetUserType(null)}
              className="cursor-pointer"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-phillips-orange text-sidebar-primary-foreground">
                <img
                  src="/assets/philips-corp-brand-mark.png"
                  alt="P"
                  className="h-4 w-4 brightness-0 invert"
                />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  Phillips Education
                </span>
                <span className="truncate text-xs">Supervisor Console</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* SidebarGroup, not a bare SidebarMenu: SidebarContent has no padding of
          its own, SidebarFooter has `p-2`. Without this the nav icons sat 8px
          left of the footer icons and read as off-centre when collapsed. */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {/* Account */}
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="Account"
                isActive={currentView === "account"}
                className="text-sm font-medium"
              >
                <CircleUser className="h-4 w-4" />
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
                        <ChevronRight className="ml-auto transition-transform duration-(--duration-swap) ease-out group-data-[state=open]/collapsible:rotate-90 group-data-[collapsible=icon]:hidden" />
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
                                  <span className="truncate">
                                    {program.programName}
                                  </span>
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
                        <ChevronRight className="ml-auto transition-transform duration-(--duration-swap) ease-out group-data-[state=open]/collapsible:rotate-90 group-data-[collapsible=icon]:hidden" />
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
                                  currentView ===
                                  `student_${student.learner_Data_Id}`
                                }
                                className="cursor-pointer"
                              >
                                <Button
                                  variant="ghost"
                                  className="w-full justify-start"
                                  onClick={() =>
                                    onNavigate(
                                      `student_${student.learner_Data_Id}`,
                                    )
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
        </SidebarGroup>
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
                {/* size="lg" carries `group-data-[collapsible=icon]:!p-0`, which
                    is what lets the 32px avatar fill the 32px collapsed button
                    instead of overflowing a 16px content box and getting sliced
                    by the rail's right border. */}
                <SidebarMenuButton
                  size="lg"
                  tooltip="shadcn"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarFallback className="rounded-lg">SC</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">shadcn</span>
                    <span className="truncate text-xs text-muted-foreground">
                      m@example.com
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4 group-data-[collapsible=icon]:hidden" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              {/* side="right" so the menu pops out of the rail rather than
                  dropping down over the footer. The scale-from-origin motion
                  comes from POPPER_MOTION_CLASS in ui/dropdown-menu.tsx. */}
              <DropdownMenuContent
                side={isMobile ? "bottom" : "right"}
                align="end"
                sideOffset={4}
                className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
              >
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarFallback className="rounded-lg">SC</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">shadcn</span>
                    <span className="truncate text-xs text-muted-foreground">
                      m@example.com
                    </span>
                  </div>
                </div>
                <DropdownMenuSeparator />
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
