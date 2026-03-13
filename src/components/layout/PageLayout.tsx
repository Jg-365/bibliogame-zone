import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, type LucideIcon } from "lucide-react";

const pageShellVariants = cva("cozy-background min-h-screen", {
  variants: {
    density: {
      compact: "py-4 sm:py-6",
      default: "py-6 sm:py-8",
      relaxed: "py-8 sm:py-10",
    },
  },
  defaultVariants: {
    density: "default",
  },
});

interface PageShellProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof pageShellVariants> {
  containerClassName?: string;
}

export const PageShell = React.forwardRef<HTMLDivElement, PageShellProps>(
  ({ className, containerClassName, density, children, ...props }, ref) => (
    <div ref={ref} className={cn(pageShellVariants({ density }), className)} {...props}>
      <div className={cn("container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8", containerClassName)}>
        {children}
      </div>
    </div>
  ),
);
PageShell.displayName = "PageShell";

interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
}

export const PageHeader = ({
  title,
  description,
  icon: Icon,
  actions,
  className,
  ...props
}: PageHeaderProps) => (
  <header
    className={cn(
      "glass-card texture-noise rounded-[var(--radius-xl)] p-5 sm:p-6 lg:p-7",
      "flex flex-col gap-4 border-border/60",
      className,
    )}
    {...props}
  >
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          {Icon ? (
            <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-primary/15 text-primary">
              <Icon className="h-5 w-5" />
            </div>
          ) : null}
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">{title}</h1>
        </div>
        {description ? (
          <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">{actions}</div>
      ) : null}
    </div>
  </header>
);

interface SectionProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

export const PageSection = ({
  title,
  description,
  action,
  className,
  children,
  ...props
}: SectionProps) => (
  <section className={cn("space-y-4", className)} {...props}>
    {title || description || action ? (
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          {title ? <h2 className="text-xl font-semibold tracking-tight">{title}</h2> : null}
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    ) : null}
    {children}
  </section>
);

interface StateCardProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  action?: { label: string; onClick: () => void };
  tone?: "default" | "danger";
}

export const StateCard = ({
  title,
  description,
  icon: Icon,
  action,
  tone = "default",
}: StateCardProps) => (
  <Card className="border-dashed">
    <CardHeader className="text-center">
      <div
        className={cn(
          "mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full",
          tone === "danger"
            ? "bg-destructive/15 text-destructive"
            : "bg-muted text-muted-foreground",
        )}
      >
        {Icon ? <Icon className="h-6 w-6" /> : <AlertTriangle className="h-6 w-6" />}
      </div>
      <CardTitle>{title}</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4 text-center">
      <p className="text-sm text-muted-foreground">{description}</p>
      {action ? (
        <Button onClick={action.onClick} variant={tone === "danger" ? "destructive" : "default"}>
          {action.label}
        </Button>
      ) : null}
    </CardContent>
  </Card>
);
