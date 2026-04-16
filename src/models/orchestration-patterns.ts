import type { ModelProfile } from "../contracts/runtime.js";
import type { ModelRouter } from "./model-router.js";

// Pattern 1: Parallel Critique → Synthesis
export interface CritiquePattern {
	plan: string; // primary plan (from synthesis model)
	critique: string; // independent critique (from critique model)
	synthesis?: string; // final reconciliation
}

// Pattern 2: Draft → Review Chain
export interface DraftReviewPattern {
	draft: string;
	reviewNotes: string;
	final?: string;
}

// Pattern 3: Majority Vote
export interface VoteResult<T> {
	votes: T[];
	winner: T | null;
	unanimous: boolean;
	escalationRequired: boolean;
}

// Pattern 4: Cascade with Fallback
export type CascadeResult<T> = {
	result: T;
	modelUsed: string;
	tier: "free" | "cheap" | "strong";
};

// Pattern 5: Free Triple Parallel + Single Strong Synthesis
export interface TripleParallelResult {
	perspectives: string[]; // 3 free-tier outputs
	synthesis?: string; // single strong synthesis
}

/**
 * Pure routing advisor for orchestration patterns. Does not call LLMs.
 */
export class OrchestrationPatterns {
	constructor(private router: ModelRouter) {}

	/** Pattern 1: who should critique, who should synthesize */
	pattern1Roles(): {
		planModel: ModelProfile;
		critiqueModel: ModelProfile;
		synthesisModel: ModelProfile;
	} {
		return {
			planModel: this.router.chooseSynthesisModel(),
			critiqueModel: this.router.chooseCritiqueModel(),
			synthesisModel: this.router.chooseSynthesisModel(),
		};
	}

	/** Pattern 2: draft with free, review with strong */
	pattern2Roles(): { draftModel: ModelProfile; reviewModel: ModelProfile } {
		const [draft] = this.router.chooseFreeParallelLanes();
		return {
			draftModel: draft,
			reviewModel: this.router.chooseSynthesisModel(),
		};
	}

	/** Pattern 3: three voters, escalation models */
	pattern3Roles(): {
		voters: [ModelProfile, ModelProfile, ModelProfile];
		tiebreak1: ModelProfile;
		tiebreak2: ModelProfile;
	} {
		return {
			voters: this.router.chooseFreeParallelLanes(),
			tiebreak1: this.router.chooseCritiqueModel(),
			tiebreak2: this.router.chooseSynthesisModel(),
		};
	}

	/** Pattern 4: cascade order for simple → complex skill dispatch */
	pattern4Cascade(): ModelProfile[] {
		const [free] = this.router.chooseFreeParallelLanes();
		return [free, this.router.chooseSynthesisModel()];
	}

	/** Pattern 5: three free lanes → one synthesis */
	pattern5Roles(): {
		freeModels: [ModelProfile, ModelProfile, ModelProfile];
		synthesisModel: ModelProfile;
	} {
		return {
			freeModels: this.router.chooseFreeParallelLanes(),
			synthesisModel: this.router.chooseSynthesisModel(),
		};
	}
}
