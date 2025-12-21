import { BaseDiagramHandler } from "./base.handler.js";

/**
 * Handler for git graph diagrams.
 * Generates git commit history visualizations.
 */
export class GitGraphHandler extends BaseDiagramHandler {
	readonly diagramType = "git-graph";

	generate(description: string, theme?: string): string {
		this.validateInput(description);

		const lines: string[] = ["gitGraph"];
		if (theme) lines.unshift(`%%{init: {'theme':'${theme}'}}%%`);

		// Extract branch and commit info from description
		const { commits, branches: _branches } =
			this.parseGitDescription(description);

		if (commits.length > 0) {
			for (const commit of commits) {
				lines.push(commit);
			}
		} else {
			// Fallback template
			lines.push(
				'commit id: "Initial"',
				"branch develop",
				"checkout develop",
				'commit id: "Feature"',
				"checkout main",
				"merge develop",
				'commit id: "Release"',
			);
		}

		return lines.join("\n");
	}

	/**
	 * Parse natural language description to extract git information.
	 */
	private parseGitDescription(description: string): {
		commits: string[];
		branches: string[];
	} {
		const commits: string[] = [];
		const branches: string[] = [];

		const sentences = description
			.split(/[.!?\n]+/)
			.map((s) => s.trim())
			.filter((s) => s.length > 0);

		commits.push('commit id: "Initial"');

		for (let i = 0; i < Math.min(sentences.length, 5); i++) {
			const msg =
				sentences[i].length > 30
					? `${sentences[i].substring(0, 27)}...`
					: sentences[i];
			commits.push(`commit id: "${msg}"`);
		}

		return { commits, branches };
	}
}
