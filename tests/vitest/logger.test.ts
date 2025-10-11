import { describe, expect, it, vi } from "vitest";
import { logger } from "../../src/tools/shared/logger";

describe("Logger", () => {
	it("should log warn messages with structured JSON format", () => {
		const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation();

		logger.warn("Test warning message", { key: "value", count: 42 });

		expect(consoleErrorSpy).toHaveBeenCalledOnce();
		const loggedMessage = consoleErrorSpy.mock.calls[0][0];
		const parsed = JSON.parse(loggedMessage as string);

		expect(parsed).toHaveProperty("timestamp");
		expect(parsed.level).toBe("warn");
		expect(parsed.message).toBe("Test warning message");
		expect(parsed.context).toEqual({ key: "value", count: 42 });

		consoleErrorSpy.mockRestore();
	});

	it("should log error messages with structured JSON format", () => {
		const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation();

		logger.error("Test error message", { errorCode: "E123" });

		expect(consoleErrorSpy).toHaveBeenCalledOnce();
		const loggedMessage = consoleErrorSpy.mock.calls[0][0];
		const parsed = JSON.parse(loggedMessage as string);

		expect(parsed).toHaveProperty("timestamp");
		expect(parsed.level).toBe("error");
		expect(parsed.message).toBe("Test error message");
		expect(parsed.context).toEqual({ errorCode: "E123" });

		consoleErrorSpy.mockRestore();
	});

	it("should log info messages with structured JSON format", () => {
		const consoleLogSpy = vi.spyOn(console, "log").mockImplementation();

		logger.info("Test info message", { status: "success" });

		expect(consoleLogSpy).toHaveBeenCalledOnce();
		const loggedMessage = consoleLogSpy.mock.calls[0][0];
		const parsed = JSON.parse(loggedMessage as string);

		expect(parsed).toHaveProperty("timestamp");
		expect(parsed.level).toBe("info");
		expect(parsed.message).toBe("Test info message");
		expect(parsed.context).toEqual({ status: "success" });

		consoleLogSpy.mockRestore();
	});

	it("should log debug messages with structured JSON format", () => {
		const consoleLogSpy = vi.spyOn(console, "log").mockImplementation();

		logger.debug("Test debug message");

		expect(consoleLogSpy).toHaveBeenCalledOnce();
		const loggedMessage = consoleLogSpy.mock.calls[0][0];
		const parsed = JSON.parse(loggedMessage as string);

		expect(parsed).toHaveProperty("timestamp");
		expect(parsed.level).toBe("debug");
		expect(parsed.message).toBe("Test debug message");
		expect(parsed.context).toBeUndefined();

		consoleLogSpy.mockRestore();
	});

	it("should log messages without context", () => {
		const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation();

		logger.warn("Warning without context");

		expect(consoleErrorSpy).toHaveBeenCalledOnce();
		const loggedMessage = consoleErrorSpy.mock.calls[0][0];
		const parsed = JSON.parse(loggedMessage as string);

		expect(parsed).toHaveProperty("timestamp");
		expect(parsed.level).toBe("warn");
		expect(parsed.message).toBe("Warning without context");
		expect(parsed).not.toHaveProperty("context");

		consoleErrorSpy.mockRestore();
	});

	it("should include valid ISO timestamp", () => {
		const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation();

		logger.warn("Test timestamp");

		const loggedMessage = consoleErrorSpy.mock.calls[0][0];
		const parsed = JSON.parse(loggedMessage as string);

		// Check that timestamp is a valid ISO string
		expect(() => new Date(parsed.timestamp)).not.toThrow();
		expect(new Date(parsed.timestamp).toISOString()).toBe(parsed.timestamp);

		consoleErrorSpy.mockRestore();
	});

	it("should output warn and error to stderr", () => {
		const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation();
		const consoleLogSpy = vi.spyOn(console, "log").mockImplementation();

		logger.warn("Test warn");
		logger.error("Test error");

		expect(consoleErrorSpy).toHaveBeenCalledTimes(2);
		expect(consoleLogSpy).not.toHaveBeenCalled();

		consoleErrorSpy.mockRestore();
		consoleLogSpy.mockRestore();
	});

	it("should output info and debug to stdout", () => {
		const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation();
		const consoleLogSpy = vi.spyOn(console, "log").mockImplementation();

		logger.info("Test info");
		logger.debug("Test debug");

		expect(consoleLogSpy).toHaveBeenCalledTimes(2);
		expect(consoleErrorSpy).not.toHaveBeenCalled();

		consoleErrorSpy.mockRestore();
		consoleLogSpy.mockRestore();
	});
});
