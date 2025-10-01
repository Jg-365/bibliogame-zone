import { useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import {
  isValidEmail,
  isValidPassword,
} from "@/shared/utils";
import type { AsyncAction } from "@/shared/types";

interface SignUpData {
  email: string;
  password: string;
  fullName: string;
}

interface SignInData {
  email: string;
  password: string;
}

interface AuthFormHooks {
  signUp: AsyncAction<void>;
  signIn: AsyncAction<void>;
  resetPassword: AsyncAction<void>;
  validateSignUp: (data: SignUpData) => string | null;
  validateSignIn: (data: SignInData) => string | null;
}

export const useAuthForm = (): AuthFormHooks => {
  const { signUp, signIn, resetPassword } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateSignUp = (
    data: SignUpData
  ): string | null => {
    if (!data.fullName.trim()) {
      return "Nome completo é obrigatório";
    }
    if (!isValidEmail(data.email)) {
      return "Email inválido";
    }
    if (!isValidPassword(data.password)) {
      return "Senha deve ter pelo menos 8 caracteres";
    }
    return null;
  };

  const validateSignIn = (
    data: SignInData
  ): string | null => {
    if (!isValidEmail(data.email)) {
      return "Email inválido";
    }
    if (!data.password.trim()) {
      return "Senha é obrigatória";
    }
    return null;
  };

  const executeSignUp = async (
    email: string,
    password: string,
    fullName: string
  ): Promise<void> => {
    const data = { email, password, fullName };
    const validationError = validateSignUp(data);

    if (validationError) {
      throw new Error(validationError);
    }

    setIsLoading(true);
    setError(null);

    try {
      await signUp(email, password, { fullName });

      toast({
        title: "Conta criada com sucesso!",
        description:
          "Verifique seu email para confirmar a conta.",
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Erro ao criar conta";
      setError(errorMessage);

      toast({
        title: "Erro ao criar conta",
        description: errorMessage,
        variant: "destructive",
      });

      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const executeSignIn = async (
    email: string,
    password: string
  ): Promise<void> => {
    const data = { email, password };
    const validationError = validateSignIn(data);

    if (validationError) {
      throw new Error(validationError);
    }

    setIsLoading(true);
    setError(null);

    try {
      await signIn(email, password);

      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo de volta ao ReadQuest!",
      });
    } catch (error) {
      let errorMessage =
        error instanceof Error
          ? error.message
          : "Erro ao fazer login";

      // Customize error messages
      if (
        errorMessage.includes("Invalid login credentials")
      ) {
        errorMessage = "Email ou senha incorretos";
      } else if (
        errorMessage.includes("Email not confirmed")
      ) {
        errorMessage =
          "Email não confirmado. Verifique sua caixa de entrada.";
      }

      setError(errorMessage);

      toast({
        title: "Erro ao fazer login",
        description: errorMessage,
        variant: "destructive",
      });

      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const executeResetPassword = async (
    email: string
  ): Promise<void> => {
    if (!isValidEmail(email)) {
      throw new Error("Email inválido");
    }

    setIsLoading(true);
    setError(null);

    try {
      await resetPassword(email);

      toast({
        title: "Email enviado!",
        description:
          "Verifique sua caixa de entrada para redefinir sua senha.",
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Erro ao enviar email";
      setError(errorMessage);

      toast({
        title: "Erro ao enviar email",
        description: errorMessage,
        variant: "destructive",
      });

      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    signUp: {
      execute: executeSignUp,
      isLoading,
      error,
    },
    signIn: {
      execute: executeSignIn,
      isLoading,
      error,
    },
    resetPassword: {
      execute: executeResetPassword,
      isLoading,
      error,
    },
    validateSignUp,
    validateSignIn,
  };
};
