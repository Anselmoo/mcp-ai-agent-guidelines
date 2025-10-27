import { describe, expect, it } from "vitest";
import {
	detectFramework,
	detectLanguage,
	generateContextAwareRecommendations,
	generateContextualDesignGuidance,
	generateFrameworkDesignRecommendations,
	generateLanguageDesignRecommendations,
} from "../../src/tools/design/services/context-pattern-analyzer.service.js";

describe("Context Pattern Analyzer Service", () => {
	describe("detectLanguage", () => {
		it("should detect TypeScript from code context", () => {
			const context = "This is a TypeScript project with interface definitions";
			const result = detectLanguage(context);
			expect(result).toBe("typescript");
		});

		it("should detect JavaScript from code context", () => {
			const context = "This is a JavaScript project using const and let";
			const result = detectLanguage(context);
			expect(result).toBe("javascript");
		});

		it("should detect Python from code context", () => {
			const context = "This is a Python project with def and class";
			const result = detectLanguage(context);
			expect(result).toBe("python");
		});

		it("should detect Java from code context", () => {
			const context = "This is a .java file with @Override annotation";
			const result = detectLanguage(context);
			expect(result).toBe("java");
		});

		it("should detect C# from code context", () => {
			const context = "This is a C# project with namespace and using System";
			const result = detectLanguage(context);
			expect(result).toBe("csharp");
		});

		it("should detect Go from code context", () => {
			const context = "This is a Go project with func and package";
			const result = detectLanguage(context);
			expect(result).toBe("go");
		});

		it("should detect Rust from code context", () => {
			const context = "This is a Rust project with fn and impl";
			const result = detectLanguage(context);
			expect(result).toBe("rust");
		});

		it("should return auto-detect for unknown language", () => {
			const context = "This is some random text without language indicators";
			const result = detectLanguage(context);
			expect(result).toBe("auto-detect");
		});
	});

	describe("detectFramework", () => {
		it("should detect React from code context", () => {
			const context =
				"This is a React project using useState and useEffect hooks";
			const result = detectFramework(context);
			expect(result).toBe("react");
		});

		it("should detect Angular from code context", () => {
			const context = "This is an Angular project with @Component decorators";
			const result = detectFramework(context);
			expect(result).toBe("angular");
		});

		it("should detect Vue from code context", () => {
			const context =
				"This is a Vue project with <template> and v-if directives";
			const result = detectFramework(context);
			expect(result).toBe("vue");
		});

		it("should detect Express from code context", () => {
			const context =
				"This is an Express server with app.get and app.post routes";
			const result = detectFramework(context);
			expect(result).toBe("express");
		});

		it("should detect Node.js from code context", () => {
			const context = "This is a Node.js server application";
			const result = detectFramework(context);
			expect(result).toBe("node.js");
		});

		it("should detect Django from code context", () => {
			const context = "This is a Django project with models.Model classes";
			const result = detectFramework(context);
			expect(result).toBe("django");
		});

		it("should detect Spring Boot from code context", () => {
			const context =
				"This is a Spring Boot project with @RestController annotations";
			const result = detectFramework(context);
			expect(result).toBe("spring boot");
		});

		it("should detect ASP.NET Core from code context", () => {
			const context =
				"This is an ASP.NET Core project with [ApiController] attributes";
			const result = detectFramework(context);
			expect(result).toBe("asp.net core");
		});

		it("should detect Flask from code context", () => {
			const context = "This is a Flask app with @app.route decorators";
			const result = detectFramework(context);
			expect(result).toBe("flask");
		});

		it("should detect Rails from code context", () => {
			const context = "This is a Ruby on Rails app with ActiveRecord models";
			const result = detectFramework(context);
			expect(result).toBe("rails");
		});

		it("should detect Laravel from code context", () => {
			const context = "This is a Laravel project using Eloquent ORM";
			const result = detectFramework(context);
			expect(result).toBe("laravel");
		});

		it("should return undefined for unknown framework", () => {
			const context = "This is some generic code without framework indicators";
			const result = detectFramework(context);
			expect(result).toBeUndefined();
		});
	});

	describe("generateLanguageDesignRecommendations", () => {
		it("should generate TypeScript-specific recommendations", () => {
			const result = generateLanguageDesignRecommendations("typescript");
			expect(result).toContain("Typescript-Specific Design Recommendations");
			expect(result).toContain("SOLID Principles");
			expect(result).toContain("Recommended Design Patterns");
			expect(result).toContain("Best Practices");
			expect(result).toContain("Anti-Patterns to Avoid");
		});

		it("should generate Python-specific recommendations", () => {
			const result = generateLanguageDesignRecommendations("python");
			expect(result).toContain("Python-Specific Design Recommendations");
			expect(result).toContain("SOLID Principles");
			expect(result).toContain("PEP 8");
		});

		it("should handle auto-detect language", () => {
			const result = generateLanguageDesignRecommendations("auto-detect");
			expect(result).toBe("");
		});

		it("should handle unknown language", () => {
			const result = generateLanguageDesignRecommendations("unknown-lang");
			expect(result).toContain("Language-Specific Design Recommendations");
			expect(result).toContain("not available");
		});
	});

	describe("generateFrameworkDesignRecommendations", () => {
		it("should generate React-specific recommendations", () => {
			const result = generateFrameworkDesignRecommendations("react");
			expect(result).toContain("react Framework Design Recommendations");
			expect(result).toContain("Architecture Patterns");
			expect(result).toContain("Atomic Design");
			expect(result).toContain("Best Practices");
		});

		it("should generate Node.js-specific recommendations", () => {
			const result = generateFrameworkDesignRecommendations("node.js");
			expect(result).toContain("node.js Framework Design Recommendations");
			expect(result).toContain("Layered Architecture");
			expect(result).toContain("Middleware Pattern");
		});

		it("should handle undefined framework", () => {
			const result = generateFrameworkDesignRecommendations(undefined);
			expect(result).toBe("");
		});

		it("should handle unknown framework", () => {
			const result =
				generateFrameworkDesignRecommendations("unknown-framework");
			expect(result).toContain("Framework-Specific Design Recommendations");
		});
	});

	describe("generateContextualDesignGuidance", () => {
		it("should generate component design guidance", () => {
			const context = "This is a React component library";
			const result = generateContextualDesignGuidance(context);
			expect(result).toContain("Context-Aware Design Guidance");
			expect(result).toContain("Component Design");
			expect(result).toContain("Atomic Design");
		});

		it("should generate API/service design guidance", () => {
			const context = "This is a REST API service with multiple endpoints";
			const result = generateContextualDesignGuidance(context);
			expect(result).toContain("API/Service Design");
			expect(result).toContain("layered architecture");
		});

		it("should generate state management guidance", () => {
			const context = "This application uses Redux for state management";
			const result = generateContextualDesignGuidance(context);
			expect(result).toContain("State Management");
			expect(result).toContain("single source of truth");
		});

		it("should generate database/data access guidance", () => {
			const context = "This project uses ORM models and repositories";
			const result = generateContextualDesignGuidance(context);
			expect(result).toContain("Data Access Design");
			expect(result).toContain("Repository pattern");
		});

		it("should generate authentication guidance", () => {
			const context =
				"This service handles user authentication and authorization";
			const result = generateContextualDesignGuidance(context);
			expect(result).toContain("Authentication & Authorization Design");
			expect(result).toContain("RBAC");
		});

		it("should generate testing guidance", () => {
			const context = "This is a test suite with unit tests and mocks";
			const result = generateContextualDesignGuidance(context);
			expect(result).toContain("Testing Design");
			expect(result).toContain("Test Pyramid");
		});

		it("should generate error handling guidance", () => {
			const context = "This service has error handling and validation logic";
			const result = generateContextualDesignGuidance(context);
			expect(result).toContain("Error Handling Design");
			expect(result).toContain("centralized error handling");
		});

		it("should generate event-driven guidance", () => {
			const context = "This system uses event sourcing and message queues";
			const result = generateContextualDesignGuidance(context);
			expect(result).toContain("Event-Driven Design");
			expect(result).toContain("Event Sourcing");
		});

		it("should generate general guidance when no specific context detected", () => {
			const context = "This is some generic code";
			const result = generateContextualDesignGuidance(context);
			expect(result).toContain("General Design Principles");
			expect(result).toContain("SOLID principles");
		});
	});

	describe("generateContextAwareRecommendations", () => {
		it("should generate comprehensive recommendations for TypeScript + React", () => {
			const context =
				"This is a TypeScript React application with component library";
			const result = generateContextAwareRecommendations(context);
			expect(result).toContain("Typescript-Specific Design Recommendations");
			expect(result).toContain("react Framework Design Recommendations");
			expect(result).toContain("Component Design");
		});

		it("should generate comprehensive recommendations for Python + Django", () => {
			const context = "This is a Python Django REST API";
			const result = generateContextAwareRecommendations(context);
			expect(result).toContain("Python-Specific Design Recommendations");
			expect(result).toContain("Django");
			expect(result).toContain("MVT Pattern");
		});

		it("should generate recommendations with only language detection", () => {
			const context = "This is a Java application";
			const result = generateContextAwareRecommendations(context);
			expect(result).toContain("Java-Specific Design Recommendations");
			expect(result).toContain("SOLID Principles");
		});

		it("should handle minimal context", () => {
			const context = "Some code";
			const result = generateContextAwareRecommendations(context);
			expect(result).toBeTruthy();
			expect(result.length).toBeGreaterThan(0);
		});
	});
});
