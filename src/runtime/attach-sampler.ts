import type { Server } from "@modelcontextprotocol/sdk/server/index.js";
import type { Sampler } from "../contracts/runtime.js";
import { makeSampler } from "../tools/shared/sampler.js";

/**
 * Populate the runtime's optional sampling capability from the connected
 * client's advertised capabilities. Call once, after `server.connect`. When the
 * client does not advertise `sampling`, `sampler` is left undefined and skills
 * fall back to their deterministic / directive paths.
 */
export function attachSamplerCapability(
	runtime: { sampler?: Sampler; clientSupportsSampling?: boolean },
	server: Pick<Server, "createMessage" | "getClientCapabilities">,
): void {
	const supportsSampling = Boolean(server.getClientCapabilities()?.sampling);
	runtime.clientSupportsSampling = supportsSampling;
	if (supportsSampling) {
		runtime.sampler = makeSampler(server);
	}
}
