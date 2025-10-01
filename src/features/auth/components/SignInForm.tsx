import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/shared/utils";
import type { BaseComponentProps } from "@/shared/types";

interface SignInFormProps extends BaseComponentProps {
  onSubmit: (
    email: string,
    password: string
  ) => Promise<void>;
  onForgotPassword?: (email: string) => Promise<void>;
  isLoading?: boolean;
}

export const SignInForm: React.FC<SignInFormProps> = ({
  onSubmit,
  onForgotPassword,
  isLoading = false,
  className,
}) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState<
    Record<string, string>
  >({});
  const [showForgotPassword, setShowForgotPassword] =
    useState(false);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email é obrigatório";
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
    ) {
      newErrors.email = "Email inválido";
    }

    if (!formData.password.trim()) {
      newErrors.password = "Senha é obrigatória";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      await onSubmit(formData.email, formData.password);
    } catch (error) {
      console.error("Sign in error:", error);
    }
  };

  const handleForgotPassword = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!formData.email.trim()) {
      setErrors({
        email: "Digite seu email para recuperar a senha",
      });
      return;
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
    ) {
      setErrors({ email: "Email inválido" });
      return;
    }

    try {
      if (onForgotPassword) {
        await onForgotPassword(formData.email);
        setShowForgotPassword(false);
      }
    } catch (error) {
      console.error("Forgot password error:", error);
    }
  };

  const handleInputChange =
    (field: keyof typeof formData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({
        ...prev,
        [field]: e.target.value,
      }));
      // Clear error when user starts typing
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: "" }));
      }
    };

  if (showForgotPassword) {
    return (
      <form
        onSubmit={handleForgotPassword}
        className={cn("space-y-4", className)}
      >
        <div className="space-y-2">
          <Label htmlFor="resetEmail">
            Email para recuperação
          </Label>
          <Input
            id="resetEmail"
            type="email"
            placeholder="seu@email.com"
            value={formData.email}
            onChange={handleInputChange("email")}
            className={errors.email ? "border-red-500" : ""}
            required
          />
          {errors.email && (
            <p className="text-sm text-red-500">
              {errors.email}
            </p>
          )}
        </div>

        <div className="flex space-x-2">
          <Button
            type="submit"
            className="flex-1"
            disabled={isLoading}
          >
            {isLoading ? "Enviando..." : "Enviar email"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowForgotPassword(false)}
            disabled={isLoading}
          >
            Voltar
          </Button>
        </div>
      </form>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("space-y-4", className)}
    >
      <div className="space-y-2">
        <Label htmlFor="signInEmail">Email</Label>
        <Input
          id="signInEmail"
          type="email"
          placeholder="seu@email.com"
          value={formData.email}
          onChange={handleInputChange("email")}
          className={errors.email ? "border-red-500" : ""}
          required
        />
        {errors.email && (
          <p className="text-sm text-red-500">
            {errors.email}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="signInPassword">Senha</Label>
        <Input
          id="signInPassword"
          type="password"
          placeholder="Sua senha"
          value={formData.password}
          onChange={handleInputChange("password")}
          className={
            errors.password ? "border-red-500" : ""
          }
          required
        />
        {errors.password && (
          <p className="text-sm text-red-500">
            {errors.password}
          </p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isLoading}
      >
        {isLoading ? "Entrando..." : "Entrar"}
      </Button>

      {onForgotPassword && (
        <Button
          type="button"
          variant="link"
          className="w-full"
          onClick={() => setShowForgotPassword(true)}
          disabled={isLoading}
        >
          Esqueci minha senha
        </Button>
      )}
    </form>
  );
};
