import React, { useEffect, useMemo, useState } from "react";
import { PauseCircle, PlayCircle, TimerReset } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { triggerHapticFeedback } from "@/lib/haptics";

interface FocusTimerCardProps {
  defaultMinutes?: number;
}

export const FocusTimerCard = ({ defaultMinutes = 25 }: FocusTimerCardProps) => {
  const totalSeconds = defaultMinutes * 60;
  const [remainingSeconds, setRemainingSeconds] = useState(totalSeconds);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          triggerHapticFeedback(30);
          setRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [running]);

  const progress = useMemo(
    () => Math.round(((totalSeconds - remainingSeconds) / totalSeconds) * 100),
    [remainingSeconds, totalSeconds],
  );

  const mm = String(Math.floor(remainingSeconds / 60)).padStart(2, "0");
  const ss = String(remainingSeconds % 60).padStart(2, "0");

  return (
    <Card className="border-border/70">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Modo foco</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <div className="text-center">
          <p className="font-mono text-3xl font-bold">
            {mm}:{ss}
          </p>
          <p className="text-xs text-muted-foreground">timer de leitura ({defaultMinutes} min)</p>
        </div>
        <Progress value={progress} className="h-2" />
        <div className="grid grid-cols-2 gap-2">
          <Button
            size="sm"
            variant={running ? "secondary" : "default"}
            onClick={() => {
              triggerHapticFeedback(12);
              setRunning((prev) => !prev);
            }}
          >
            {running ? (
              <>
                <PauseCircle className="mr-2 h-4 w-4" />
                Pausar
              </>
            ) : (
              <>
                <PlayCircle className="mr-2 h-4 w-4" />
                Iniciar
              </>
            )}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              triggerHapticFeedback(10);
              setRunning(false);
              setRemainingSeconds(totalSeconds);
            }}
          >
            <TimerReset className="mr-2 h-4 w-4" />
            Resetar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
