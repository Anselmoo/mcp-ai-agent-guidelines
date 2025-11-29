/**
 * .NET/NuGet Parser (csproj)
 */

import type {
	AnalysisOptions,
	DeprecatedPackageInfo,
	EcosystemType,
	Issue,
	PackageFileType,
	PackageInfo,
	ParseResult,
} from "../types.js";
import { BaseParser } from "./base.js";

export class DotNetCsprojParser extends BaseParser {
	private static deprecatedPackages: Record<string, DeprecatedPackageInfo> = {
		"Microsoft.AspNet.WebApi": {
			reason: "Legacy ASP.NET Web API, replaced by ASP.NET Core",
			alternative: "Use Microsoft.AspNetCore.* packages",
		},
		"Microsoft.AspNet.Mvc": {
			reason: "Legacy ASP.NET MVC, replaced by ASP.NET Core MVC",
			alternative: "Use Microsoft.AspNetCore.Mvc",
		},
		"Newtonsoft.Json": {
			reason: "Consider using System.Text.Json for new projects",
			alternative: "System.Text.Json is built-in since .NET Core 3.0",
		},
		EntityFramework: {
			reason: "Legacy Entity Framework 6.x",
			alternative: "Use Microsoft.EntityFrameworkCore for new projects",
		},
		"Microsoft.Owin": {
			reason: "OWIN/Katana is legacy middleware",
			alternative: "Use ASP.NET Core middleware",
		},
		RestSharp: {
			reason: "Consider using HttpClient for new projects",
			alternative: "Use System.Net.Http.HttpClient with IHttpClientFactory",
		},
		log4net: {
			reason: "Consider more modern logging frameworks",
			alternative: "Use Microsoft.Extensions.Logging or Serilog",
		},
	};

	parse(content: string): ParseResult {
		const packages: PackageInfo[] = [];
		const errors: string[] = [];
		let projectName: string | undefined;
		let projectVersion: string | undefined;

		try {
			const assemblyMatch = content.match(
				/<AssemblyName>([^<]+)<\/AssemblyName>/,
			);
			const rootNsMatch = content.match(
				/<RootNamespace>([^<]+)<\/RootNamespace>/,
			);
			projectName = assemblyMatch?.[1] || rootNsMatch?.[1];

			const versionMatch = content.match(/<Version>([^<]+)<\/Version>/);
			projectVersion = versionMatch?.[1];

			const packageRefs = content.matchAll(
				/<PackageReference\s+Include=["']([^"']+)["']\s*(?:Version=["']([^"']+)["'])?[^>]*\/?>/gi,
			);
			for (const match of packageRefs) {
				const name = match[1];
				let version = match[2] || "*";

				if (!match[2]) {
					const versionElementMatch = content.match(
						new RegExp(
							`<PackageReference\\s+Include=["']${name}["'][^>]*>[\\s\\S]*?<Version>([^<]+)<\\/Version>`,
							"i",
						),
					);
					if (versionElementMatch) version = versionElementMatch[1];
				}

				const privateAssetsMatch = content.match(
					new RegExp(
						`<PackageReference\\s+Include=["']${name}["'][^>]*PrivateAssets=["']All["']`,
						"i",
					),
				);

				packages.push({
					name,
					version,
					type: privateAssetsMatch ? "devDependencies" : "dependencies",
					ecosystem: "dotnet",
				});
			}

			const projectRefs = content.matchAll(
				/<ProjectReference\s+Include=["']([^"']+)["']/gi,
			);
			for (const match of projectRefs) {
				const projectPath = match[1];
				const projectFileName = projectPath.split(/[/\\]/).pop() || projectPath;
				packages.push({
					name: projectFileName.replace(".csproj", ""),
					version: "local",
					type: "dependencies",
					ecosystem: "dotnet",
				});
			}
		} catch (error) {
			errors.push(
				`Error parsing csproj: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}

		return {
			packages,
			projectName,
			projectVersion,
			ecosystem: "dotnet",
			fileType: "csproj",
			errors: errors.length > 0 ? errors : undefined,
		};
	}

	canParse(content: string): boolean {
		return (
			content.includes("<Project") &&
			(content.includes("<PackageReference") ||
				content.includes("<ItemGroup") ||
				content.includes("Sdk="))
		);
	}

	getEcosystem(): EcosystemType {
		return "dotnet";
	}
	getFileTypes(): PackageFileType[] {
		return ["csproj"];
	}

	protected analyzePackage(
		pkg: PackageInfo,
		options: AnalysisOptions,
		issues: Issue[],
	): void {
		if (pkg.version === "local") return;

		if (options.checkDeprecated) {
			const deprecated = DotNetCsprojParser.deprecatedPackages[pkg.name];
			if (deprecated) {
				this.addIssue(
					issues,
					pkg,
					"Deprecated Package",
					"moderate",
					deprecated.reason,
					deprecated.alternative,
				);
			}
		}

		if (options.checkOutdated) {
			if (pkg.version === "*" || pkg.version.includes("*")) {
				this.addIssue(
					issues,
					pkg,
					"Unpinned Version",
					"moderate",
					"Floating version can lead to unexpected updates",
					"Pin to a specific version for reproducible builds",
				);
			}
			if (
				pkg.version.includes("-alpha") ||
				pkg.version.includes("-beta") ||
				pkg.version.includes("-preview") ||
				pkg.version.includes("-rc")
			) {
				this.addIssue(
					issues,
					pkg,
					"Pre-release Version",
					"info",
					"Using pre-release version which may be unstable",
					"Consider using stable release for production",
				);
			}
			if (pkg.name.startsWith("Microsoft.") && pkg.version.match(/^[1-3]\./)) {
				this.addIssue(
					issues,
					pkg,
					"Potentially Outdated",
					"info",
					"Package may be from an older .NET version",
					"Check if a newer version is available",
				);
			}
		}

		if (options.checkVulnerabilities)
			this.checkKnownVulnerabilities(pkg, issues);
	}

	private checkKnownVulnerabilities(pkg: PackageInfo, issues: Issue[]): void {
		if (pkg.name === "System.Text.Json" && pkg.version.match(/^[1-5]\./)) {
			this.addIssue(
				issues,
				pkg,
				"Known Vulnerabilities",
				"high",
				"Older System.Text.Json versions have known vulnerabilities",
				"Update to System.Text.Json >= 6.0.0",
			);
		}
		if (
			pkg.name === "Newtonsoft.Json" &&
			pkg.version.match(/^([1-9]|1[0-2])\./)
		) {
			this.addIssue(
				issues,
				pkg,
				"Known Vulnerabilities",
				"moderate",
				"Older Newtonsoft.Json versions may have security issues",
				"Update to Newtonsoft.Json >= 13.0.1",
			);
		}
		if (
			pkg.name.startsWith("Microsoft.AspNetCore.") &&
			pkg.version.match(/^[1-5]\./)
		) {
			this.addIssue(
				issues,
				pkg,
				"End of Support",
				"high",
				"This ASP.NET Core version is out of support",
				"Update to .NET 6+ (LTS) or .NET 8+ (current LTS)",
			);
		}
	}

	protected addEcosystemRecommendations(recommendations: string[]): void {
		recommendations.push(
			"Run 'dotnet list package --outdated' to check for updates",
		);
		recommendations.push(
			"Run 'dotnet list package --vulnerable' for security scanning",
		);
		recommendations.push(
			"Use Directory.Packages.props for centralized versioning",
		);
		recommendations.push(
			"Consider using dependabot for automated NuGet updates",
		);
	}
}
