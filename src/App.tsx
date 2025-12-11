import "./App.css";
import { useState } from "react";
import { PageContent } from "./components/PageContent";
import { SidebarNav } from "./components/SidebarNav";
import { Toaster } from "sonner";

function App() {
  const [userType, setUserType] = useState<"supervisor" | "student" | null>(null);
  const [currentView, setCurrentView] = useState<string>("builder");

  // Set initial view based on user type
  const handleSetUserType = (type: "supervisor" | "student" | null) => {
    setUserType(type);
    if (type === "student") {
      setCurrentView("programs");
    } else if (type === "supervisor") {
      setCurrentView("builder");
    }
  };

  if (userType === null) {
    return (
      <>
        <Toaster position="top-right" />
        <div className="flex h-screen">
          {/* button container */}
          <div className="flex flex-col items-center justify-center flex-1 gap-3">
            <button
              className="!bg-gray-100 !text-slate-700 px-6 py-3 rounded hover:!bg-slate-200 hover:border-slate-400 mx-auto font-medium"
              onClick={() => handleSetUserType("supervisor")}
            >
              Education Supervisor
            </button>
            <button
              className="!bg-gray-100 !text-slate-700 px-6 py-3 rounded hover:!bg-slate-200 hover:border-slate-400 mx-auto font-medium"
              onClick={() => handleSetUserType("student")}
            >
              Student
            </button>
          </div>
        </div>
      </>
    );
  } else if (userType === "supervisor") {
    return (
      <>
        <Toaster position="top-right" />
        <div className="flex flex-1 overflow-hidden">
          <SidebarNav
            currentView={currentView}
            onNavigate={setCurrentView}
            userType={userType}
          />
          <PageContent
            userType={userType}
            setUserType={handleSetUserType}
            currentView={currentView}
          />
        </div>
      </>
    );
  } else {
    return (
      <>
        <Toaster position="top-right" />
        <div className="flex flex-1 overflow-hidden">
          <SidebarNav
            currentView={currentView}
            onNavigate={setCurrentView}
            userType={userType}
          />
          <PageContent
            userType={userType}
            setUserType={handleSetUserType}
            currentView={currentView}
          />
        </div>
      </>
    );
  }
}

export default App;
