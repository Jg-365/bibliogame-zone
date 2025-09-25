import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertTriangle,
  RotateCcw,
  Trash2,
  UserX,
  LogOut,
} from "lucide-react";
import { useAccountReset } from "@/hooks/useAccountReset";
import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export const AccountResetManager = () => {
  const {
    resetAccount,
    deleteAccountCompletely,
    isResetting,
  } = useAccountReset();
  const { user } = useAuth();
  const { toast } = useToast();
  const [confirmationText, setConfirmationText] =
    useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleReset = () => {
    resetAccount.mutate();
  };

  const handleDeleteAccount = async () => {
    if (confirmationText !== "EXCLUIR CONTA") {
      toast({
        title: "Confirmação incorreta",
        description:
          "Digite exatamente 'EXCLUIR CONTA' para confirmar",
        variant: "destructive",
      });
      return;
    }

    setIsDeleting(true);
    try {
      // Usar a nova função que exclui TUDO completamente
      await deleteAccountCompletely.mutateAsync();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir conta",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-destructive/20 bg-destructive/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Zona de Perigo
          </CardTitle>
          <CardDescription>
            Ações irreversíveis que afetam permanentemente
            sua conta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Atenção:</strong> Estas ações são
              permanentes e não podem ser desfeitas.
              Certifique-se de que realmente deseja
              prosseguir.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            {/* Resetar Dados */}
            <div className="p-4 border border-orange-200 rounded-lg bg-orange-50/50">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <h3 className="font-semibold text-orange-800 flex items-center gap-2">
                    <RotateCcw className="h-4 w-4" />
                    Resetar Dados da Conta
                  </h3>
                  <p className="text-sm text-orange-700 max-w-md">
                    Remove todos os dados, mas mantém sua
                    conta ativa:
                  </p>
                  <ul className="text-xs text-orange-600 ml-4 space-y-1">
                    <li>• Todos os livros adicionados</li>
                    <li>• Todas as conquistas obtidas</li>
                    <li>• Todo o progresso de leitura</li>
                    <li>• Todas as sessões de leitura</li>
                    <li>
                      • Seguidores e pessoas que você segue
                    </li>
                    <li>
                      • Sequências de leitura e estatísticas
                    </li>
                  </ul>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  disabled={isResetting}
                  className="ml-4 shrink-0 border-orange-300 text-orange-800 hover:bg-orange-100"
                >
                  {isResetting ? (
                    <>
                      <RotateCcw className="h-4 w-4 mr-2 animate-spin" />
                      Resetando...
                    </>
                  ) : (
                    <>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Resetar Dados
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Excluir Conta Completamente */}
            <div className="p-4 border border-red-200 rounded-lg bg-red-50/50">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <h3 className="font-semibold text-red-800 flex items-center gap-2">
                    <UserX className="h-4 w-4" />
                    Excluir Conta Permanentemente
                  </h3>
                  <p className="text-sm text-red-700 max-w-md">
                    <strong>ATENÇÃO:</strong> Exclui sua
                    conta e TODOS os dados do banco de
                    dados:
                  </p>
                  <ul className="text-xs text-red-600 ml-4 space-y-1">
                    <li>
                      • Remove completamente do banco de
                      dados
                    </li>
                    <li>
                      • Exclui perfil, livros, sessões,
                      conquistas
                    </li>
                    <li>
                      • Remove seguidores e pessoas que você
                      segue
                    </li>
                    <li>
                      • Exclui sua conta de autenticação
                    </li>
                    <li>
                      • Você será deslogado automaticamente
                    </li>
                    <li>
                      •{" "}
                      <strong>IMPOSSÍVEL RECUPERAR</strong>
                    </li>
                  </ul>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={isDeleting}
                      className="ml-4 shrink-0"
                    >
                      {isDeleting ? (
                        <>
                          <RotateCcw className="h-4 w-4 mr-2 animate-spin" />
                          Excluindo...
                        </>
                      ) : (
                        <>
                          <UserX className="h-4 w-4 mr-2" />
                          Excluir Conta
                        </>
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-red-800">
                        ⚠️ Excluir Conta Permanentemente
                      </AlertDialogTitle>
                      <AlertDialogDescription className="space-y-3">
                        <p className="text-red-700">
                          <strong>
                            Esta ação é IRREVERSÍVEL!
                          </strong>
                        </p>
                        <p>
                          Ao excluir sua conta, todos os
                          seus dados serão removidos
                          permanentemente e você não poderá
                          mais acessar o BiblioGame Zone.
                        </p>
                        <div className="space-y-2">
                          <Label
                            htmlFor="confirmation"
                            className="text-sm font-medium"
                          >
                            Para confirmar, digite{" "}
                            <strong>"EXCLUIR CONTA"</strong>
                            :
                          </Label>
                          <Input
                            id="confirmation"
                            value={confirmationText}
                            onChange={(e) =>
                              setConfirmationText(
                                e.target.value
                              )
                            }
                            placeholder="Digite EXCLUIR CONTA"
                            className="border-red-200"
                          />
                        </div>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel
                        onClick={() =>
                          setConfirmationText("")
                        }
                      >
                        Cancelar
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAccount}
                        disabled={
                          confirmationText !==
                            "EXCLUIR CONTA" || isDeleting
                        }
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {isDeleting ? (
                          <>
                            <RotateCcw className="h-4 w-4 mr-2 animate-spin" />
                            Excluindo...
                          </>
                        ) : (
                          <>
                            <UserX className="h-4 w-4 mr-2" />
                            Sim, Excluir Minha Conta
                          </>
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>

          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-red-800">
              <strong>Importante:</strong> Antes de resetar,
              você será solicitado a confirmar múltiplas
              vezes e digitar uma palavra de confirmação.
              Esta é uma medida de segurança para evitar
              exclusões acidentais.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Como funciona o reset?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm space-y-2">
            <p>
              <strong>1. Confirmação múltipla:</strong> Você
              precisará confirmar 3 vezes antes da exclusão
            </p>
            <p>
              <strong>2. Palavra-chave:</strong> Digite
              "RESETAR" para confirmar definitivamente
            </p>
            <p>
              <strong>3. Exclusão imediata:</strong> Todos
              os dados são removidos instantaneamente
            </p>
            <p>
              <strong>4. Recomeço limpo:</strong> Sua conta
              volta ao estado inicial
            </p>
          </div>

          <Alert>
            <AlertDescription>
              <strong>Dica:</strong> Se você quer apenas
              limpar alguns dados específicos, use as outras
              abas para remover livros individuais, sessões
              específicas ou apenas conquistas.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};
