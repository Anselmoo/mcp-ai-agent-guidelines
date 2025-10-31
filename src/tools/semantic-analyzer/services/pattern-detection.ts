/**
 * Pattern Detection Service
 *
 * Detects design patterns and coding patterns in code
 */

import type { PatternDetector, PatternInfo } from "../types/index.js";

/**
 * Pattern Registry for extensible pattern detection
 */
export class PatternRegistry {
	private static instance: PatternRegistry;
	private detectors: Map<string, PatternDetector> = new Map();

	private constructor() {
		this.registerDefaultPatterns();
	}

	static getInstance(): PatternRegistry {
		if (!PatternRegistry.instance) {
			PatternRegistry.instance = new PatternRegistry();
		}
		return PatternRegistry.instance;
	}

	/**
	 * Register a pattern detector
	 */
	register(detector: PatternDetector): void {
		this.detectors.set(detector.name, detector);
	}

	/**
	 * Detect all patterns in code
	 */
	detectPatterns(code: string, language: string): PatternInfo[] {
		const patterns: PatternInfo[] = [];

		for (const detector of this.detectors.values()) {
			const result = detector.detect(code, language);
			if (result) {
				patterns.push(result);
			}
		}

		return patterns;
	}

	/**
	 * Get all registered pattern names
	 */
	getRegisteredPatterns(): string[] {
		return Array.from(this.detectors.keys());
	}

	private registerDefaultPatterns(): void {
		// Async/Await Pattern
		this.register({
			name: "Async/Await",
			description: "Asynchronous programming pattern",
			detect: (code: string) => {
				if (code.includes("async") && code.includes("await")) {
					const asyncFunctions = code.match(/async\s+(?:function|\w+)/g) || [];
					return {
						pattern: "Async/Await",
						description: "Asynchronous programming pattern detected",
						locations: asyncFunctions.map((f) => f.trim()),
					};
				}
				return null;
			},
		});

		// Error Handling Pattern
		this.register({
			name: "Error Handling",
			description: "Try-catch error handling",
			detect: (code: string) => {
				if (code.includes("try") && code.includes("catch")) {
					return {
						pattern: "Error Handling",
						description: "Try-catch error handling implemented",
						locations: ["try-catch blocks found"],
					};
				}
				return null;
			},
		});

		// Dependency Injection Pattern
		this.register({
			name: "Dependency Injection",
			description: "Constructor-based dependency injection",
			detect: (code: string) => {
				if (code.match(/constructor\s*\([^)]*:/)) {
					return {
						pattern: "Dependency Injection",
						description: "Constructor-based dependency injection",
						locations: ["constructor"],
					};
				}
				return null;
			},
		});

		// Factory Pattern
		this.register({
			name: "Factory Pattern",
			description: "Factory methods for object creation",
			detect: (code: string) => {
				const factoryMethods = code.match(/(?:create|make|build)\w+/gi);
				if (factoryMethods && factoryMethods.length > 0) {
					return {
						pattern: "Factory Pattern",
						description: "Factory methods for object creation",
						locations: [...new Set(factoryMethods)],
					};
				}
				return null;
			},
		});

		// Singleton Pattern
		this.register({
			name: "Singleton Pattern",
			description: "Singleton pattern for single instance",
			detect: (code: string) => {
				const hasSingleton =
					code.match(/private\s+static\s+instance/i) ||
					code.match(/static\s+getInstance\s*\(/i) ||
					code.match(/private\s+constructor\s*\(/i);

				if (hasSingleton) {
					return {
						pattern: "Singleton Pattern",
						description:
							"Singleton pattern detected with private constructor and getInstance",
						locations: ["getInstance method", "private static instance"],
					};
				}
				return null;
			},
		});

		// Observer Pattern
		this.register({
			name: "Observer Pattern",
			description: "Observer/Event pattern for notifications",
			detect: (code: string) => {
				const hasObserver =
					code.match(/(?:add|remove)(?:Observer|Listener|Subscriber)/i) ||
					code.match(/(?:on|off|emit|subscribe|unsubscribe)\s*\(/i) ||
					code.match(/addEventListener|removeEventListener/i);

				if (hasObserver) {
					const methods =
						code.match(
							/(?:add|remove|on|off|emit|subscribe|unsubscribe|addEventListener|removeEventListener)/gi,
						) || [];
					return {
						pattern: "Observer Pattern",
						description: "Observer/Event pattern for pub-sub notifications",
						locations: [...new Set(methods)],
					};
				}
				return null;
			},
		});

		// Decorator Pattern
		this.register({
			name: "Decorator Pattern",
			description: "Decorator pattern for extending behavior",
			detect: (code: string) => {
				const hasDecorator =
					code.match(/@\w+/g) || // TypeScript/Python decorators
					code.match(/class\s+\w+Decorator/i) ||
					code.match(/extends\s+\w+\s+implements\s+\w+/i);

				if (hasDecorator) {
					const decorators = code.match(/@\w+/g) || [];
					return {
						pattern: "Decorator Pattern",
						description: "Decorator pattern for extending functionality",
						locations:
							decorators.length > 0 ? decorators : ["Decorator class found"],
					};
				}
				return null;
			},
		});

		// Strategy Pattern
		this.register({
			name: "Strategy Pattern",
			description: "Strategy pattern for interchangeable algorithms",
			detect: (code: string) => {
				const hasStrategy =
					code.match(/interface\s+\w+Strategy/i) ||
					code.match(/class\s+\w+Strategy/i) ||
					code.match(/setStrategy\s*\(/i);

				if (hasStrategy) {
					return {
						pattern: "Strategy Pattern",
						description: "Strategy pattern for algorithm selection",
						locations: ["Strategy interface/class found"],
					};
				}
				return null;
			},
		});

		// Builder Pattern
		this.register({
			name: "Builder Pattern",
			description: "Builder pattern for object construction",
			detect: (code: string) => {
				const hasBuilder =
					code.match(/class\s+\w+Builder/i) ||
					code.match(/\.build\s*\(\s*\)/i) ||
					code.match(/with\w+\s*\(/i);

				if (hasBuilder) {
					return {
						pattern: "Builder Pattern",
						description: "Builder pattern for fluent object construction",
						locations: ["Builder class or build methods found"],
					};
				}
				return null;
			},
		});

		// Adapter Pattern
		this.register({
			name: "Adapter Pattern",
			description: "Adapter pattern for interface compatibility",
			detect: (code: string) => {
				const hasAdapter =
					code.match(/class\s+\w+Adapter/i) ||
					code.match(/implements\s+\w+\s*{[^}]*adapt/is);

				if (hasAdapter) {
					return {
						pattern: "Adapter Pattern",
						description: "Adapter pattern for converting interfaces",
						locations: ["Adapter class found"],
					};
				}
				return null;
			},
		});

		// Promise/Future Pattern
		this.register({
			name: "Promise Pattern",
			description: "Promise-based asynchronous pattern",
			detect: (code: string) => {
				const hasPromise =
					code.match(/new\s+Promise\s*\(/i) ||
					code.match(/\.then\s*\(/i) ||
					code.match(/\.catch\s*\(/i);

				if (hasPromise) {
					return {
						pattern: "Promise Pattern",
						description: "Promise-based asynchronous handling",
						locations: ["Promise usage found"],
					};
				}
				return null;
			},
		});
	}
}

/**
 * Singleton instance for easy access
 */
export const patternRegistry = PatternRegistry.getInstance();

/**
 * Detect patterns in code
 */
export function detectPatterns(code: string, language: string): PatternInfo[] {
	return patternRegistry.detectPatterns(code, language);
}
