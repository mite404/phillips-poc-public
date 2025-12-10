import "./App.css";
import { useState } from "react";
import { PageContent } from "./components/PageContent";
import { SidebarNav } from "./components/SidebarNav";

function App() {
  const [userType, setUserType] = useState<"supervisor" | "student" | null>(null);

  if (userType === null) {
    return (
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
    );
  } else if (userType === "supervisor") {
    return (
      <div className="flex flex-1 overflow-hidden">
        <SidebarNav />
        <PageContent userType={userType} setUserType={setUserType} />
      </div>
    );
  } else {
    return (
      <div className="flex flex-1 overflow-hidden">
        <SidebarNav />
        <PageContent userType={userType} setUserType={setUserType} />
      </div>
    );
  }
}

export default App;
