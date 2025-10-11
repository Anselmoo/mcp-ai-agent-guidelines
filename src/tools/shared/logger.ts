/**
 * Structured logging utility for production code
 * Provides consistent, queryable log output for monitoring and debugging
 */

export interface LogContext {
	[key: string]: unknown;
}

export type LogLevel = "debug" | "info" | "warn" | "error";

/**
 * Structured logger that outputs JSON-formatted log messages
 * for improved monitoring and debuggability in production
 */
class Logger {
	/**
	 * Log a warning message with optional context
	 */
	warn(message: string, context?: LogContext): void {
		this.log("warn", message, context);
	}

	/**
	 * Log an error message with optional context
	 */
	error(message: string, context?: LogContext): void {
		this.log("error", message, context);
	}

	/**
	 * Log an info message with optional context
	 */
	info(message: string, context?: LogContext): void {
		this.log("info", message, context);
	}

	/**
	 * Log a debug message with optional context
	 */
	debug(message: string, context?: LogContext): void {
		this.log("debug", message, context);
	}

	/**
	 * Internal logging method that outputs structured JSON
	 */
	private log(level: LogLevel, message: string, context?: LogContext): void {
		const logEntry = {
			timestamp: new Date().toISOString(),
			level,
			message,
			...(context && { context }),
		};

		// Output to stderr for warn/error, stdout for info/debug
		const output =
			level === "warn" || level === "error" ? console.error : console.log;
		output(JSON.stringify(logEntry));
	}
}

/**
 * Singleton logger instance
 */
export const logger = new Logger();
