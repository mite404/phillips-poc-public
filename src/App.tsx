import "./App.css";
import { useState, useEffect } from "react";
import { PageContent } from "./components/PageContent";
import { AppSidebar } from "./components/layout/AppSidebar";
import { SiteHeader } from "./components/layout/SiteHeader";
import { SidebarProvider, SidebarInset } from "./components/ui/sidebar";
import { Toaster } from "sonner";

function App() {
  const [userType, setUserType] = useState<"supervisor" | "student" | null>(null);
  const [currentView, setCurrentView] = useState<string>("builder");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [lightMode, setLightMode] = useState(() => {
    return localStorage.getItem('theme') === 'light';
  });

  // Set initial view based on user type
  const handleSetUserType = (type: "supervisor" | "student" | null) => {
    setUserType(type);
    if (type === "student") {
      setCurrentView("programs");
    } else if (type === "supervisor") {
      setCurrentView("dashboard");
    }
  };

  // Handler to trigger sidebar refresh when a program is saved
  const handleProgramSaved = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  // Handler to toggle theme
  const handleThemeToggle = () => {
    const next = !lightMode;
    requestAnimationFrame(() => {
      document.documentElement.classList.toggle('dark', !next);
    });
    setLightMode(next);
  };

  // Persist theme preference to localStorage
  useEffect(() => {
    localStorage.setItem('theme', lightMode ? 'light' : 'dark');
  }, [lightMode]);

  if (userType === null) {
    return (
      <>
        <Toaster position="top-right" />
        <div className="flex flex-col h-screen">
          {/* button container */}
          <div className="flex flex-col items-center justify-center flex-1 gap-3">
            <header className="w-full flex justify-center items-center gap-2 py-4">
              <img
                src="/assets/philips-corp-brand-mark.png"
                alt="Phillips Logo"
                className="h-8"
              />
              <h1 className="text-2xl font-bold italic">Phillips</h1>
            </header>
            <button
              className="bg-orange-500! text-gray-950! px-6 py-3 rounded-[--radius] mx-auto font-medium hover:bg-orange-400! focus-visible:bg-orange-400! transition-colors"
              onClick={() => handleSetUserType("supervisor")}
            >
              Education Supervisor
            </button>
            <button
              className="bg-orange-500! text-gray-950! px-6 py-3 rounded-[--radius] mx-auto font-medium hover:bg-orange-400! focus-visible:bg-orange-400! transition-colors"
              onClick={() => handleSetUserType("student")}
            >
              Student
            </button>
          </div>
        </div>
      </>
    );
  } else {
    return (
      <>
        <Toaster position="top-right" />
        <SidebarProvider>
          <AppSidebar
            currentView={currentView}
            onNavigate={setCurrentView}
            onSetUserType={handleSetUserType}
            userType={userType}
            refreshTrigger={refreshTrigger}
          />
          <SidebarInset>
            <SiteHeader lightMode={lightMode} onThemeToggle={handleThemeToggle} />
            <div className="flex flex-1 min-h-0">
              <div className="flex flex-1 max-w-7xl mx-auto w-full min-h-0">
                <PageContent
                  userType={userType}
                  setUserType={handleSetUserType}
                  currentView={currentView}
                  onProgramSaved={handleProgramSaved}
                  onNavigate={setCurrentView}
                />
              </div>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </>
    );
  }
}

export default App;
