import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Sparkles } from "lucide-react";

export const AuthPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSignUp = async (
    email: string,
    password: string,
    fullName: string
  ) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;

      toast({
        title: "Conta criada com sucesso!",
        description:
          "Verifique seu email para confirmar a conta.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao criar conta",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (
    email: string,
    password: string,
    remember = true
  ) => {
    setIsLoading(true);
    try {
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (authError) {
        // Handle specific authentication errors
        if (
          authError.message.includes(
            "Invalid login credentials"
          )
        ) {
          throw new Error(
            "Email ou senha incorretos. Verifique suas credenciais."
          );
        }
        throw authError;
      }

      // Persist remember preference
      try {
        localStorage.setItem(
          "rq_remember",
          remember ? "true" : "false"
        );
      } catch (e) {
        // ignore storage errors
      }

      // Check if user has a profile (account not deleted)
      if (authData.user) {
        const { data: profile, error: profileError } =
          await supabase
            .from("profiles")
            .select("level, full_name, user_id")
            .eq("user_id", authData.user.id)
            .single();

        if (profileError || !profile) {
          // Profile doesn't exist - account was deleted
          console.log(
            "🚫 Perfil não encontrado - conta foi deletada"
          );

          // Sign out immediately
          await supabase.auth.signOut();

          throw new Error(
            "Esta conta não está mais ativa. Usuário não cadastrado."
          );
        }

        // Check if account is marked as deleted
        if (
          profile.level === "DELETADA" ||
          profile.full_name === "CONTA_DELETADA"
        ) {
          console.log("🚫 Conta marcada como deletada");

          // Sign out immediately
          await supabase.auth.signOut();

          throw new Error(
            "Esta conta foi excluída. Usuário não cadastrado."
          );
        }

        // Account is valid
        toast({
          title: "Login realizado com sucesso!",
          description: "Bem-vindo de volta ao ReadQuest!",
        });
      }
    } catch (error: any) {
      console.error("Erro no login:", error);

      // Customize error messages
      let errorMessage = error.message;

      if (
        error.message.includes("não cadastrado") ||
        error.message.includes("não está mais ativa")
      ) {
        errorMessage = "Usuário não cadastrado";
      } else if (
        error.message.includes("Invalid login credentials")
      ) {
        errorMessage = "Email ou senha incorretos";
      } else if (
        error.message.includes("Email not confirmed")
      ) {
        errorMessage =
          "Email não confirmado. Verifique sua caixa de entrada.";
      }

      toast({
        title: "Erro ao fazer login",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const SignUpForm = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState("");

    const onSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      handleSignUp(email, password, fullName);
    };

    return (
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">Nome completo</Label>
          <Input
            id="fullName"
            type="text"
            placeholder="Seu nome completo"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            type="password"
            placeholder="Sua senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? "Criando conta..." : "Criar conta"}
        </Button>
      </form>
    );
  };

  const SignInForm = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [remember, setRemember] = useState(true);

    const onSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      handleSignIn(email, password, remember);
    };

    return (
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="signInEmail">Email</Label>
          <Input
            id="signInEmail"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="signInPassword">Senha</Label>
          <Input
            id="signInPassword"
            type="password"
            placeholder="Sua senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="flex items-center space-x-2">
          <input
            id="remember"
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="w-4 h-4"
          />
          <label htmlFor="remember" className="text-sm">
            Lembrar de mim
          </label>
        </div>
        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? "Entrando..." : "Entrar"}
        </Button>
      </form>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-reading flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <BookOpen className="h-8 w-8 text-primary" />
            <Sparkles className="h-6 w-6 text-accent" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-2">
            ReadQuest
          </h1>
          <p className="text-muted-foreground">
            Transforme sua leitura em uma aventura épica
          </p>
        </div>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-center">
              Entre na sua conta
            </CardTitle>
            <CardDescription className="text-center">
              Faça login ou crie uma nova conta para começar
              sua jornada
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">
                  Login
                </TabsTrigger>
                <TabsTrigger value="signup">
                  Criar conta
                </TabsTrigger>
              </TabsList>
              <TabsContent value="signin" className="mt-6">
                <SignInForm />
              </TabsContent>
              <TabsContent value="signup" className="mt-6">
                <SignUpForm />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
