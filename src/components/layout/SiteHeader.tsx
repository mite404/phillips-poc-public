import { Moon, Sun } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";

interface SiteHeaderProps {
  lightMode: boolean;
  onThemeToggle: () => void;
}

export function SiteHeader({ lightMode, onThemeToggle }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
      <SidebarTrigger className="md:hidden" />
      <div className="flex flex-1 justify-center items-center gap-2">
        <img
          src="/assets/philips-corp-brand-mark.png"
          alt="Phillips Logo"
          className="h-8"
        />
        <h1 className="text-2xl font-bold italic">Phillips Education</h1>
      </div>
      <button
        onClick={onThemeToggle}
        aria-label={lightMode ? "Switch to dark mode" : "Switch to light mode"}
        className="flex items-center justify-center w-10 h-10 text-foreground hover:bg-muted focus-visible:bg-muted transition-colors rounded-[--radius]"
      >
        {lightMode ? (
          <Moon className="w-5 h-5" />
        ) : (
          <Sun className="w-5 h-5" />
        )}
      </button>
    </header>
  );
}
