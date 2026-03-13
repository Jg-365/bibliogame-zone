import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { triggerHapticFeedback } from "@/lib/haptics";

const buttonVariants = cva(
  // Base: shared across all variants
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "text-sm font-medium select-none",
    "rounded-[var(--radius-md)]",
    "transition-all duration-[var(--duration-fast)] ease-[var(--easing-standard)]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-40",
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
    "active:scale-[0.97]",
  ].join(" "),
  {
    variants: {
      variant: {
        // Primary — violet fill with glow on hover
        default:
          "bg-primary text-primary-foreground shadow-sm hover:bg-primary-hover hover:shadow-glow",

        // Destructive — crimson fill
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/85 hover:shadow-[0_0_20px_hsl(var(--destructive)/0.35)]",

        // Outline — bordered, fills on hover
        outline:
          "border border-border bg-transparent text-foreground hover:bg-muted hover:border-primary/40",

        // Secondary — muted fill
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/70",

        // Ghost — transparent, subtle
        ghost: "bg-transparent text-foreground hover:bg-muted/60 hover:text-foreground",

        // Link
        link: "bg-transparent text-primary underline-offset-4 hover:underline p-0 h-auto",

        // Success — emerald fill
        success:
          "bg-success text-success-foreground shadow-sm hover:bg-success-hover hover:shadow-emerald",

        // Accent — amber fill (achievements)
        accent:
          "bg-accent text-accent-foreground shadow-sm hover:bg-accent-hover hover:shadow-amber",

        // Glass — glassmorphism surface button
        glass: "glass-card text-foreground hover:border-primary/40 hover:shadow-glow",
      },
      size: {
        default: "h-10 px-4 py-2",
        xs: "h-7 px-2.5 py-1 text-xs rounded-[var(--radius-sm)]",
        sm: "h-9 px-3 py-1.5",
        lg: "h-11 px-6 py-2.5 text-base",
        xl: "h-12 px-8 py-3 text-base",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
        "icon-lg": "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    const { onPointerDown, ...restProps } = props;
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        onPointerDown={(event: React.PointerEvent<HTMLButtonElement>) => {
          triggerHapticFeedback();
          onPointerDown?.(event);
        }}
        {...restProps}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
