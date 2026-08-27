import * as React from "react"
import * as SheetPrimitive from "@radix-ui/react-dialog"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const Sheet = SheetPrimitive.Root

const SheetTrigger = SheetPrimitive.Trigger

const SheetClose = SheetPrimitive.Close

const SheetPortal = SheetPrimitive.Portal

/* Same exit-gate need as Dialog (see index.css and dialog.tsx): Presence only
   defers unmount for a real `animation`, never a `transition`, so the fade
   below pairs each transition with a matching `exit-gate` run. Sheet's own
   contract row is travel (460ms) in / surface (320ms) out on --ease-drawer /
   --ease-exit, one step slower than Dialog's since a sheet crosses more of
   the viewport. */
const SHEET_OVERLAY_MOTION_CLASS =
  "opacity-100 transition-[opacity] duration-(--duration-travel) ease-drawer " +
  "starting:opacity-0 " +
  "data-[state=closed]:opacity-0 data-[state=closed]:duration-(--duration-surface) data-[state=closed]:ease-exit " +
  "data-[state=closed]:[animation:exit-gate_var(--duration-surface)_linear]"

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay
    className={cn("fixed inset-0 z-50 bg-black/80", SHEET_OVERLAY_MOTION_CLASS, className)}
    {...props}
    ref={ref}
  />
))
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName

/* Sheet lives on an edge, so contract rule 3 puts its origin there too - a
   pure `translate`, never a scale, sliding fully off-screen and back rather
   than nudging by `--travel-md`. `starting:` and `data-[state=closed]:` carry
   the identical off-screen offset per side: `starting:` seeds where the
   enter transition begins, `data-[state=closed]:` is where the exit ends -
   the original also slid all the way back out on close, per side, so this
   keeps that instead of fading in place. */
const sheetVariants = cva(
  "fixed z-50 gap-4 bg-background p-6 shadow-lg translate-x-0 translate-y-0 " +
    "transition-[translate] duration-(--duration-travel) ease-drawer " +
    "data-[state=closed]:duration-(--duration-surface) data-[state=closed]:ease-exit " +
    "data-[state=closed]:[animation:exit-gate_var(--duration-surface)_linear]",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 border-b starting:-translate-y-(--travel-sheet) data-[state=closed]:-translate-y-(--travel-sheet)",
        bottom:
          "inset-x-0 bottom-0 border-t starting:translate-y-(--travel-sheet) data-[state=closed]:translate-y-(--travel-sheet)",
        left: "inset-y-0 left-0 h-full w-3/4 border-r starting:-translate-x-(--travel-sheet) data-[state=closed]:-translate-x-(--travel-sheet) sm:max-w-sm",
        right:
          "inset-y-0 right-0 h-full w-3/4 border-l starting:translate-x-(--travel-sheet) data-[state=closed]:translate-x-(--travel-sheet) sm:max-w-sm",
      },
    },
    defaultVariants: {
      side: "right",
    },
  }
)

interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>,
    VariantProps<typeof sheetVariants> {}

const SheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  SheetContentProps
>(({ side = "right", className, children, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <SheetPrimitive.Content
      ref={ref}
      className={cn(sheetVariants({ side }), className)}
      {...props}
    >
      <SheetPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </SheetPrimitive.Close>
      {children}
    </SheetPrimitive.Content>
  </SheetPortal>
))
SheetContent.displayName = SheetPrimitive.Content.displayName

const SheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-2 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
SheetHeader.displayName = "SheetHeader"

const SheetFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
SheetFooter.displayName = "SheetFooter"

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold text-foreground", className)}
    {...props}
  />
))
SheetTitle.displayName = SheetPrimitive.Title.displayName

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
SheetDescription.displayName = SheetPrimitive.Description.displayName

export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
