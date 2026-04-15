import { ToonMemoryInterface } from "./toon-interface.js";

/**
 * Shared runtime memory interface used by MCP tool surfaces so session,
 * snapshot, workspace, and orchestration operations all talk to the same
 * configured TOON backend instance.
 */
export const sharedToonMemoryInterface = new ToonMemoryInterface();
