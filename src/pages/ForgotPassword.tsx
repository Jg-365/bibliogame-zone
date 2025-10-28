import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
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

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email) {
      toast({
        title: "Informe um email",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    try {
      const { error } =
        await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
      if (error) throw error;
      toast({
        title: "Email enviado",
        description:
          "Verifique sua caixa de entrada para redefinir a senha.",
      });
      // Optionally navigate back to login
      navigate("/", { replace: true });
    } catch (err: any) {
      toast({
        title: "Erro ao enviar email",
        description: err?.message || String(err),
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Recuperar senha</CardTitle>
            <CardDescription>
              Informe o email cadastrado e enviaremos um
              link para redefinir sua senha.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSend}
              className="space-y-4"
            >
              <div>
                <Label htmlFor="forgotEmail">Email</Label>
                <Input
                  id="forgotEmail"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={isSending}>
                  {isSending
                    ? "Enviando..."
                    : "Enviar email"}
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

export default ForgotPasswordPage;
