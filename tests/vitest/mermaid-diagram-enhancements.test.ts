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
	});
});
