import React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: any;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{
    error: Error;
    resetError: () => void;
  }>;
  onError?: (error: Error, errorInfo: any) => void;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(
    error: Error
  ): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error(
      "ErrorBoundary caught an error:",
      error,
      errorInfo
    );

    // Log error para monitoramento
    this.props.onError?.(error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
    });
  };

  render() {
    if (this.state.hasError) {
      const { error } = this.state;

      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent
            error={error!}
            resetError={this.handleReset}
          />
        );
      }

      return (
        <DefaultErrorFallback
          error={error!}
          resetError={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

export const DefaultErrorFallback: React.FC<
  ErrorFallbackProps
> = ({ error, resetError }) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-red-100 rounded-full">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <CardTitle className="text-xl text-red-600">
            Algo deu errado
          </CardTitle>
          <CardDescription>
            Ocorreu um erro inesperado. Por favor, tente
            novamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <details className="text-sm">
            <summary className="cursor-pointer font-medium mb-2">
              Detalhes do erro
            </summary>
            <div className="bg-gray-50 p-3 rounded border text-xs font-mono overflow-auto max-h-32">
              {error.name}: {error.message}
              {error.stack && (
                <pre className="mt-2 whitespace-pre-wrap">
                  {error.stack}
                </pre>
              )}
            </div>
          </details>
          <div className="flex gap-2">
            <Button
              onClick={resetError}
              className="flex-1"
              variant="default"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar novamente
            </Button>
            <Button
              onClick={() => window.location.reload()}
              className="flex-1"
              variant="outline"
            >
              Recarregar página
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Error boundary específico para componentes menores
export const ComponentErrorFallback: React.FC<
  ErrorFallbackProps
> = ({ error, resetError }) => {
  return (
    <Card className="border-red-200 bg-red-50">
      <CardContent className="p-4">
        <div className="flex items-center space-x-2 text-red-700 mb-2">
          <AlertTriangle className="h-4 w-4" />
          <span className="font-medium">
            Erro no componente
          </span>
        </div>
        <p className="text-sm text-red-600 mb-3">
          {error.message || "Ocorreu um erro inesperado"}
        </p>
        <Button
          size="sm"
          onClick={resetError}
          variant="outline"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Tentar novamente
        </Button>
      </CardContent>
    </Card>
  );
};

// Hook para capturar erros em componentes funcionais
export const useErrorHandler = () => {
  return (error: Error) => {
    console.error("Erro capturado pelo hook:", error);

    // Aqui você pode integrar com serviços de monitoramento
    // como Sentry, LogRocket, etc.

    throw error; // Re-throw para que o ErrorBoundary capture
  };
};
