/**
 * Context Pattern Analyzer Service
 * Provides context-aware design pattern recommendations based on language, framework, and code analysis
 */

/**
 * Language-specific design pattern knowledge base
 */
interface LanguageDesignInfo {
	solidPrinciples: string[];
	designPatterns: string[];
	bestPractices: string[];
	antiPatterns: string[];
}

const LANGUAGE_DESIGN_MAP: Record<string, LanguageDesignInfo> = {
	typescript: {
		solidPrinciples: [
			"Single Responsibility: Use classes/modules with focused purposes; leverage TypeScript's strict type system to enforce boundaries",
			"Open/Closed: Use interfaces and abstract classes for extensibility; avoid modifying existing types",
			"Liskov Substitution: Ensure derived types are substitutable for base types; use type guards for safe narrowing",
			"Interface Segregation: Define small, focused interfaces; use intersection types for composition",
			"Dependency Inversion: Depend on abstractions (interfaces) not concrete implementations; use dependency injection patterns",
		],
		designPatterns: [
			"Factory Pattern: Use factory functions or classes for object creation with proper typing",
			"Singleton Pattern: Implement with ES6 modules or classes, leveraging TypeScript's type safety",
			"Observer Pattern: Implement with RxJS observables or custom event emitters with type safety",
			"Decorator Pattern: Use TypeScript decorators for cross-cutting concerns (with experimentalDecorators)",
			"Strategy Pattern: Leverage union types and type guards for strategy selection",
			"Builder Pattern: Use fluent interfaces with method chaining and return type inference",
		],
		bestPractices: [
			"Use strict mode (strict: true in tsconfig.json) for enhanced type safety",
			"Prefer 'unknown' over 'any' for better type safety when types are uncertain",
			"Use readonly modifiers to prevent unintended mutations",
			"Implement proper error handling with custom error types",
			"Use discriminated unions for type-safe state management",
			"Leverage mapped types and conditional types for advanced type transformations",
		],
		antiPatterns: [
			"Overuse of 'any' type: Bypasses type system benefits; use 'unknown' or proper typing instead",
			"Type assertions everywhere: Indicates design flaws; refactor to proper type inference",
			"Ignoring null/undefined: Use optional chaining and nullish coalescing operators",
			"God classes: Break down into smaller, focused modules with clear responsibilities",
		],
	},
	javascript: {
		solidPrinciples: [
			"Single Responsibility: Keep functions and modules focused on one task; use ES6 modules for organization",
			"Open/Closed: Use composition and higher-order functions for extensibility without modification",
			"Liskov Substitution: Ensure objects of derived 'classes' can replace base without breaking functionality",
			"Interface Segregation: Create small, focused modules; avoid monolithic objects",
			"Dependency Inversion: Use dependency injection through function parameters or module systems",
		],
		designPatterns: [
			"Module Pattern: Use ES6 modules for encapsulation and namespace management",
			"Factory Pattern: Create object factories for consistent object creation",
			"Observer Pattern: Implement with event emitters or custom pub/sub systems",
			"Prototype Pattern: Leverage JavaScript's prototypal inheritance appropriately",
			"Middleware Pattern: Chain functions for request/response processing (Express-style)",
		],
		bestPractices: [
			"Use 'use strict' mode to catch common coding mistakes",
			"Implement proper error handling with try/catch and Promise rejection handling",
			"Use const/let instead of var for block scoping",
			"Leverage async/await for cleaner asynchronous code",
			"Apply functional programming principles: pure functions, immutability",
		],
		antiPatterns: [
			"Callback hell: Use Promises or async/await instead",
			"Global namespace pollution: Use modules and IIFE patterns",
			"Mutating shared state: Prefer immutability and pure functions",
			"Ignoring error handling: Always handle Promise rejections and errors",
		],
	},
	python: {
		solidPrinciples: [
			"Single Responsibility: One class/module should have only one reason to change; use packages for organization",
			"Open/Closed: Use abstract base classes and duck typing for extensibility",
			"Liskov Substitution: Ensure subclasses can replace parent classes without breaking code",
			"Interface Segregation: Prefer multiple small protocols/ABCs over large monolithic ones",
			"Dependency Inversion: Use dependency injection and abstract base classes for decoupling",
		],
		designPatterns: [
			"Factory Pattern: Use factory methods or abstract factories for object creation",
			"Singleton Pattern: Implement using metaclasses or module-level instances",
			"Decorator Pattern: Leverage Python's built-in decorator syntax for cross-cutting concerns",
			"Context Manager Pattern: Use 'with' statements and context managers for resource management",
			"Iterator Pattern: Implement custom iterators with __iter__ and __next__",
			"Strategy Pattern: Use protocol classes or duck typing for algorithm families",
		],
		bestPractices: [
			"Follow PEP 8 style guidelines for code consistency",
			"Use type hints (PEP 484) for better code documentation and IDE support",
			"Implement proper error handling with specific exception types",
			"Use dataclasses or attrs for data-centric classes",
			"Leverage list comprehensions and generators for efficient iteration",
			"Use context managers for resource cleanup",
		],
		antiPatterns: [
			"Using mutable default arguments: Can cause unexpected behavior across calls",
			"Bare except clauses: Always catch specific exceptions",
			"Not using virtual environments: Leads to dependency conflicts",
			"Overusing inheritance: Prefer composition over inheritance",
		],
	},
	java: {
		solidPrinciples: [
			"Single Responsibility: Each class should have one well-defined purpose",
			"Open/Closed: Use abstract classes and interfaces for extension without modification",
			"Liskov Substitution: Subtypes must be substitutable for their base types",
			"Interface Segregation: Define focused interfaces; use multiple interfaces over fat ones",
			"Dependency Inversion: Depend on abstractions (interfaces) not concrete classes",
		],
		designPatterns: [
			"Factory Pattern: Use factory methods or abstract factory for object creation",
			"Singleton Pattern: Implement with enum or synchronized getInstance()",
			"Builder Pattern: Use static inner builder classes for complex object construction",
			"Observer Pattern: Implement with java.util.Observable or custom listeners",
			"Strategy Pattern: Define algorithm families with interfaces",
			"Adapter Pattern: Wrap incompatible interfaces for integration",
			"Template Method Pattern: Define algorithm skeleton in base class",
		],
		bestPractices: [
			"Use interfaces and abstract classes for abstraction",
			"Implement proper exception handling with checked and unchecked exceptions",
			"Use generics for type-safe collections",
			"Follow naming conventions (PascalCase for classes, camelCase for methods)",
			"Use dependency injection frameworks (Spring, Guice)",
			"Implement equals(), hashCode(), and toString() appropriately",
		],
		antiPatterns: [
			"God Object: Classes with too many responsibilities",
			"Magic numbers: Use constants or enums instead",
			"Catching generic Exception: Catch specific exception types",
			"Not closing resources: Use try-with-resources for auto-closing",
		],
	},
	csharp: {
		solidPrinciples: [
			"Single Responsibility: Classes should have one reason to change",
			"Open/Closed: Use interfaces and abstract classes for extensibility",
			"Liskov Substitution: Derived classes must be substitutable for base classes",
			"Interface Segregation: Many specific interfaces are better than one general interface",
			"Dependency Inversion: High-level modules should not depend on low-level modules",
		],
		designPatterns: [
			"Factory Pattern: Use factory methods for object creation",
			"Singleton Pattern: Implement with lazy initialization or Lazy<T>",
			"Repository Pattern: Abstract data access layer",
			"Unit of Work Pattern: Coordinate multiple repository operations",
			"MVVM Pattern: Separate concerns in UI applications",
			"Mediator Pattern: Use MediatR for CQRS implementation",
		],
		bestPractices: [
			"Use LINQ for collection operations",
			"Implement async/await for asynchronous operations",
			"Use nullable reference types (C# 8+) to prevent null reference exceptions",
			"Follow naming conventions (PascalCase for public members)",
			"Use dependency injection with built-in DI container",
			"Implement IDisposable for resource cleanup",
		],
		antiPatterns: [
			"Not disposing resources: Use using statements or IDisposable",
			"Catching and swallowing exceptions without logging",
			"Using static classes for everything: Reduces testability",
			"Ignoring async/await: Can cause deadlocks and performance issues",
		],
	},
	go: {
		solidPrinciples: [
			"Single Responsibility: Functions and packages should have focused purposes",
			"Open/Closed: Use interfaces for extensibility; composition over inheritance",
			"Liskov Substitution: Interface implementations should be substitutable",
			"Interface Segregation: Define small, focused interfaces",
			"Dependency Inversion: Depend on interfaces, not concrete types",
		],
		designPatterns: [
			"Factory Pattern: Use constructor functions for object creation",
			"Builder Pattern: Use functional options pattern for configuration",
			"Singleton Pattern: Use sync.Once for lazy initialization",
			"Decorator Pattern: Wrap interfaces for added functionality",
			"Strategy Pattern: Use interfaces for interchangeable algorithms",
			"Middleware Pattern: Chain handlers for request processing",
		],
		bestPractices: [
			"Use goroutines and channels for concurrent operations",
			"Handle errors explicitly; don't ignore returned errors",
			"Use defer for cleanup operations",
			"Keep interfaces small and focused",
			"Use context for cancellation and timeouts",
			"Follow Go idioms (gofmt, effective Go guidelines)",
		],
		antiPatterns: [
			"Ignoring errors: Always check and handle error returns",
			"Not using defer for cleanup: Can lead to resource leaks",
			"Premature goroutine usage: Can complicate simple code",
			"Sharing memory instead of communicating: Prefer channels over shared memory",
		],
	},
	rust: {
		solidPrinciples: [
			"Single Responsibility: Modules and structs should have focused purposes",
			"Open/Closed: Use traits for extensibility without modifying existing code",
			"Liskov Substitution: Trait implementations should be substitutable",
			"Interface Segregation: Define focused traits",
			"Dependency Inversion: Depend on traits, not concrete types",
		],
		designPatterns: [
			"Builder Pattern: Use builder pattern for complex struct construction",
			"Newtype Pattern: Wrap types for additional type safety",
			"RAII Pattern: Use ownership system for automatic resource management",
			"Strategy Pattern: Use trait objects for runtime polymorphism",
			"Visitor Pattern: Use pattern matching for type-based dispatch",
			"State Pattern: Use enum and pattern matching for state machines",
		],
		bestPractices: [
			"Leverage ownership and borrowing for memory safety",
			"Use Result and Option types for error handling",
			"Minimize unsafe code; document safety invariants",
			"Use pattern matching for exhaustive case handling",
			"Implement traits for common operations (Debug, Clone, etc.)",
			"Use cargo for dependency management and builds",
		],
		antiPatterns: [
			"Overuse of clone(): Can impact performance; use references when possible",
			"Fighting the borrow checker: Indicates design issues; refactor ownership",
			"Unnecessary unsafe blocks: Minimize and document unsafe code",
			"Not handling Result types: Always handle potential errors",
		],
	},
};

/**
 * Framework-specific design pattern knowledge base
 */
interface FrameworkDesignInfo {
	architecturePatterns: string[];
	bestPractices: string[];
	commonIssues: string[];
	recommendedStructures: string[];
}

const FRAMEWORK_DESIGN_MAP: Record<string, FrameworkDesignInfo> = {
	react: {
		architecturePatterns: [
			"Atomic Design: Organize components hierarchically (atoms → molecules → organisms → templates → pages)",
			"Container/Presentation Pattern: Separate logic (containers) from UI (presentational components)",
			"Compound Components Pattern: Create flexible, composable component APIs",
			"Render Props Pattern: Share code between components using props with function values",
			"Higher-Order Components (HOC): Enhance components with additional functionality",
			"Custom Hooks Pattern: Extract and reuse stateful logic across components",
		],
		bestPractices: [
			"Use functional components with hooks for most cases",
			"Implement proper prop validation with PropTypes or TypeScript",
			"Memoize expensive computations with useMemo",
			"Use React.memo for component memoization to prevent unnecessary re-renders",
			"Keep components small and focused (single responsibility)",
			"Implement error boundaries for graceful error handling",
			"Use React Context API for global state (avoid prop drilling)",
			"Follow accessibility guidelines (ARIA attributes, semantic HTML)",
		],
		commonIssues: [
			"Prop drilling: Use Context API or state management libraries",
			"Unnecessary re-renders: Use React.memo, useMemo, useCallback",
			"Missing key props in lists: Always provide unique keys",
			"Side effects in render: Use useEffect for side effects",
			"Not cleaning up effects: Return cleanup functions from useEffect",
		],
		recommendedStructures: [
			"Feature-based organization: Group by features/domains rather than types",
			"Atomic design structure: atoms/, molecules/, organisms/, templates/, pages/",
			"Separation of concerns: components/, hooks/, utils/, services/",
			"Colocation: Keep related files together (component, styles, tests)",
		],
	},
	angular: {
		architecturePatterns: [
			"Module-based architecture: Organize into feature modules and shared modules",
			"Smart/Dumb Components: Container components for logic, presentational for UI",
			"Reactive Programming: Use RxJS observables for async data streams",
			"NgRx/State Management: Redux-like state management for complex apps",
			"Facade Pattern: Create service facades to simplify complex subsystems",
		],
		bestPractices: [
			"Use OnPush change detection strategy for performance",
			"Implement lazy loading for feature modules",
			"Unsubscribe from observables to prevent memory leaks",
			"Use Angular CLI for code generation and consistency",
			"Follow Angular style guide for naming and structure",
			"Implement route guards for authentication and authorization",
			"Use dependency injection for loose coupling",
		],
		commonIssues: [
			"Memory leaks from subscriptions: Use async pipe or takeUntil operator",
			"Performance issues: Use OnPush change detection and trackBy functions",
			"Circular dependencies: Refactor module structure",
			"Not using reactive forms: Prefer reactive over template-driven for complex forms",
		],
		recommendedStructures: [
			"Core module: Singleton services, guards, interceptors",
			"Shared module: Reusable components, directives, pipes",
			"Feature modules: Lazy-loaded, domain-specific functionality",
		],
	},
	vue: {
		architecturePatterns: [
			"Component-based architecture: Reusable, composable components",
			"Vuex/Pinia for state management: Centralized state with actions, mutations, getters",
			"Composition API: Use composables for logic reuse",
			"Provide/Inject Pattern: Share dependencies across component tree",
		],
		bestPractices: [
			"Use Composition API for better code organization and TypeScript support",
			"Implement proper component communication (props down, events up)",
			"Use computed properties for derived state",
			"Leverage scoped styles for component isolation",
			"Implement route-level code splitting",
			"Use Vue Devtools for debugging and performance monitoring",
		],
		commonIssues: [
			"Mutating props: Props should be read-only; emit events for changes",
			"Overusing Vuex: Not all state needs to be global",
			"Memory leaks from event listeners: Clean up in beforeUnmount",
			"Not using keys in v-for: Provide unique keys for list items",
		],
		recommendedStructures: [
			"Feature-based structure: Organize by domain/feature",
			"Components hierarchy: layouts/, views/, components/",
			"Composables: Reusable composition functions in composables/",
		],
	},
	"node.js": {
		architecturePatterns: [
			"Layered Architecture: Controller → Service → Repository layers",
			"Middleware Pattern: Chain request/response handlers",
			"Dependency Injection: Inject dependencies for testability",
			"Repository Pattern: Abstract data access layer",
			"Event-Driven Architecture: Use EventEmitter for decoupling",
			"Microservices Pattern: Decompose into independent services",
		],
		bestPractices: [
			"Use async/await for asynchronous operations",
			"Implement proper error handling middleware",
			"Use environment variables for configuration",
			"Implement logging with structured logging libraries",
			"Use connection pooling for database connections",
			"Implement rate limiting for API protection",
			"Use clustering for CPU-intensive applications",
			"Validate input with libraries like Joi or Zod",
		],
		commonIssues: [
			"Callback hell: Use Promises or async/await",
			"Not handling Promise rejections: Implement global error handlers",
			"Blocking the event loop: Offload CPU-intensive tasks",
			"Memory leaks: Monitor and profile memory usage",
			"Not using environment-specific configs: Use dotenv or config libraries",
		],
		recommendedStructures: [
			"MVC/Layered structure: routes/, controllers/, services/, models/",
			"Feature-based: Organize by business domain",
			"Clean Architecture: Core domain isolated from infrastructure",
		],
	},
	express: {
		architecturePatterns: [
			"MVC Pattern: Model-View-Controller separation",
			"Middleware Chain Pattern: Sequential request processing",
			"Router Pattern: Modular route organization",
			"Service Layer Pattern: Business logic separate from routes",
		],
		bestPractices: [
			"Use express.Router() for modular route definitions",
			"Implement error handling middleware",
			"Use helmet middleware for security headers",
			"Implement request validation middleware",
			"Use async error handling with express-async-errors",
			"Separate business logic from route handlers",
			"Use dependency injection for services",
		],
		commonIssues: [
			"Not handling async errors: Use try/catch or async error wrapper",
			"Middleware order issues: Load security middleware early",
			"Memory leaks from event listeners: Clean up properly",
			"Not validating input: Implement input validation middleware",
		],
		recommendedStructures: [
			"routes/: Route definitions",
			"controllers/: Request handlers",
			"services/: Business logic",
			"middleware/: Custom middleware",
			"models/: Data models",
		],
	},
	django: {
		architecturePatterns: [
			"MVT Pattern: Model-View-Template (Django's MVC variant)",
			"Service Layer Pattern: Extract business logic from views",
			"Repository Pattern: Abstract data access layer",
			"Fat Models, Thin Views: Business logic in models",
		],
		bestPractices: [
			"Use Django ORM instead of raw SQL",
			"Implement custom managers for complex queries",
			"Use class-based views for reusability",
			"Leverage Django's built-in authentication and permissions",
			"Use signals sparingly; prefer explicit calls",
			"Implement proper migration workflow",
			"Use Django REST Framework for APIs",
		],
		commonIssues: [
			"N+1 query problems: Use select_related and prefetch_related",
			"Not using transactions: Wrap related operations in transactions",
			"Circular imports: Refactor app structure",
			"Not caching queries: Implement caching strategy",
		],
		recommendedStructures: [
			"App-based organization: Each app is a self-contained module",
			"models.py: Data models",
			"views.py: View logic",
			"serializers.py: API serialization",
			"services.py: Business logic layer",
		],
	},
	"spring boot": {
		architecturePatterns: [
			"Layered Architecture: Controller → Service → Repository",
			"Dependency Injection: Use Spring's DI container",
			"Repository Pattern: Spring Data JPA repositories",
			"DTO Pattern: Data Transfer Objects for API",
			"Aspect-Oriented Programming: Cross-cutting concerns",
		],
		bestPractices: [
			"Use constructor-based dependency injection",
			"Implement proper exception handling with @ControllerAdvice",
			"Use Spring Boot starters for common functionality",
			"Implement pagination for large datasets",
			"Use Spring Profiles for environment-specific configs",
			"Implement proper logging with SLF4J",
			"Use Spring Security for authentication and authorization",
		],
		commonIssues: [
			"Circular dependencies: Refactor to break cycles",
			"N+1 query problems: Use JOIN FETCH",
			"Not using transactions properly: Use @Transactional appropriately",
			"Overusing field injection: Prefer constructor injection",
		],
		recommendedStructures: [
			"controller/: REST controllers",
			"service/: Business logic",
			"repository/: Data access",
			"model/entity/: JPA entities",
			"dto/: Data transfer objects",
			"config/: Configuration classes",
		],
	},
	"asp.net core": {
		architecturePatterns: [
			"Clean Architecture: Domain at center, dependencies point inward",
			"CQRS Pattern: Separate read and write operations",
			"MediatR Pattern: Mediator for decoupling handlers",
			"Repository Pattern: Abstract data access",
			"Unit of Work Pattern: Coordinate multiple operations",
		],
		bestPractices: [
			"Use built-in dependency injection",
			"Implement async/await throughout",
			"Use Data Annotations or Fluent Validation",
			"Implement proper exception handling middleware",
			"Use Entity Framework Core migrations",
			"Leverage middleware pipeline for cross-cutting concerns",
			"Use action filters for reusable logic",
		],
		commonIssues: [
			"Blocking async calls: Avoid .Result or .Wait()",
			"Not disposing DbContext: Use dependency injection scopes",
			"Over-fetching data: Use projections and select statements",
			"Not using async properly: Can cause thread pool starvation",
		],
		recommendedStructures: [
			"Controllers/: API controllers",
			"Services/: Business logic",
			"Data/: DbContext and migrations",
			"Models/: Domain models and DTOs",
			"Middleware/: Custom middleware",
		],
	},
	rails: {
		architecturePatterns: [
			"MVC Pattern: Model-View-Controller",
			"Service Objects: Extract complex business logic",
			"Form Objects: Handle complex form submissions",
			"Interactor Pattern: Single-purpose business operations",
			"Presenter Pattern: View-specific logic",
		],
		bestPractices: [
			"Follow convention over configuration",
			"Use ActiveRecord callbacks sparingly",
			"Implement service objects for complex logic",
			"Use concerns for shared behavior",
			"Leverage ActiveJob for background processing",
			"Use Rails routing conventions",
			"Implement proper error handling",
		],
		commonIssues: [
			"N+1 queries: Use includes, joins, or preload",
			"Fat models: Extract to service objects",
			"Callback chains: Can become unmaintainable",
			"Not using database indexes: Add indexes for frequent queries",
		],
		recommendedStructures: [
			"app/models/: ActiveRecord models",
			"app/controllers/: Controllers",
			"app/services/: Service objects",
			"app/interactors/: Business logic",
			"app/presenters/: View logic",
		],
	},
};

/**
 * Detect programming language from code context
 */
export function detectLanguage(codeContext: string): string {
	const contextLower = codeContext.toLowerCase();

	// TypeScript indicators
	if (
		contextLower.includes("typescript") ||
		contextLower.includes(".ts") ||
		contextLower.includes("interface ") ||
		contextLower.includes("type ") ||
		contextLower.includes(": string") ||
		contextLower.includes(": number")
	) {
		return "typescript";
	}

	// JavaScript indicators
	if (
		contextLower.includes("javascript") ||
		contextLower.includes(".js") ||
		contextLower.includes("const ") ||
		contextLower.includes("let ") ||
		contextLower.includes("var ")
	) {
		return "javascript";
	}

	// Python indicators
	if (
		contextLower.includes("python") ||
		contextLower.includes(".py") ||
		contextLower.includes("def ") ||
		contextLower.includes("import ") ||
		contextLower.includes("class ") ||
		contextLower.includes("self.")
	) {
		return "python";
	}

	// Java indicators
	if (
		contextLower.includes("java") ||
		contextLower.includes(".java") ||
		contextLower.includes("public class") ||
		contextLower.includes("private ") ||
		contextLower.includes("@override")
	) {
		return "java";
	}

	// C# indicators
	if (
		contextLower.includes("c#") ||
		contextLower.includes("csharp") ||
		contextLower.includes(".cs") ||
		contextLower.includes("namespace ") ||
		contextLower.includes("using system")
	) {
		return "csharp";
	}

	// Go indicators
	if (
		contextLower.includes("golang") ||
		contextLower.includes(" go") ||
		contextLower.includes(".go") ||
		contextLower.includes("func ") ||
		contextLower.includes("package ")
	) {
		return "go";
	}

	// Rust indicators
	if (
		contextLower.includes("rust") ||
		contextLower.includes(".rs") ||
		contextLower.includes("fn ") ||
		contextLower.includes("impl ") ||
		contextLower.includes("trait ")
	) {
		return "rust";
	}

	return "auto-detect";
}

/**
 * Detect framework from code context
 */
export function detectFramework(codeContext: string): string | undefined {
	const contextLower = codeContext.toLowerCase();

	// Frontend frameworks
	if (
		contextLower.includes("react") ||
		contextLower.includes("usestate") ||
		contextLower.includes("useeffect") ||
		contextLower.includes("jsx")
	) {
		return "react";
	}

	if (
		contextLower.includes("angular") ||
		contextLower.includes("@component") ||
		contextLower.includes("ngmodule")
	) {
		return "angular";
	}

	if (
		contextLower.includes("vue") ||
		contextLower.includes("<template>") ||
		contextLower.includes("v-if") ||
		contextLower.includes("v-for")
	) {
		return "vue";
	}

	// Backend frameworks
	if (
		contextLower.includes("express") ||
		contextLower.includes("app.get") ||
		contextLower.includes("app.post")
	) {
		return "express";
	}

	if (
		contextLower.includes("node.js") ||
		contextLower.includes("nodejs") ||
		(contextLower.includes("node") && contextLower.includes("server"))
	) {
		return "node.js";
	}

	if (
		contextLower.includes("django") ||
		contextLower.includes("django.") ||
		contextLower.includes("models.model")
	) {
		return "django";
	}

	if (
		contextLower.includes("flask") ||
		contextLower.includes("@app.route") ||
		contextLower.includes("from flask")
	) {
		return "flask";
	}

	if (
		contextLower.includes("spring boot") ||
		contextLower.includes("springboot") ||
		contextLower.includes("@springbootapplication") ||
		contextLower.includes("@restcontroller")
	) {
		return "spring boot";
	}

	if (
		contextLower.includes("asp.net") ||
		contextLower.includes("aspnet") ||
		contextLower.includes(".net core") ||
		contextLower.includes("[apicontroller]")
	) {
		return "asp.net core";
	}

	if (
		contextLower.includes("rails") ||
		contextLower.includes("ruby on rails") ||
		contextLower.includes("activerecord")
	) {
		return "rails";
	}

	if (
		contextLower.includes("laravel") ||
		contextLower.includes("artisan") ||
		contextLower.includes("eloquent")
	) {
		return "laravel";
	}

	return undefined;
}

/**
 * Generate language-specific design recommendations
 */
export function generateLanguageDesignRecommendations(
	language: string,
): string {
	const normalizedLang = language.toLowerCase().trim();
	const langInfo = LANGUAGE_DESIGN_MAP[normalizedLang];

	if (!langInfo && normalizedLang === "auto-detect") {
		return "";
	}

	if (!langInfo) {
		return `\n### Language-Specific Design Recommendations\n\nNote: Specific design patterns for '${language}' are not available. Apply general design best practices.\n\n`;
	}

	let section = `\n### ${language.charAt(0).toUpperCase() + language.slice(1)}-Specific Design Recommendations\n\n`;

	section += `**SOLID Principles for ${language}:**\n`;
	for (const principle of langInfo.solidPrinciples) {
		section += `- ${principle}\n`;
	}
	section += "\n";

	section += `**Recommended Design Patterns:**\n`;
	for (const pattern of langInfo.designPatterns) {
		section += `- ${pattern}\n`;
	}
	section += "\n";

	section += `**Best Practices:**\n`;
	for (const practice of langInfo.bestPractices) {
		section += `- ${practice}\n`;
	}
	section += "\n";

	section += `**Anti-Patterns to Avoid:**\n`;
	for (const antiPattern of langInfo.antiPatterns) {
		section += `- ${antiPattern}\n`;
	}
	section += "\n";

	return section;
}

/**
 * Generate framework-specific design recommendations
 */
export function generateFrameworkDesignRecommendations(
	framework: string | undefined,
): string {
	if (!framework) {
		return "";
	}

	const normalizedFramework = framework.toLowerCase().trim();
	const frameworkInfo = FRAMEWORK_DESIGN_MAP[normalizedFramework];

	if (!frameworkInfo) {
		return `\n### Framework-Specific Design Recommendations\n\nConsider ${framework}-specific design patterns and architectural best practices.\n\n`;
	}

	let section = `\n### ${framework} Framework Design Recommendations\n\n`;

	section += `**Architecture Patterns:**\n`;
	for (const pattern of frameworkInfo.architecturePatterns) {
		section += `- ${pattern}\n`;
	}
	section += "\n";

	section += `**Best Practices:**\n`;
	for (const practice of frameworkInfo.bestPractices) {
		section += `- ${practice}\n`;
	}
	section += "\n";

	section += `**Common Issues to Avoid:**\n`;
	for (const issue of frameworkInfo.commonIssues) {
		section += `- ${issue}\n`;
	}
	section += "\n";

	section += `**Recommended Project Structure:**\n`;
	for (const structure of frameworkInfo.recommendedStructures) {
		section += `- ${structure}\n`;
	}
	section += "\n";

	return section;
}

/**
 * Generate context-aware design guidance based on code analysis
 */
export function generateContextualDesignGuidance(codeContext: string): string {
	let section = `\n### Context-Aware Design Guidance\n\n`;

	const contextLower = codeContext.toLowerCase();
	let contextsDetected = 0;

	section += "Based on the provided code context, consider:\n\n";

	// Component/UI context
	if (
		contextLower.includes("component") ||
		contextLower.includes("ui") ||
		contextLower.includes("view") ||
		contextLower.includes("template")
	) {
		contextsDetected++;
		section += "**Component Design:**\n";
		section +=
			"- Apply Atomic Design principles (atoms, molecules, organisms)\n";
		section += "- Keep components small and focused (single responsibility)\n";
		section += "- Use composition over inheritance for reusability\n";
		section += "- Implement proper prop/input validation\n";
		section += "- Consider accessibility (ARIA attributes, semantic HTML)\n\n";
	}

	// API/Service context
	if (
		contextLower.includes("api") ||
		contextLower.includes("service") ||
		contextLower.includes("endpoint") ||
		contextLower.includes("controller")
	) {
		contextsDetected++;
		section += "**API/Service Design:**\n";
		section +=
			"- Implement layered architecture (Controller → Service → Repository)\n";
		section +=
			"- Use dependency injection for loose coupling and testability\n";
		section +=
			"- Apply RESTful principles or GraphQL best practices as appropriate\n";
		section += "- Implement proper error handling and status codes\n";
		section += "- Use DTOs (Data Transfer Objects) for API contracts\n";
		section += "- Consider versioning strategy for APIs\n\n";
	}

	// State management context
	if (
		contextLower.includes("state") ||
		contextLower.includes("store") ||
		contextLower.includes("redux") ||
		contextLower.includes("vuex") ||
		contextLower.includes("context")
	) {
		contextsDetected++;
		section += "**State Management:**\n";
		section += "- Implement single source of truth for application state\n";
		section +=
			"- Use immutable state updates to prevent unexpected mutations\n";
		section += "- Separate UI state from domain/server state\n";
		section += "- Consider Redux/Vuex/Context API patterns for global state\n";
		section +=
			"- Implement state normalization for complex data structures\n\n";
	}

	// Database/Data access context
	if (
		contextLower.includes("database") ||
		contextLower.includes("repository") ||
		contextLower.includes("model") ||
		contextLower.includes("entity") ||
		contextLower.includes("orm")
	) {
		contextsDetected++;
		section += "**Data Access Design:**\n";
		section += "- Implement Repository pattern to abstract data access\n";
		section += "- Use Unit of Work pattern for transaction management\n";
		section += "- Apply Query Object pattern for complex queries\n";
		section +=
			"- Consider CQRS (Command Query Responsibility Segregation) for complex domains\n";
		section += "- Implement proper entity relationship mapping\n\n";
	}

	// Authentication/Authorization context
	if (
		contextLower.includes("auth") ||
		contextLower.includes("login") ||
		contextLower.includes("permission") ||
		contextLower.includes("role")
	) {
		contextsDetected++;
		section += "**Authentication & Authorization Design:**\n";
		section +=
			"- Implement Strategy pattern for multiple authentication methods\n";
		section +=
			"- Use Role-Based Access Control (RBAC) or Attribute-Based Access Control (ABAC)\n";
		section += "- Apply Guard pattern for route/endpoint protection\n";
		section += "- Implement proper session management or token-based auth\n";
		section += "- Consider OAuth2/OIDC for third-party authentication\n\n";
	}

	// Testing context
	if (
		contextLower.includes("test") ||
		contextLower.includes("spec") ||
		contextLower.includes("mock")
	) {
		contextsDetected++;
		section += "**Testing Design:**\n";
		section += "- Design for testability: use dependency injection\n";
		section +=
			"- Apply Test Pyramid: more unit tests, fewer integration/e2e tests\n";
		section += "- Use Test Doubles (mocks, stubs, fakes) appropriately\n";
		section +=
			"- Implement Arrange-Act-Assert (AAA) pattern for test structure\n";
		section +=
			"- Consider Test-Driven Development (TDD) for critical logic\n\n";
	}

	// Error handling context
	if (
		contextLower.includes("error") ||
		contextLower.includes("exception") ||
		contextLower.includes("validation")
	) {
		contextsDetected++;
		section += "**Error Handling Design:**\n";
		section +=
			"- Implement centralized error handling middleware/interceptor\n";
		section +=
			"- Use custom error/exception types for domain-specific errors\n";
		section +=
			"- Apply Railway Oriented Programming for functional error handling\n";
		section += "- Implement proper error logging and monitoring\n";
		section += "- Use Result/Either types for explicit error handling\n\n";
	}

	// Event/Messaging context
	if (
		contextLower.includes("event") ||
		contextLower.includes("message") ||
		contextLower.includes("queue") ||
		contextLower.includes("pub") ||
		contextLower.includes("sub")
	) {
		contextsDetected++;
		section += "**Event-Driven Design:**\n";
		section +=
			"- Implement Event Sourcing for audit trail and temporal queries\n";
		section += "- Use Observer/Pub-Sub pattern for decoupled communication\n";
		section += "- Apply Event-Driven Architecture for scalable systems\n";
		section += "- Consider CQRS with event sourcing for complex domains\n";
		section += "- Implement proper event versioning and schema evolution\n\n";
	}

	// If no specific context detected, provide general guidance
	if (contextsDetected === 0) {
		section += "**General Design Principles:**\n";
		section += "- Apply SOLID principles throughout your codebase\n";
		section +=
			"- Keep functions/methods small and focused (single responsibility)\n";
		section +=
			"- Use design patterns where appropriate, but don't over-engineer\n";
		section += "- Write code that is easy to test and maintain\n";
		section += "- Consider separation of concerns and modularity\n\n";
	}

	return section;
}

/**
 * Generate comprehensive context-aware design recommendations
 */
export function generateContextAwareRecommendations(
	codeContext: string,
): string {
	const language = detectLanguage(codeContext);
	const framework = detectFramework(codeContext);

	let recommendations = "";

	// Add language-specific recommendations
	recommendations += generateLanguageDesignRecommendations(language);

	// Add framework-specific recommendations
	recommendations += generateFrameworkDesignRecommendations(framework);

	// Add context-aware guidance
	recommendations += generateContextualDesignGuidance(codeContext);

	return recommendations;
}
