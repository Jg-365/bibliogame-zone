import { useEffect } from "react";
import { useAuth } from "./useAuth";

/**
 * Hook que monitora constantemente se a conta foi deletada
 * e força logout imediato se detectar que a conta não existe mais
 */
export function useAccountGuard() {
  const { user, checkAccountStatus } = useAuth();

  useEffect(() => {
    if (!user) return;
    const isOffline = () => typeof navigator !== "undefined" && !navigator.onLine;
    const runCheck = () => {
      if (isOffline()) return;
      void checkAccountStatus();
    };

    // Verifica imediatamente ao montar
    runCheck();

    // Verifica a cada 30 segundos se a conta ainda existe
    const interval = setInterval(() => {
      runCheck();
    }, 30000); // 30 segundos

    // Verifica quando a aba volta a ter foco
    const handleFocus = () => {
      runCheck();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [user, checkAccountStatus]);
}
