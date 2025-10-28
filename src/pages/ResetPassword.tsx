import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

export const ResetPasswordPage: React.FC = () => {
  const [password, setPassword] = useState("");
  const [hasSession, setHasSession] = useState<
    boolean | null
  >(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    const checkSession = async () => {
      try {
        // Try to extract and store a session from the URL if available.
        if (
          typeof (supabase.auth as any)
            .getSessionFromUrl === "function"
        ) {
          try {
            // Let SDK try to consume tokens from URL and store the session
            await (supabase.auth as any).getSessionFromUrl({
              storeSession: true,
            });
          } catch (e) {
            console.debug(
              "getSessionFromUrl not available or failed:",
              e
            );
          }
        }
      } catch (outerErr) {
        // ignore
      }
      // Debug: show current URL and any params so we can diagnose redirect issues
      try {
        console.debug(
          "ResetPassword URL:",
          window.location.href
        );
        const parseParams = (str: string) =>
          Object.fromEntries(
            str
              .replace(/^#|^\?/g, "")
              .split("&")
              .filter(Boolean)
              .map((p) =>
                p.split("=").map(decodeURIComponent)
              )
          );
        const hashParams = parseParams(
          window.location.hash || ""
        );
        const queryParams = parseParams(
          window.location.search || ""
        );
        console.debug(
          "ResetPassword params: hash=",
          hashParams,
          "query=",
          queryParams
        );
      } catch (dbgErr) {
        // ignore
      }
      try {
        // First, ask the client SDK if a session is available
        const resp = await supabase.auth.getSession();
        let session = resp?.data?.session ?? null;

        // If SDK didn't restore a session automatically, try manual fallback:
        // parse tokens from the URL (hash or query) and call setSession when available.
        if (!session) {
          const parseParams = (str: string) =>
            Object.fromEntries(
              str
                .replace(/^#|^\?/g, "")
                .split("&")
                .filter(Boolean)
                .map((p) =>
                  p.split("=").map(decodeURIComponent)
                )
            );

          const hashParams = parseParams(
            window.location.hash || ""
          );
          const queryParams = parseParams(
            window.location.search || ""
          );
          const params = {
            ...queryParams,
            ...hashParams,
          } as Record<string, string>;

          const access_token =
            params.access_token ||
            params.accessToken ||
            params.accessToken;
          const refresh_token =
            params.refresh_token ||
            params.refreshToken ||
            params.refresh_token;

          if (
            access_token &&
            typeof (supabase.auth as any).setSession ===
              "function"
          ) {
            try {
              await (supabase.auth as any).setSession({
                access_token,
                refresh_token,
              });
              const newResp =
                await supabase.auth.getSession();
              session = newResp?.data?.session ?? null;
              console.debug(
                "setSession fallback success, session present:",
                !!session
              );
            } catch (setErr) {
              console.debug(
                "setSession fallback failed:",
                setErr
              );
            }
          } else {
            console.debug(
              "No access_token in URL or setSession not available; cannot restore session automatically."
            );
          }
        }

        if (mounted) setHasSession(!!session);
      } catch (err) {
        console.error(
          "Error checking/creating session:",
          err
        );
        if (mounted) setHasSession(false);
      }
    };

    checkSession();

    return () => {
      mounted = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast({
        title: "Senha muito curta",
        description:
          "A senha deve ter ao menos 8 caracteres.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });
      if (error) throw error;

      toast({
        title: "Senha alterada",
        description:
          "Sua senha foi atualizada com sucesso. Faça login com a nova senha.",
      });
      navigate("/", { replace: true });
    } catch (err: any) {
      console.error("Reset password error:", err);
      toast({
        title: "Erro ao redefinir senha",
        description:
          err?.message ||
          "Não foi possível alterar a senha.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Redefinir senha</CardTitle>
            <CardDescription>
              Insira sua nova senha. Se você abriu este link
              a partir do email de recuperação, a sessão
              poderá já estar ativa.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {hasSession === false && (
              <div className="mb-4 text-sm text-muted-foreground">
                Não detectamos uma sessão ativa. Verifique
                se você abriu o link de redefinição
                diretamente a partir do email que recebeu.
                Se o link estiver inválido, solicite um novo
                email através da tela de login.
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              <div>
                <Label htmlFor="newPassword">
                  Nova senha
                </Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  placeholder="Nova senha (mínimo 8 caracteres)"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? "Salvando..."
                    : "Salvar senha"}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => navigate(-1)}
                >
                  Voltar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
