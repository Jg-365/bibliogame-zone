// Sistema de logging e monitoramento para ReadQuest
type LogLevel = "error" | "warn" | "info" | "debug";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  category: string;
  userId?: string;
  metadata?: Record<string, any>;
  stackTrace?: string;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000; // Manter apenas os últimos 1000 logs
  private isDevelopment = import.meta.env.DEV;

  private log(
    level: LogLevel,
    message: string,
    category: string,
    metadata?: Record<string, any>
  ) {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      category,
      metadata,
    };

    // Adicionar stack trace para erros
    if (level === "error") {
      logEntry.stackTrace = new Error().stack;
    }

    // Adicionar à lista de logs
    this.logs.push(logEntry);

    // Manter apenas os últimos logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Console log apenas em desenvolvimento
    if (this.isDevelopment) {
      const consoleMethod =
        level === "error"
          ? "error"
          : level === "warn"
          ? "warn"
          : "log";
      console[consoleMethod](
        `[${category}] ${message}`,
        metadata
      );
    }

    // Em produção, enviar logs críticos para servidor
    if (
      !this.isDevelopment &&
      (level === "error" || level === "warn")
    ) {
      this.sendToServer(logEntry);
    }
  }

  private async sendToServer(logEntry: LogEntry) {
    try {
      // Em uma implementação real, enviar para serviço de logging
      // Como Sentry, LogRocket, ou endpoint customizado
      await fetch("/api/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(logEntry),
      });
    } catch (error) {
      // Falha silenciosa para não quebrar a aplicação
      console.warn("Failed to send log to server:", error);
    }
  }

  error(
    message: string,
    category = "General",
    metadata?: Record<string, any>
  ) {
    this.log("error", message, category, metadata);
  }

  warn(
    message: string,
    category = "General",
    metadata?: Record<string, any>
  ) {
    this.log("warn", message, category, metadata);
  }

  info(
    message: string,
    category = "General",
    metadata?: Record<string, any>
  ) {
    this.log("info", message, category, metadata);
  }

  debug(
    message: string,
    category = "General",
    metadata?: Record<string, any>
  ) {
    if (this.isDevelopment) {
      this.log("debug", message, category, metadata);
    }
  }

  // Méodos específicos para diferentes categorias
  auth = {
    success: (action: string, userId: string) =>
      this.info(`Auth success: ${action}`, "Auth", {
        userId,
        action,
      }),
    error: (action: string, error: any) =>
      this.error(`Auth error: ${action}`, "Auth", {
        action,
        error: error.message,
      }),
  };

  api = {
    request: (url: string, method: string) =>
      this.debug(`API request: ${method} ${url}`, "API", {
        url,
        method,
      }),
    response: (
      url: string,
      status: number,
      duration: number
    ) =>
      this.debug(`API response: ${status} ${url}`, "API", {
        url,
        status,
        duration,
      }),
    error: (url: string, error: any) =>
      this.error(`API error: ${url}`, "API", {
        url,
        error: error.message,
      }),
  };

  performance = {
    slow: (operation: string, duration: number) =>
      this.warn(
        `Slow operation: ${operation}`,
        "Performance",
        { operation, duration }
      ),
    error: (operation: string, error: any) =>
      this.error(
        `Performance error: ${operation}`,
        "Performance",
        { operation, error: error.message }
      ),
  };

  user = {
    action: (
      action: string,
      userId?: string,
      metadata?: Record<string, any>
    ) =>
      this.info(`User action: ${action}`, "User", {
        action,
        userId,
        ...metadata,
      }),
  };

  getLogs(category?: string, level?: LogLevel) {
    return this.logs.filter((log) => {
      const categoryMatch =
        !category || log.category === category;
      const levelMatch = !level || log.level === level;
      return categoryMatch && levelMatch;
    });
  }

  clearLogs() {
    this.logs = [];
  }

  exportLogs() {
    const logsJson = JSON.stringify(this.logs, null, 2);
    const blob = new Blob([logsJson], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `readquest-logs-${
      new Date().toISOString().split("T")[0]
    }.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

export const logger = new Logger();

// Performance Monitor
class PerformanceMonitor {
  private measurements: Map<string, number> = new Map();
  private observer?: PerformanceObserver;

  constructor() {
    this.initObserver();
  }

  private initObserver() {
    if (
      typeof window !== "undefined" &&
      "PerformanceObserver" in window
    ) {
      this.observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === "navigation") {
            const navEntry =
              entry as PerformanceNavigationTiming;
            logger.performance.slow(
              "Page Load",
              navEntry.loadEventEnd - navEntry.fetchStart
            );
          }

          if (
            entry.entryType === "largest-contentful-paint"
          ) {
            const lcpTime = entry.startTime;
            if (lcpTime > 2500) {
              // LCP > 2.5s é considerado ruim
              logger.performance.slow("LCP", lcpTime);
            }
          }

          if (entry.entryType === "first-input") {
            const fidTime =
              (entry as any).processingStart -
              entry.startTime;
            if (fidTime > 100) {
              // FID > 100ms é considerado ruim
              logger.performance.slow("FID", fidTime);
            }
          }
        });
      });

      try {
        this.observer.observe({
          entryTypes: [
            "navigation",
            "largest-contentful-paint",
            "first-input",
          ],
        });
      } catch (error) {
        logger.debug(
          "Performance observer not supported",
          "Performance"
        );
      }
    }
  }

  startMeasurement(name: string) {
    this.measurements.set(name, performance.now());
  }

  endMeasurement(name: string) {
    const startTime = this.measurements.get(name);
    if (startTime) {
      const duration = performance.now() - startTime;
      this.measurements.delete(name);

      if (duration > 1000) {
        // Operações > 1s
        logger.performance.slow(name, duration);
      }

      return duration;
    }
    return 0;
  }

  measureFunction<T>(name: string, fn: () => T): T {
    this.startMeasurement(name);
    try {
      const result = fn();
      return result;
    } finally {
      this.endMeasurement(name);
    }
  }

  async measureAsyncFunction<T>(
    name: string,
    fn: () => Promise<T>
  ): Promise<T> {
    this.startMeasurement(name);
    try {
      const result = await fn();
      return result;
    } finally {
      this.endMeasurement(name);
    }
  }

  getMemoryUsage() {
    if ("memory" in performance) {
      const memory = (performance as any).memory;
      return {
        used: Math.round(memory.usedJSHeapSize / 1048576), // MB
        total: Math.round(memory.totalJSHeapSize / 1048576), // MB
        limit: Math.round(memory.jsHeapSizeLimit / 1048576), // MB
      };
    }
    return null;
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Error Tracker
class ErrorTracker {
  private errorCount = 0;
  private lastErrors: Array<{
    error: Error;
    timestamp: string;
  }> = [];

  constructor() {
    this.setupGlobalErrorHandling();
  }

  private setupGlobalErrorHandling() {
    if (typeof window !== "undefined") {
      window.addEventListener("error", (event) => {
        this.trackError(event.error, "Global Error");
      });

      window.addEventListener(
        "unhandledrejection",
        (event) => {
          this.trackError(
            new Error(event.reason),
            "Unhandled Promise"
          );
        }
      );
    }
  }

  trackError(error: Error, context = "Unknown") {
    this.errorCount++;
    const errorInfo = {
      error,
      timestamp: new Date().toISOString(),
    };

    this.lastErrors.push(errorInfo);
    if (this.lastErrors.length > 10) {
      this.lastErrors = this.lastErrors.slice(-10);
    }

    logger.error(
      `${context}: ${error.message}`,
      "Error Tracker",
      {
        stack: error.stack,
        errorCount: this.errorCount,
      }
    );
  }

  getErrorStats() {
    return {
      totalErrors: this.errorCount,
      recentErrors: this.lastErrors,
    };
  }
}

export const errorTracker = new ErrorTracker();

// Analytics Tracker (simulado)
class Analytics {
  private events: Array<{
    event: string;
    properties: Record<string, any>;
    timestamp: string;
  }> = [];

  track(
    event: string,
    properties: Record<string, any> = {}
  ) {
    const eventData = {
      event,
      properties,
      timestamp: new Date().toISOString(),
    };

    this.events.push(eventData);

    // Manter apenas os últimos 100 eventos
    if (this.events.length > 100) {
      this.events = this.events.slice(-100);
    }

    logger.info(
      `Analytics: ${event}`,
      "Analytics",
      properties
    );

    // Em produção, enviar para GA4, Mixpanel, etc.
    if (!import.meta.env.DEV) {
      this.sendToAnalytics(eventData);
    }
  }

  private async sendToAnalytics(eventData: any) {
    try {
      // Implementar envio para serviço de analytics
      // gtag('event', eventData.event, eventData.properties);
    } catch (error) {
      logger.warn(
        "Failed to send analytics event",
        "Analytics",
        { error }
      );
    }
  }

  // Eventos específicos do ReadQuest
  readingSession = {
    start: (
      bookId: string,
      sessionType: "reading" | "listening"
    ) =>
      this.track("reading_session_start", {
        bookId,
        sessionType,
      }),
    end: (
      bookId: string,
      duration: number,
      pagesRead: number
    ) =>
      this.track("reading_session_end", {
        bookId,
        duration,
        pagesRead,
      }),
  };

  social = {
    postCreated: (hasBook: boolean, hasImage: boolean) =>
      this.track("post_created", { hasBook, hasImage }),
    postLiked: (postId: string) =>
      this.track("post_liked", { postId }),
    commentCreated: (postId: string) =>
      this.track("comment_created", { postId }),
  };

  achievement = {
    unlocked: (achievementId: string, points: number) =>
      this.track("achievement_unlocked", {
        achievementId,
        points,
      }),
  };

  getEvents() {
    return this.events;
  }
}

export const analytics = new Analytics();

// Hook para usar o sistema de monitoramento
export const useMonitoring = () => {
  return {
    logger,
    performanceMonitor,
    errorTracker,
    analytics,
  };
};
