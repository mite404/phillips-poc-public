import { cva, type VariantProps } from "class-variance-authority";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-[color,background-color,border-color,scale] duration-(--duration-micro) ease-out active:scale-(--scale-press) active:duration-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/70",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/70",
        outline: "border border-primary bg-background text-primary hover:bg-primary/20",
        secondary: "bg-primary text-primary-foreground hover:bg-primary/70",
        ghost: "text-primary hover:bg-primary/20",
        // Renders as inline text, so a depress reads as a glitch rather than a press.
        // scale-100 (not transform) so it cancels the base rule instead of composing with it.
        link: "text-primary underline-offset-4 hover:underline active:scale-100",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-10 px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export type ButtonVariantsProps = VariantProps<typeof buttonVariants>;
