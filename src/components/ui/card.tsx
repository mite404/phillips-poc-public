import * as React from "react";

import { cn } from "@/lib/utils";

// Shared affordance for a Card that acts as a click target: shadow lift on
// hover, timed to the contract's micro duration so it feels immediate.
// Not a cva variant - there is no second option to select between, just one
// recipe reused at each call site via cn().
export const cardInteractiveClasses =
  "hover:shadow-md transition-shadow duration-(--duration-micro) ease-out cursor-pointer";

// Per-item entrance delay for a freshly-mounted list, index * --duration-stagger.
// Capped at 8 items (nth-9+ get no delay class, so they arrive immediately
// rather than noticeably late) - the cap the motion contract asks for,
// visible here rather than computed. `starting:` only fires when a node is
// newly inserted, so items that persist across a re-render (same key) never
// replay this - a filter change does not re-stagger what's already on
// screen, only genuinely new items.
const staggerDelayClasses =
  "starting:opacity-0 starting:translate-y-(--travel-md) " +
  "nth-2:delay-(--duration-stagger) " +
  "nth-3:delay-[calc(var(--duration-stagger)*2)] " +
  "nth-4:delay-[calc(var(--duration-stagger)*3)] " +
  "nth-5:delay-[calc(var(--duration-stagger)*4)] " +
  "nth-6:delay-[calc(var(--duration-stagger)*5)] " +
  "nth-7:delay-[calc(var(--duration-stagger)*6)] " +
  "nth-8:delay-[calc(var(--duration-stagger)*7)]";

// Card entrance stagger, combined with cardInteractiveClasses's hover-lift
// into ONE `transition-[...]` value with per-property timing. Tailwind (via
// tailwind-merge) keeps only the last `transition-*` utility applied to an
// element - stacking `transition-shadow` and a separate `transition-[opacity,
// translate]` class would have silently deleted one of them. box-shadow
// keeps cardInteractiveClasses's --duration-micro so the existing hover-lift
// feel is unchanged; opacity/translate use --duration-pop, the entrance
// duration for a small anchored surface.
export const staggerCardClasses =
  "[transition:box-shadow_var(--duration-micro)_var(--ease-out),opacity_var(--duration-pop)_var(--ease-out),translate_var(--duration-pop)_var(--ease-out)] " +
  staggerDelayClasses;

// Roster row entrance stagger, folded together with TableRow's built-in
// `hover:bg-muted/50` transition for the same reason as staggerCardClasses.
export const staggerRowClasses =
  "[transition:background-color_var(--duration-pop)_var(--ease-out),opacity_var(--duration-pop)_var(--ease-out),translate_var(--duration-pop)_var(--ease-out)] " +
  staggerDelayClasses;

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-[--radius] border bg-card-background text-card-foreground border-border",
        className,
      )}
      {...props}
    />
  ),
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-1.5 p-6", className)}
      {...props}
    />
  ),
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  ),
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
  ),
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
