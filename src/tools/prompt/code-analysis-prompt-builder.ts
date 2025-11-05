import { z } from "zod";
import {
	buildFrontmatterWithPolicy as buildFrontmatter,
	buildFurtherReadingSection,
	buildMetadataSection,
	slugify,
} from "../shared/prompt-utils.js";

const CodeAnalysisPromptSchema = z.object({
	codebase: z.string().describe("The codebase or code snippet to analyze"),
	focusArea: z
		.enum(["security", "performance", "maintainability", "general"])
		.optional()
		.default("general")
		.describe(
			"Specific area to focus on (security, performance, maintainability)",
		),
	language: z
		.string()
		.optional()
		.default("auto-detect")
		.describe("Programming language of the code"),
	// Optional frontmatter controls
	mode: z.enum(["agent", "tool", "workflow"]).optional().default("agent"),
	model: z.string().optional().default("GPT-5"),
	tools: z.array(z.string()).optional().default(["codebase", "editFiles"]),
	includeFrontmatter: z.boolean().optional().default(true),
	includeReferences: z.boolean().optional().default(false),
	includeMetadata: z.boolean().optional().default(true),
	inputFile: z.string().optional(),
	forcePromptMdStyle: z.boolean().optional().default(true),
});

type CodeAnalysisPromptInput = z.infer<typeof CodeAnalysisPromptSchema>;

// Language-specific security guidance
function getSecurityGuidance(language: string): string {
	const normalizedLang = language.toLowerCase();

	const securityGuides: Record<string, string> = {
		javascript: `   - **SQL Injection**: Check for string concatenation in database queries (e.g., \`db.query('SELECT * FROM users WHERE id=' + userId)\`)
   - **XSS Vulnerabilities**: Look for unescaped user input in DOM manipulation or HTML templates
   - **Prototype Pollution**: Watch for unsafe use of object property assignment from user input
   - **Insecure eval()**: Flag any use of \`eval()\`, \`Function()\`, or \`setTimeout()\` with string arguments
   - **Path Traversal**: Check for file system operations using unsanitized user input
   - **CSRF Tokens**: Verify state-changing operations have CSRF protection`,

		typescript: `   - **Type Safety Bypasses**: Look for excessive use of \`any\` or type assertions that bypass safety
   - **SQL Injection**: Check for string concatenation in database queries
   - **XSS Vulnerabilities**: Look for unescaped user input in DOM manipulation
   - **Prototype Pollution**: Watch for unsafe object property assignment
   - **Insecure Dependencies**: Check for use of \`@ts-ignore\` that might hide security issues`,

		python: `   - **SQL Injection**: Check for string formatting in SQL queries (e.g., \`cursor.execute(f"SELECT * FROM users WHERE id={user_id}")\`)
   - **Command Injection**: Look for \`os.system()\`, \`subprocess.call()\` with unsanitized input
   - **Path Traversal**: Check \`open()\` calls with user-controlled file paths
   - **Pickle Deserialization**: Flag use of \`pickle.loads()\` on untrusted data
   - **XML External Entities**: Check XML parsers for XXE vulnerabilities
   - **Insecure Randomness**: Verify cryptographic operations use \`secrets\` module, not \`random\``,

		java: `   - **SQL Injection**: Look for string concatenation in JDBC queries instead of PreparedStatements
   - **Path Traversal**: Check for File operations using unsanitized user input
   - **XXE Vulnerabilities**: Verify XML parsers disable external entity processing
   - **Insecure Deserialization**: Flag use of \`readObject()\` on untrusted data
   - **LDAP Injection**: Check for unsanitized input in LDAP queries
   - **Weak Cryptography**: Verify use of strong algorithms (AES-256, not DES or MD5)`,

		php: `   - **SQL Injection**: Check for direct variable interpolation in queries (use PDO with parameters)
   - **XSS**: Look for unescaped output with \`echo\` or \`print\`
   - **Remote Code Execution**: Flag dangerous functions like \`eval()\`, \`system()\`, \`exec()\`
   - **File Inclusion**: Check for user input in \`include()\`, \`require()\` statements
   - **Weak Session**: Verify proper session configuration and regeneration
   - **Directory Traversal**: Check file operations for path traversal attempts`,

		go: `   - **SQL Injection**: Verify database queries use parameterized statements
   - **Command Injection**: Check \`exec.Command()\` with user input
   - **Path Traversal**: Look for \`os.Open()\` with unsanitized paths
   - **Race Conditions**: Check for goroutine synchronization issues
   - **Unsafe Reflection**: Flag use of \`reflect\` package with untrusted data
   - **Resource Leaks**: Verify proper \`defer\` usage for cleanup`,

		rust: `   - **Unsafe Blocks**: Review all \`unsafe\` code blocks for memory safety
   - **SQL Injection**: Check database queries use parameterized statements
   - **Command Injection**: Look for \`Command::new()\` with user input
   - **Integer Overflow**: Verify arithmetic operations have overflow checks
   - **Unwrap Usage**: Check for \`.unwrap()\` calls that could panic
   - **Concurrency Issues**: Review \`Arc\`, \`Mutex\` usage for race conditions`,
	};

	return (
		securityGuides[normalizedLang] ||
		`   - Identify potential security vulnerabilities
   - Check for input validation issues
   - Review authentication and authorization
   - Analyze data exposure risks
   - Look for injection vulnerabilities (SQL, command, etc.)
   - Check for insecure cryptographic practices`
	);
}

// Language-specific performance guidance
function getPerformanceGuidance(language: string): string {
	const normalizedLang = language.toLowerCase();

	const perfGuides: Record<string, string> = {
		javascript: `   - **Array Operations**: Look for inefficient operations like \`array.indexOf()\` in loops (use Set)
   - **DOM Manipulation**: Check for repeated DOM queries (cache selectors)
   - **Event Listeners**: Watch for memory leaks from unremoved listeners
   - **Async/Await**: Identify missed parallelization opportunities (use \`Promise.all()\`)
   - **Closures**: Check for unintentional memory retention in closures
   - **Algorithm Complexity**: Look for nested loops with O(n²) or worse complexity`,

		python: `   - **List Comprehensions**: Suggest using generators for large datasets
   - **String Concatenation**: Flag string concatenation in loops (use join() or io.StringIO)
   - **Dictionary Lookups**: Replace linear searches with dictionary/set lookups
   - **Global Variables**: Check for excessive global variable access (cache locally)
   - **Function Calls**: Identify repeated expensive function calls that could be cached
   - **Pandas Operations**: Look for iterrows() usage (vectorize with apply() or numpy)`,

		java: `   - **String Concatenation**: Flag string concatenation in loops (use StringBuilder)
   - **Collection Choice**: Check if appropriate collection types are used (ArrayList vs LinkedList)
   - **Stream Operations**: Look for unnecessary intermediate operations or boxing
   - **Synchronization**: Check for excessive locking or synchronization overhead
   - **Object Creation**: Identify unnecessary object instantiation in loops
   - **Database N+1**: Watch for N+1 query patterns (use batch loading)`,

		go: `   - **Goroutine Leaks**: Check for goroutines that never terminate
   - **Channel Blocking**: Look for unbuffered channels causing unnecessary blocking
   - **Memory Allocations**: Identify excessive allocations in hot paths
   - **Map Access**: Check for repeated map lookups (cache values)
   - **JSON Marshaling**: Look for repeated marshal/unmarshal in loops
   - **Defer in Loops**: Flag defer usage inside loops (causes memory buildup)`,

		rust: `   - **Clone Usage**: Check for unnecessary \`.clone()\` calls (use references)
   - **Vec Capacity**: Look for repeated \`.push()\` without pre-allocation
   - **Iterator Chains**: Identify missing iterator fusion opportunities
   - **Box/Rc Overhead**: Check for excessive heap allocations
   - **Match Patterns**: Look for inefficient pattern matching
   - **String Operations**: Flag repeated string allocations (use \`Cow\` or string slices)`,
	};

	return (
		perfGuides[normalizedLang] ||
		`   - Identify performance bottlenecks
   - Analyze algorithm complexity
   - Review resource usage patterns
   - Suggest optimization opportunities
   - Check for unnecessary computations
   - Look for caching opportunities`
	);
}

// Few-shot examples for security analysis
function getSecurityExamples(language: string): string {
	const normalizedLang = language.toLowerCase();

	if (normalizedLang === "javascript" || normalizedLang === "typescript") {
		return `

## Few-Shot Examples

### Example 1: SQL Injection Vulnerability
**Vulnerable Code:**
\`\`\`javascript
function getUser(userId) {
  return db.query('SELECT * FROM users WHERE id=' + userId);
}
\`\`\`

**Issue:** SQL injection - user input concatenated directly into query
**Severity:** CRITICAL
**Fix:**
\`\`\`javascript
function getUser(userId) {
  return db.query('SELECT * FROM users WHERE id=?', [userId]);
}
\`\`\`

### Example 2: XSS Vulnerability
**Vulnerable Code:**
\`\`\`javascript
element.innerHTML = userComment;
\`\`\`

**Issue:** Unescaped user input inserted into DOM
**Severity:** HIGH
**Fix:**
\`\`\`javascript
element.textContent = userComment;
// Or use a sanitization library like DOMPurify
element.innerHTML = DOMPurify.sanitize(userComment);
\`\`\``;
	}

	if (normalizedLang === "python") {
		return `

## Few-Shot Examples

### Example 1: SQL Injection Vulnerability
**Vulnerable Code:**
\`\`\`python
cursor.execute(f"SELECT * FROM users WHERE id={user_id}")
\`\`\`

**Issue:** SQL injection via f-string formatting
**Severity:** CRITICAL
**Fix:**
\`\`\`python
cursor.execute("SELECT * FROM users WHERE id=%s", (user_id,))
\`\`\`

### Example 2: Command Injection
**Vulnerable Code:**
\`\`\`python
os.system(f"ping {user_input}")
\`\`\`

**Issue:** Command injection through unsanitized input
**Severity:** CRITICAL
**Fix:**
\`\`\`python
import subprocess
subprocess.run(["ping", user_input], check=True)
\`\`\``;
	}

	return "";
}

function buildCodeAnalysisPrompt(input: CodeAnalysisPromptInput): string {
	const { codebase, focusArea, language } = input;

	let focusSection = "";

	if (focusArea === "security") {
		focusSection = `2. **Security Analysis**
${getSecurityGuidance(language)}`;
	} else if (focusArea === "performance") {
		focusSection = `2. **Performance Analysis**
${getPerformanceGuidance(language)}`;
	} else {
		focusSection = `2. **Maintainability Analysis**
   - Assess code maintainability
   - Check for code duplication
   - Review module coupling
   - Analyze technical debt
   - Evaluate naming conventions and code clarity`;
	}

	const fewShotExamples =
		focusArea === "security" ? getSecurityExamples(language) : "";

	return `# Code Analysis Request

## Context
You are an expert code reviewer analyzing ${language} code with a focus on ${focusArea} aspects.

## Code to Analyze
\`\`\`${language}
${codebase}
\`\`\`
${fewShotExamples}

## Analysis Requirements
1. **Code Quality Assessment**
   - Readability and maintainability
   - Code structure and organization
   - Naming conventions and clarity

${focusSection}

3. **Best Practices Compliance**
   - Language-specific best practices for ${language}
   - Design pattern usage
   - Error handling implementation

## Output Format
- **Summary**: Brief overview of code quality
- **Issues Found**: List of specific issues with severity levels (CRITICAL, HIGH, MEDIUM, LOW)
- **Recommendations**: Actionable improvement suggestions with code examples
- **Code Examples**: Improved code snippets showing the fix

## Scoring
Provide an overall score from 1-10 for:
- Code Quality
- ${focusArea ? focusArea.charAt(0).toUpperCase() + focusArea.slice(1) : "General"}
- Best Practices Adherence`;
}

function buildCodeAnalysisFrontmatter(input: CodeAnalysisPromptInput): string {
	const desc = `Code analysis with focus on ${input.focusArea}`;
	return buildFrontmatter({
		mode: input.mode,
		model: input.model,
		tools: input.tools,
		description: desc,
	});
}

export async function codeAnalysisPromptBuilder(args: unknown) {
	const input = CodeAnalysisPromptSchema.parse(args);

	const enforce = input.forcePromptMdStyle ?? true;
	const effectiveIncludeFrontmatter = enforce ? true : input.includeFrontmatter;
	const effectiveIncludeMetadata = enforce ? true : input.includeMetadata;

	const prompt = buildCodeAnalysisPrompt(input);
	const frontmatter = effectiveIncludeFrontmatter
		? `${buildCodeAnalysisFrontmatter(input)}\n`
		: "";
	const references = input.includeReferences
		? buildFurtherReadingSection([
				{
					title: "Code Review Best Practices",
					url: "https://google.github.io/eng-practices/review/",
					description:
						"Google's engineering practices guide for effective code reviews",
				},
			])
		: "";
	const filenameHint = `${slugify(`code-analysis-${input.focusArea}`)}.prompt.md`;
	const metadata = effectiveIncludeMetadata
		? buildMetadataSection({
				sourceTool: "mcp_ai-agent-guid_code-analysis-prompt-builder",
				inputFile: input.inputFile,
				filenameHint,
			})
		: "";

	return {
		content: [
			{
				type: "text",
				text: `${frontmatter}## 🔍 Code Analysis Prompt\n\n${metadata}\n${prompt}\n\n${references ? `${references}\n` : ""}`,
			},
		],
	};
}
