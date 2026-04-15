const NAME_PATH_SEP = "/";

export interface MatchOptions {
	substringMatching?: boolean;
	caseInsensitive?: boolean;
	wildcardSegments?: boolean;
	regexSegments?: boolean;
}

export interface NamePathComponent {
	name: string;
	overloadIdx: number | null;
}

export interface MatchResult {
	matched: boolean;
	reason?: string;
}

export function componentToString(component: NamePathComponent): string {
	return component.overloadIdx !== null
		? `${component.name}[${component.overloadIdx}]`
		: component.name;
}

class PatternComponent implements NamePathComponent {
	readonly name: string;
	readonly overloadIdx: number | null;

	private readonly isWildcard: boolean;
	private readonly regexTest: RegExp | null;

	private constructor(
		name: string,
		overloadIdx: number | null,
		isWildcard: boolean,
		regexTest: RegExp | null,
	) {
		this.name = name;
		this.overloadIdx = overloadIdx;
		this.isWildcard = isWildcard;
		this.regexTest = regexTest;
	}

	static fromString(raw: string, options: MatchOptions = {}): PatternComponent {
		if (options.wildcardSegments && raw === "*") {
			return new PatternComponent("*", null, true, null);
		}

		if (options.regexSegments) {
			const regexLiteralMatch = raw.match(/^\/(.+)\/([gimsuy]*)$/);
			if (regexLiteralMatch) {
				const [, body, flags] = regexLiteralMatch;
				const compiled = new RegExp(
					body,
					options.caseInsensitive && !flags.includes("i") ? `${flags}i` : flags,
				);
				return new PatternComponent(raw, null, false, compiled);
			}
		}

		let name = raw;
		let overloadIdx: number | null = null;

		if (raw.endsWith("]") && raw.includes("[")) {
			const bracketIdx = raw.lastIndexOf("[");
			const indexPart = raw.slice(bracketIdx + 1, -1);
			if (/^\d+$/.test(indexPart)) {
				name = raw.slice(0, bracketIdx);
				overloadIdx = Number.parseInt(indexPart, 10);
			}
		}

		return new PatternComponent(name, overloadIdx, false, null);
	}

	matches(
		component: NamePathComponent,
		substringMatch: boolean,
		caseInsensitive: boolean,
	): boolean {
		if (this.isWildcard) {
			return true;
		}

		if (this.regexTest !== null) {
			if (!this.regexTest.test(component.name)) {
				return false;
			}
		} else {
			const patternName = caseInsensitive ? this.name.toLowerCase() : this.name;
			const componentName = caseInsensitive
				? component.name.toLowerCase()
				: component.name;

			if (substringMatch) {
				if (!componentName.includes(patternName)) {
					return false;
				}
			} else if (patternName !== componentName) {
				return false;
			}
		}

		if (
			this.overloadIdx !== null &&
			this.overloadIdx !== component.overloadIdx
		) {
			return false;
		}

		return true;
	}

	toString(): string {
		return componentToString(this);
	}
}

function splitPatternSegments(
	pattern: string,
	regexSegments: boolean,
): string[] {
	const segments: string[] = [];
	let current = "";

	for (let i = 0; i < pattern.length; i += 1) {
		const char = pattern[i];

		if (char !== NAME_PATH_SEP) {
			current += char;
			continue;
		}

		if (regexSegments && i + 1 < pattern.length && pattern[i + 1] === "/") {
			if (current.length > 0) {
				segments.push(current);
				current = "";
			}

			const regexStart = i + 1;
			let regexEnd = regexStart + 1;
			let escaped = false;

			while (regexEnd < pattern.length) {
				const candidate = pattern[regexEnd];
				if (!escaped && candidate === "/") {
					regexEnd += 1;
					while (
						regexEnd < pattern.length &&
						/[gimsuy]/.test(pattern[regexEnd] ?? "")
					) {
						regexEnd += 1;
					}
					break;
				}
				escaped = !escaped && candidate === "\\";
				if (candidate !== "\\") {
					escaped = false;
				}
				regexEnd += 1;
			}

			segments.push(pattern.slice(regexStart, regexEnd));
			i = regexEnd - 1;
			continue;
		}

		if (current.length > 0) {
			segments.push(current);
			current = "";
		}
	}

	if (current.length > 0) {
		segments.push(current);
	}

	return segments;
}

export class NamePathMatcher {
	private readonly expr: string;
	private readonly options: Required<MatchOptions>;
	private readonly isAbsolutePattern: boolean;
	private readonly components: PatternComponent[];

	constructor(namePathPattern: string, options: MatchOptions = {}) {
		if (!namePathPattern) {
			throw new Error("namePathPattern must not be empty");
		}

		this.expr = namePathPattern;
		this.options = {
			substringMatching: options.substringMatching ?? false,
			caseInsensitive: options.caseInsensitive ?? false,
			wildcardSegments: options.wildcardSegments ?? false,
			regexSegments: options.regexSegments ?? false,
		};

		this.isAbsolutePattern = namePathPattern.startsWith(NAME_PATH_SEP);
		const stripped = namePathPattern.replace(/^\/+|\/+$/g, "");
		this.components = splitPatternSegments(
			stripped,
			this.options.regexSegments,
		).map((segment) => PatternComponent.fromString(segment, this.options));
	}

	static for(pattern: string): NamePathMatcherBuilder {
		return new NamePathMatcherBuilder(pattern);
	}

	matchesReversedComponents(
		componentsReversed: Iterator<NamePathComponent>,
	): MatchResult {
		const reversed = [...this.components].reverse();

		for (let i = 0; i < reversed.length; i += 1) {
			const patternComp = reversed[i];
			const next = componentsReversed.next();

			if (next.done) {
				return {
					matched: false,
					reason: `Pattern has ${reversed.length} segments but symbol path is shorter (stopped at segment ${i})`,
				};
			}

			const useSubstring = this.options.substringMatching && i === 0;
			if (
				!patternComp.matches(
					next.value,
					useSubstring,
					this.options.caseInsensitive,
				)
			) {
				return {
					matched: false,
					reason: `Segment mismatch at depth ${i}: pattern="${patternComp}" vs symbol="${componentToString(next.value)}"`,
				};
			}
		}

		if (this.isAbsolutePattern) {
			const leftover = componentsReversed.next();
			if (!leftover.done) {
				return {
					matched: false,
					reason: `Absolute pattern "${this.expr}" requires an exact path, but symbol has additional ancestors (e.g. "${componentToString(leftover.value)}")`,
				};
			}
		}

		return { matched: true };
	}

	matchesComponents(components: NamePathComponent[]): MatchResult {
		return this.matchesReversedComponents([...components].reverse().values());
	}

	matchesPath(namePath: string): MatchResult {
		const components = namePath
			.replace(/^\/+|\/+$/g, "")
			.split(NAME_PATH_SEP)
			.map((segment): NamePathComponent => {
				if (segment.endsWith("]") && segment.includes("[")) {
					const bracketIdx = segment.lastIndexOf("[");
					const idx = segment.slice(bracketIdx + 1, -1);
					if (/^\d+$/.test(idx)) {
						return {
							name: segment.slice(0, bracketIdx),
							overloadIdx: Number.parseInt(idx, 10),
						};
					}
				}
				return { name: segment, overloadIdx: null };
			});

		return this.matchesComponents(components);
	}

	get expression(): string {
		return this.expr;
	}

	get isAbsolute(): boolean {
		return this.isAbsolutePattern;
	}

	get segmentCount(): number {
		return this.components.length;
	}

	toString(): string {
		return `NamePathMatcher(${this.expr})`;
	}
}

export class NamePathMatcherBuilder {
	private readonly pattern: string;
	private opts: MatchOptions = {};

	constructor(pattern: string) {
		this.pattern = pattern;
	}

	withSubstringMatching(): this {
		this.opts.substringMatching = true;
		return this;
	}

	withCaseInsensitive(): this {
		this.opts.caseInsensitive = true;
		return this;
	}

	withWildcardSegments(): this {
		this.opts.wildcardSegments = true;
		return this;
	}

	withRegexSegments(): this {
		this.opts.regexSegments = true;
		return this;
	}

	build(): NamePathMatcher {
		return new NamePathMatcher(this.pattern, this.opts);
	}
}
