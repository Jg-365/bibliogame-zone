import { toast } from "@/hooks/use-toast";

// =============================================================================
// ERROR TYPES
// =============================================================================

export interface AppError extends Error {
  code?: string;
  statusCode?: number;
  context?: Record<string, unknown>;
  timestamp?: string;
  userId?: string;
}

export interface ValidationError extends AppError {
  field?: string;
  validationErrors?: Record<string, string>;
}

export interface NetworkError extends AppError {
  endpoint?: string;
  method?: string;
  response?: Response;
}

export interface AuthError extends AppError {
  authAction?: "login" | "signup" | "logout" | "refresh";
}

export interface DatabaseError extends AppError {
  query?: string;
  table?: string;
}

// =============================================================================
// ERROR CODES
// =============================================================================

export const ERROR_CODES = {
  // Network errors
  NETWORK_ERROR: "NETWORK_ERROR",
  TIMEOUT_ERROR: "TIMEOUT_ERROR",
  OFFLINE_ERROR: "OFFLINE_ERROR",

  // Authentication errors
  AUTH_REQUIRED: "AUTH_REQUIRED",
  AUTH_INVALID: "AUTH_INVALID",
  AUTH_EXPIRED: "AUTH_EXPIRED",
  AUTH_FORBIDDEN: "AUTH_FORBIDDEN",

  // Validation errors
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INVALID_INPUT: "INVALID_INPUT",
  REQUIRED_FIELD: "REQUIRED_FIELD",

  // Database errors
  DB_CONNECTION_ERROR: "DB_CONNECTION_ERROR",
  DB_QUERY_ERROR: "DB_QUERY_ERROR",
  RECORD_NOT_FOUND: "RECORD_NOT_FOUND",
  DUPLICATE_RECORD: "DUPLICATE_RECORD",

  // Business logic errors
  BOOK_NOT_FOUND: "BOOK_NOT_FOUND",
  INVALID_READING_PROGRESS: "INVALID_READING_PROGRESS",
  ACHIEVEMENT_ALREADY_UNLOCKED:
    "ACHIEVEMENT_ALREADY_UNLOCKED",
  READING_GOAL_EXCEEDED: "READING_GOAL_EXCEEDED",

  // File/Upload errors
  FILE_TOO_LARGE: "FILE_TOO_LARGE",
  INVALID_FILE_TYPE: "INVALID_FILE_TYPE",
  UPLOAD_FAILED: "UPLOAD_FAILED",

  // Unknown/Generic errors
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export type ErrorCode =
  (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

// =============================================================================
// ERROR MESSAGES
// =============================================================================

const ERROR_MESSAGES: Record<ErrorCode, string> = {
  // Network errors
  NETWORK_ERROR: "Erro de conexão. Verifique sua internet.",
  TIMEOUT_ERROR:
    "A operação demorou muito para responder. Tente novamente.",
  OFFLINE_ERROR:
    "Você está offline. Conecte-se à internet para continuar.",

  // Authentication errors
  AUTH_REQUIRED:
    "Você precisa estar logado para acessar esta funcionalidade.",
  AUTH_INVALID:
    "Credenciais inválidas. Verifique email e senha.",
  AUTH_EXPIRED: "Sua sessão expirou. Faça login novamente.",
  AUTH_FORBIDDEN: "Você não tem permissão para esta ação.",

  // Validation errors
  VALIDATION_ERROR:
    "Dados inválidos. Verifique as informações inseridas.",
  INVALID_INPUT:
    "Entrada inválida. Verifique o formato dos dados.",
  REQUIRED_FIELD: "Campo obrigatório não preenchido.",

  // Database errors
  DB_CONNECTION_ERROR:
    "Erro de conexão com o banco de dados.",
  DB_QUERY_ERROR:
    "Erro ao processar solicitação no banco de dados.",
  RECORD_NOT_FOUND: "Registro não encontrado.",
  DUPLICATE_RECORD: "Este registro já existe.",

  // Business logic errors
  BOOK_NOT_FOUND: "Livro não encontrado.",
  INVALID_READING_PROGRESS:
    "Progresso de leitura inválido.",
  ACHIEVEMENT_ALREADY_UNLOCKED:
    "Conquista já desbloqueada.",
  READING_GOAL_EXCEEDED: "Meta de leitura excedida.",

  // File/Upload errors
  FILE_TOO_LARGE:
    "Arquivo muito grande. Tamanho máximo: 5MB.",
  INVALID_FILE_TYPE: "Tipo de arquivo inválido.",
  UPLOAD_FAILED: "Falha no upload do arquivo.",

  // Unknown/Generic errors
  UNKNOWN_ERROR: "Erro desconhecido. Tente novamente.",
  INTERNAL_ERROR:
    "Erro interno do sistema. Nossa equipe foi notificada.",
};

// =============================================================================
// ERROR CREATION FUNCTIONS
// =============================================================================

export function createAppError(
  message: string,
  code?: ErrorCode,
  statusCode?: number,
  context?: Record<string, unknown>
): AppError {
  const error = new Error(message) as AppError;
  error.code = code;
  error.statusCode = statusCode;
  error.context = context;
  error.timestamp = new Date().toISOString();

  // Add user ID if available (from auth context)
  if (typeof window !== "undefined") {
    const userStr = localStorage.getItem("auth-user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        error.userId = user?.id;
      } catch {
        // Ignore parsing errors
      }
    }
  }

  return error;
}

export function createValidationError(
  message: string,
  field?: string,
  validationErrors?: Record<string, string>
): ValidationError {
  const error = createAppError(
    message,
    ERROR_CODES.VALIDATION_ERROR,
    400
  ) as ValidationError;
  error.field = field;
  error.validationErrors = validationErrors;
  return error;
}

export function createNetworkError(
  message: string,
  endpoint?: string,
  method?: string,
  response?: Response
): NetworkError {
  const error = createAppError(
    message,
    ERROR_CODES.NETWORK_ERROR,
    response?.status
  ) as NetworkError;
  error.endpoint = endpoint;
  error.method = method;
  error.response = response;
  return error;
}

export function createAuthError(
  message: string,
  authAction?: AuthError["authAction"]
): AuthError {
  const error = createAppError(
    message,
    ERROR_CODES.AUTH_INVALID,
    401
  ) as AuthError;
  error.authAction = authAction;
  return error;
}

export function createDatabaseError(
  message: string,
  query?: string,
  table?: string
): DatabaseError {
  const error = createAppError(
    message,
    ERROR_CODES.DB_QUERY_ERROR,
    500
  ) as DatabaseError;
  error.query = query;
  error.table = table;
  return error;
}

// =============================================================================
// ERROR HANDLING UTILITIES
// =============================================================================

export function getErrorMessage(error: unknown): string {
  if (!error) return ERROR_MESSAGES.UNKNOWN_ERROR;

  // Check if it's an AppError with a code
  if (error instanceof Error && "code" in error) {
    const appError = error as AppError;
    if (
      appError.code &&
      ERROR_MESSAGES[appError.code as ErrorCode]
    ) {
      return ERROR_MESSAGES[appError.code as ErrorCode];
    }
  }

  // Check if it's a regular Error
  if (error instanceof Error) {
    return error.message || ERROR_MESSAGES.UNKNOWN_ERROR;
  }

  // Handle Supabase errors
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error
  ) {
    const supabaseError = error as {
      message: string;
      code?: string;
    };

    // Map common Supabase error codes
    switch (supabaseError.code) {
      case "PGRST116":
        return ERROR_MESSAGES.RECORD_NOT_FOUND;
      case "23505":
        return ERROR_MESSAGES.DUPLICATE_RECORD;
      case "42501":
        return ERROR_MESSAGES.AUTH_FORBIDDEN;
      default:
        return (
          supabaseError.message ||
          ERROR_MESSAGES.UNKNOWN_ERROR
        );
    }
  }

  // Handle string errors
  if (typeof error === "string") {
    return error;
  }

  return ERROR_MESSAGES.UNKNOWN_ERROR;
}

export function getErrorCode(error: unknown): ErrorCode {
  if (error instanceof Error && "code" in error) {
    const appError = error as AppError;
    return (
      (appError.code as ErrorCode) ||
      ERROR_CODES.UNKNOWN_ERROR
    );
  }

  // Handle Supabase errors
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error
  ) {
    const supabaseError = error as { code?: string };

    switch (supabaseError.code) {
      case "PGRST116":
        return ERROR_CODES.RECORD_NOT_FOUND;
      case "23505":
        return ERROR_CODES.DUPLICATE_RECORD;
      case "42501":
        return ERROR_CODES.AUTH_FORBIDDEN;
      case "PGRST301":
        return ERROR_CODES.DB_CONNECTION_ERROR;
      default:
        return ERROR_CODES.DB_QUERY_ERROR;
    }
  }

  return ERROR_CODES.UNKNOWN_ERROR;
}

export function isRetriableError(error: unknown): boolean {
  const code = getErrorCode(error);

  const retriableErrors: ErrorCode[] = [
    ERROR_CODES.NETWORK_ERROR,
    ERROR_CODES.TIMEOUT_ERROR,
    ERROR_CODES.DB_CONNECTION_ERROR,
    ERROR_CODES.INTERNAL_ERROR,
  ];

  return retriableErrors.includes(code);
}

export function shouldShowToUser(error: unknown): boolean {
  const code = getErrorCode(error);

  // Don't show internal/system errors to users
  const internalErrors: ErrorCode[] = [
    ERROR_CODES.INTERNAL_ERROR,
    ERROR_CODES.DB_CONNECTION_ERROR,
    ERROR_CODES.DB_QUERY_ERROR,
  ];

  return !internalErrors.includes(code);
}

// =============================================================================
// ERROR HANDLING HOOKS
// =============================================================================

export function useErrorHandler() {
  const handleError = (
    error: unknown,
    options?: {
      showToast?: boolean;
      toastTitle?: string;
      logError?: boolean;
      context?: Record<string, unknown>;
    }
  ) => {
    const {
      showToast = true,
      toastTitle = "Erro",
      logError = true,
      context,
    } = options || {};

    const message = getErrorMessage(error);
    const code = getErrorCode(error);

    // Log error in development
    if (
      logError &&
      process.env.NODE_ENV === "development"
    ) {
      console.group(`🚨 Error Handler: ${code}`);
      console.error("Error:", error);
      console.error("Message:", message);
      if (context) console.error("Context:", context);
      console.groupEnd();
    }

    // Show toast notification if requested and error should be shown to user
    if (showToast && shouldShowToUser(error)) {
      toast({
        title: toastTitle,
        description: message,
        variant: "destructive",
      });
    }

    // Report error in production
    if (process.env.NODE_ENV === "production") {
      reportError(error, context);
    }
  };

  return { handleError };
}

// =============================================================================
// ERROR REPORTING
// =============================================================================

export function reportError(
  error: unknown,
  context?: Record<string, unknown>
) {
  try {
    const errorReport = {
      message: getErrorMessage(error),
      code: getErrorCode(error),
      stack:
        error instanceof Error ? error.stack : undefined,
      context,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    };

    // Here you would send to your error reporting service
    // Example: Sentry, LogRocket, Bugsnag, etc.
    console.log("Would report error:", errorReport);

    // You could also send to your own API endpoint
    // fetch('/api/errors', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(errorReport),
    // });
  } catch (reportingError) {
    console.error(
      "Failed to report error:",
      reportingError
    );
  }
}

// =============================================================================
// ASYNC ERROR HANDLING
// =============================================================================

export function withErrorHandling<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  options?: {
    retries?: number;
    retryDelay?: number;
    onError?: (error: unknown) => void;
  }
) {
  return async (...args: T): Promise<R> => {
    const {
      retries = 0,
      retryDelay = 1000,
      onError,
    } = options || {};

    let lastError: unknown;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await fn(...args);
      } catch (error) {
        lastError = error;

        // If this is the last attempt or error is not retriable, throw
        if (
          attempt === retries ||
          !isRetriableError(error)
        ) {
          if (onError) onError(error);
          throw error;
        }

        // Wait before retrying
        if (retryDelay > 0) {
          await new Promise((resolve) =>
            setTimeout(resolve, retryDelay * (attempt + 1))
          );
        }
      }
    }

    throw lastError;
  };
}

// =============================================================================
// VALIDATION ERROR HELPERS
// =============================================================================

export function formatValidationErrors(
  errors: Record<string, string>
): string {
  const messages = Object.values(errors);
  if (messages.length === 1) {
    return messages[0];
  }

  return `Encontrados ${messages.length} erros:\n${messages
    .map((msg) => `• ${msg}`)
    .join("\n")}`;
}

export function hasValidationError(
  errors: Record<string, string>,
  field: string
): boolean {
  return field in errors;
}

export function getValidationError(
  errors: Record<string, string>,
  field: string
): string | undefined {
  return errors[field];
}
