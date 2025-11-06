/**
 * Custom Error Classes for the JML solution
 */

export class JMLError extends Error {
  constructor(
    message: string,
    public code: string,
    public userMessage: string,
    public details?: any
  ) {
    super(message);
    this.name = "JMLError";
    Object.setPrototypeOf(this, JMLError.prototype);
  }
}

export class NotFoundError extends JMLError {
  constructor(entity: string, id: string | number) {
    super(
      `${entity} with ID ${id} not found`,
      "NOT_FOUND",
      `The requested ${entity} could not be found.`,
      { entity, id }
    );
    this.name = "NotFoundError";
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class ValidationError extends JMLError {
  constructor(field: string, message: string) {
    super(
      `Validation failed for ${field}: ${message}`,
      "VALIDATION_ERROR",
      `Please check the ${field} field: ${message}`,
      { field, validationMessage: message }
    );
    this.name = "ValidationError";
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class PermissionError extends JMLError {
  constructor(action: string) {
    super(
      `Permission denied for action: ${action}`,
      "PERMISSION_DENIED",
      "You don't have permission to perform this action.",
      { action }
    );
    this.name = "PermissionError";
    Object.setPrototypeOf(this, PermissionError.prototype);
  }
}

/**
 * Global Error Handler Service
 */
export class ErrorHandlerService {
  private static logToConsole: boolean = true;

  public static handle(error: Error, context?: string): void {
    // Log to console in development
    if (this.logToConsole) {
      console.error(`[${context || 'JML'}] Error occurred:`, error);
    }

    // Log to SharePoint list (async, non-blocking)
    this.logToSharePoint(error, context).catch(logError => {
      console.error('Failed to log error to SharePoint:', logError);
    });

    // Show user-friendly message
    this.showUserMessage(error);
  }

  private static async logToSharePoint(error: Error, context?: string): Promise<void> {
    try {
      // TODO: Implement SP list logging when PnP service is ready
      // await sp.web.lists.getByTitle("Error Log").items.add({
      //   Title: error.message,
      //   ErrorType: error.name,
      //   Context: context,
      //   StackTrace: error.stack,
      //   Timestamp: new Date().toISOString()
      // });
    } catch (logError) {
      console.error('Error logging failed:', logError);
    }
  }

  private static showUserMessage(error: Error): void {
    let message = "An unexpected error occurred. Please try again.";

    if (error instanceof JMLError) {
      message = error.userMessage;
    }

    // TODO: Implement UI notification when component is ready
    console.warn('User Message:', message);
  }

  public static setLogToConsole(enabled: boolean): void {
    this.logToConsole = enabled;
  }
}

/**
 * Retry utility for network operations
 */
export async function fetchWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      // Don't retry on validation or permission errors
      if (error instanceof ValidationError || error instanceof PermissionError) {
        throw error;
      }

      // Wait before retry (exponential backoff)
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs * Math.pow(2, i)));
      }
    }
  }

  throw lastError!;
}
