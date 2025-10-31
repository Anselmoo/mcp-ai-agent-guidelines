import { describe, expect, it } from "vitest";
import { securityHardeningPromptBuilder } from "../../src/tools/prompt/security-hardening-prompt-builder.js";

describe("security-hardening-prompt-builder input-aware enhancements", () => {
	describe("Language-Specific Security Checks", () => {
		it("should generate JavaScript-specific security checks", async () => {
			const result = await securityHardeningPromptBuilder({
				codeContext: "Express.js API with user authentication",
				language: "javascript",
				securityFocus: "vulnerability-analysis",
			});

			const text = result.content[0].text;

			// Check for JavaScript-specific section
			expect(text).toContain("Javascript-Specific Security Checks");

			// Check for JavaScript vulnerabilities
			expect(text).toContain("Prototype pollution");
			expect(text).toContain("DOM-based XSS");
			expect(text).toContain("eval()");
			expect(text).toContain("NPM package supply chain attacks");

			// Check for JavaScript security checks
			expect(text).toContain("unsafe use of eval()");
			expect(text).toContain("new Function()");
			expect(text).toContain("innerHTML");

			// Check for JavaScript best practices
			expect(text).toContain("strict mode");
			expect(text).toContain("DOMPurify");
		});

		it("should generate Python-specific security checks", async () => {
			const result = await securityHardeningPromptBuilder({
				codeContext: "Django application with database queries",
				language: "python",
				securityFocus: "vulnerability-analysis",
			});

			const text = result.content[0].text;

			// Check for Python-specific section
			expect(text).toContain("Python-Specific Security Checks");

			// Check for Python vulnerabilities
			expect(text).toContain("SQL injection via string concatenation");
			expect(text).toContain("Pickle deserialization");
			expect(text).toContain("Command injection");

			// Check for Python security checks
			expect(text).toContain("parameterized queries");
			expect(text).toContain("pickle.loads()");
			expect(text).toContain("eval()");
			expect(text).toContain("exec()");

			// Check for Python best practices
			expect(text).toContain("SQLAlchemy");
			expect(text).toContain("Django ORM");
			expect(text).toContain("subprocess with shell=False");
		});

		it("should generate TypeScript-specific security checks", async () => {
			const result = await securityHardeningPromptBuilder({
				codeContext: "TypeScript Node.js API",
				language: "typescript",
				securityFocus: "security-hardening",
			});

			const text = result.content[0].text;

			// Check for TypeScript-specific section
			expect(text).toContain("Typescript-Specific Security Checks");

			// Check for TypeScript vulnerabilities
			expect(text).toContain("Type assertion bypassing security checks");
			expect(text).toContain("Any type overuse");

			// Check for TypeScript security checks
			expect(text).toContain("as any");
			expect(text).toContain("type assertions");

			// Check for TypeScript best practices
			expect(text).toContain("strict mode in tsconfig.json");
			expect(text).toContain("Avoid 'any' type");
			expect(text).toContain("Zod");
		});

		it("should handle unsupported language gracefully", async () => {
			const result = await securityHardeningPromptBuilder({
				codeContext: "COBOL mainframe application",
				language: "cobol",
				securityFocus: "vulnerability-analysis",
			});

			const text = result.content[0].text;

			// Should include a note about unsupported language
			expect(text).toContain("Language-Specific Security Considerations");
			expect(text).toContain("cobol");
			expect(text).toContain("general security best practices");
		});

		it("should not include language checks when auto-detect is specified", async () => {
			const result = await securityHardeningPromptBuilder({
				codeContext: "Generic application code",
				language: "auto-detect",
				securityFocus: "vulnerability-analysis",
			});

			const text = result.content[0].text;

			// Should not include language-specific section
			expect(text).not.toContain("Specific Security Checks");
		});
	});

	describe("Framework-Specific Security Checks", () => {
		it("should generate Express-specific security checks", async () => {
			const result = await securityHardeningPromptBuilder({
				codeContext: "Express.js REST API",
				language: "javascript",
				framework: "express",
				securityFocus: "security-hardening",
			});

			const text = result.content[0].text;

			// Check for Express-specific section
			expect(text).toContain("express Framework Security Analysis");

			// Check for Express security checks
			expect(text).toContain("helmet middleware");
			expect(text).toContain("CORS configuration");
			expect(text).toContain("body-parser limits");
			expect(text).toContain("rate limiting");

			// Check for Express issues
			expect(text).toContain("Missing helmet middleware");
			expect(text).toContain("Overly permissive CORS");

			// Check for Express best practices
			expect(text).toContain("helmet()");
			expect(text).toContain("express-rate-limit");
			expect(text).toContain("express-validator");
		});

		it("should generate Django-specific security checks", async () => {
			const result = await securityHardeningPromptBuilder({
				codeContext: "Django web application with user authentication",
				language: "python",
				framework: "django",
				securityFocus: "vulnerability-analysis",
			});

			const text = result.content[0].text;

			// Check for Django-specific section
			expect(text).toContain("django Framework Security Analysis");

			// Check for Django security checks
			expect(text).toContain("Django ORM queries");
			expect(text).toContain("CSRF protection");
			expect(text).toContain("SECRET_KEY");

			// Check for Django issues
			expect(text).toContain("raw SQL queries");
			expect(text).toContain("DEBUG=True");

			// Check for Django best practices
			expect(text).toContain("Django ORM query methods");
			expect(text).toContain("CSRF_COOKIE_SECURE");
			expect(text).toContain("SecurityMiddleware");
		});

		it("should generate React-specific security checks", async () => {
			const result = await securityHardeningPromptBuilder({
				codeContext: "React single-page application",
				language: "javascript",
				framework: "react",
				securityFocus: "vulnerability-analysis",
			});

			const text = result.content[0].text;

			// Check for React-specific section
			expect(text).toContain("react Framework Security Analysis");

			// Check for React security checks
			expect(text).toContain("dangerouslySetInnerHTML");
			expect(text).toContain("state management");
			expect(text).toContain("XSS vulnerabilities");

			// Check for React issues
			expect(text).toContain("Sensitive data stored in client-side state");
			expect(text).toContain("API keys exposed");

			// Check for React best practices
			expect(text).toContain("proper escaping");
			expect(text).toContain("REACT_APP_");
		});

		it("should handle unsupported framework gracefully", async () => {
			const result = await securityHardeningPromptBuilder({
				codeContext: "Custom framework application",
				language: "javascript",
				framework: "MyCustomFramework",
				securityFocus: "vulnerability-analysis",
			});

			const text = result.content[0].text;

			// Should include a note about unsupported framework
			expect(text).toContain("Framework-Specific Security Considerations");
			expect(text).toContain("MyCustomFramework");
		});
	});

	describe("Context-Aware Vulnerability Analysis", () => {
		it("should detect authentication context and provide specific guidance", async () => {
			const result = await securityHardeningPromptBuilder({
				codeContext:
					"User authentication module with login, password reset, and token management",
				language: "javascript",
				securityFocus: "vulnerability-analysis",
			});

			const text = result.content[0].text;

			// Check for authentication-specific guidance
			expect(text).toContain("Context-Aware Vulnerability Analysis");
			expect(text).toContain("Authentication & Authorization");
			expect(text).toContain("password storage");
			expect(text).toContain("bcrypt");
			expect(text).toContain("insecure direct object references");
			expect(text).toContain("session management");
			expect(text).toContain("token generation");
		});

		it("should detect database context and provide SQL injection guidance", async () => {
			const result = await securityHardeningPromptBuilder({
				codeContext:
					"Database layer with SQL queries, INSERT operations, and SELECT statements",
				language: "python",
				securityFocus: "vulnerability-analysis",
			});

			const text = result.content[0].text;

			// Check for database-specific guidance
			expect(text).toContain("Database Security");
			expect(text).toContain("parameterized statements");
			expect(text).toContain("string concatenation");
			expect(text).toContain("SQL injection");
			expect(text).toContain("ORM usage");
		});

		it("should detect API context and provide API security guidance", async () => {
			const result = await securityHardeningPromptBuilder({
				codeContext: "REST API endpoints with request handling and controllers",
				language: "javascript",
				securityFocus: "security-hardening",
			});

			const text = result.content[0].text;

			// Check for API-specific guidance
			expect(text).toContain("API Security");
			expect(text).toContain("input parameters");
			expect(text).toContain("rate limiting");
			expect(text).toContain("authentication on all endpoints");
			expect(text).toContain("CORS configuration");
		});

		it("should detect file upload context and provide file security guidance", async () => {
			const result = await securityHardeningPromptBuilder({
				codeContext: "File upload handler with multipart form data",
				language: "python",
				securityFocus: "vulnerability-analysis",
			});

			const text = result.content[0].text;

			// Check for file upload-specific guidance
			expect(text).toContain("File Upload Security");
			expect(text).toContain("file types");
			expect(text).toContain("content inspection");
			expect(text).toContain("file size limits");
			expect(text).toContain("path traversal");
			expect(text).toContain("malware");
		});

		it("should detect cryptography context and provide crypto guidance", async () => {
			const result = await securityHardeningPromptBuilder({
				codeContext:
					"Encryption module with cipher operations and hash functions",
				language: "python",
				securityFocus: "security-hardening",
			});

			const text = result.content[0].text;

			// Check for cryptography-specific guidance
			expect(text).toContain("Cryptography");
			expect(text).toContain("cryptographic algorithms");
			expect(text).toContain("AES-256");
			expect(text).toContain("encryption keys");
			expect(text).toContain("initialization vectors");
			expect(text).toContain("MD5");
			expect(text).toContain("SHA1");
		});

		it("should detect session management context", async () => {
			const result = await securityHardeningPromptBuilder({
				codeContext: "Session manager with cookie handling and JWT tokens",
				language: "javascript",
				securityFocus: "security-hardening",
			});

			const text = result.content[0].text;

			// Check for session-specific guidance
			expect(text).toContain("Session Management");
			expect(text).toContain("HttpOnly");
			expect(text).toContain("Secure");
			expect(text).toContain("SameSite");
			expect(text).toContain("session timeout");
			expect(text).toContain("JWT tokens");
		});

		it("should provide general guidance when no specific context is detected", async () => {
			const result = await securityHardeningPromptBuilder({
				codeContext: "Generic utility functions for data processing",
				language: "javascript",
				securityFocus: "vulnerability-analysis",
			});

			const text = result.content[0].text;

			// Check for general guidance
			expect(text).toContain("Context-Aware Vulnerability Analysis");
			expect(text).toContain("General Security Review");
			expect(text).toContain("OWASP Top 10");
		});
	});

	describe("Tailored Compliance Guidance", () => {
		it("should generate OWASP Top 10 specific checks", async () => {
			const result = await securityHardeningPromptBuilder({
				codeContext: "Web application security review",
				language: "javascript",
				complianceStandards: ["OWASP-Top-10"],
				securityFocus: "compliance-check",
			});

			const text = result.content[0].text;

			// Check for OWASP-specific guidance
			expect(text).toContain("Tailored Compliance Analysis");
			expect(text).toContain("OWASP Top 10 Specific Checks");
			expect(text).toContain("A01:2021");
			expect(text).toContain("Broken Access Control");
			expect(text).toContain("A02:2021");
			expect(text).toContain("Cryptographic Failures");
			expect(text).toContain("A03:2021");
			expect(text).toContain("Injection");
			expect(text).toContain("A10:2021");
			expect(text).toContain("Server-Side Request Forgery");
		});

		it("should generate PCI-DSS specific checks with payment context", async () => {
			const result = await securityHardeningPromptBuilder({
				codeContext: "Payment processing module with card data handling",
				language: "java",
				complianceStandards: ["PCI-DSS"],
				securityFocus: "compliance-check",
			});

			const text = result.content[0].text;

			// Check for PCI-DSS guidance
			expect(text).toContain("PCI-DSS Compliance Focus");
			expect(text).toContain("Requirement 3");
			expect(text).toContain("cardholder data");
			expect(text).toContain("encrypted at rest");

			// Check for context-specific PCI-DSS guidance
			expect(text).toContain("Context-Specific");
			expect(text).toContain("payment processing");
			expect(text).toContain("CVV");
			expect(text).toContain("full track data");
		});

		it("should generate HIPAA specific checks with healthcare context", async () => {
			const result = await securityHardeningPromptBuilder({
				codeContext: "Patient health records management system with PHI",
				language: "python",
				complianceStandards: ["HIPAA"],
				securityFocus: "compliance-check",
			});

			const text = result.content[0].text;

			// Check for HIPAA guidance
			expect(text).toContain("HIPAA Security Rule Compliance");
			expect(text).toContain("Access Control");
			expect(text).toContain("Protected Health Information");

			// Check for context-specific HIPAA guidance
			expect(text).toContain("Context-Specific");
			expect(text).toContain("PHI handling");
			expect(text).toContain("minimum necessary access");
			expect(text).toContain("encryption of PHI");
		});

		it("should generate GDPR specific checks with personal data context", async () => {
			const result = await securityHardeningPromptBuilder({
				codeContext:
					"User data processing with personal information collection",
				language: "javascript",
				complianceStandards: ["GDPR"],
				securityFocus: "compliance-check",
			});

			const text = result.content[0].text;

			// Check for GDPR guidance
			expect(text).toContain("GDPR Data Protection Requirements");
			expect(text).toContain("Article 5");
			expect(text).toContain("Article 25");
			expect(text).toContain("privacy by design");

			// Check for context-specific GDPR guidance
			expect(text).toContain("Context-Specific");
			expect(text).toContain("personal data processing");
			expect(text).toContain("data minimization");
			expect(text).toContain("right to erasure");
		});

		it("should generate SOC 2 compliance guidance", async () => {
			const result = await securityHardeningPromptBuilder({
				codeContext: "Enterprise SaaS application",
				language: "java",
				complianceStandards: ["SOC-2"],
				securityFocus: "compliance-check",
			});

			const text = result.content[0].text;

			// Check for SOC 2 guidance
			expect(text).toContain("SOC 2 Trust Service Criteria");
			expect(text).toContain("Security");
			expect(text).toContain("Availability");
			expect(text).toContain("Processing Integrity");
			expect(text).toContain("Confidentiality");
			expect(text).toContain("Privacy");
		});

		it("should handle multiple compliance standards", async () => {
			const result = await securityHardeningPromptBuilder({
				codeContext: "Healthcare payment system",
				language: "java",
				complianceStandards: ["OWASP-Top-10", "HIPAA", "PCI-DSS"],
				securityFocus: "compliance-check",
			});

			const text = result.content[0].text;

			// Check all three compliance frameworks are included
			expect(text).toContain("OWASP Top 10 Specific Checks");
			expect(text).toContain("PCI-DSS Compliance Focus");
			expect(text).toContain("HIPAA Security Rule Compliance");
		});
	});

	describe("Combined Context Analysis", () => {
		it("should combine language, framework, and context-specific guidance", async () => {
			const result = await securityHardeningPromptBuilder({
				codeContext:
					"Django views.py with user authentication and database queries",
				language: "python",
				framework: "django",
				complianceStandards: ["OWASP-Top-10"],
				securityFocus: "vulnerability-analysis",
			});

			const text = result.content[0].text;

			// Check for Python-specific checks
			expect(text).toContain("Python-Specific Security Checks");

			// Check for Django-specific checks
			expect(text).toContain("django Framework Security Analysis");
			expect(text).toContain("Django ORM queries");

			// Check for context-aware checks (auth + database)
			expect(text).toContain("Authentication & Authorization");
			expect(text).toContain("Database Security");

			// Check for OWASP compliance
			expect(text).toContain("OWASP Top 10 Specific Checks");
		});

		it("should provide comprehensive analysis for Node.js/Express API with auth", async () => {
			const result = await securityHardeningPromptBuilder({
				codeContext:
					"Express.js API endpoint with JWT authentication and user login",
				language: "javascript",
				framework: "express",
				complianceStandards: ["OWASP-Top-10"],
				securityFocus: "vulnerability-analysis",
				analysisScope: ["authentication", "api-security", "input-validation"],
			});

			const text = result.content[0].text;

			// All aspects should be covered
			expect(text).toContain("Javascript-Specific Security Checks");
			expect(text).toContain("express Framework Security Analysis");
			expect(text).toContain("Authentication & Authorization");
			expect(text).toContain("API Security");
			expect(text).toContain("OWASP Top 10 Specific Checks");
		});
	});
});
