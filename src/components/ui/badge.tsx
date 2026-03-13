import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  [
    "inline-flex items-center gap-1 rounded-full border",
    "px-2.5 py-0.5 text-xs font-semibold",
    "transition-colors duration-[var(--duration-fast)]",
    "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
    "select-none",
  ].join(" "),
  {
    variants: {
      variant: {
        // Standard semantic variants
        default: "border-transparent bg-primary/15 text-primary hover:bg-primary/25",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/70",
        destructive:
          "border-transparent bg-destructive/15 text-destructive hover:bg-destructive/25",
        success: "border-transparent bg-success/15 text-success hover:bg-success/25",
        accent:
          "border-transparent bg-accent/15 text-amber-600 dark:text-accent hover:bg-accent/25",
        outline: "border-border text-foreground bg-transparent",
        muted: "border-transparent bg-muted text-muted-foreground",

        // Rarity tiers for achievements
        common: "border-slate-500/30 bg-slate-500/10 text-slate-400",
        rare: "border-violet-500/30 bg-violet-500/10 text-violet-400",
        epic: "border-transparent bg-gradient-rarity-epic text-white shadow-[0_2px_8px_hsl(265_63%_46%/0.3)]",
        legendary: "border-transparent bg-gradient-rarity-legendary text-white shadow-amber",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
