import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";
import { useId } from "react";

// Context to share the generated description id between DialogContent and DialogDescription
const DialogDescContext = React.createContext<
  string | null
>(null);

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<
    typeof DialogPrimitive.Overlay
  >
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
));
DialogOverlay.displayName =
  DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<
    typeof DialogPrimitive.Content
  >
>(({ className, children, ...props }, ref) => {
  // Helper to find if children contains a DialogDescription element (recursively)
  const hasDescription = (
    nodes: React.ReactNode
  ): boolean => {
    const arr = React.Children.toArray(nodes);
    for (const node of arr) {
      if (!React.isValidElement(node)) continue;
      const type: any = (node as any).type;
      if (
        type === DialogPrimitive.Description ||
        type === DialogDescription ||
        type?.displayName === DialogDescription.displayName
      ) {
        return true;
      }
      if ((node as any).props?.children) {
        if (hasDescription((node as any).props.children))
          return true;
      }
    }
    return false;
  };

  const descriptionId = useId();
  const shouldDescribe = hasDescription(children);

  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
          className
        )}
        {...props}
        // Only set aria-describedby when we detected a DialogDescription in the children
        aria-describedby={
          shouldDescribe ? descriptionId : undefined
        }
      >
        <DialogDescContext.Provider
          value={shouldDescribe ? descriptionId : null}
        >
          {children}
          {/* If there is no DialogDescription provided by the consumer, render a visually-hidden
                fallback description element so aria-describedby references a valid element and
                accessibility/runtime warnings are avoided. */}
          {!shouldDescribe && (
            <DialogPrimitive.Description
              id={descriptionId}
              className="sr-only"
            >
              {/* empty intentionally */}
            </DialogPrimitive.Description>
          )}
        </DialogDescContext.Provider>
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity data-[state=open]:bg-accent data-[state=open]:text-muted-foreground hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  );
});
DialogContent.displayName =
  DialogPrimitive.Content.displayName;

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
);
DialogHeader.displayName = "DialogHeader";

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
);
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<
    typeof DialogPrimitive.Title
  >
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<
    typeof DialogPrimitive.Description
  >
>(({ className, ...props }, ref) => {
  const descId = React.useContext(DialogDescContext);
  return (
    <DialogPrimitive.Description
      id={descId ?? undefined}
      ref={ref}
      className={cn(
        "text-sm text-muted-foreground",
        className
      )}
      {...props}
    />
  );
});
DialogDescription.displayName =
  DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
