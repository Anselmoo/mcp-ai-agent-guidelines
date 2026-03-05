import type {
	GeneratorFactory,
	PromptDomain,
	PromptGenerator,
	RegistryEntry,
	RegistryListItem,
} from "./types.js";

export class PromptRegistry {
	private static instance: PromptRegistry | undefined;
	private readonly entries = new Map<PromptDomain, RegistryEntry>();

	private constructor() {}

	static getInstance(): PromptRegistry {
		PromptRegistry.instance ??= new PromptRegistry();
		return PromptRegistry.instance;
	}

	/** For testing only */
	static resetInstance(): void {
		PromptRegistry.instance = undefined;
	}

	register(domain: PromptDomain, factory: GeneratorFactory): void {
		this.entries.set(domain, { factory });
	}

	get<T extends object = object>(
		domain: PromptDomain,
	): PromptGenerator<T> | undefined {
		const entry = this.entries.get(domain);
		if (!entry) return undefined;
		if (!entry.singleton) {
			entry.singleton = entry.factory();
		}
		return entry.singleton as PromptGenerator<T>;
	}

	has(domain: PromptDomain): boolean {
		return this.entries.has(domain);
	}

	listDomains(): PromptDomain[] {
		return Array.from(this.entries.keys());
	}

	listGenerators(): RegistryListItem[] {
		return this.listDomains().map((domain) => {
			const gen = this.get(domain);
			return {
				domain,
				version: gen?.version ?? "unknown",
				description: gen?.description ?? "",
			};
		});
	}

	/** Remove a domain registration (testing helper) */
	unregister(domain: PromptDomain): void {
		this.entries.delete(domain);
	}
}
