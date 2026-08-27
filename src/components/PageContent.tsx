import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Button } from "./ui/button";
import { ProgramBuilder } from "./ProgramBuilder";
import { ProgramManager } from "./ProgramManager";
import { StudentDashboard } from "./student/StudentDashboard";
import { StudentProgressView } from "./progress/StudentProgressView";
import { SupervisorDashboard } from "./SupervisorDashboard";

export function PageContent(props: {
  userType: "supervisor" | "student";
  setUserType: (userType: "supervisor" | "student" | null) => void;
  currentView: string;
  onProgramSaved?: () => void;
  onNavigate: (view: string) => void;
}) {
  const { userType, setUserType, currentView, onProgramSaved, onNavigate } = props;
  const reduceMotion = useReducedMotion();

  // Check if viewing a student progress view (student_1511, student_1512, etc.)
  const isStudentProgressView = currentView.startsWith("student_");
  const studentId = isStudentProgressView ? currentView.replace("student_", "") : null;

  // Check if viewing a saved program (UUID format or specific IDs)
  const isProgramView =
    currentView !== "builder" &&
    currentView !== "programs" &&
    currentView !== "dashboard" &&
    !isStudentProgressView &&
    (currentView.match(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    ) ||
      ["prog_101", "prog_102", "prog_103"].includes(currentView));

  // Which of the five screens is showing, as a stable identity for AnimatePresence.
  // `currentView` alone is not enough: "programs" resolves to a different screen
  // depending on userType, so keying on it would leave the two mounted as one node
  // and skip the transition entirely.
  const screenKey =
    userType === "student" && currentView === "programs"
      ? "student-dashboard"
      : currentView === "dashboard"
        ? "supervisor-dashboard"
        : isStudentProgressView && studentId
          ? `progress-${studentId}`
          : isProgramView
            ? `program-${currentView}`
            : "builder";

  const screen =
    screenKey === "student-dashboard" ? (
      <StudentDashboard />
    ) : screenKey === "supervisor-dashboard" ? (
      <SupervisorDashboard onNavigate={onNavigate} />
    ) : screenKey.startsWith("progress-") && studentId ? (
      <StudentProgressView studentId={studentId} />
    ) : screenKey.startsWith("program-") ? (
      <ProgramManager programId={currentView} />
    ) : (
      <ProgramBuilder onProgramSaved={onProgramSaved} />
    );

  // Reduced motion keeps the crossfade and drops the rise, per contract rule 6.
  const rise = reduceMotion ? "translateY(0px)" : "translateY(8px)";

  return (
    <main className="flex-1 overflow-hidden flex flex-col w-full @container">
      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        {/* mode="wait" because these screens are full-height: overlapping two of
            them stacks their scroll containers and the page scrolls twice.
            Explicit tween, not Motion's default spring - the contract forbids
            visible bounce in this app. Full transform strings rather than the
            `y` shorthand, which is not hardware-accelerated (AUDIT cat 5). */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={screenKey}
            className="h-full"
            initial={{ opacity: 0, transform: rise }}
            animate={{ opacity: 1, transform: "translateY(0px)" }}
            exit={{ opacity: 0, transform: rise }}
            transition={{
              duration: 0.32,
              ease: [0.23, 1, 0.32, 1],
              opacity: { duration: 0.19, ease: [0.4, 0, 1, 1] },
            }}
          >
            {screen}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border flex justify-center">
        <Button size="sm" onClick={() => setUserType(null)}>
          Back to Auth Portal
        </Button>
      </div>
    </main>
  );
}
