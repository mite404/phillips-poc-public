import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

/* Modal exit runs at ~60% of its enter, per contract rule 1 - written as
   `calc(var(--duration-surface)*0.6)` rather than a hand-typed "190ms" so it
   stays correct if that token ever changes, and so it still shortens under
   reduced motion once --duration-surface collapses to --duration-micro. The
   expression is repeated as a literal (not a shared JS constant) because
   Tailwind extracts candidate classes by scanning this file's source text
   for whole class names - a class built from a template-literal variable
   never appears as literal text here, so Tailwind never sees it and emits no
   CSS for it. The transition and the exit-gate animation below both need the
   same duration so the node unmounts exactly when the fade finishes. */
const DIALOG_OVERLAY_MOTION_CLASS =
  "opacity-100 transition-[opacity] duration-(--duration-surface) ease-out " +
  "starting:opacity-0 " +
  "data-[state=closed]:opacity-0 data-[state=closed]:duration-[calc(var(--duration-surface)*0.6)] data-[state=closed]:ease-exit " +
  "data-[state=closed]:[animation:exit-gate_calc(var(--duration-surface)*0.6)_linear]"

/* Dialog is the documented exception to "motion has an origin" - centred is
   correct, so this only scales and fades, never translates. The pre-existing
   keyframes also carried a ~48%-of-height vertical drop, composed through
   the plugin's shared enter/exit transform machinery; reproducing that on
   top of the permanent `-translate-x/y-1/2` centering would mean stacking
   two offsets into one `translate` property by hand. Dropped: the contract's
   own target table for Dialog asks only for a scale-in and does not mention
   a slide, and "centred is correct" reads as being about the resting
   position, not a vertical approach to it. */
const DIALOG_CONTENT_MOTION_CLASS =
  "opacity-100 scale-100 transition-[opacity,scale] duration-(--duration-surface) ease-out " +
  "starting:opacity-0 starting:scale-(--scale-in) " +
  "data-[state=closed]:opacity-0 data-[state=closed]:scale-(--scale-in) data-[state=closed]:duration-[calc(var(--duration-surface)*0.6)] data-[state=closed]:ease-exit " +
  "data-[state=closed]:[animation:exit-gate_calc(var(--duration-surface)*0.6)_linear]"

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80",
      DIALOG_OVERLAY_MOTION_CLASS,
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 border bg-background p-6 shadow-lg sm:rounded-lg",
        DIALOG_CONTENT_MOTION_CLASS,
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
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
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
