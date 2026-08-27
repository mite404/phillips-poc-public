import { cva, type VariantProps } from "class-variance-authority";

export const sidebarMenuButtonVariants = cva(
  // `active:scale-100` is a deliberate opt-OUT, not a no-op. `index.css` has a
  // global `button:active:not(:disabled) { scale: var(--scale-press) }` in
  // `@layer base` that reaches every button in the app, so simply omitting a
  // press utility here does NOT stop the shrink - it only stops it easing.
  // Measured: with the utility absent, a pressed row computes `scale: 0.97`.
  // Cancelling it needs a real utility, because utilities outrank `@layer base`.
  // This is the same escape hatch `button-variants.ts` uses for `link`.
  //
  // Why cancel it at all: a sidebar row already answers the click twice - it
  // tints to `sidebar-accent` on `:active`, and either the chevron twirls or the
  // page behind it swaps. A third signal on the same press reads as the text
  // flinching. Do not "restore" press scale for consistency with other buttons.
  "peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-none ring-sidebar-ring transition-[width,height,padding] duration-(--duration-micro) ease-out active:scale-100 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-2 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        outline:
          "bg-background shadow-[0_0_0_1px_hsl(var(--sidebar-border))] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-[0_0_0_1px_hsl(var(--sidebar-accent))]",
      },
      size: {
        default: "h-8 text-sm",
        sm: "h-7 text-xs",
        lg: "h-12 text-sm group-data-[collapsible=icon]:!p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export type SidebarMenuButtonVariantsProps = VariantProps<
  typeof sidebarMenuButtonVariants
>;
