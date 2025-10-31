#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const toolName = "l9-distinguished-engineer-prompt-builder";

async function demonstrateL9DistinguishedEngineerPromptBuilder() {
	console.log(
		`\n🚀 Testing ${toolName} with a distributed caching system scenario...\n`,
	);

	const transport = new StdioClientTransport({
		command: "node",
		args: [path.resolve(__dirname, "../dist/index.js")],
	});

	const client = new Client(
		{
			name: "test-client",
			version: "1.0.0",
		},
		{
			capabilities: {},
		},
	);

	try {
		await client.connect(transport);

		const response = await client.callTool({
			name: toolName,
			arguments: {
				projectName: "Global Distributed Caching System",
				technicalChallenge:
					"Design a global-scale distributed caching layer capable of serving 10M+ QPS with <5ms p99 latency across 15+ geographic regions while maintaining strong consistency for critical operations and eventual consistency for non-critical paths",
				technicalDrivers: [
					"Sub-5ms p99 latency at global scale",
					"Linear horizontal scalability to 100M+ QPS",
					"99.999% availability (5 minutes downtime per year)",
					"Strong consistency for financial transactions",
					"Cost optimization: 50% reduction in current cache TCO",
				],
				currentArchitecture:
					"Monolithic Redis cluster with single-region deployment, manual sharding, and custom replication logic. Current pain points: Regional hotspots, cross-region latency spikes, manual failover taking 15+ minutes, limited observability",
				userScale:
					"500M monthly active users, 10M peak concurrent connections, 2PB data under management, 15 global regions (Americas 40%, EMEA 35%, APAC 25%)",
				technicalDifferentiators: [
					"Multi-region atomic transactions without global locks",
					"AI-driven cache warming and eviction policies",
					"Sub-millisecond cross-region propagation for critical data",
				],
				engineeringConstraints: [
					"Must maintain backward compatibility with existing client SDKs",
					"Cannot introduce breaking API changes",
					"Migration must be zero-downtime (rolling blue-green deployment)",
					"Total migration budget: $5M capex, $500K/month opex increase limit",
				],
				securityRequirements: [
					"SOC 2 Type II compliance",
					"GDPR data residency and right-to-be-forgotten support",
					"End-to-end encryption for PII",
					"Multi-tenancy isolation (500+ tenants)",
				],
				techStack: [
					"Existing: Redis 6.x, Python/Go clients, Kubernetes on AWS",
					"Proposed: Evaluate Dragonfly, KeyDB, Garnet, or custom solution",
				],
				teamContext:
					"Platform Infrastructure org (40 engineers): 15 SREs, 12 backend engineers, 8 distributed systems specialists, 5 data engineers. Average tenure 3+ years, strong Kubernetes and distributed systems expertise",
				migrationPhilosophy:
					"Incremental migration via shadow writes and dual-read validation. Phase 1: Read replica validation (3 months), Phase 2: Shadow writes (2 months), Phase 3: Write migration region-by-region (6 months), Phase 4: Decommission legacy (2 months)",
				performanceBenchmarks:
					"Current: 2M QPS peak, 12ms p99 latency, 99.9% availability. Target: 10M+ QPS, <5ms p99 latency, 99.999% availability",
				complianceLandscape:
					"SOC 2 audit annually, GDPR compliance required for EU data, PCI DSS for payment data, internal security review quarterly",
				researchPriorities: [
					"CRDT-based conflict resolution at scale",
					"Hybrid logical clocks for distributed consistency",
					"Machine learning for predictive cache warming",
					"Zero-knowledge proofs for privacy-preserving analytics",
				],
				architecturalReferences: [
					"https://aws.amazon.com/blogs/database/work-with-cluster-mode-on-amazon-elasticache-for-redis/",
					"https://www.usenix.org/conference/nsdi16/technical-sessions/presentation/li_cheng",
					"https://research.google/pubs/spanner-googles-globally-distributed-database/",
				],
			},
		});

		console.log("✅ Tool execution successful\n");

		if (response.content && response.content.length > 0) {
			const textContent = response.content.find((c) => c.type === "text");
			if (textContent) {
				const outputPath = path.join(__dirname, "demo-l9-engineer.prompt.md");
				await fs.writeFile(outputPath, textContent.text, "utf8");
				console.log(
					`📝 Full output written to: ${path.relative(process.cwd(), outputPath)}`,
				);
				console.log("\n📋 Preview (first 1500 characters):");
				console.log("─".repeat(80));
				console.log(textContent.text.slice(0, 1500));
				if (textContent.text.length > 1500) {
					console.log(
						`\n... (${textContent.text.length - 1500} more characters)`,
					);
				}
				console.log("─".repeat(80));
			}
		}
	} catch (error) {
		console.error("❌ Error:", error);
		throw error;
	} finally {
		await client.close();
		console.log("\n✅ Demo complete!");
	}
}

demonstrateL9DistinguishedEngineerPromptBuilder().catch((error) => {
	console.error("Fatal error:", error);
	process.exit(1);
});
