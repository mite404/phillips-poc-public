import * as React from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

/* Collapse timing. Opening decelerates over --duration-surface; closing
   accelerates away in --duration-swap, ~50% of the enter, per contract rule 1.
   CSS picks the transition properties of the state being moved TO, so listing
   the open values under `group-data-[state=open]` gives each direction its own
   curve with no JS. */
const COLLAPSE_CLASS =
  "grid grid-rows-[0fr] invisible transition-[grid-template-rows,visibility] " +
  "duration-(--duration-swap) ease-exit " +
  "group-data-[state=open]:grid-rows-[1fr] group-data-[state=open]:visible " +
  "group-data-[state=open]:duration-(--duration-surface) group-data-[state=open]:ease-out";

const Accordion = AccordionPrimitive.Root;

const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item ref={ref} className={cn("border-b", className)} {...props} />
));
AccordionItem.displayName = "AccordionItem";

const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        "group flex flex-1 items-center justify-between py-4 text-sm font-medium transition-colors duration-(--duration-micro) ease-out hover:underline text-left",
        className,
      )}
      {...props}
    >
      {children}
      {/* Same split timing as the panel, so chevron and panel land together. */}
      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-(--duration-swap) ease-exit group-data-[state=open]:rotate-180 group-data-[state=open]:duration-(--duration-surface) group-data-[state=open]:ease-out" />
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
));
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName;

/**
 * Collapsible panel body for an `Accordion.Item`.
 *
 * Animates to intrinsic content height by transitioning a wrapper's
 * `grid-template-rows` from `0fr` to `1fr` - a transition, not a keyframe, so a
 * mid-flight reversal retargets from the current height instead of restarting.
 *
 * Two structural requirements, both load-bearing:
 *
 * 1. `forceMount`. Radix's `Presence` only defers unmount for a running CSS
 *    *animation*; it never observes transitions. Without `forceMount` the node
 *    is hidden and its children dropped on the same frame the state flips, so
 *    the closing transition has nothing left to animate. `invisible` above
 *    keeps the always-mounted collapsed body out of the a11y tree and out of
 *    tab order, and rides the same transition so it stays visible for the whole
 *    close.
 * 2. The transition lives on an inner wrapper, never on `Accordion.Content`
 *    itself. On every toggle Radix sets `style.transitionDuration = "0s"` on
 *    the content node and calls `getBoundingClientRect()`, which flushes style
 *    with the new `data-state` already applied - the transition completes
 *    inside that flush and the panel snaps. The wrapper is untouched by Radix.
 *
 * `overflow-hidden` sits on its own element between the grid and the padded
 * body: it zeroes the grid item's automatic minimum size (making `0fr` reach
 * true zero) and it must carry no padding, which would otherwise floor the
 * collapsed height at the padding total under `box-sizing: border-box`.
 */
const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content ref={ref} forceMount className="group text-sm" {...props}>
    <div className={COLLAPSE_CLASS}>
      <div className="overflow-hidden">
        <div className={cn("pb-4 pt-0", className)}>{children}</div>
      </div>
    </div>
  </AccordionPrimitive.Content>
));
AccordionContent.displayName = AccordionPrimitive.Content.displayName;

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
