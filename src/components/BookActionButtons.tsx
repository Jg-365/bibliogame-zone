import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { useResponsive } from "@/shared/utils/responsive";
import { Plus, Search, Scan, Edit, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BookActionButtonsProps {
  onAddBook?: () => void;
  onSearchBook?: () => void;
  onScanBook?: () => void;
  onManualAdd?: () => void;
  className?: string;
}

export const BookActionButtons: React.FC<BookActionButtonsProps> = ({
  onAddBook,
  onSearchBook,
  onScanBook,
  onManualAdd,
  className = "",
}) => {
  const { isMobile } = useResponsive();
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    {
      id: "search",
      label: "Buscar Livro",
      icon: Search,
      onClick: onSearchBook,
      description: "Procurar na base de dados",
    },
    {
      id: "scan",
      label: "Escanear ISBN",
      icon: Scan,
      onClick: onScanBook,
      description: "Usar câmera para escanear",
    },
    {
      id: "manual",
      label: "Adicionar Manual",
      icon: Edit,
      onClick: onManualAdd,
      description: "Criar entrada personalizada",
    },
  ];

  const handleActionClick = (action: (typeof actions)[0]) => {
    action.onClick?.();
    setIsOpen(false);
  };

  if (isMobile) {
    return (
      <>
        {/* Backdrop */}
        {isOpen && (
          <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setIsOpen(false)} />
        )}

        {/* Mobile Action Sheet */}
        <div
          className={cn(
            "fixed bottom-20 left-4 right-4 z-50 transition-all duration-300",
            isOpen ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none",
            className
          )}
        >
          <div className="bg-background rounded-lg border shadow-lg p-4 space-y-3">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Adicionar Livro</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {actions.map(action => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  onClick={() => handleActionClick(action)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors text-left"
                >
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-100 text-blue-700 border border-blue-200 rounded-lg flex items-center justify-center">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{action.label}</div>
                    <div className="text-xs text-slate-600 font-medium">{action.description}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Trigger function for mobile navbar */}
        <div className="hidden">
          <button onClick={() => setIsOpen(true)} id="mobile-add-book-trigger" />
        </div>
      </>
    );
  }

  // Desktop floating action button
  return (
    <div className={cn("fixed bottom-6 right-6 z-40", className)}>
      <div className="relative">
        {/* Action buttons */}
        <div
          className={cn(
            "absolute bottom-16 right-0 space-y-3 transition-all duration-300",
            isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
          )}
        >
          {actions.map(action => {
            const Icon = action.icon;
            return (
              <div key={action.id} className="flex items-center gap-3">
                <div className="bg-background text-foreground px-3 py-2 rounded-lg text-sm font-medium shadow-lg border whitespace-nowrap">
                  {action.label}
                </div>
                <Button
                  onClick={() => handleActionClick(action)}
                  size="sm"
                  className="h-12 w-12 rounded-full shadow-lg bg-slate-700 hover:bg-slate-800 text-white border-2 border-slate-800"
                >
                  <Icon className="h-5 w-5" />
                </Button>
              </div>
            );
          })}
        </div>

        {/* Main FAB */}
        <Button
          onClick={() => setIsOpen(!isOpen)}
          size="lg"
          className={cn(
            "h-14 w-14 rounded-full shadow-lg transition-all duration-300 bg-blue-600 hover:bg-blue-700 text-white border-2 border-blue-700",
            isOpen && "rotate-45"
          )}
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
};
