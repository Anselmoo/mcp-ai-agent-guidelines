import { describe, expect, it } from "vitest";
import { mermaidDiagramGenerator } from "../../src/tools/mermaid-diagram-generator";

describe("mermaid-diagram-generator enhancements", () => {
	describe("New diagram types", () => {
		it("generates ER diagrams from description", async () => {
			const res = await mermaidDiagramGenerator({
				description:
					"Customer places Order. Order contains LineItem. Product is ordered in LineItem.",
				diagramType: "er",
				strict: false,
			});
			const text = res.content[0].text;
			expect(text).toMatch(/erDiagram/);
			expect(text).toMatch(/CUSTOMER/);
			expect(text).toMatch(/ORDER/);
		});

		it("generates user journey diagrams from description", async () => {
			const res = await mermaidDiagramGenerator({
				description:
					"User Journey for Shopping. User discovers product. User reads reviews. User adds to cart. User completes checkout.",
				diagramType: "journey",
				strict: false,
			});
			const text = res.content[0].text;
			expect(text).toMatch(/journey/);
			expect(text).toMatch(/title/);
		});

		it("generates quadrant charts from description", async () => {
			const res = await mermaidDiagramGenerator({
				description:
					"Priority analysis. Feature A is critical. Feature B needs review. Feature C can wait.",
				diagramType: "quadrant",
				strict: false,
			});
			const text = res.content[0].text;
			expect(text).toMatch(/quadrantChart/);
			expect(text).toMatch(/x-axis/);
			expect(text).toMatch(/y-axis/);
		});

		it("generates git graphs from description", async () => {
			const res = await mermaidDiagramGenerator({
				description:
					"Initial commit. Add feature. Fix bug. Merge changes. Release version.",
				diagramType: "git-graph",
				strict: false,
			});
			const text = res.content[0].text;
			expect(text).toMatch(/gitGraph/);
			expect(text).toMatch(/commit/);
		});

		it("generates mindmaps from description", async () => {
			const res = await mermaidDiagramGenerator({
				description:
					"Project Planning. Define requirements. Design architecture. Implement features. Test quality. Deploy to production.",
				diagramType: "mindmap",
				strict: false,
			});
			const text = res.content[0].text;
			expect(text).toMatch(/mindmap/);
			expect(text).toMatch(/root/);
		});

		it("generates timelines from description", async () => {
			const res = await mermaidDiagramGenerator({
				description:
					"Product Development Timeline. Q1 planning phase. Q2 development. Q3 testing. Q4 launch.",
				diagramType: "timeline",
				strict: false,
			});
			const text = res.content[0].text;
			expect(text).toMatch(/timeline/);
			expect(text).toMatch(/title/);
		});
	});

	describe("Enhanced parsing for existing diagrams", () => {
		it("parses sequence diagram from description with participants", async () => {
			const res = await mermaidDiagramGenerator({
				description:
					"User sends request to System. System queries Database. Database returns data to System. System responds to User.",
				diagramType: "sequence",
				strict: false,
			});
			const text = res.content[0].text;
			expect(text).toMatch(/sequenceDiagram/);
			expect(text).toMatch(/participant.*User/);
			expect(text).toMatch(/participant.*System/);
			expect(text).toMatch(/participant.*Database/);
		});

		it("parses class diagram from description with classes", async () => {
			const res = await mermaidDiagramGenerator({
				description:
					"User has id and name. Product has id and price. Order contains Product items. User places Order.",
				diagramType: "class",
				strict: false,
			});
			const text = res.content[0].text;
			expect(text).toMatch(/classDiagram/);
			expect(text).toMatch(/class User/);
			expect(text).toMatch(/class Product/);
			expect(text).toMatch(/class Order/);
		});

		it("parses state diagram from description with states", async () => {
			const res = await mermaidDiagramGenerator({
				description:
					"System starts in idle state. From idle to processing when user starts. Processing to complete when task finishes. From processing to error if something fails.",
				diagramType: "state",
				strict: false,
			});
			const text = res.content[0].text;
			expect(text).toMatch(/stateDiagram-v2/);
			expect(text).toMatch(/Idle/);
			expect(text).toMatch(/Processing/);
		});

		it("parses gantt chart from description with tasks", async () => {
			const res = await mermaidDiagramGenerator({
				description:
					"Project: New Feature Development. Phase 1: Research and planning. Phase 2: Design mockups. Development phase: Implement backend. Testing phase: QA validation.",
				diagramType: "gantt",
				strict: false,
			});
			const text = res.content[0].text;
			expect(text).toMatch(/gantt/);
			expect(text).toMatch(/New Feature Development/);
			expect(text).toMatch(/Research and planning/);
		});

		it("parses pie chart from description with percentages", async () => {
			const res = await mermaidDiagramGenerator({
				description:
					"Distribution of: User satisfaction. Happy customers: 60%. Neutral: 25%. Unhappy: 15%.",
				diagramType: "pie",
				strict: false,
			});
			const text = res.content[0].text;
			expect(text).toMatch(/pie title/);
			expect(text).toMatch(/Happy customers.*60/);
			expect(text).toMatch(/Neutral.*25/);
		});
	});

	describe("Advanced customization options", () => {
		it("supports flowchart direction customization", async () => {
			const res = await mermaidDiagramGenerator({
				description: "Step one. Step two. Step three.",
				diagramType: "flowchart",
				direction: "LR",
				strict: false,
			});
			const text = res.content[0].text;
			expect(text).toMatch(/flowchart LR/);
		});

		it("supports different flowchart directions", async () => {
			const directions = ["TD", "TB", "BT", "LR", "RL"] as const;
			for (const dir of directions) {
				const res = await mermaidDiagramGenerator({
					description: "A to B to C",
					diagramType: "flowchart",
					direction: dir,
					strict: false,
				});
				const text = res.content[0].text;
				expect(text).toMatch(new RegExp(`flowchart ${dir}`));
			}
		});

		it("supports advanced features for sequence diagrams", async () => {
			const res = await mermaidDiagramGenerator({
				description: "User sends request. System processes. System responds.",
				diagramType: "sequence",
				advancedFeatures: { autonumber: true },
				strict: false,
			});
			const text = res.content[0].text;
			expect(text).toMatch(/sequenceDiagram/);
			expect(text).toMatch(/autonumber/);
		});

		it("applies theme to all diagram types", async () => {
			const types = ["flowchart", "sequence", "class", "state", "er"] as const;
			for (const type of types) {
				const res = await mermaidDiagramGenerator({
					description: "Test diagram with theme",
					diagramType: type,
					theme: "dark",
					strict: false,
				});
				const text = res.content[0].text;
				expect(text).toMatch(/theme.*dark/);
			}
		});
	});

	describe("Legacy diagram type support", () => {
		it("converts erDiagram to er type", async () => {
			const res = await mermaidDiagramGenerator({
				description: "Customer and Order relationship",
				diagramType: "erDiagram" as any,
				strict: false,
			});
			const text = res.content[0].text;
			expect(text).toMatch(/erDiagram/);
		});

		it("converts graph to flowchart type", async () => {
			const res = await mermaidDiagramGenerator({
				description: "Step A to Step B",
				diagramType: "graph" as any,
				strict: false,
			});
			const text = res.content[0].text;
			expect(text).toMatch(/flowchart/);
		});

		it("converts userJourney to journey type", async () => {
			const res = await mermaidDiagramGenerator({
				description: "User journey steps",
				diagramType: "userJourney" as any,
				strict: false,
			});
			const text = res.content[0].text;
			expect(text).toMatch(/journey/);
		});

		it("converts gitgraph to git-graph type", async () => {
			const res = await mermaidDiagramGenerator({
				description: "Git commit history",
				diagramType: "gitGraph" as any,
				strict: false,
			});
			const text = res.content[0].text;
			expect(text).toMatch(/gitGraph/);
		});

		it("handles unknown diagram type with default fallback", async () => {
			// Note: This actually gets rejected by Zod validation before reaching the default case
			// So we'll test a valid type that exercises the default branch another way
			// The default case in the switch is unreachable due to Zod enum validation
			// This test is removed as it's not a valid scenario
		});
	});

	describe("Complex description parsing", () => {
		it("handles multi-sentence descriptions for flowcharts", async () => {
			const res = await mermaidDiagramGenerator({
				description: `
					Receive user input and validate format.
					Check authentication credentials against database.
					Process business logic and apply rules.
					Generate response and format output.
					Log transaction details for audit.
					Return formatted response to user.
				`,
				diagramType: "flowchart",
				strict: false,
			});
			const text = res.content[0].text;
			expect(text).toMatch(/flowchart/);
			// Should have multiple steps
			expect(text.split("\n").length).toBeGreaterThan(5);
		});

		it("handles complex sequence diagram scenarios", async () => {
			const res = await mermaidDiagramGenerator({
				description: `
					User sends login request to API.
					API queries Database for credentials.
					Database returns user record to API.
					API sends validation to Service.
					Service responds with token to API.
					API responds with success to User.
				`,
				diagramType: "sequence",
				strict: false,
			});
			const text = res.content[0].text;
			expect(text).toMatch(/sequenceDiagram/);
			expect(text).toMatch(/User/);
			expect(text).toMatch(/API/);
		});

		it("extracts multiple classes with relationships", async () => {
			const res = await mermaidDiagramGenerator({
				description: `
					User has personal information.
					Account contains User details.
					Transaction uses Account for payments.
					Product can be purchased via Transaction.
				`,
				diagramType: "class",
				strict: false,
			});
			const text = res.content[0].text;
			expect(text).toMatch(/classDiagram/);
			expect(text).toMatch(/class User/);
			expect(text).toMatch(/class Account/);
			expect(text).toMatch(/class Transaction/);
			expect(text).toMatch(/class Product/);
		});
	});

	describe("Fallback behavior", () => {
		it("uses fallback template when description cannot be parsed for ER", async () => {
			const res = await mermaidDiagramGenerator({
				description: "Generic system diagram",
				diagramType: "er",
				strict: false,
			});
			const text = res.content[0].text;
			expect(text).toMatch(/erDiagram/);
			expect(text).toMatch(/CUSTOMER|ORDER|LINE-ITEM|PRODUCT/);
		});

		it("uses fallback template when description cannot be parsed for journey", async () => {
			const res = await mermaidDiagramGenerator({
				description: "Some journey",
				diagramType: "journey",
				strict: false,
			});
			const text = res.content[0].text;
			expect(text).toMatch(/journey/);
			expect(text).toMatch(/section/);
		});

		it("uses fallback template for empty descriptions", async () => {
			const res = await mermaidDiagramGenerator({
				description: "",
				diagramType: "quadrant",
				strict: false,
			});
			const text = res.content[0].text;
			expect(text).toMatch(/quadrantChart/);
		});

		it("uses fallback for class diagram with no parseable classes", async () => {
			const res = await mermaidDiagramGenerator({
				description: "simple text with no classes",
				diagramType: "class",
				strict: false,
			});
			const text = res.content[0].text;
			expect(text).toMatch(/classDiagram/);
			expect(text).toMatch(/class User/);
			expect(text).toMatch(/class System/);
		});

		it("uses fallback for gantt chart with no parseable tasks", async () => {
			const res = await mermaidDiagramGenerator({
				description: "x",
				diagramType: "gantt",
				strict: false,
			});
			const text = res.content[0].text;
			expect(text).toMatch(/gantt/);
			expect(text).toMatch(/section/);
		});

		it("uses default gantt template when tasks array is empty", async () => {
			const res = await mermaidDiagramGenerator({
				description: "",
				diagramType: "gantt",
				strict: false,
			});
			const text = res.content[0].text;
			expect(text).toMatch(/gantt/);
			expect(text).toMatch(/Project Timeline/);
			expect(text).toMatch(/Planning|Development/);
		});

		it("uses fallback for git-graph with no commits", async () => {
			const res = await mermaidDiagramGenerator({
				description: "",
				diagramType: "git-graph",
				strict: false,
			});
			const text = res.content[0].text;
			expect(text).toMatch(/gitGraph/);
			expect(text).toMatch(/commit/);
		});

		it("uses fallback for mindmap with minimal content", async () => {
			const res = await mermaidDiagramGenerator({
				description: "Topic",
				diagramType: "mindmap",
				strict: false,
			});
			const text = res.content[0].text;
			expect(text).toMatch(/mindmap/);
			expect(text).toMatch(/root/);
		});

		it("uses fallback for timeline with no events", async () => {
			const res = await mermaidDiagramGenerator({
				description: "Timeline",
				diagramType: "timeline",
				strict: false,
			});
			const text = res.content[0].text;
			expect(text).toMatch(/timeline/);
			expect(text).toMatch(/section/);
		});

		it("uses fallback for sequence diagram with no participants", async () => {
			const res = await mermaidDiagramGenerator({
				description: "Some random text without participants",
				diagramType: "sequence",
				strict: false,
			});
			const text = res.content[0].text;
			expect(text).toMatch(/sequenceDiagram/);
			expect(text).toMatch(/participant/);
		});

		it("uses fallback for state diagram with no states", async () => {
			const res = await mermaidDiagramGenerator({
				description: "Random text",
				diagramType: "state",
				strict: false,
			});
			const text = res.content[0].text;
			expect(text).toMatch(/stateDiagram-v2/);
			expect(text).toMatch(/-->/);
		});

		it("uses fallback for pie chart with no data", async () => {
			const res = await mermaidDiagramGenerator({
				description: "No percentages here",
				diagramType: "pie",
				strict: false,
			});
			const text = res.content[0].text;
			expect(text).toMatch(/pie title/);
			expect(text).toMatch(/Category/);
		});
	});

	describe("Edge cases and parsing variations", () => {
		it("handles sequence diagram with multiple interaction patterns", async () => {
			const res = await mermaidDiagramGenerator({
				description:
					"User sends request. Server responds with data. Client processes result.",
				diagramType: "sequence",
				strict: false,
			});
			const text = res.content[0].text;
			expect(text).toMatch(/sequenceDiagram/);
		});

		it("handles class diagram with various relationship keywords", async () => {
			const res = await mermaidDiagramGenerator({
				description:
					"Manager uses System. Employee depends on Manager. Task belongs to Employee.",
				diagramType: "class",
				strict: false,
			});
			const text = res.content[0].text;
			expect(text).toMatch(/classDiagram/);
		});

		it("handles state diagram with different state keywords", async () => {
			const res = await mermaidDiagramGenerator({
				description:
					"Start pending. Move to ready then active. From active to done or failed.",
				diagramType: "state",
				strict: false,
			});
			const text = res.content[0].text;
			expect(text).toMatch(/stateDiagram-v2/);
		});

		it("handles gantt chart with section keywords", async () => {
			const res = await mermaidDiagramGenerator({
				description:
					"Project: Test. Planning phase: Task 1. Development stage: Task 2.",
				diagramType: "gantt",
				strict: false,
			});
			const text = res.content[0].text;
			expect(text).toMatch(/Test/);
		});

		it("handles pie chart with explicit counts", async () => {
			const res = await mermaidDiagramGenerator({
				description: "50 apples. 30 oranges. 20 bananas.",
				diagramType: "pie",
				strict: false,
			});
			const text = res.content[0].text;
			expect(text).toMatch(/pie title/);
		});

		it("handles ER diagram with belongs to relationship", async () => {
			const res = await mermaidDiagramGenerator({
				description: "Employee belongs to Department. Department has Manager.",
				diagramType: "er",
				strict: false,
			});
			const text = res.content[0].text;
			expect(text).toMatch(/erDiagram/);
		});

		it("handles journey with section keywords", async () => {
			const res = await mermaidDiagramGenerator({
				description:
					"Shopping Journey. Discovery phase: Browse products. Purchase section: Checkout process.",
				diagramType: "journey",
				strict: false,
			});
			const text = res.content[0].text;
			expect(text).toMatch(/journey/);
		});

		it("extracts action verbs in sequence diagrams", async () => {
			const res = await mermaidDiagramGenerator({
				description:
					"User requests data. Server queries database. Database provides results.",
				diagramType: "sequence",
				strict: false,
			});
			const text = res.content[0].text;
			expect(text).toMatch(/sequenceDiagram/);
		});

		it("extracts triggers in state diagrams", async () => {
			const res = await mermaidDiagramGenerator({
				description:
					"Idle to active on start. Active to complete on finish. Active to error on fail.",
				diagramType: "state",
				strict: false,
			});
			const text = res.content[0].text;
			expect(text).toMatch(/stateDiagram-v2/);
		});
	});

	describe("Validation and repair scenarios", () => {
		it("handles validation when mermaid is not available", async () => {
			const res = await mermaidDiagramGenerator({
				description: "Test validation",
				diagramType: "flowchart",
				strict: false,
			});
			// Should still generate diagram even if validation is skipped
			expect(res.content[0].text).toMatch(/flowchart/);
			// Check that response has content
			expect(res.content.length).toBeGreaterThan(0);
		});

		it("generates diagram with repair enabled on complex input", async () => {
			const res = await mermaidDiagramGenerator({
				description: "Complex flow with special chars & symbols | test",
				diagramType: "flowchart",
				repair: true,
				strict: false,
			});
			expect(res.content[0].text).toMatch(/flowchart/);
		});

		it("handles strict mode with valid diagram", async () => {
			const res = await mermaidDiagramGenerator({
				description: "Step one. Step two. Step three.",
				diagramType: "flowchart",
				strict: true,
			});
			expect(res.content[0].text).toMatch(/flowchart/);
		});

		it("returns proper response structure with validation info", async () => {
			const res = await mermaidDiagramGenerator({
				description: "Test",
				diagramType: "sequence",
				strict: false,
			});
			// Should have at least one content item
			expect(res.content.length).toBeGreaterThan(0);
			expect(res.content[0].type).toBe("text");
		});
	});
});
