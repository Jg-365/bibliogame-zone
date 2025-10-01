import React from "react";
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
import { BookOpen, Sparkles } from "lucide-react";
import { SignUpForm } from "./SignUpForm";
import { SignInForm } from "./SignInForm";
import { useAuthForm } from "../hooks/useAuthForm";

export const AuthPage: React.FC = () => {
  const { signUp, signIn, resetPassword } = useAuthForm();

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
                <SignInForm
                  onSubmit={signIn.execute}
                  onForgotPassword={resetPassword.execute}
                  isLoading={
                    signIn.isLoading ||
                    resetPassword.isLoading
                  }
                />
              </TabsContent>

              <TabsContent value="signup" className="mt-6">
                <SignUpForm
                  onSubmit={signUp.execute}
                  isLoading={signUp.isLoading}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
