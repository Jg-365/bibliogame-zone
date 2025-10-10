// Utility para retry com exponential backoff
export const fetchWithRetry = async <T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> => {
  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Se é a última tentativa, throw o erro
      if (attempt === maxRetries) {
        throw error;
      }

      // Calcular delay com exponential backoff
      const delay = baseDelay * Math.pow(2, attempt);

      console.warn(
        `Tentativa ${
          attempt + 1
        } falhou, tentando novamente em ${delay}ms:`,
        error
      );

      // Aguardar antes da próxima tentativa
      await new Promise((resolve) =>
        setTimeout(resolve, delay)
      );
    }
  }

  throw lastError;
};

// Utility para detectar erros temporários vs permanentes
export const isRetryableError = (error: any): boolean => {
  // Erros de rede ou temporários do servidor
  if (error?.message?.includes("fetch")) return true;
  if (error?.message?.includes("network")) return true;
  if (error?.message?.includes("timeout")) return true;
  if (error?.code === "PGRST301") return true; // Supabase timeout
  if (error?.status >= 500 && error?.status < 600)
    return true; // 5xx errors

  return false;
};

// Configurações de cache otimizadas
export const CACHE_CONFIG = {
  POSTS: {
    staleTime: 2 * 60 * 1000, // 2 minutos
    cacheTime: 10 * 60 * 1000, // 10 minutos
  },
  COMMENTS: {
    staleTime: 1 * 60 * 1000, // 1 minuto
    cacheTime: 5 * 60 * 1000, // 5 minutos
  },
  LIKES: {
    staleTime: 30 * 1000, // 30 segundos
    cacheTime: 2 * 60 * 1000, // 2 minutos
  },
};
