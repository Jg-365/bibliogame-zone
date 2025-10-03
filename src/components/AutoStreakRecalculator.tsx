import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGlobalStreakRecalculator } from "@/hooks/useGlobalStreakRecalculator";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { RefreshCw, CheckCircle, AlertCircle } from "lucide-react";

export const AutoStreakRecalculator = () => {
  const { user } = useAuth();
  const { recalculateAllUserStreaks } = useGlobalStreakRecalculator();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<"idle" | "running" | "completed" | "error">("idle");
  const [hasRun, setHasRun] = useState(false);

  useEffect(() => {
    if (user && !hasRun) {
      const runRecalculation = async () => {
        setStatus("running");
        try {
          await recalculateAllUserStreaks();

          // Invalidar queries para atualizar dados
          queryClient.invalidateQueries({ queryKey: ["rankings"] });
          queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
          queryClient.invalidateQueries({ queryKey: ["profile"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });

          setStatus("completed");
          setHasRun(true);

          // Auto-hide after 3 seconds
          setTimeout(() => {
            setStatus("idle");
          }, 3000);
        } catch (error) {
          console.error("Erro no recálculo automático:", error);
          setStatus("error");

          // Auto-hide error after 5 seconds
          setTimeout(() => {
            setStatus("idle");
          }, 5000);
        }
      };

      // Executar com um pequeno delay para não afetar o carregamento inicial
      const timer = setTimeout(runRecalculation, 2000);

      return () => clearTimeout(timer);
    }
  }, [user, hasRun, recalculateAllUserStreaks]);

  if (status === "idle") {
    return null;
  }

  const getStatusIcon = () => {
    switch (status) {
      case "running":
        return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case "running":
        return "Recalculando sequências de todos os usuários...";
      case "completed":
        return "✅ Sequências recalculadas com sucesso!";
      case "error":
        return "❌ Erro ao recalcular sequências";
      default:
        return "";
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "running":
        return "border-blue-200 bg-blue-50 text-blue-700";
      case "completed":
        return "border-green-200 bg-green-50 text-green-700";
      case "error":
        return "border-red-200 bg-red-50 text-red-700";
      default:
        return "";
    }
  };

  return (
    <Card className={`${getStatusColor()} border-2`}>
      <CardContent className="p-3">
        <div className="flex items-center space-x-3">
          {getStatusIcon()}
          <span className="text-sm font-medium">{getStatusMessage()}</span>
        </div>
      </CardContent>
    </Card>
  );
};
