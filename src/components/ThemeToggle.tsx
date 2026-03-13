import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
  compact?: boolean;
}

export const ThemeToggle = ({ className, compact = false }: ThemeToggleProps) => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const activeTheme = theme === "system" ? resolvedTheme : theme;
  const isDark = activeTheme === "dark";

  return (
    <Button
      variant="outline"
      size={compact ? "icon-sm" : "sm"}
      className={cn("relative overflow-hidden", className)}
      aria-label={isDark ? "Ativar tema claro" : "Ativar tema escuro"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      <Sun
        className={cn(
          "h-4 w-4 transition-transform duration-300",
          isDark ? "-rotate-90 scale-0" : "rotate-0 scale-100",
        )}
      />
      <Moon
        className={cn(
          "absolute h-4 w-4 transition-transform duration-300",
          isDark ? "rotate-0 scale-100" : "rotate-90 scale-0",
        )}
      />
      {!compact ? <span className="ml-2">{isDark ? "Claro" : "Escuro"}</span> : null}
    </Button>
  );
};
