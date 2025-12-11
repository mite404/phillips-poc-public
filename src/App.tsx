import "./App.css";
import { useState } from "react";
import { PageContent } from "./components/PageContent";
import { SidebarNav } from "./components/SidebarNav";
import { Toaster } from "sonner";

function App() {
  const [userType, setUserType] = useState<"supervisor" | "student" | null>(null);
  const [currentView, setCurrentView] = useState<string>("builder");

  if (userType === null) {
    return (
      <>
        <Toaster position="top-right" />
        <div className="flex h-screen">
          {/* button container */}
          <div className="flex flex-col items-center justify-center flex-1">
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700 active:bg-blue-600 mx-auto"
              onClick={() => setUserType("supervisor")}
            >
              Education Supervisor
            </button>
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700 active:bg-blue-600 mx-auto"
              onClick={() => setUserType("student")}
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
          <SidebarNav currentView={currentView} onNavigate={setCurrentView} />
          <PageContent
            userType={userType}
            setUserType={setUserType}
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
          <SidebarNav currentView={currentView} onNavigate={setCurrentView} />
          <PageContent
            userType={userType}
            setUserType={setUserType}
            currentView={currentView}
          />
        </div>
      </>
    );
  }
}

export default App;
