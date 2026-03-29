import React, { useMemo, useState } from "react";
import {
  BookOpen,
  Bot,
  Home,
  Library,
  LogOut,
  Menu,
  PlusCircle,
  Search,
  Trophy,
  User,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { triggerHapticFeedback } from "@/lib/haptics";
import { useAuth } from "@/hooks/useAuth";
import { useResponsive } from "@/shared/utils/responsive";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export type NavigationPage =
  | "dashboard"
  | "social"
  | "ranking"
  | "profile"
  | "social-feed"
  | "search"
  | "library"
  | "copilot";

interface ResponsiveNavigationProps {
  currentPage: NavigationPage;
  onNavigate: (page: NavigationPage) => void;
  className?: string;
}

const navigationItems = [
  {
    id: "social-feed" as NavigationPage,
    label: "Início",
    icon: Home,
    description: "Feed e ranking",
  },
  {
    id: "search" as NavigationPage,
    label: "Buscar",
    icon: Search,
    description: "Livros e usuários",
  },
  {
    id: "library" as NavigationPage,
    label: "Biblioteca",
    icon: Library,
    description: "Sua coleção",
  },
  {
    id: "copilot" as NavigationPage,
    label: "Copiloto",
    icon: Bot,
    description: "Chat de leitura IA",
  },
  {
    id: "profile" as NavigationPage,
    label: "Perfil",
    icon: User,
    description: "Conta e progresso",
  },
];

const Brand = ({ compact = false }: { compact?: boolean }) => (
  <div className="select-none">
    <div className="flex items-center gap-2">
      <BookOpen className={cn("text-primary", compact ? "h-4 w-4" : "h-5 w-5")} />
      <span
        className={cn(
          "font-display font-semibold tracking-[-0.02em]",
          compact ? "text-lg" : "text-xl",
        )}
      >
        ReadQuest
      </span>
    </div>
  </div>
);

const ResponsiveNavigation = ({
  currentPage,
  onNavigate,
  className,
}: ResponsiveNavigationProps) => {
  const { isMobile, isDesktop } = useResponsive();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const activePage = useMemo(() => {
    if (["dashboard", "social"].includes(currentPage)) return "social-feed";
    if (currentPage === "ranking") return "social-feed";
    return currentPage;
  }, [currentPage]);

  const handleNavigate = (page: NavigationPage) => {
    onNavigate(page);
    setIsSheetOpen(false);
  };

  const goToRanking = () => {
    onNavigate("ranking");
    setIsSheetOpen(false);
  };

  const goToAddPages = () => {
    navigate("/library#add-pages");
    setIsSheetOpen(false);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } finally {
      navigate("/");
    }
  };

  const renderNavButton = (item: (typeof navigationItems)[number], compact = false) => {
    const Icon = item.icon;
    const isActive = activePage === item.id;

    return (
      <button
        key={item.id}
        onClick={() => handleNavigate(item.id)}
        onPointerDown={() => triggerHapticFeedback()}
        className={cn(
          navigationMenuTriggerStyle(),
          "relative gap-2 bg-transparent",
          compact ? "h-auto px-3 py-2 text-xs" : "px-4",
          isActive
            ? "bg-primary text-primary-foreground hover:bg-primary/90"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
      >
        <Icon className="h-4 w-4" />
        <span>{item.label}</span>
      </button>
    );
  };

  if (isDesktop) {
    return (
      <header
        className={cn(
          "glass-nav safe-area-pt fixed left-0 right-0 top-0 z-50 border-b border-border/50",
          className,
        )}
      >
        <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4">
          <Brand />

          <NavigationMenu>
            <NavigationMenuList className="gap-1">
              {navigationItems.map((item) => (
                <NavigationMenuItem key={item.id}>{renderNavButton(item)}</NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToRanking}>
              <Trophy className="mr-2 h-4 w-4" />
              Ranking
            </Button>
            <Button size="sm" onClick={goToAddPages}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar páginas
            </Button>
            <ThemeToggle compact />
            <Button variant="ghost" size="sm" onClick={() => setShowLogoutConfirm(true)}>
              Sair
            </Button>
          </div>
        </div>

        <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar saída</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja sair da sua conta?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={handleSignOut}
              >
                Sair
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </header>
    );
  }

  return (
    <>
      <header
        className={cn(
          "glass-nav safe-area-pt fixed left-0 right-0 top-0 z-50 border-b border-border/50",
          className,
        )}
      >
        <div className="flex h-14 items-center justify-between px-4 sm:h-16 sm:px-6">
          <Brand compact={isMobile} />

          <div className="flex items-center gap-2">
            <ThemeToggle compact />

            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label="Abrir menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side={isMobile ? "left" : "right"} className="w-[320px] p-0">
                <SheetHeader className="border-b border-border px-4 py-4">
                  <SheetTitle>
                    <Brand />
                  </SheetTitle>
                </SheetHeader>

                <ScrollArea className="h-[calc(100vh-13rem)]">
                  <div className="space-y-2 p-4">
                    <Button
                      onClick={goToRanking}
                      variant="outline"
                      className="w-full justify-start"
                    >
                      <Trophy className="mr-2 h-4 w-4" />
                      Ver ranking agora
                    </Button>
                    <Button onClick={goToAddPages} className="w-full justify-start">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Adicionar páginas lidas
                    </Button>

                    {navigationItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = activePage === item.id;

                      return (
                        <button
                          key={item.id}
                          onClick={() => handleNavigate(item.id)}
                          onPointerDown={() => triggerHapticFeedback()}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-[var(--radius-md)] border px-3 py-3 text-left transition-colors",
                            isActive
                              ? "border-primary/40 bg-primary/10 text-primary"
                              : "border-border/70 bg-card text-foreground hover:bg-muted",
                          )}
                        >
                          <Icon className="h-5 w-5" />
                          <div>
                            <div className="font-medium">{item.label}</div>
                            <div className="text-xs text-muted-foreground">{item.description}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </ScrollArea>

                <div className="border-t border-border p-4">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setShowLogoutConfirm(true)}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair da conta
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {isMobile ? (
        <nav className="glass-nav safe-area-pb fixed bottom-0 left-0 right-0 z-50 border-t border-border/50">
          <div className="flex h-16 items-center justify-around px-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.id)}
                  onPointerDown={() => triggerHapticFeedback()}
                  className={cn(
                    "relative flex flex-col items-center gap-1 rounded-[var(--radius-lg)] px-4 py-2 transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {isActive ? (
                    <span className="absolute -top-0.5 left-1/2 h-0.5 w-5 -translate-x-1/2 rounded-full bg-primary" />
                  ) : null}
                  <Icon className="h-5 w-5" />
                  <span className="text-xs font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      ) : null}

      <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar saída</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja sair da sua conta?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleSignOut}
            >
              Sair
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ResponsiveNavigation;
