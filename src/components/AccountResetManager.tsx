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
} from "lucide-react";
import { useAccountReset } from "@/hooks/useAccountReset";
import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert";

export const AccountResetManager = () => {
  const { resetAccount, isResetting } = useAccountReset();

  const handleReset = () => {
    resetAccount.mutate();
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
            <div className="p-4 border border-destructive/20 rounded-lg bg-background">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <h3 className="font-semibold text-destructive flex items-center gap-2">
                    <Trash2 className="h-4 w-4" />
                    Resetar Conta Completamente
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Remove TODOS os dados da sua conta
                    permanentemente:
                  </p>
                  <ul className="text-xs text-muted-foreground ml-4 space-y-1">
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
                  variant="destructive"
                  size="sm"
                  onClick={handleReset}
                  disabled={isResetting}
                  className="ml-4 shrink-0"
                >
                  {isResetting ? (
                    <>
                      <RotateCcw className="h-4 w-4 mr-2 animate-spin" />
                      Resetando...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Resetar Tudo
                    </>
                  )}
                </Button>
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
