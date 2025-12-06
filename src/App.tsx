import { Toaster } from "@/components/ui/sonner";
import { CatalogColumn } from "@/components/builder/CatalogColumn";

function App() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header / Nav would go here */}
      <header className="bg-white border-b p-4 mb-6">
        <h1 className="text-2xl font-bold text-phillips-blue">Phillips Education</h1>
      </header>

      <main className="container mx-auto px-4 py-6">
        <CatalogColumn />
      </main>

      <Toaster />
    </div>
  );
}

export default App;
