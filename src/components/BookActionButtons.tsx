import React, { useEffect, useState } from "react";
import { Edit, Plus, Scan, Search, X } from "lucide-react";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useResponsive } from "@/shared/utils/responsive";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

interface BookActionButtonsProps {
  onAddBook?: () => void;
  onSearchBook?: () => void;
  onScanBook?: () => void;
  onManualAdd?: () => void;
  className?: string;
}

export const BookActionButtons: React.FC<BookActionButtonsProps> = ({
  onSearchBook,
  onScanBook,
  onManualAdd,
  className = "",
}) => {
  const { isMobile } = useResponsive();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    {
      id: "search",
      label: "Buscar livro",
      icon: Search,
      onClick: onSearchBook,
      description: "Pesquisar no catálogo",
    },
    {
      id: "scan",
      label: "Escanear ISBN",
      icon: Scan,
      onClick: onScanBook,
      description: "Adicionar pela câmera",
    },
    {
      id: "manual",
      label: "Adicionar manual",
      icon: Edit,
      onClick: onManualAdd,
      description: "Criar entrada personalizada",
    },
  ];

  const runAction = (action: (typeof actions)[0]) => {
    action.onClick?.();
    setIsOpen(false);
  };

  useEffect(() => {
    if (location.hash === "#add-pages" || location.search.includes("quick=add-pages")) {
      setIsOpen(true);
    }
  }, [location.hash, location.search]);

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button className="w-full justify-center sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Adicionar livro
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="rounded-t-[var(--radius-xl)] pb-8">
          <SheetHeader>
            <SheetTitle>Ações rápidas</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-2">
            {actions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  onClick={() => runAction(action)}
                  className="flex w-full items-center gap-3 rounded-[var(--radius-md)] border border-border/70 bg-card p-3 text-left transition-colors hover:bg-muted"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-medium">{action.label}</div>
                    <div className="text-xs text-muted-foreground">{action.description}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div className={cn("fixed bottom-6 right-6 z-40", className)}>
      <div className="relative">
        <div
          className={cn(
            "absolute bottom-16 right-0 space-y-3 transition-all duration-300",
            isOpen ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0",
          )}
        >
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <div key={action.id} className="flex items-center gap-3">
                <div className="glass-card rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium">
                  {action.label}
                </div>
                <Button
                  onClick={() => runAction(action)}
                  size="icon-lg"
                  className="rounded-full shadow-lg"
                >
                  <Icon className="h-5 w-5" />
                </Button>
              </div>
            );
          })}
        </div>

        <Button
          onClick={() => setIsOpen((prev) => !prev)}
          size="icon-lg"
          className={cn("rounded-full shadow-lg transition-transform", isOpen && "rotate-45")}
          aria-label={isOpen ? "Fechar ações" : "Abrir ações"}
        >
          {isOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
        </Button>
      </div>
    </div>
  );
};
