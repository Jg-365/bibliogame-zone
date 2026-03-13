import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const cardVariants = cva(
  // Base: consistent structure for all card types
  "rounded-[var(--radius-lg)] border text-card-foreground transition-all duration-[var(--duration-normal)] ease-[var(--easing-standard)]",
  {
    variants: {
      variant: {
        // Default — subtle surface, clean shadow
        default: "bg-card border-border shadow-card",

        // Glass — frosted glass effect
        glass:
          "bg-card/70 border-border/60 shadow-card backdrop-blur-[12px] saturate-150 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md",

        // Elevated — higher contrast card
        elevated: "bg-card border-border shadow-md hover:-translate-y-1 hover:shadow-lg",

        // Accent — highlighted with primary color trim
        accent: "bg-card border-primary/30 shadow-glow/20",

        // Flat — no shadow, minimal
        flat: "bg-muted/40 border-border/50 shadow-none",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

type CardVariantProps = VariantProps<typeof cardVariants>;

interface CardProps extends React.HTMLAttributes<HTMLDivElement>, CardVariantProps {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, ...props }, ref) => (
    <div ref={ref} className={cn(cardVariants({ variant }), className)} {...props} />
  ),
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-5", className)} {...props} />
  ),
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, children, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn("text-lg font-semibold leading-snug tracking-[-0.01em]", className)}
      {...props}
    >
      {children}
    </h3>
  ),
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground leading-relaxed", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-5 pt-0", className)} {...props} />
  ),
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center p-5 pt-0", className)} {...props} />
  ),
);
CardFooter.displayName = "CardFooter";

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  cardVariants,
  type CardProps,
};
