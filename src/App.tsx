import "./App.css";
import { useState } from "react";
import { PageContent } from "./components/PageContent";
import { AppSidebar } from "./components/layout/AppSidebar";
import { SiteHeader } from "./components/layout/SiteHeader";
import { SidebarProvider, SidebarInset } from "./components/ui/sidebar";
import { Toaster } from "sonner";

function App() {
  const [userType, setUserType] = useState<"supervisor" | "student" | null>(null);
  const [currentView, setCurrentView] = useState<string>("builder");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

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
              className="bg-orange-500! text-gray-950! px-6 py-3 rounded mx-auto font-medium"
              onClick={() => handleSetUserType("supervisor")}
            >
              Education Supervisor
            </button>
            <button
              className="bg-orange-500! text-gray-950! px-6 py-3 rounded mx-auto font-medium"
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
            <SiteHeader />
            <div className="flex flex-1 p-4 overflow-auto">
              <PageContent
                userType={userType}
                setUserType={handleSetUserType}
                currentView={currentView}
                onProgramSaved={handleProgramSaved}
                onNavigate={setCurrentView}
              />
            </div>
          </SidebarInset>
        </SidebarProvider>
      </>
    );
  }
}

export default App;
