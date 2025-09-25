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

    // Verifica imediatamente ao montar
    checkAccountStatus();

    // Verifica a cada 30 segundos se a conta ainda existe
    const interval = setInterval(() => {
      checkAccountStatus();
    }, 30000); // 30 segundos

    // Verifica quando a aba volta a ter foco
    const handleFocus = () => {
      checkAccountStatus();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [user, checkAccountStatus]);
}
