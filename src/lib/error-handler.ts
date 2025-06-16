// Global error handler for the application
export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorLog: Array<{
    timestamp: Date;
    type: string;
    message: string;
    stack?: string;
    url?: string;
  }> = [];

  private constructor() {
    this.setupGlobalHandlers();
  }

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  private setupGlobalHandlers() {
    if (typeof window !== 'undefined') {
      // Client-side error handling
      window.addEventListener('error', (event) => {
        this.logError('window-error', event.message, event.error?.stack, window.location.href);
        this.sendToServer({
          type: 'window-error',
          message: event.message,
          stack: event.error?.stack,
          url: window.location.href
        });
      });

      window.addEventListener('unhandledrejection', (event) => {
        this.logError('unhandled-rejection', event.reason?.toString() || 'Unknown promise rejection', 
          event.reason?.stack, window.location.href);
        this.sendToServer({
          type: 'unhandled-rejection',
          message: event.reason?.toString() || 'Unknown promise rejection',
          stack: event.reason?.stack,
          url: window.location.href
        });
      });
    } else {
      // Server-side error handling
      process.on('uncaughtException', (error) => {
        console.error('[UNCAUGHT EXCEPTION]', error);
        this.logError('uncaught-exception', error.message, error.stack);
      });

      process.on('unhandledRejection', (reason, promise) => {
        console.error('[UNHANDLED REJECTION]', reason);
        this.logError('unhandled-rejection', reason?.toString() || 'Unknown rejection');
      });
    }
  }

  private logError(type: string, message: string, stack?: string, url?: string) {
    const error = {
      timestamp: new Date(),
      type,
      message,
      stack,
      url
    };
    
    this.errorLog.push(error);
    
    // Keep only last 100 errors in memory
    if (this.errorLog.length > 100) {
      this.errorLog.shift();
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error(`[${type.toUpperCase()}]`, {
        message,
        stack,
        url,
        timestamp: error.timestamp.toISOString()
      });
    }
  }

  private async sendToServer(error: any) {
    try {
      await fetch('/api/client-errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(error)
      });
    } catch (err) {
      console.error('Failed to send error to server:', err);
    }
  }

  public getRecentErrors(count: number = 10) {
    return this.errorLog.slice(-count);
  }

  public clearErrors() {
    this.errorLog = [];
  }

  // Manual error logging
  public logCustomError(message: string, details?: any) {
    this.logError('custom', message, details?.stack);
    if (typeof window !== 'undefined') {
      this.sendToServer({
        type: 'custom',
        message,
        details,
        url: window.location.href
      });
    }
  }
}

// Initialize error handler
export const errorHandler = ErrorHandler.getInstance(); 