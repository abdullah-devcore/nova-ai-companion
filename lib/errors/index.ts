// ============================================================================
// CUSTOM ERROR CLASSES
// ============================================================================

export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class AuthError extends AppError {
  constructor(message: string, details?: any) {
    super("AUTH_ERROR", message, 401, details);
    this.name = "AuthError";
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, details?: any) {
    super("DATABASE_ERROR", message, 500, details);
    this.name = "DatabaseError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super("VALIDATION_ERROR", message, 400, details);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, details?: any) {
    super(
      "NOT_FOUND",
      `${resource} not found`,
      404,
      details
    );
    this.name = "NotFoundError";
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = "Too many requests", details?: any) {
    super("RATE_LIMIT", message, 429, details);
    this.name = "RateLimitError";
  }
}

// ============================================================================
// ERROR UTILITIES
// ============================================================================

interface ErrorOptions {
  retry?: boolean;
  retryCount?: number;
  retryDelay?: number;
  fallback?: any;
  logError?: boolean;
}

/**
 * Execute function with retry logic
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: ErrorOptions = {}
): Promise<T> {
  const {
    retry = true,
    retryCount = 3,
    retryDelay = 1000,
    fallback = null,
    logError = true,
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < retryCount; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (logError) {
        console.error(
          `[Error] Attempt ${attempt + 1}/${retryCount} failed:`,
          error
        );
      }

      // Don't retry for certain errors
      if (error instanceof ValidationError || error instanceof AuthError) {
        throw error;
      }

      // Wait before retry
      if (attempt < retryCount - 1) {
        await new Promise((resolve) =>
          setTimeout(resolve, retryDelay * Math.pow(2, attempt))
        );
      }
    }
  }

  // If all retries exhausted
  if (fallback !== null) {
    console.warn("[Error] All retries exhausted, using fallback");
    return fallback;
  }

  throw lastError || new Error("Unknown error after retries");
}

/**
 * Handle error gracefully with logging and user feedback
 */
export function handleError(error: any): {
  message: string;
  code: string;
  statusCode: number;
} {
  if (error instanceof AppError) {
    console.error(`[${error.code}]`, error.message, error.details);
    return {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
    };
  }

  // Supabase errors
  if (error?.message?.includes("Failed to find Server Action")) {
    console.error("[Server Action Error]", error.message);
    return {
      message: "Server action not found. Please refresh the page.",
      code: "SERVER_ACTION_ERROR",
      statusCode: 500,
    };
  }

  if (error?.message?.includes("JWT expired")) {
    console.error("[Auth Error]", "Session expired");
    return {
      message: "Your session has expired. Please sign in again.",
      code: "SESSION_EXPIRED",
      statusCode: 401,
    };
  }

  if (error?.message?.includes("duplicate key value")) {
    console.error("[Database Error]", "Duplicate entry");
    return {
      message: "This item already exists.",
      code: "DUPLICATE_ENTRY",
      statusCode: 400,
    };
  }

  if (error?.message?.includes("violates foreign key")) {
    console.error("[Database Error]", "Foreign key violation");
    return {
      message: "Invalid reference. Please check your data.",
      code: "INVALID_REFERENCE",
      statusCode: 400,
    };
  }

  // Generic error
  const message = error?.message || "An unexpected error occurred";
  console.error("[Unknown Error]", message);

  return {
    message,
    code: "UNKNOWN_ERROR",
    statusCode: 500,
  };
}

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) errors.push("Password must be at least 8 characters");
  if (!/[A-Z]/.test(password))
    errors.push("Password must contain uppercase letter");
  if (!/[a-z]/.test(password))
    errors.push("Password must contain lowercase letter");
  if (!/[0-9]/.test(password)) errors.push("Password must contain number");

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateUsername(username: string): {
  valid: boolean;
  error?: string;
} {
  if (username.length < 3) {
    return { valid: false, error: "Username must be at least 3 characters" };
  }
  if (username.length > 30) {
    return { valid: false, error: "Username must not exceed 30 characters" };
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return {
      valid: false,
      error: "Username can only contain letters, numbers, underscores, and hyphens",
    };
  }
  return { valid: true };
}

// ============================================================================
// ASYNC STATE MANAGER
// ============================================================================

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function createInitialAsyncState<T>(): AsyncState<T> {
  return {
    data: null,
    loading: false,
    error: null,
  };
}

export function createLoadingState<T>(): AsyncState<T> {
  return {
    data: null,
    loading: true,
    error: null,
  };
}

export function createSuccessState<T>(data: T): AsyncState<T> {
  return {
    data,
    loading: false,
    error: null,
  };
}

export function createErrorState<T>(error: string): AsyncState<T> {
  return {
    data: null,
    loading: false,
    error,
  };
}

// ============================================================================
// LOGGING UTILITIES
// ============================================================================

export interface LogEntry {
  timestamp: string;
  level: "info" | "warn" | "error" | "debug";
  category: string;
  message: string;
  data?: any;
}

const logs: LogEntry[] = [];

export function logEvent(
  category: string,
  message: string,
  level: "info" | "warn" | "error" | "debug" = "info",
  data?: any
): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    category,
    message,
    data,
  };

  logs.push(entry);

  // Keep only last 100 logs in memory
  if (logs.length > 100) {
    logs.shift();
  }

  // Console output
  const prefix = `[${category}]`;
  switch (level) {
    case "error":
      console.error(prefix, message, data);
      break;
    case "warn":
      console.warn(prefix, message, data);
      break;
    case "debug":
      if (process.env.NODE_ENV === "development") {
        console.debug(prefix, message, data);
      }
      break;
    default:
      console.log(prefix, message, data);
  }
}

export function getLogs(category?: string): LogEntry[] {
  return category ? logs.filter((l) => l.category === category) : logs;
}

export function clearLogs(): void {
  logs.length = 0;
}
