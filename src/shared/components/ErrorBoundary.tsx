import React, {
  Component,
  ErrorInfo,
  ReactNode,
} from "react";
import {
  AlertTriangle,
  RefreshCw,
  Home,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
  level?: "page" | "component" | "feature";
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

/**
 * Global Error Boundary for catching and handling React component errors
 */
export class ErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: "",
    };
  }

  static getDerivedStateFromError(
    error: Error
  ): Partial<State> {
    // Generate unique error ID for tracking
    const errorId = `ERR_${Date.now()}_${Math.random()
      .toString(36)
      .substring(7)}`;

    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError } = this.props;

    // Update state with error info
    this.setState({
      error,
      errorInfo,
    });

    // Log error to console in development
    if (process.env.NODE_ENV === "development") {
      console.group("🚨 Error Boundary Caught Error");
      console.error("Error:", error);
      console.error("Error Info:", errorInfo);
      console.error(
        "Component Stack:",
        errorInfo.componentStack
      );
      console.groupEnd();
    }

    // Call custom error handler if provided
    if (onError) {
      onError(error, errorInfo);
    }

    // Report error to monitoring service in production
    if (process.env.NODE_ENV === "production") {
      this.reportError(error, errorInfo);
    }
  }

  private reportError = async (
    error: Error,
    errorInfo: ErrorInfo
  ) => {
    try {
      // Here you would integrate with your error reporting service
      // Example: Sentry, LogRocket, Bugsnag, etc.
      const errorReport = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        errorId: this.state.errorId,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        level: this.props.level || "component",
      };

      // Send to your error reporting service
      console.log("Would report error:", errorReport);
    } catch (reportingError) {
      console.error(
        "Failed to report error:",
        reportingError
      );
    }
  };

  private handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: "",
      });
    } else {
      // Redirect to home page after max retries
      window.location.href = "/";
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = "/";
  };

  private handleReportFeedback = () => {
    const subject = encodeURIComponent(
      `Bug Report - ${this.state.errorId}`
    );
    const body = encodeURIComponent(`
Error ID: ${this.state.errorId}
Error Message: ${
      this.state.error?.message || "Unknown error"
    }
URL: ${window.location.href}
Timestamp: ${new Date().toISOString()}

Please describe what you were doing when this error occurred:


Additional details:
${this.state.error?.stack || "No stack trace available"}
`);

    window.open(
      `mailto:support@bibliogamezone.com?subject=${subject}&body=${body}`
    );
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI based on level
      const { level = "component", showDetails = false } =
        this.props;
      const { error, errorId } = this.state;

      if (level === "page") {
        return (
          <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="max-w-2xl w-full text-center space-y-6">
              <div className="space-y-2">
                <AlertTriangle className="h-16 w-16 text-destructive mx-auto" />
                <h1 className="text-3xl font-bold text-foreground">
                  Ops! Algo deu errado
                </h1>
                <p className="text-muted-foreground text-lg">
                  Ocorreu um erro inesperado. Nossa equipe
                  foi notificada.
                </p>
              </div>

              <Alert className="text-left">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Erro ID: {errorId}</AlertTitle>
                <AlertDescription>
                  Você pode tentar novamente ou voltar à
                  página inicial.
                  {showDetails && error && (
                    <details className="mt-4">
                      <summary className="cursor-pointer font-medium">
                        Detalhes técnicos
                      </summary>
                      <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
                        {error.message}
                        {"\n\n"}
                        {error.stack}
                      </pre>
                    </details>
                  )}
                </AlertDescription>
              </Alert>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {this.retryCount < this.maxRetries && (
                  <Button
                    onClick={this.handleRetry}
                    className="gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Tentar Novamente (
                    {this.maxRetries - this.retryCount}{" "}
                    restantes)
                  </Button>
                )}
                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="gap-2"
                >
                  <Home className="h-4 w-4" />
                  Ir para Início
                </Button>
                <Button
                  onClick={this.handleReportFeedback}
                  variant="outline"
                  className="gap-2"
                >
                  <MessageCircle className="h-4 w-4" />
                  Reportar Problema
                </Button>
              </div>

              <Button
                onClick={this.handleReload}
                variant="ghost"
                size="sm"
              >
                Recarregar Página
              </Button>
            </div>
          </div>
        );
      }

      // Component/Feature level error UI
      return (
        <div className="p-6 border border-destructive/20 rounded-lg bg-destructive/5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
            <div className="flex-1 space-y-3">
              <div>
                <h3 className="font-medium text-foreground">
                  Erro no componente
                </h3>
                <p className="text-sm text-muted-foreground">
                  Este componente encontrou um erro e não
                  pode ser exibido.
                </p>
                {showDetails && (
                  <p className="text-xs text-muted-foreground mt-1">
                    ID: {errorId}
                  </p>
                )}
              </div>

              {showDetails && error && (
                <details className="text-sm">
                  <summary className="cursor-pointer font-medium text-foreground">
                    Detalhes do erro
                  </summary>
                  <pre className="mt-2 text-xs bg-background p-2 rounded border overflow-auto">
                    {error.message}
                  </pre>
                </details>
              )}

              <div className="flex gap-2">
                {this.retryCount < this.maxRetries && (
                  <Button
                    onClick={this.handleRetry}
                    size="sm"
                    variant="outline"
                    className="gap-1"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Tentar Novamente
                  </Button>
                )}
                <Button
                  onClick={this.handleReportFeedback}
                  size="sm"
                  variant="ghost"
                  className="gap-1"
                >
                  <MessageCircle className="h-3 w-3" />
                  Reportar
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// =============================================================================
// SPECIALIZED ERROR BOUNDARIES
// =============================================================================

/**
 * Error boundary specifically for async operations and data fetching
 */
export const AsyncErrorBoundary: React.FC<{
  children: ReactNode;
  fallback?: ReactNode;
  onRetry?: () => void;
}> = ({ children, fallback, onRetry }) => (
  <ErrorBoundary
    level="component"
    fallback={
      fallback || (
        <div className="p-4 text-center">
          <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
          <h3 className="font-medium mb-2">
            Erro ao carregar dados
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Não foi possível carregar as informações. Tente
            novamente.
          </p>
          {onRetry && (
            <Button
              onClick={onRetry}
              size="sm"
              variant="outline"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Tentar Novamente
            </Button>
          )}
        </div>
      )
    }
  >
    {children}
  </ErrorBoundary>
);

/**
 * Error boundary for form components with validation
 */
export const FormErrorBoundary: React.FC<{
  children: ReactNode;
  onReset?: () => void;
}> = ({ children, onReset }) => (
  <ErrorBoundary
    level="component"
    fallback={
      <Alert className="border-destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Erro no formulário</AlertTitle>
        <AlertDescription className="space-y-2">
          <p>Ocorreu um erro inesperado no formulário.</p>
          <Button
            onClick={onReset}
            size="sm"
            variant="outline"
            className="gap-1"
          >
            <RefreshCw className="h-3 w-3" />
            Reiniciar Formulário
          </Button>
        </AlertDescription>
      </Alert>
    }
  >
    {children}
  </ErrorBoundary>
);

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Higher-order component to wrap components with error boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Partial<Props>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${
    Component.displayName || Component.name
  })`;

  return WrappedComponent;
}

/**
 * React hook for handling errors in functional components
 */
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(
    null
  );

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const handleError = React.useCallback((error: Error) => {
    console.error(
      "Error caught by useErrorHandler:",
      error
    );
    setError(error);
  }, []);

  // Throw error to trigger error boundary
  if (error) {
    throw error;
  }

  return { handleError, resetError };
}
