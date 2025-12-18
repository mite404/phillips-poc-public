import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

export function SiteHeader() {
  return (
    <header className="sticky top-0 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <div className="flex flex-1 justify-center items-center gap-2">
        <img
          src="/assets/philips-corp-brand-mark.png"
          alt="Phillips Logo"
          className="h-8"
        />
        <h1 className="text-2xl font-bold italic">Phillips Education</h1>
      </div>
    </header>
  );
}
