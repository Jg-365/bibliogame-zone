import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const progressVariants = cva("relative w-full overflow-hidden rounded-full bg-muted", {
  variants: {
    size: {
      xs: "h-1",
      sm: "h-1.5",
      default: "h-2",
      md: "h-2.5",
      lg: "h-3",
    },
    color: {
      primary: "",
      success: "",
      accent: "",
    },
  },
  defaultVariants: { size: "default", color: "primary" },
});

const indicatorColorMap: Record<string, string> = {
  primary: "bg-gradient-primary",
  success: "bg-gradient-success",
  accent: "bg-gradient-gold",
};

interface ProgressProps
  extends
    React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>,
    VariantProps<typeof progressVariants> {
  showLabel?: boolean;
  animated?: boolean;
}

const Progress = React.forwardRef<React.ElementRef<typeof ProgressPrimitive.Root>, ProgressProps>(
  (
    { className, value, size, color = "primary", showLabel = false, animated = true, ...props },
    ref,
  ) => {
    const pct = value ?? 0;
    const indicatorClass = indicatorColorMap[color ?? "primary"];
    const nearComplete = pct >= 95;

    return (
      <div className={cn("w-full", showLabel && "flex items-center gap-3")}>
        <ProgressPrimitive.Root
          ref={ref}
          className={cn(progressVariants({ size, color }), className)}
          {...props}
        >
          <ProgressPrimitive.Indicator
            className={cn(
              "h-full w-full flex-1",
              indicatorClass,
              animated && "transition-transform duration-500 ease-out",
              nearComplete && animated && "animate-pulse-glow",
            )}
            style={{
              transform: `translateX(-${100 - pct}%)`,
            }}
          />
        </ProgressPrimitive.Root>

        {showLabel && (
          <span
            className="shrink-0 text-xs font-mono font-medium text-muted-foreground w-9 text-right tabular-nums"
            data-stat
          >
            {Math.round(pct)}%
          </span>
        )}
      </div>
    );
  },
);
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
